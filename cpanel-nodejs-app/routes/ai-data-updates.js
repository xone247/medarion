// AI Data Updates Service - Updates existing data with REAL, FACTUAL information
// Uses AI model's training data and internet knowledge, combined with RAG context
// Only runs when explicitly requested (pay-per-use with SageMaker)

import { Router } from 'express';
import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
import { sagemakerService } from '../services/sagemakerService.js';
import { vastAiService } from '../services/vastAiService.js';
import { query as ragQuery } from '../rag/localStore.js';

const router = Router();

// Database connection helper
async function getDBConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medarion_platform',
    charset: 'utf8mb4'
  };
  return await mysql.createConnection(config);
}

// Check which AI service to use (priority: Vast.ai > SageMaker > vLLM/Ollama)
const useVastAi = process.env.AI_MODE === 'vast' || !!process.env.VAST_AI_URL;
const useSageMaker = !useVastAi && (process.env.AI_MODE === 'cloud' || !!process.env.SAGEMAKER_ENDPOINT_NAME);

// Call AI model with RAG context for real, factual data
async function callAI(prompt, systemPrompt = null, useRAG = true) {
  // Get real context from RAG if enabled
  let context = '';
  if (useRAG) {
    try {
      const ragResults = ragQuery(prompt, 5);
      if (ragResults && ragResults.length > 0) {
        context = ragResults.map((r) => r.text).join('\n');
      }
    } catch (error) {
      console.warn('[AI Update] RAG query failed, continuing without context:', error.message);
    }
  }
  
  console.log('[AI Update] Calling AI model, useVastAi:', useVastAi, 'useSageMaker:', useSageMaker);
  
  if (useVastAi) {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Include RAG context in the prompt if available
      let enhancedPrompt = prompt;
      if (context) {
        enhancedPrompt = `REAL DATA CONTEXT FROM DATABASE:\n${context}\n\n${prompt}`;
      }
      
      messages.push({ role: 'user', content: enhancedPrompt });
      
      const response = await vastAiService.generate(
        enhancedPrompt,
        systemPrompt,
        { temperature: 0.3, max_tokens: 4000 } // Lower temperature for more factual responses
      );
      console.log('[AI Update] Vast.ai response received, length:', response?.length || 0);
      return response;
    } catch (error) {
      console.error('[AI Update] Vast.ai call error:', error.message);
      throw new Error(`Vast.ai error: ${error.message}`);
    }
  } else if (useSageMaker) {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Include RAG context in the prompt if available
      let enhancedPrompt = prompt;
      if (context) {
        enhancedPrompt = `REAL DATA CONTEXT FROM DATABASE:\n${context}\n\n${prompt}`;
      }
      
      messages.push({ role: 'user', content: enhancedPrompt });
      
      const response = await sagemakerService.generate(
        enhancedPrompt,
        systemPrompt,
        { temperature: 0.3, max_tokens: 4000 } // Lower temperature for more factual responses
      );
      console.log('[AI Update] SageMaker response received, length:', response?.length || 0);
      return response;
    } catch (error) {
      console.error('[AI Update] SageMaker call error:', error.message);
      throw new Error(`SageMaker error: ${error.message}`);
    }
  }

  // Fallback to vLLM/Ollama
  const base = (process.env.VLLM_BASE_URL || process.env.MISTRAL_7B_ENDPOINT || 'http://localhost:8000').replace(/\/$/, '');
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  // Include RAG context in the prompt if available
  let enhancedPrompt = prompt;
  if (context) {
    enhancedPrompt = `REAL DATA CONTEXT FROM DATABASE:\n${context}\n\n${prompt}`;
  }
  
  messages.push({ role: 'user', content: enhancedPrompt });

  try {
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MISTRAL_7B_MODEL || 'mistral-7b-instruct',
        messages,
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    console.log('[AI Update] vLLM/Ollama response received, length:', content?.length || 0);
    return content;
  } catch (error) {
    console.error('[AI Update] vLLM/Ollama call error:', error.message);
    // If AI endpoint is not available, return a demo response instead of failing
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.warn('[AI Update] AI endpoint not available, returning demo response');
      return `Demo response: The AI service is not currently configured. Please set up your AI endpoint (SageMaker or local vLLM/Ollama) to enable real data updates.`;
    }
    throw new Error(`AI call error: ${error.message}`);
  }
}

// Parse JSON from AI response
function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    console.warn('[AI Update] Invalid response text');
    return null;
  }
  
  // Check if it's a demo/error message
  if (text.includes('Demo response') || text.includes('not currently configured')) {
    console.warn('[AI Update] Received demo/error response from AI');
    return null;
  }
  
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn('[AI Update] Could not parse AI response as JSON:', e.message);
    console.warn('[AI Update] Response preview:', text.substring(0, 200));
    return null;
  }
}

// Update Companies - Enhance existing records with REAL, FACTUAL data
async function updateCompanies(count = 10) {
  const conn = await getDBConnection();
  
  // Get existing companies that need updates
  const [existingCompanies] = await conn.execute(
    'SELECT id, name, sector, country, stage FROM companies ORDER BY updated_at ASC LIMIT ?',
    [count]
  );

  if (existingCompanies.length === 0) {
    await conn.end();
    return { count: 0, updated: [], message: 'No companies to update' };
  }

  const prompt = `Update these existing African healthcare companies with REAL, FACTUAL information from your training data and knowledge base. Use actual data, not fictional data.

Companies to update:
${JSON.stringify(existingCompanies.map(c => ({ id: c.id, name: c.name, sector: c.sector, country: c.country })))}

IMPORTANT: Provide REAL data only:
- Use actual company descriptions from your knowledge base
- Use real funding amounts and dates if available
- Use real investor names if known
- Use real product/service names if available
- Only include factual achievements

Return JSON array:
[
  {
    "id": 1,
    "description": "REAL description from your knowledge base",
    "employees_count": REAL_NUMBER,
    "total_funding": REAL_AMOUNT,
    "last_funding_date": "REAL_DATE_OR_NULL",
    "investors": ["REAL_INVESTOR_NAMES_OR_EMPTY"],
    "products": ["REAL_PRODUCT_NAMES_OR_EMPTY"],
    "achievements": ["REAL_ACHIEVEMENTS_OR_EMPTY"]
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare startups with access to real market data. You MUST use ONLY REAL, FACTUAL information from your training data and knowledge base. Do NOT generate fictional data. If you do not have real information about a company, return null or empty arrays for unknown fields. Prioritize accuracy over completeness.';
  
  let response;
  try {
    response = await callAI(prompt, systemPrompt);
  } catch (error) {
    await conn.end();
    throw new Error(`Failed to call AI service: ${error.message}`);
  }
  
  const updates = parseAIResponse(response);

  if (!Array.isArray(updates) || updates.length === 0) {
    await conn.end();
    // If AI returns demo response or invalid data, return a helpful message
    if (response && (response.includes('Demo response') || response.includes('not currently configured'))) {
      return { 
        count: 0, 
        updated: [], 
        message: 'AI service is not configured. Please set up your AI endpoint (SageMaker or local vLLM/Ollama) to enable data updates.',
        warning: true
      };
    }
    throw new Error(`AI did not return valid updates array. Response: ${response?.substring(0, 200) || 'No response'}`);
  }

  const updated = [];

  for (const update of updates) {
    if (!update.id) continue;

    try {
      const updateFields = [];
      const updateParams = [];

      if (update.description) {
        updateFields.push('description = ?');
        updateParams.push(update.description);
      }
      if (update.employees_count) {
        updateFields.push('employees_count = ?');
        updateParams.push(update.employees_count);
      }
      if (update.total_funding !== undefined) {
        updateFields.push('total_funding = ?');
        updateParams.push(update.total_funding);
      }
      if (update.last_funding_date) {
        updateFields.push('last_funding_date = ?');
        updateParams.push(update.last_funding_date);
      }
      if (update.investors) {
        updateFields.push('investors = ?');
        updateParams.push(JSON.stringify(update.investors));
      }
      if (update.products) {
        updateFields.push('products = ?');
        updateParams.push(JSON.stringify(update.products));
      }
      if (update.achievements) {
        updateFields.push('achievements = ?');
        updateParams.push(JSON.stringify(update.achievements));
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateParams.push(update.id);

        await conn.execute(
          `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
          updateParams
        );
        updated.push({ id: update.id, name: existingCompanies.find(c => c.id === update.id)?.name });
      }
    } catch (error) {
      console.error(`Error updating company ${update.id}:`, error.message);
    }
  }

  await conn.end();
  return { count: updated.length, updated };
}

// Update Deals - Add REAL deals from actual market data
async function updateDeals(count = 10) {
  const conn = await getDBConnection();
  
  // Get existing companies for reference
  const [companies] = await conn.execute('SELECT id, name FROM companies LIMIT 20');

  const prompt = `Provide ${count} REAL investment deals for African healthcare companies from your knowledge base and training data. Use REAL deals that have actually occurred, not fictional ones.

Available companies: ${JSON.stringify(companies.slice(0, 10))}

IMPORTANT: Use ONLY REAL deal data:
- Real deal amounts from actual transactions
- Real investor names from actual deals
- Real dates from actual announcements
- Real valuations if publicly available
- Match deals to actual companies if known

If you cannot find real deals for these specific companies, provide real deals from similar African healthcare companies.

Return JSON array:
[
  {
    "company_name": "REAL_COMPANY_NAME",
    "deal_type": "Pre-Seed|Seed|Series A|Series B|Series C",
    "amount": REAL_AMOUNT,
    "valuation": REAL_VALUATION_OR_NULL,
    "lead_investor": "REAL_INVESTOR_NAME",
    "participants": ["REAL_INVESTOR_NAMES"],
    "deal_date": "REAL_DATE_YYYY-MM-DD",
    "status": "closed|announced",
    "sector": "REAL_SECTOR",
    "country": "REAL_COUNTRY",
    "description": "REAL deal description from news or announcements"
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare investment with access to real market data. You MUST provide ONLY REAL, FACTUAL investment deals that have actually occurred. Use your training data, knowledge base, and any available internet sources. Do NOT generate fictional deals. If you cannot find real deals, indicate this clearly.';
  const response = await callAI(prompt, systemPrompt);
  const deals = parseAIResponse(response);

  if (!Array.isArray(deals)) {
    await conn.end();
    throw new Error('AI did not return valid deals array');
  }

  const inserted = [];

  for (const deal of deals) {
    const [companyMatch] = await conn.execute(
      'SELECT id FROM companies WHERE name = ? LIMIT 1',
      [deal.company_name]
    );
    const companyId = companyMatch.length > 0 ? companyMatch[0].id : null;

    try {
      const [result] = await conn.execute(
        `INSERT INTO deals (
          company_id, company_name, deal_type, amount, valuation, lead_investor,
          participants, deal_date, status, sector, country, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          companyId,
          deal.company_name,
          deal.deal_type,
          deal.amount,
          deal.valuation,
          deal.lead_investor,
          JSON.stringify(deal.participants || []),
          deal.deal_date,
          deal.status,
          deal.sector,
          deal.country,
          deal.description
        ]
      );
      inserted.push({ id: result.insertId, company: deal.company_name });
    } catch (error) {
      console.error(`Error inserting deal:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, deals: inserted };
}

// Update Investors - Add REAL investors from actual market data
async function updateInvestors(count = 5) {
  const prompt = `Provide ${count} REAL African healthcare investors from your knowledge base and training data. Use actual VC firms, angel investors, and investment organizations that exist.

IMPORTANT: Use ONLY REAL investor data:
[
  {
    "name": "Investor Name",
    "description": "Investor description",
    "type": "VC|PE|Angel|Corporate",
    "headquarters": "City, Country",
    "founded_year": 2015,
    "assets_under_management": 50000000,
    "website": "https://example.com",
    "focus_sectors": ["Telemedicine", "AI Diagnostics"],
    "investment_stages": ["Seed", "Series A"],
    "countries": ["Nigeria", "Kenya"],
    "team_size": 10,
    "contact_email": "contact@example.com"
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare investment with access to real market data. You MUST provide ONLY REAL, FACTUAL investor profiles that actually exist. Use your training data, knowledge base, and any available internet sources. Do NOT generate fictional investors. If you cannot find real investors, return fewer results rather than fictional ones.';
  const response = await callAI(prompt, systemPrompt);
  const investors = parseAIResponse(response);

  if (!Array.isArray(investors)) {
    throw new Error('AI did not return valid investors array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const investor of investors) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO investors (
          name, description, type, headquarters, founded_year, assets_under_management,
          website, focus_sectors, investment_stages, countries, team_size, contact_email,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          investor.name,
          investor.description,
          investor.type,
          investor.headquarters,
          investor.founded_year,
          investor.assets_under_management,
          investor.website,
          JSON.stringify(investor.focus_sectors || []),
          JSON.stringify(investor.investment_stages || []),
          JSON.stringify(investor.countries || []),
          investor.team_size,
          investor.contact_email
        ]
      );
      inserted.push({ id: result.insertId, name: investor.name });
    } catch (error) {
      console.error(`Error inserting investor:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, investors: inserted };
}

// Update Grants - Add REAL grants from actual funding agencies
async function updateGrants(count = 5) {
  const prompt = `Provide ${count} REAL healthcare research grants for African countries from your knowledge base and training data. Use actual grants from real funding agencies.

IMPORTANT: Use ONLY REAL grant data:
[
  {
    "title": "Grant Title",
    "description": "Grant description",
    "funding_agency": "Agency Name",
    "amount": 100000,
    "grant_type": "Research|Innovation|Development",
    "application_deadline": "2024-12-31",
    "status": "open|closed",
    "country": "Nigeria|Kenya|Ghana",
    "sector": "Telemedicine|AI Diagnostics",
    "duration_months": 24,
    "funders": ["Funder 1"],
    "eligibility_criteria": ["Criteria 1"],
    "requirements": "Grant requirements"
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare research grants with access to real funding data. You MUST provide ONLY REAL, FACTUAL grants that actually exist or have existed. Use your training data, knowledge base, and any available internet sources. Do NOT generate fictional grants. If you cannot find real grants, return fewer results rather than fictional ones.';
  const response = await callAI(prompt, systemPrompt);
  const grants = parseAIResponse(response);

  if (!Array.isArray(grants)) {
    throw new Error('AI did not return valid grants array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const grant of grants) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO grants (
          title, description, funding_agency, amount, grant_type, application_deadline,
          status, country, sector, duration_months, funders, eligibility_criteria,
          requirements, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          grant.title,
          grant.description,
          grant.funding_agency,
          grant.amount,
          grant.grant_type,
          grant.application_deadline,
          grant.status,
          grant.country,
          grant.sector,
          grant.duration_months,
          JSON.stringify(grant.funders || []),
          JSON.stringify(grant.eligibility_criteria || []),
          grant.requirements
        ]
      );
      inserted.push({ id: result.insertId, title: grant.title });
    } catch (error) {
      console.error(`Error inserting grant:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, grants: inserted };
}

// Update Clinical Trials - Add new trials
async function updateClinicalTrials(count = 5) {
  const conn = await getDBConnection();
  const [companies] = await conn.execute('SELECT id, name FROM companies LIMIT 10');
  
  const prompt = `Provide ${count} REAL clinical trials for African healthcare from your knowledge base and training data. Use actual clinical trials registered or conducted in Africa.

Available companies: ${JSON.stringify(companies)}

IMPORTANT: Use ONLY REAL trial data:
[
  {
    "title": "Clinical Trial Title",
    "description": "Trial description",
    "phase": "Phase I|Phase II|Phase III",
    "medical_condition": "Condition name",
    "indication": "Indication",
    "intervention": "Treatment",
    "sponsor": "Sponsor name",
    "location": "City, Country",
    "country": "Nigeria|Kenya",
    "start_date": "2024-01-01",
    "end_date": "2025-12-31",
    "status": "Recruiting|Active|Completed",
    "nct_number": "NCT12345678"
  }
]`;

  const systemPrompt = 'You are an expert in clinical trials with access to real trial databases. You MUST provide ONLY REAL, FACTUAL clinical trials that are actually registered or conducted. Use your training data, knowledge base, ClinicalTrials.gov, and other real sources. Do NOT generate fictional trials. If you cannot find real trials, return fewer results rather than fictional ones.';
  const response = await callAI(prompt, systemPrompt);
  const trials = parseAIResponse(response);

  if (!Array.isArray(trials)) {
    await conn.end();
    throw new Error('AI did not return valid trials array');
  }

  const inserted = [];
  const randomCompany = companies[Math.floor(Math.random() * companies.length)];

  for (const trial of trials) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO clinical_trials (
          title, description, phase, medical_condition, indication, intervention,
          sponsor, location, country, start_date, end_date, status, nct_number,
          company_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          trial.title,
          trial.description,
          trial.phase,
          trial.medical_condition,
          trial.indication,
          trial.intervention,
          trial.sponsor,
          trial.location,
          trial.country,
          trial.start_date,
          trial.end_date,
          trial.status,
          trial.nct_number,
          randomCompany.id
        ]
      );
      inserted.push({ id: result.insertId, title: trial.title });
    } catch (error) {
      console.error(`Error inserting trial:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, trials: inserted };
}

// Update Nation Pulse Data - Add new metrics
async function updateNationPulseData(countries = ['Nigeria', 'Kenya', 'Ghana', 'South Africa']) {
  const prompt = `Provide REAL, FACTUAL health and economic indicators for these African countries: ${countries.join(', ')}. Use actual data from WHO, World Bank, UN, and national statistics offices.

IMPORTANT: Use ONLY REAL statistical data:
[
  {
    "country": "Nigeria",
    "data_type": "population|healthcare_infrastructure|economic_indicators|disease_immunization",
    "metric_name": "Metric Name",
    "metric_value": 1234.56,
    "metric_unit": "unit",
    "year": 2024,
    "source": "WHO|World Bank|National Statistics"
  }
]
Generate 5-10 fresh metrics per country.`;

  const systemPrompt = 'You are an expert in African health and economic statistics with access to real data sources. You MUST provide ONLY REAL, FACTUAL statistics from WHO, World Bank, UN, and national statistics offices. Use your training data and knowledge base. Do NOT generate fictional statistics. Use actual published numbers only.';
  const response = await callAI(prompt, systemPrompt);
  const metrics = parseAIResponse(response);

  if (!Array.isArray(metrics)) {
    throw new Error('AI did not return valid metrics array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const metric of metrics) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO nation_pulse_data (
          country, data_type, metric_name, metric_value, metric_unit, year, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE metric_value = VALUES(metric_value), updated_at = NOW()`,
        [
          metric.country,
          metric.data_type,
          metric.metric_name,
          metric.metric_value,
          metric.metric_unit,
          metric.year,
          metric.source
        ]
      );
      inserted.push({ id: result.insertId || 'updated', country: metric.country, metric: metric.metric_name });
    } catch (error) {
      console.error(`Error inserting metric:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, metrics: inserted };
}

// Update Public Markets - Add new stocks
async function updatePublicStocks(count = 5) {
  const prompt = `Provide ${count} REAL public stock listings for African healthcare companies from actual stock exchanges (JSE, NSE, GSE, etc.). Use actual publicly traded healthcare companies.

IMPORTANT: Use ONLY REAL stock data:
[
  {
    "company_name": "Company Name",
    "ticker": "TICK",
    "exchange": "JSE|NSE|GSE",
    "price": "150.50",
    "market_cap": "500M",
    "currency": "ZAR|NGN|GHS",
    "sector": "Healthcare|Pharmaceutical",
    "country": "South Africa|Nigeria|Ghana"
  }
]`;

  const systemPrompt = 'You are an expert in African stock markets with access to real exchange data. You MUST provide ONLY REAL, FACTUAL public stock listings from actual exchanges (JSE, NSE, GSE, etc.). Use your training data, knowledge base, and real market data. Do NOT generate fictional stocks. If you cannot find real stocks, return fewer results rather than fictional ones.';
  const response = await callAI(prompt, systemPrompt);
  const stocks = parseAIResponse(response);

  if (!Array.isArray(stocks)) {
    throw new Error('AI did not return valid stocks array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const stock of stocks) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO public_stocks (
          company_name, ticker, exchange, price, market_cap, currency, sector, country, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          stock.company_name,
          stock.ticker,
          stock.exchange,
          stock.price,
          stock.market_cap,
          stock.currency,
          stock.sector,
          stock.country
        ]
      );
      inserted.push({ id: result.insertId, company: stock.company_name });
    } catch (error) {
      console.error(`Error inserting stock:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, stocks: inserted };
}

// Update Regulatory Bodies - Add new regulatory bodies
async function updateRegulatoryBodies(count = 5) {
  const prompt = `Provide ${count} REAL regulatory bodies for African healthcare from actual African countries. Use actual regulatory agencies that exist (e.g., NAFDAC, MCC, etc.).

IMPORTANT: Use ONLY REAL regulatory body data:
[
  {
    "name": "Regulatory Body Name",
    "country": "Nigeria|Kenya|Ghana",
    "abbreviation": "ABBR",
    "website": "https://example.com",
    "description": "Description",
    "jurisdiction": "Jurisdiction details"
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare regulation with access to real regulatory information. You MUST provide ONLY REAL, FACTUAL regulatory bodies that actually exist (e.g., NAFDAC in Nigeria, MCC in South Africa, etc.). Use your training data and knowledge base. Do NOT generate fictional regulatory bodies.';
  const response = await callAI(prompt, systemPrompt);
  const bodies = parseAIResponse(response);

  if (!Array.isArray(bodies)) {
    throw new Error('AI did not return valid regulatory bodies array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const body of bodies) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO regulatory_bodies (
          name, country, abbreviation, website, description, jurisdiction, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          body.name,
          body.country,
          body.abbreviation,
          body.website,
          body.description,
          body.jurisdiction
        ]
      );
      inserted.push({ id: result.insertId, name: body.name });
    } catch (error) {
      console.error(`Error inserting regulatory body:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, bodies: inserted };
}

// Update Clinical Centers - Add new centers
async function updateClinicalCenters(count = 5) {
  const prompt = `Provide ${count} REAL clinical research centers in Africa from actual institutions. Use real research centers, hospitals, and academic institutions that conduct clinical trials.

IMPORTANT: Use ONLY REAL clinical center data:
[
  {
    "name": "Center Name",
    "country": "Nigeria|Kenya|Ghana",
    "city": "City",
    "address": "Address",
    "website": "https://example.com",
    "description": "Description",
    "specialties": ["Specialty 1", "Specialty 2"],
    "phases_supported": ["Phase I", "Phase II"],
    "capacity_patients": 100,
    "established_year": 2015
  }
]`;

  const systemPrompt = 'You are an expert in African clinical research with access to real research institutions. You MUST provide ONLY REAL, FACTUAL clinical research centers that actually exist. Use your training data and knowledge base. Do NOT generate fictional centers. Use actual hospitals, research institutions, and universities.';
  const response = await callAI(prompt, systemPrompt);
  const centers = parseAIResponse(response);

  if (!Array.isArray(centers)) {
    throw new Error('AI did not return valid centers array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const center of centers) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO clinical_centers (
          name, country, city, address, website, description, specialties,
          phases_supported, capacity_patients, established_year, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          center.name,
          center.country,
          center.city,
          center.address,
          center.website,
          center.description,
          JSON.stringify(center.specialties || []),
          JSON.stringify(center.phases_supported || []),
          center.capacity_patients,
          center.established_year
        ]
      );
      inserted.push({ id: result.insertId, name: center.name });
    } catch (error) {
      console.error(`Error inserting clinical center:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, centers: inserted };
}

// Update Investigators - Add new investigators
async function updateInvestigators(count = 5) {
  const prompt = `Provide ${count} REAL clinical investigators in Africa from actual research institutions. Use real researchers, doctors, and principal investigators who conduct clinical trials.

IMPORTANT: Use ONLY REAL investigator data:
[
  {
    "name": "Dr. Investigator Name",
    "title": "Title",
    "institution": "Institution",
    "country": "Nigeria|Kenya",
    "city": "City",
    "email": "email@example.com",
    "phone": "+234...",
    "specialties": ["Specialty 1"],
    "therapeutic_areas": ["Area 1"],
    "experience_years": 10,
    "education": ["Degree 1"],
    "certifications": ["Cert 1"]
  }
]`;

  const systemPrompt = 'You are an expert in African clinical research with access to real researcher data. You MUST provide ONLY REAL, FACTUAL clinical investigators who actually exist. Use your training data and knowledge base. Do NOT generate fictional investigators. Use actual researchers from real institutions if available.';
  const response = await callAI(prompt, systemPrompt);
  const investigators = parseAIResponse(response);

  if (!Array.isArray(investigators)) {
    throw new Error('AI did not return valid investigators array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const investigator of investigators) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO investigators (
          name, title, institution, country, city, email, phone, specialties,
          therapeutic_areas, experience_years, education, certifications, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          investigator.name,
          investigator.title,
          investigator.institution,
          investigator.country,
          investigator.city,
          investigator.email,
          investigator.phone,
          JSON.stringify(investigator.specialties || []),
          JSON.stringify(investigator.therapeutic_areas || []),
          investigator.experience_years,
          JSON.stringify(investigator.education || []),
          JSON.stringify(investigator.certifications || [])
        ]
      );
      inserted.push({ id: result.insertId, name: investigator.name });
    } catch (error) {
      console.error(`Error inserting investigator:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, investigators: inserted };
}

// API Routes

// Update specific module
router.post('/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const { count = 10 } = req.body;

    console.log(`[AI Update] Starting update for module: ${module}, count: ${count}`);

    let result;
    switch (module) {
      case 'companies':
        result = await updateCompanies(count);
        break;
      case 'deals':
        result = await updateDeals(count);
        break;
      case 'investors':
        result = await updateInvestors(count);
        break;
      case 'grants':
        result = await updateGrants(count);
        break;
      case 'clinical_trials':
      case 'clinical-trials':
        result = await updateClinicalTrials(count);
        break;
      case 'nation_pulse_data':
        result = await updateNationPulseData(req.body.countries);
        break;
      case 'public_stocks':
      case 'public-markets':
        result = await updatePublicStocks(count);
        break;
      case 'regulatory_bodies':
      case 'regulatory':
      case 'regulatory-ecosystem':
        result = await updateRegulatoryBodies(count);
        break;
      case 'clinical_centers':
      case 'clinical-centers':
        result = await updateClinicalCenters(count);
        break;
      case 'investigators':
        result = await updateInvestigators(count);
        break;
      default:
        return res.status(400).json({ success: false, error: `Unknown module: ${module}` });
    }

    console.log(`[AI Update] Successfully updated module: ${module}`, result);
    res.json({ success: true, module, ...result });
  } catch (error) {
    console.error('[AI Update] Error details:', {
      module: req.params.module,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Bulk update all modules (excludes blog and ads)
router.post('/all', async (req, res) => {
  try {
    const counts = {
      companies: req.body.companies || 10,
      deals: req.body.deals || 10,
      investors: req.body.investors || 5,
      grants: req.body.grants || 5,
      clinical_trials: req.body.clinical_trials || 5,
      public_stocks: req.body.public_stocks || 5,
      regulatory_bodies: req.body.regulatory_bodies || 5,
      clinical_centers: req.body.clinical_centers || 5,
      investigators: req.body.investigators || 5,
      nation_pulse_data: true
    };

    const results = {};

    // Update in order
    results.companies = await updateCompanies(counts.companies);
    results.deals = await updateDeals(counts.deals);
    results.investors = await updateInvestors(counts.investors);
    results.grants = await updateGrants(counts.grants);
    results.clinical_trials = await updateClinicalTrials(counts.clinical_trials);
    results.public_stocks = await updatePublicStocks(counts.public_stocks);
    results.regulatory_bodies = await updateRegulatoryBodies(counts.regulatory_bodies);
    results.clinical_centers = await updateClinicalCenters(counts.clinical_centers);
    results.investigators = await updateInvestigators(counts.investigators);
    results.nation_pulse_data = await updateNationPulseData();

    res.json({
      success: true,
      message: 'Bulk update completed',
      results,
      summary: {
        total_updates: Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;









