import { Router } from 'express';
import fetch from 'node-fetch';
import mysql from 'mysql2/promise';

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

// AI Model Configuration - Support Vast.ai and vLLM/Ollama
import { vastAiService } from '../services/vastAiService.js';

const AI_CONFIG = {
  // Check which AI service to use (priority: Vast.ai > vLLM/Ollama)
  useVastAi: process.env.AI_MODE === 'vast' || !!process.env.VAST_AI_URL,
  endpoint: process.env.VLLM_BASE_URL || process.env.MISTRAL_7B_ENDPOINT || 'http://localhost:8000',
  model: process.env.MISTRAL_7B_MODEL || 'mistral-7b-instruct',
  temperature: 0.7,
  maxTokens: 4000
};

// Call AI model to generate data
async function callAI(prompt, systemPrompt = null) {
  // Use Vast.ai if configured (highest priority)
  if (AI_CONFIG.useVastAi) {
    try {
      const response = await vastAiService.generate(
        prompt,
        systemPrompt,
        {
          temperature: AI_CONFIG.temperature,
          max_tokens: AI_CONFIG.maxTokens
        }
      );
      return response;
    } catch (error) {
      console.error('Vast.ai call error:', error);
      throw error;
    }
  }
  
  // Fallback to vLLM/Ollama endpoint
  const base = AI_CONFIG.endpoint.replace(/\/$/, '');
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages,
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('AI call error:', error);
    throw error;
  }
}

// Parse JSON from AI response
function parseAIResponse(text) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try direct JSON parse
    return JSON.parse(text);
  } catch (e) {
    // If JSON parsing fails, try to extract structured data
    console.warn('Could not parse AI response as JSON, attempting to extract data');
    return null;
  }
}

// Generate Companies
async function generateCompanies(count = 5) {
  const prompt = `Generate ${count} realistic African healthcare startup companies. Return JSON array with this exact structure:
[
  {
    "name": "Company Name",
    "description": "Detailed description",
    "website": "https://example.com",
    "industry": "Healthcare",
    "sector": "Telemedicine|AI Diagnostics|Health Tech|Pharmaceutical|Medical Devices",
    "stage": "idea|mvp|early|growth|mature",
    "founded_year": 2020,
    "employees_count": 50,
    "headquarters": "City, Country",
    "country": "Nigeria|Kenya|Ghana|South Africa|Egypt|Rwanda",
    "funding_stage": "Seed|Series A|Series B",
    "total_funding": 500000,
    "investors": ["Investor 1", "Investor 2"],
    "products": ["Product 1", "Product 2"],
    "markets": ["Market 1"],
    "achievements": ["Achievement 1"]
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare startups. Generate realistic, diverse company data.';
  const response = await callAI(prompt, systemPrompt);
  const companies = parseAIResponse(response);
  
  if (!Array.isArray(companies)) {
    throw new Error('AI did not return valid company array');
  }

  const conn = await getDBConnection();
  const inserted = [];

  for (const company of companies) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO companies (
          name, description, website, industry, sector, stage, founded_year,
          employees_count, headquarters, country, funding_stage, total_funding,
          investors, products, markets, achievements, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          company.name,
          company.description,
          company.website,
          company.industry || 'Healthcare',
          company.sector,
          company.stage,
          company.founded_year,
          company.employees_count,
          company.headquarters,
          company.country,
          company.funding_stage,
          company.total_funding,
          JSON.stringify(company.investors || []),
          JSON.stringify(company.products || []),
          JSON.stringify(company.markets || []),
          JSON.stringify(company.achievements || [])
        ]
      );
      inserted.push({ id: result.insertId, name: company.name });
    } catch (error) {
      console.error(`Error inserting company ${company.name}:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, companies: inserted };
}

// Generate Deals
async function generateDeals(count = 5, companyIds = null) {
  const conn = await getDBConnection();
  
  // Get existing companies if companyIds not provided
  if (!companyIds) {
    const [companies] = await conn.execute('SELECT id, name FROM companies LIMIT 20');
    companyIds = companies.map(c => ({ id: c.id, name: c.name }));
  }

  const prompt = `Generate ${count} realistic investment deals for African healthcare companies. Use these companies: ${JSON.stringify(companyIds.slice(0, 10))}. Return JSON array:
[
  {
    "company_name": "Company Name",
    "deal_type": "Pre-Seed|Seed|Series A|Series B|Series C",
    "amount": 500000,
    "valuation": 5000000,
    "lead_investor": "Investor Name",
    "participants": ["Investor 1", "Investor 2"],
    "deal_date": "2024-01-15",
    "status": "closed|announced|pending",
    "sector": "Telemedicine|AI Diagnostics|Health Tech",
    "country": "Nigeria|Kenya|Ghana|South Africa",
    "description": "Deal description"
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare investment deals. Generate realistic deal data with appropriate amounts and valuations.';
  const response = await callAI(prompt, systemPrompt);
  const deals = parseAIResponse(response);

  if (!Array.isArray(deals)) {
    await conn.end();
    throw new Error('AI did not return valid deals array');
  }

  const inserted = [];

  for (const deal of deals) {
    // Find matching company_id
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

// Generate Investors
async function generateInvestors(count = 5) {
  const prompt = `Generate ${count} realistic African healthcare investors (VCs, Angels, etc.). Return JSON array:
[
  {
    "name": "Investor Name",
    "description": "Investor description",
    "type": "VC|PE|Angel|Corporate|Government|Foundation",
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

  const systemPrompt = 'You are an expert in African healthcare investment. Generate realistic investor profiles.';
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
      console.error(`Error inserting investor ${investor.name}:`, error.message);
    }
  }

  await conn.end();
  return { count: inserted.length, investors: inserted };
}

// Generate Grants
async function generateGrants(count = 5) {
  const prompt = `Generate ${count} realistic healthcare research grants for African countries. Return JSON array:
[
  {
    "title": "Grant Title",
    "description": "Grant description",
    "funding_agency": "Agency Name",
    "amount": 100000,
    "grant_type": "Research|Innovation|Development|Capacity Building",
    "application_deadline": "2024-12-31",
    "status": "open|closed|awarded",
    "country": "Nigeria|Kenya|Ghana|South Africa",
    "sector": "Telemedicine|AI Diagnostics|Health Tech",
    "duration_months": 24,
    "funders": ["Funder 1"],
    "eligibility_criteria": ["Criteria 1", "Criteria 2"],
    "requirements": "Grant requirements"
  }
]`;

  const systemPrompt = 'You are an expert in African healthcare research grants. Generate realistic grant opportunities.';
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

// Generate Clinical Trials
async function generateClinicalTrials(count = 5) {
  const conn = await getDBConnection();
  const [companies] = await conn.execute('SELECT id, name FROM companies LIMIT 10');
  
  const prompt = `Generate ${count} realistic clinical trials for African healthcare. Use companies: ${JSON.stringify(companies)}. Return JSON array:
[
  {
    "title": "Clinical Trial Title",
    "description": "Trial description",
    "phase": "Phase I|Phase II|Phase III|Phase IV",
    "medical_condition": "Condition name",
    "indication": "Indication",
    "intervention": "Treatment/intervention",
    "sponsor": "Sponsor name",
    "location": "City, Country",
    "country": "Nigeria|Kenya|Ghana|South Africa",
    "start_date": "2024-01-01",
    "end_date": "2025-12-31",
    "status": "Recruiting|Active|Completed",
    "nct_number": "NCT12345678"
  }
]`;

  const systemPrompt = 'You are an expert in clinical trials. Generate realistic trial data for African healthcare.';
  const response = await callAI(prompt, systemPrompt);
  const trials = parseAIResponse(response);

  if (!Array.isArray(trials)) {
    await conn.end();
    throw new Error('AI did not return valid trials array');
  }

  const inserted = [];

  for (const trial of trials) {
    // Randomly assign to a company
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    
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

// Generate Nation Pulse Data
async function generateNationPulseData(countries = ['Nigeria', 'Kenya', 'Ghana', 'South Africa']) {
  const prompt = `Generate realistic health and economic indicators for these African countries: ${countries.join(', ')}. Return JSON array:
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
Generate 5-10 metrics per country.`;

  const systemPrompt = 'You are an expert in African health and economic statistics. Generate realistic, accurate data.';
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

// API Routes

// Generate data for specific table
router.post('/generate/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { count = 5, ...params } = req.body;

    let result;
    switch (table) {
      case 'companies':
        result = await generateCompanies(count);
        break;
      case 'deals':
        result = await generateDeals(count);
        break;
      case 'investors':
        result = await generateInvestors(count);
        break;
      case 'grants':
        result = await generateGrants(count);
        break;
      case 'clinical_trials':
        result = await generateClinicalTrials(count);
        break;
      case 'nation_pulse_data':
        result = await generateNationPulseData(params.countries);
        break;
      default:
        return res.status(400).json({ success: false, error: `Unknown table: ${table}` });
    }

    res.json({ success: true, table, ...result });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate data for all tables (bulk population)
router.post('/generate/all', async (req, res) => {
  try {
    const counts = {
      companies: req.body.companies || 20,
      deals: req.body.deals || 30,
      investors: req.body.investors || 15,
      grants: req.body.grants || 20,
      clinical_trials: req.body.clinical_trials || 15,
      nation_pulse_data: true
    };

    const results = {};

    // Generate in order (companies first, then deals that reference them)
    results.companies = await generateCompanies(counts.companies);
    results.deals = await generateDeals(counts.deals);
    results.investors = await generateInvestors(counts.investors);
    results.grants = await generateGrants(counts.grants);
    results.clinical_trials = await generateClinicalTrials(counts.clinical_trials);
    results.nation_pulse_data = await generateNationPulseData();

    res.json({
      success: true,
      message: 'Data generation completed',
      results,
      summary: {
        total_companies: results.companies.count,
        total_deals: results.deals.count,
        total_investors: results.investors.count,
        total_grants: results.grants.count,
        total_trials: results.clinical_trials.count,
        total_metrics: results.nation_pulse_data.count
      }
    });
  } catch (error) {
    console.error('Bulk generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const conn = await getDBConnection();
    await conn.ping();
    await conn.end();

    let aiAvailable = false;
    let aiEndpoint = AI_CONFIG.endpoint;
    let aiMode = AI_CONFIG.useVastAi ? 'vast' : 'local';

    // Test AI endpoint
    if (AI_CONFIG.useVastAi) {
      // Test Vast.ai
      aiAvailable = await vastAiService.healthCheck();
      aiEndpoint = process.env.VAST_AI_URL || 'http://localhost:8081';
    } else {
      // Test vLLM/Ollama
      try {
        const testResponse = await fetch(`${AI_CONFIG.endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: AI_CONFIG.model,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 10
          })
        });
        aiAvailable = testResponse.ok;
      } catch (error) {
        aiAvailable = false;
      }
    }

    res.json({
      success: true,
      database: 'connected',
      ai_endpoint: aiEndpoint,
      ai_model: AI_CONFIG.model,
      ai_mode: aiMode,
      ai_available: aiAvailable
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

