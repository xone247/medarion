// Mock-first AI service with optional live (Ollama) mode controlled by Super Admin config

import { mockData } from '../../data/mockData';
import { grantsData } from '../../data/grantsData';
import { nationPulseData } from '../../data/nationPulseData';
import { companiesData } from '../../data/companiesData';
import { getApiUrl } from '../../config/api';

type AppConfig = {
  dataMode?: 'demo' | 'live';
  aiMode?: 'demo' | 'live';
  ollama?: { endpoint?: string; model?: string };
};

function getConfig(): AppConfig {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('medarionConfig') : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function callOllamaIfEnabled(prompt: string): Promise<string | null> {
  // First attempt backend AI gateway (Vast.ai/vLLM via server)
  const viaBackend = await postToBackendAI(prompt);
  if (viaBackend) return viaBackend;

  const cfg = getConfig();
  if (cfg.aiMode !== 'live') return null;
  const endpoint = (cfg.ollama?.endpoint || '').trim();
  const model = (cfg.ollama?.model || 'mistral').trim();
  if (!endpoint) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Ollama error ${res.status}`);
    const data = await res.json();
    return (data as any)?.response || '';
  } catch {
    return null;
  }
}

/**
 * Call Vast.ai API directly (bypassing backend)
 * This allows testing raw API responses without backend cleaning
 */
async function callVastAiDirect(prompt: string): Promise<string | null> {
  try {
    // Get API URL from environment or use Cloudflare tunnel URL
    const apiUrl = (import.meta as any).env?.VAST_AI_URL || 
                   (window as any)?.VAST_AI_URL || 
                   'https://establish-ought-operation-areas.trycloudflare.com';
    
    const apiKey = (import.meta as any).env?.VAST_AI_API_KEY || 
                   (window as any)?.VAST_AI_API_KEY || 
                   'medarion-secure-key-2025';
    
    console.log('[AI Service] Calling Vast.ai API directly:', apiUrl);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 seconds
    
    const res = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        repetition_penalty: 1.1
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[AI Service] Direct API error:', res.status, errorText);
      return null;
    }
    
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    
    console.log('[AI Service] Direct API response received:', {
      length: text.length,
      preview: text.substring(0, 100)
    });
    
    return text || null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[AI Service] Direct API request timeout');
    } else {
      console.error('[AI Service] Direct API exception:', err.message);
    }
    return null;
  }
}

/**
 * Post AI query to backend API
 * Backend connects directly to Vast.ai via SSH tunnel (localhost:8081)
 * This ensures professional, reliable AI responses
 */
         async function postToBackendAI(prompt: string): Promise<string | null> {
           const controller = new AbortController();
           const timeout = setTimeout(() => controller.abort(), 45000); // 45 seconds for fast chat responses
  
  try {
    // Use centralized API URL configuration
    // In dev: Vite proxy routes to localhost:3001
    // In prod: Apache proxies to Node.js backend
    // Backend connects to Vast.ai via Cloudflare tunnel (configured in server/.env)
    const apiUrl = getApiUrl('/api/ai/query');
    
    console.log('[AI Service] Sending request to backend:', apiUrl);
    console.log('[AI Service] Backend will connect to Vast.ai fine-tuned Medarion model');
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: prompt, topK: 5 }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      // Log error for debugging
      const errorText = await res.text();
      console.error('[AI Service] Backend API error:', res.status, errorText);
      
      // If it's a 503 (service unavailable), the backend couldn't reach Vast.ai
      if (res.status === 503) {
        console.warn('[AI Service] Vast.ai service unavailable - check backend connection to API');
        return null;
      }
      
      // For other errors, try to parse JSON error message
      try {
        const errorData = JSON.parse(errorText);
        console.error('[AI Service] Error details:', errorData);
      } catch {
        // Not JSON, use text as-is
      }
      return null;
    }
    
    const data = await res.json();
    const text = (data as any)?.answer || '';
    
    console.log('[AI Service] Response received:', {
      success: data.success,
      answerLength: text.length,
      hasSources: !!(data.sources && data.sources.length > 0),
      connectionType: 'Direct (Vast.ai via SSH tunnel)'
    });
    
    // Reject demo answers - they should not come from backend anymore
    if (text && (text.toLowerCase().includes('demo answer') || text.toLowerCase().includes('placeholder'))) {
      console.warn('[AI Service] Received demo answer from backend, treating as error');
      return null;
    }
    
    // Return full answer (no truncation)
    return text || null;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error('[AI Service] Request timeout after 45 seconds');
      console.error('[AI Service] This may indicate the backend is not responding');
    } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      console.error('[AI Service] Network error - backend may not be running');
      console.error('[AI Service] Make sure backend is running on http://localhost:3001');
    } else {
      console.error('[AI Service] Backend API exception:', err.message);
      console.error('[AI Service] Check that backend is running and can reach Vast.ai API');
    }
    return null;
  }
}

export async function assessMarketRisk(input: { country: string; companyId?: string }) {
  const prompt = `Assess market risk for healthcare companies in ${input.country}. Provide:
1. Risk score (0-100, where 0 is lowest risk and 100 is highest risk)
2. Top 5 key risk factors

Format your response as:
RISK SCORE: [number]
RISK FACTORS:
- [Factor 1]
- [Factor 2]
- [Factor 3]
- [Factor 4]
- [Factor 5]`;
  const live = await postToBackendAI(prompt);
  if (live) {
    // Extract risk score
    const scoreMatch = live.match(/RISK SCORE[:\s]+(\d+)/i) || live.match(/score[:\s]+(\d+)/i) || live.match(/(\d+)\s*\/\s*100/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 60;
    
    // Extract risk factors
    const factorsMatch = live.match(/RISK FACTORS[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]+:|$)/is) || 
                          live.match(/factors[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]+:|$)/is);
    let factors: string[] = [];
    if (factorsMatch) {
      factors = factorsMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim())
        .filter(line => line.length > 10 && !line.match(/^(risk|factor|score)/i))
        .slice(0, 5);
    }
    
    // Fallback: extract from general text
    if (factors.length === 0) {
      factors = live.split(/\n|\d+\.|\-|•/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && !s.match(/^(risk|factor|score|country)/i))
        .slice(0, 5);
    }
    
    if (factors.length > 0) {
      return { score, factors };
    }
  }
  // Fallback to Ollama if configured
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const scoreMatch = ollamaResult.match(/score[:\s]+(\d+)/i) || ollamaResult.match(/(\d+)\s*\/\s*100/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 60;
    const factors = ollamaResult.split(/\n|\d+\.|\-/)
      .map(s => s.trim().replace(/^[-•\d+\.)\s]+/, ''))
      .filter(s => s.length > 10 && !s.match(/^(risk|factor|score)/i))
      .slice(0, 5);
    if (factors.length > 0) {
      return { score, factors };
    }
  }
  // Final fallback to mock data
  const baselineByCountry: Record<string, number> = { 
    Kenya: 62, Nigeria: 68, Ghana: 58, Rwanda: 52, Egypt: 61, 
    SouthAfrica: 55, Tanzania: 64, Uganda: 66, Ethiopia: 70 
  };
  const key = (input.country || 'Kenya').replace(/\s+/g, '');
  const base = baselineByCountry[key] ?? 60;
  return { 
    score: base, 
    factors: [
      'Regulatory environment and approvals complexity',
      'Macroeconomic stability and foreign exchange volatility',
      'Healthcare infrastructure and distribution challenges',
      'Competitive intensity and substitute products',
      'Reimbursement systems and purchasing power limitations'
    ]
  };
}

export async function analyzeCompetitors(input: { companyId: string }) {
  const prompt = `List top 5 competitors for ${input.companyId} in the African healthcare market. Provide company names only, one per line, without numbering or bullets.`;
  const live = await postToBackendAI(prompt);
  if (live) {
    // Extract company names from response
    const lines = live.split(/\n/).map(s => s.trim()).filter(s => s.length > 0);
    const competitors = lines
      .map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim()) // Remove bullets, numbers
      .filter(name => name.length > 2 && !name.match(/^(competitor|company|name|list|top|here|are|the)/i))
      .slice(0, 5);
    if (competitors.length > 0) {
      return { competitors: competitors };
    }
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const competitors = ollamaResult.split(/\n/)
      .map(s => s.trim().replace(/^[-•\d+\.)\s]+/, ''))
      .filter(s => s.length > 2 && !s.match(/^(competitor|company|name)/i))
      .slice(0, 5);
    return { competitors: competitors };
  }
  const name = input.companyId || 'TargetCo';
  return { competitors: [`${name} Labs`, `${name} Health`, `${name} Diagnostics`, 'MedTech Solutions', 'HealthConnect Africa'] };
}

export async function benchmarkValuation(input: { sector: string; stage: string }) {
  const prompt = `What is the typical valuation range for a ${input.stage} stage ${input.sector} healthcare startup in Africa? 

Provide the valuation range in USD millions. Format your response as:
VALUATION RANGE: $X - $Y million USD
or
VALUATION: $X to $Y million`;
  const live = await postToBackendAI(prompt);
  if (live) {
    // Try multiple patterns to extract valuation range
    const patterns = [
      /(\d+(?:\.\d+)?)\s*[-to]+\s*\$?\s*(\d+(?:\.\d+)?)\s*million/i,
      /\$(\d+(?:\.\d+)?)\s*[-to]+\s*\$?(\d+(?:\.\d+)?)\s*million/i,
      /(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)\s*m/i,
      /(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)/i
    ];
    
    for (const pattern of patterns) {
      const m = live.match(pattern);
      if (m) {
        const low = Number(m[1]) * 1_000_000;
        const high = Number(m[2]) * 1_000_000;
        if (low > 0 && high > low) {
          return { low, high, currency: 'USD' };
        }
      }
    }
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const patterns = [
      /(\d+(?:\.\d+)?)\s*[-to]+\s*\$?\s*(\d+(?:\.\d+)?)\s*million/i,
      /\$(\d+(?:\.\d+)?)\s*[-to]+\s*\$?(\d+(?:\.\d+)?)\s*million/i,
      /(\d+(?:\.\d+)?)\s*[-to]+\s*(\d+(?:\.\d+)?)\s*m/i
    ];
    for (const pattern of patterns) {
      const m = ollamaResult.match(pattern);
      if (m) {
        const low = Number(m[1]) * 1_000_000;
        const high = Number(m[2]) * 1_000_000;
        if (low > 0 && high > low) {
          return { low, high, currency: 'USD' };
        }
      }
    }
  }
  const stage = (input.stage || 'Seed').toLowerCase();
  const ranges: Record<string, { low: number; high: number }> = {
    'pre-seed': { low: 1500000, high: 3000000 },
    seed: { low: 2000000, high: 6000000 },
    'series a': { low: 5000000, high: 12000000 },
    'series b': { low: 15000000, high: 30000000 },
    'series c+': { low: 30000000, high: 80000000 },
  };
  const r = ranges[stage] || ranges['seed'];
  return { ...r, currency: 'USD' };
}

export async function generateDueDiligenceSummary(input: { companyId: string }) {
  const prompt = `Provide a comprehensive due diligence summary for ${input.companyId} in African healthcare. Format your response as follows:

STRENGTHS:
- [List 2-3 strengths, one per line]

WEAKNESSES:
- [List 2-3 weaknesses, one per line]

OPPORTUNITIES:
- [List 2-3 opportunities, one per line]

THREATS:
- [List 2-3 threats, one per line]

KEY QUESTIONS:
1. [First question]
2. [Second question]
3. [Third question]`;
  const live = await postToBackendAI(prompt);
  if (live) {
    // Parse SWOT sections
    const parseSection = (text: string, sectionName: string): string[] => {
      const regex = new RegExp(`${sectionName}[:\\s]*\\n?([^\\n]+(?:\\n[^\\n]+)*?)(?=\\n[A-Z]+:|$)`, 'is');
      const match = text.match(regex);
      if (match) {
        return match[1]
          .split(/\n/)
          .map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim())
          .filter(line => line.length > 5)
          .slice(0, 5);
      }
      return [];
    };
    
    const strengths = parseSection(live, 'STRENGTHS') || parseSection(live, 'strengths');
    const weaknesses = parseSection(live, 'WEAKNESSES') || parseSection(live, 'weaknesses');
    const opportunities = parseSection(live, 'OPPORTUNITIES') || parseSection(live, 'opportunities');
    const threats = parseSection(live, 'THREATS') || parseSection(live, 'threats');
    
    // Parse questions
    const questionsMatch = live.match(/KEY QUESTIONS[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]+:|$)/is) || 
                           live.match(/questions[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]+:|$)/is);
    let questions: string[] = [];
    if (questionsMatch) {
      questions = questionsMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 5 && line.includes('?'))
        .slice(0, 3);
    }
    
    if (questions.length === 0) {
      questions = live.match(/\d+[\.\)]\s*([^\n]+\?)/g)?.map(q => q.replace(/^\d+[\.\)]\s*/, '')) || 
                  live.split(/\n/).filter(l => l.includes('?')).slice(0, 3);
    }
    
    return { 
      swot: { 
        strengths: strengths.length > 0 ? strengths : ['Strong market position and partnerships'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['Limited geographic reach'],
        opportunities: opportunities.length > 0 ? opportunities : ['Growing market demand'],
        threats: threats.length > 0 ? threats : ['Regulatory changes']
      }, 
      questions: questions.length > 0 ? questions : ['What is the customer acquisition cost (CAC) and lifetime value (LTV)?', 'What regulatory approvals are required and what are the timelines?', 'What are the top 3 scalability risks and mitigation strategies?'] 
    };
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const parseSection = (text: string, sectionName: string): string[] => {
      const regex = new RegExp(`${sectionName}[:\\s]*\\n?([^\\n]+(?:\\n[^\\n]+)*?)(?=\\n[A-Z]+:|$)`, 'is');
      const match = text.match(regex);
      if (match) {
        return match[1].split(/\n/).map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim()).filter(line => line.length > 5).slice(0, 5);
      }
      return [];
    };
    const strengths = parseSection(ollamaResult, 'STRENGTHS') || parseSection(ollamaResult, 'strengths');
    return { 
      swot: { 
        strengths: strengths.length > 0 ? strengths : ['Strong market position'],
        weaknesses: parseSection(ollamaResult, 'WEAKNESSES') || parseSection(ollamaResult, 'weaknesses'),
        opportunities: parseSection(ollamaResult, 'OPPORTUNITIES') || parseSection(ollamaResult, 'opportunities'),
        threats: parseSection(ollamaResult, 'THREATS') || parseSection(ollamaResult, 'threats')
      }, 
      questions: ['What is CAC/LTV?', 'What regulatory approvals?', 'What scalability risks?'] 
    };
  }
  const name = input.companyId || 'TargetCo';
  return { 
    swot: { 
      strengths: [`Strong clinical partnerships in pilot regions for ${name}`, 'Proven technology platform', 'Experienced founding team'],
      weaknesses: ['Limited distribution footprint beyond 3 countries', 'Dependence on key partnerships', 'Limited brand recognition'],
      opportunities: ['Rising non-communicable disease burden driving demand', 'Government support for digital health', 'Growing smartphone penetration'],
      threats: ['Regulatory timeline variability and FX exposure', 'Increasing competition', 'Economic volatility']
    }, 
    questions: ['How does CAC compare to LTV by segment?', 'What regulatory path and timelines are required?', 'What are top 3 scale risks and mitigations?'] 
  };
}

export async function detectTrends(input: { timeframe: string }) {
  const prompt = `Identify emerging healthcare trends in Africa for ${input.timeframe}. For each trend, provide:
1. Trend name
2. Brief description
3. Growth indicator if available

Format: One trend per line with name and description.`;
  const live = await postToBackendAI(prompt);
  if (live) {
    const lines = live.split(/\n/).filter(Boolean).slice(0, 5);
    const trends = lines.map(line => {
      const cleanLine = line.replace(/^[-•\d+\.)\s]+/, '').trim();
      // Try to extract growth percentage if present
      const growthMatch = cleanLine.match(/[+\-]?\d+%/);
      const change = growthMatch ? growthMatch[0] : 'n/a';
      // Remove growth indicator from topic
      const topic = cleanLine.replace(/[+\-]?\d+%/, '').trim();
      return { topic: topic || cleanLine, change };
    }).filter(t => t.topic.length > 5);
    if (trends.length > 0) return trends;
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const trends = ollamaResult.split(/\n/)
      .filter(Boolean)
      .slice(0, 5)
      .map(line => {
        const cleanLine = line.replace(/^[-•\d+\.)\s]+/, '').trim();
        const growthMatch = cleanLine.match(/[+\-]?\d+%/);
        const change = growthMatch ? growthMatch[0] : 'n/a';
        const topic = cleanLine.replace(/[+\-]?\d+%/, '').trim();
        return { topic: topic || cleanLine, change };
      })
      .filter(t => t.topic.length > 5);
    if (trends.length > 0) return trends;
  }
  return [ 
    { topic: 'Telemedicine uptake (East Africa)', change: '+22%' }, 
    { topic: 'AI diagnostics in primary care', change: '+18%' }, 
    { topic: 'Last-mile cold chain optimization', change: '+12%' },
    { topic: 'Mobile health (mHealth) solutions expansion', change: '+15%' },
    { topic: 'Digital health record adoption', change: '+10%' }
  ];
}

export async function analyzePitchDeck(file: File) {
  // For now, return structured feedback
  // TODO: Implement actual PDF parsing and AI analysis
  const prompt = `Analyze a pitch deck for a healthcare startup. Provide feedback on:
1. Content quality and clarity
2. Structure and flow
3. Financial projections
4. Market opportunity presentation
5. Competitive positioning

Provide 5-7 specific, actionable feedback points.`;
  
  // Note: File upload would need to be implemented to extract text from PDF
  // For now, provide general feedback based on best practices
  const live = await postToBackendAI(prompt);
  if (live) {
    const feedback = live.split(/\n/)
      .map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 7);
    if (feedback.length > 0) {
      return { feedback };
    }
  }
  
  return { 
    feedback: [
      'Clarify go-to-market strategy by segment with specific customer acquisition plans',
      'Add unit economics sensitivity table showing best/worst case scenarios',
      'Strengthen competitive positioning with clear differentiation',
      'Include detailed financial projections with key assumptions',
      'Enhance market opportunity section with TAM/SAM/SOM analysis',
      'Add traction metrics and milestones achieved',
      'Improve team slide with relevant healthcare industry experience'
    ] 
  };
}

export async function generateFundraisingStrategy(input: { sector: string; stage: string; amount: number }) {
  const prompt = `Create a fundraising strategy for a ${input.sector} company at ${input.stage} stage raising $${input.amount.toLocaleString()} in Africa. Provide 5 actionable steps.`;
  const live = await postToBackendAI(prompt);
  if (live) {
    const steps = live.split(/\n/).map(s => s.replace(/^[-•\d+\.]\s*/, '').trim()).filter(Boolean).slice(0,5);
    if (steps.length > 0) return steps;
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) return ollamaResult.split(/\n/).filter(Boolean).slice(0,5).map(s => s.replace(/^[-•\d+\.]\s*/, '').trim());
  return [ `Start with specialized ${input.sector} angels and micro-VCs`, `Sequence regional funds active at ${input.stage} stage`, `Prepare outreach to 3-5 international funds for signal`, `Line up strategic corporates for partnerships`, `Time the close in tranches around milestones` ];
}

export async function askMedarion(query: string) {
  // Always use backend route (avoids CORS issues with direct API calls)
  // Backend connects to Vast.ai via Cloudflare tunnel (direct connection)
  // This is the recommended approach for production
  
  // Prefer backend AI gateway (supports Vast.ai via server)
  // Backend handles CORS and connects directly to Vast.ai
  try {
    const text = await postToBackendAI(query);
    if (text && !text.toLowerCase().includes('demo answer') && !text.toLowerCase().includes('placeholder')) {
      return { answer: text, sources: [] };
    }
  } catch (err: any) {
    console.error('[AI Service] askMedarion backend error:', err.message);
  }
  
  // Note: Direct API calls are disabled to avoid CORS errors
  // The backend route works perfectly and handles all connections

  // If a live inference base URL is configured, the app can call it here instead of Ollama
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const base = (import.meta as any).env?.VLLM_BASE_URL || (window as any)?.VLLM_BASE_URL;
    if (typeof base === 'string' && base) {
      const res = await fetch(`${base.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'medarion-8b-qlora',
          messages: [
            { role: 'system', content: 'You are Medarion, a helpful assistant for African healthcare market data. Be concise and cite sources when available.' },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || '';
        if (text && !text.toLowerCase().includes('demo answer')) {
          return { answer: text, sources: [] };
        }
      }
    }
  } catch (err: any) {
    console.error('[AI Service] askMedarion vLLM error:', err.message);
  }

  const live = await callOllamaIfEnabled(query);
  if (live && !live.toLowerCase().includes('demo answer')) {
    return { answer: live, sources: [] };
  }
  
  // Only return demo answer if all AI services failed
  console.warn('[AI Service] All AI services failed');
  console.warn('[AI Service] Check:');
  console.warn('  1. Backend is running on http://localhost:3001');
  console.warn('  2. Backend can reach Vast.ai API');
  console.warn('  3. Network connection is working');
  return { answer: `I'm sorry, but the AI service is currently unavailable. Please check that the backend server is running and try again.\n\nYour question: ${query}`, sources: [] };
}

export async function marketEntryReport(input: { country: string; sector: string }) {
  const prompt = `Create a comprehensive market entry report for ${input.sector} in ${input.country}. Format your response as:

OPPORTUNITIES:
- [List 3-5 opportunities, one per line]

CHALLENGES:
- [List 3-5 challenges, one per line]`;
  const live = await postToBackendAI(prompt);
  if (live) {
    const parseSection = (text: string, sectionName: string): string[] => {
      const regex = new RegExp(`${sectionName}[:\\s]*\\n?([^\\n]+(?:\\n[^\\n]+)*?)(?=\\n[A-Z]+:|$)`, 'is');
      const match = text.match(regex);
      if (match) {
        return match[1]
          .split(/\n/)
          .map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim())
          .filter(line => line.length > 5)
          .slice(0, 5);
      }
      return [];
    };
    
    const opportunities = parseSection(live, 'OPPORTUNITIES') || parseSection(live, 'opportunities');
    const challenges = parseSection(live, 'CHALLENGES') || parseSection(live, 'challenges');
    
    if (opportunities.length > 0 || challenges.length > 0) {
      return { 
        opportunities: opportunities.length > 0 ? opportunities : [`Growing demand for ${input.sector} solutions in ${input.country}`],
        challenges: challenges.length > 0 ? challenges : ['Fragmented reimbursement and procurement systems']
      };
    }
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const parseSection = (text: string, sectionName: string): string[] => {
      const regex = new RegExp(`${sectionName}[:\\s]*\\n?([^\\n]+(?:\\n[^\\n]+)*?)(?=\\n[A-Z]+:|$)`, 'is');
      const match = text.match(regex);
      if (match) {
        return match[1].split(/\n/).map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim()).filter(line => line.length > 5).slice(0, 5);
      }
      return [];
    };
    const opportunities = parseSection(ollamaResult, 'OPPORTUNITIES') || parseSection(ollamaResult, 'opportunities');
    const challenges = parseSection(ollamaResult, 'CHALLENGES') || parseSection(ollamaResult, 'challenges');
    return { 
      opportunities: opportunities.length > 0 ? opportunities : [`Growing demand for ${input.sector} solutions`],
      challenges: challenges.length > 0 ? challenges : ['Fragmented reimbursement and procurement']
    };
  }
  return { 
    opportunities: [
      `Growing demand for ${input.sector} solutions in ${input.country}`,
      'Supportive digital health policy frameworks in select regions',
      'Under-served rural and peri-urban populations',
      'Increasing smartphone and internet penetration',
      'Government initiatives supporting healthcare innovation'
    ], 
    challenges: [
      'Fragmented reimbursement and procurement systems',
      'Logistics and distribution complexity',
      'Variability in clinical adoption and training needs',
      'Regulatory approval processes',
      'Limited healthcare infrastructure in rural areas'
    ] 
  };
}

export async function generateImpactReport(input: { users: number; condition: string }) {
  const prompt = `Generate an impact statement for a healthcare solution serving ${input.users.toLocaleString()} users with focus on ${input.condition} in Africa. Include key metrics and outcomes.`;
  const live = await postToBackendAI(prompt);
  if (live && live.length > 50) return { statement: live };
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) return { statement: ollamaResult };
  return { statement: `Estimated ${Math.round(input.users * 0.35)} meaningful engagements for ${input.condition}, with projected adherence improvement of 8-12%.` };
}

export async function summarizeDeals(filters: { sector?: string; stage?: string; country?: string }) {
  const filterParts = [
    filters.sector && `in ${filters.sector} sector`,
    filters.stage && `at ${filters.stage} stage`,
    filters.country && `in ${filters.country}`
  ].filter(Boolean);
  
  const prompt = `Summarize recent healthcare investment deals ${filterParts.length > 0 ? filterParts.join(' ') : 'in Africa'}. 

Provide:
1. 3-5 key points about recent deals
2. A key takeaway or trend

Format as a clear, concise summary.`;
  const live = await postToBackendAI(prompt);
  if (live && live.length > 50) {
    // Clean up the response
    return live.trim();
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult && ollamaResult.length > 50) {
    return ollamaResult.trim();
  }
  const parts = [
    filters.sector && `sector ${filters.sector}`,
    filters.stage && `stage ${filters.stage}`,
    filters.country && filters.country
  ].filter(Boolean).join(', ');
  
  return `Summary for ${parts || 'recent healthcare deals in Africa'}:

Key Points:
• Notable seed rounds in AI diagnostics and digital health
• Growth equity investments in telemedicine platforms
• Strategic acquisitions in medical devices and diagnostics
• Increased focus on last-mile healthcare delivery solutions
• Growing investor interest in health tech infrastructure

Takeaway: Investor appetite remains selective but strong for companies with proven traction, clear unit economics, and strong local partnerships.`;
}

export async function suggestGrantTargets(filters: { sector?: string; type?: string; country?: string }) {
  const prompt = `Suggest 5 grant opportunities for ${filters.sector || 'health tech'} companies in ${filters.country || 'Africa'} (${filters.type || 'any type'}).

For each grant, provide:
1. Grant name
2. Brief description (1-2 sentences)

Format: One grant per line with name and description.`;
  const live = await postToBackendAI(prompt);
  if (live && live.length > 50) {
    // Parse grants from response
    const lines = live.split(/\n/)
      .map(line => line.replace(/^[-•\d+\.)\s]+/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 5);
    if (lines.length > 0) {
      return lines.join('\n');
    }
    return live.trim();
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult && ollamaResult.length > 50) {
    return ollamaResult.trim();
  }
  return `Suggested Grant Opportunities:

1. Global Health Innovation Fund (${filters.country || 'Africa'})
   Supports innovative healthcare solutions with focus on scalability and impact.

2. Digital Health Catalyst (${filters.sector || 'Health Tech'})
   Accelerates digital health startups with funding and mentorship support.

3. Impact Acceleration Grant (${filters.type || 'General'})
   Provides funding for healthcare solutions with measurable social impact.

4. African Development Bank Health Grant
   Supports healthcare infrastructure and innovation across African markets.

5. Bill & Melinda Gates Foundation Global Health Grant
   Funds innovative solutions addressing key health challenges in Africa.`;
}

export async function matchInvestors(filters: { sector?: string; stage?: string; country?: string }) {
  const prompt = `List 5 investors that match these criteria:
- Sector: ${filters.sector || 'healthcare'}
- Stage: ${filters.stage || 'seed'}
- Geographic focus: ${filters.country || 'Africa'}

Provide investor names only, one per line, without numbering or bullets.`;
  const live = await postToBackendAI(prompt);
  if (live) {
    const investors = live.split(/\n/)
      .map(s => s.replace(/^[-•\d+\.)\s]+/, '').trim())
      .filter(s => s.length > 2 && !s.match(/^(investor|name|list|top|here|are|the|matching)/i))
      .slice(0, 5);
    if (investors.length > 0) {
      return investors;
    }
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult) {
    const investors = ollamaResult.split(/\n/)
      .map(s => s.replace(/^[-•\d+\.)\s]+/, '').trim())
      .filter(s => s.length > 2 && !s.match(/^(investor|name|list)/i))
      .slice(0, 5);
    if (investors.length > 0) {
      return investors;
    }
  }
  // Return relevant investors based on filters
  const baseInvestors = ['Savannah Capital', 'TLcom Capital', 'Launch Africa', 'Norfund Health', 'Partech Africa'];
  if (filters.stage?.toLowerCase().includes('seed')) {
    return ['Launch Africa', 'Future Africa', 'Savannah Capital', 'TLcom Capital', 'Microtraction'];
  }
  if (filters.stage?.toLowerCase().includes('series a')) {
    return ['Savannah Capital', 'TLcom Capital', 'Partech Africa', 'Norfund Health', 'IFC'];
  }
  return baseInvestors;
}

export async function draftIntroEmail(input: { investorName: string; companyName: string; sector: string; stage: string }) {
  const prompt = `Draft a professional introduction email from ${input.companyName} (${input.sector} sector, ${input.stage} stage) to ${input.investorName}.

Requirements:
- Professional but warm tone
- Approximately 120-150 words
- Include: company introduction, what we do, traction, why we're reaching out
- Clear call to action
- Professional closing

Format as a complete email with subject line.`;
  const live = await postToBackendAI(prompt);
  if (live && live.length > 50) {
    // Clean up the email
    return live.trim();
  }
  const ollamaResult = await callOllamaIfEnabled(prompt);
  if (ollamaResult && ollamaResult.length > 50) {
    return ollamaResult.trim();
  }
  return `Subject: ${input.companyName} - ${input.stage} Stage ${input.sector} Opportunity

Hi ${input.investorName},

I hope this email finds you well. I'm reaching out from ${input.companyName}, a ${input.sector} company at the ${input.stage} stage.

We're building innovative solutions for the African healthcare market and have been following ${input.investorName}'s work in the space. We're seeing strong early traction and believe there could be alignment with your investment focus.

We would value the opportunity for a brief introductory call to explore potential fit and share more about our vision and progress.

Would you be available for a 15-20 minute call in the coming weeks?

Best regards,
${input.companyName} Team`;
}

// Fetch deals from database
export async function fetchDeals() {
  try {
    // Fetch real data from database API
    const response = await fetch(getApiUrl('/api/deals?limit=200'));
    const data = await response.json();
    
    if (data.success && data.data) {
      // Fetch companies for logos
      const companiesRes = await fetch(getApiUrl('/api/companies?limit=200')).then(r => r.json()).catch(() => ({ success: false, data: [] }));
      const companyLogoMap = new Map<string, string>();
      if (companiesRes.success && companiesRes.data) {
        companiesRes.data.forEach((company: any) => {
          if (company.name && company.logo_url) {
            companyLogoMap.set(company.name.toLowerCase().trim(), company.logo_url);
          }
        });
      }

      // Normalize to UI-expected shape
      return data.data.map((d: any) => ({
        id: d.id,
        company_name: d.company_name || 'Unknown',
        investors: d.participants ? (typeof d.participants === 'string' ? JSON.parse(d.participants) : d.participants) : (d.lead_investor ? [d.lead_investor] : []),
        value_usd: parseFloat(d.amount || 0),
        stage: d.deal_type || 'Unknown',
        country: d.country || 'Unknown',
        date: d.deal_date || d.created_at,
        sector: d.sector || d.industry || 'Unknown',
        company_logo: companyLogoMap.get((d.company_name || '').toLowerCase().trim()) || null,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching deals:', error);
    // Fallback to empty array
    return [];
  }
}

export async function fetchCompanies() {
  const deals = mockData.deals;
  const map = new Map<string, any>();
  for (const d of deals) {
    const key = d.companyName;
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        sector: d.sector,
        country: d.country,
        totalFunding: 0,
        dealCount: 0,
        lastFunding: d.date,
        investors: new Set<string>(),
        deals: [],
        logo: (companiesData as any)[key]?.logo || null,
        website: (companiesData as any)[key]?.website || null,
      });
    }
    const obj = map.get(key);
    obj.totalFunding += d.value;
    obj.dealCount += 1;
    obj.deals.push({ id: d.id, type: d.type, date: d.date, value: d.value, investors: d.investors, sector: d.sector, country: d.country });
    if (new Date(d.date) > new Date(obj.lastFunding)) obj.lastFunding = d.date;
    d.investors.forEach((inv) => obj.investors.add(inv));
  }
  const companies = Array.from(map.values()).map(v => ({ ...v, investors: Array.from(v.investors) }));
  return companies;
}

export async function fetchCompanyDetails(name: string) {
  const details = mockData.companies[name] || { clinical_trials: [], regulatory: [] };
  const deals = mockData.deals.filter(d => d.companyName === name);
  return { company: name, deals, ...details };
}

export async function fetchInvestors() {
  const deals = mockData.deals;
  const acc: Record<string, any> = {};
  for (const d of deals) {
    for (const inv of d.investors) {
      if (!acc[inv]) {
        acc[inv] = {
          name: inv,
          totalInvested: 0,
          dealCount: 0,
          companies: new Set<string>(),
          sectors: new Set<string>(),
          countries: new Set<string>(),
          stages: new Set<string>(),
          lastInvestment: d.date,
        };
      }
      const obj = acc[inv];
      obj.totalInvested += d.value / Math.max(1, d.investors.length);
      obj.dealCount += 1;
      obj.companies.add(d.companyName);
      obj.sectors.add(d.sector);
      obj.countries.add(d.country);
      obj.stages.add(d.type);
      if (new Date(d.date) > new Date(obj.lastInvestment)) obj.lastInvestment = d.date;
    }
  }
  const investors = Object.values(acc).map((inv: any) => ({
    ...inv,
    companies: Array.from(inv.companies),
    sectors: Array.from(inv.sectors),
    countries: Array.from(inv.countries),
    stages: Array.from(inv.stages),
  }));
  return investors;
}

export async function fetchGrants() {
  return grantsData.grants;
}

export async function fetchStocks() {
  return mockData.public_stocks;
}

export async function fetchNationPulse() {
  // Transform simplified nationPulseData to the structure expected by widgets/pages
  const src: any = nationPulseData as any;
  const toTitle = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const defaults: Record<string, { population_size: number; gdp_per_capita: number; health_spend_pct_gdp?: number }> = {
    kenya: { population_size: 53771300, gdp_per_capita: 2083, health_spend_pct_gdp: src.kenya?.investment_climate?.healthcare_investment ?? 2.8 },
    nigeria: { population_size: 206139589, gdp_per_capita: 2250, health_spend_pct_gdp: src.nigeria?.investment_climate?.healthcare_investment ?? 3.2 },
    south_africa: { population_size: 59308690, gdp_per_capita: 6000, health_spend_pct_gdp: src.south_africa?.investment_climate?.healthcare_investment ?? 8.5 },
  };

  const result: any = {
    population: {},
    healthcare_infrastructure: {},
    economic_indicators: {},
    disease_immunization: {},
  };

  Object.keys(src || {}).forEach((key) => {
    const node = src[key];
    if (!node) return;
    const proper = toTitle(key);
    const def = defaults[key] || { population_size: 50000000, gdp_per_capita: 2500, health_spend_pct_gdp: 4.0 };

    // Population block
    result.population[key] = {
      country: proper,
      life_expectancy: node.healthcare_indicators?.life_expectancy ?? 60,
      population_size: def.population_size,
      population_growth_rate: 2.4,
      birth: {
        annual_births: Math.round(def.population_size * 0.032),
        birth_rate: 32,
      },
      mortality: {
        under_five_rate: node.healthcare_indicators?.infant_mortality ?? 35,
        neonatal_rate: Math.max(8, Math.round((node.healthcare_indicators?.infant_mortality ?? 35) / 2)),
      },
    };

    // Healthcare infrastructure
    const perCapitaSpend = Math.round(def.gdp_per_capita * (Number(def.health_spend_pct_gdp) / 100));
    result.healthcare_infrastructure[key] = {
      health_expenditure: {
        per_capita_usd: perCapitaSpend,
        percentage_of_gdp: Number(def.health_spend_pct_gdp) || 4.0,
        government_share: 55,
        private_share: 45,
      },
      health_workforce: {
        physicians_per_10k: 9,
        nurses_per_10k: 28,
        midwives_per_10k: 12,
      },
      water_sanitation: {
        drinking_water_access: 72,
        basic_sanitation_access: 48,
        handwashing_facilities: 38,
      },
    };

    // Economic indicators
    const totalGdpBillions = Math.round((def.population_size * def.gdp_per_capita) / 1_000_000_000);
    result.economic_indicators[key] = {
      gdp: {
        total_usd_billions: totalGdpBillions,
        per_capita_usd: def.gdp_per_capita,
        growth_rate: 4.2,
      },
      inflation_rate: 8.5,
      foreign_investment: {
        fdi_inflow_millions: 1200,
        healthcare_fdi_share: 7,
      },
      employment: {
        unemployment_rate: 8.9,
        informal_sector_size: 55,
      },
      poverty_inequality: {
        poverty_rate: 36,
        gini_coefficient: 0.44,
      },
      government_finance: {
        debt_to_gdp: 54,
        fiscal_deficit_to_gdp: 4.1,
        health_budget_share: 9.8,
      },
      currency: {
        code: key === 'south_africa' ? 'ZAR' : key === 'egypt' ? 'EGP' : key === 'nigeria' ? 'NGN' : 'KES',
        exchange_rate_to_usd: key === 'south_africa' ? 18.5 : key === 'nigeria' ? 1500 : key === 'egypt' ? 47 : 129,
      },
    };

    // Disease and immunization
    result.disease_immunization[key] = {
      disease_prevalence: {
        hiv_prevalence: key === 'south_africa' ? 13.0 : key === 'kenya' ? 4.3 : 1.5,
        art_coverage: key === 'south_africa' ? 72 : key === 'kenya' ? 78 : 65,
        malaria_incidence: key === 'nigeria' ? 220 : key === 'kenya' ? 120 : 10,
        tuberculosis_incidence: key === 'south_africa' ? 520 : 220,
        ncd_burden: 38,
      },
      immunization_coverage: {
        dtp3: 84,
        bcg: 86,
        measles: 78,
        polio: 82,
      },
    };
  });

  return result;
}

export async function fetchDashboard() {
  try {
    // Fetch real data from database APIs
    const [companiesRes, dealsRes, investorsRes] = await Promise.all([
      fetch(getApiUrl('/api/companies?limit=100')).then(r => r.json()).catch(() => ({ success: false, data: [] })),
      fetch(getApiUrl('/api/deals?limit=100')).then(r => r.json()).catch(() => ({ success: false, data: [] })),
      fetch(getApiUrl('/api/investors?limit=100')).then(r => r.json()).catch(() => ({ success: false, data: [] }))
    ]);

    const companies = companiesRes.success ? companiesRes.data || [] : [];
    const deals = dealsRes.success ? dealsRes.data || [] : [];
    const investors = investorsRes.success ? investorsRes.data || [] : [];

    // Calculate KPIs from real data
    const companiesCount = companies.length;
    const dealsCount = deals.length;
    const investorsCount = investors.length;
    const totalValueUsd = deals.reduce((sum: number, d: any) => sum + (parseFloat(d.amount || 0) || 0), 0);

    const now = Date.now();
    const sampleActivity = (mockData.startup_dashboard_data?.notifications || []).map((n, idx) => ({
      message: n.message,
      time: new Date(now - idx * 60 * 60 * 1000).toISOString(),
    }));

    return {
      kpis: {
        companies: companiesCount,
        deals_and_grants: dealsCount,
        investors: investorsCount,
        total_value_usd: totalValueUsd,
      },
      startup_dashboard_data: mockData.startup_dashboard_data,
      deals: deals.slice(0, 10).map((d: any) => ({
        id: d.id,
        company_name: d.company_name || 'Unknown',
        investors: d.participants ? (typeof d.participants === 'string' ? JSON.parse(d.participants) : d.participants) : (d.lead_investor ? [d.lead_investor] : []),
        value_usd: parseFloat(d.amount || 0),
        stage: d.deal_type || 'Unknown',
        country: d.country || 'Unknown',
        date: d.deal_date || d.created_at,
        sector: d.sector || d.industry || 'Unknown',
      })),
      companies: companies.slice(0, 5).map((c: any) => c.name || 'Unknown'),
      investors: investors.slice(0, 5).map((i: any) => i.name || i.organization_name || 'Unknown'),
      sample_activity: sampleActivity,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Fallback to mock data if database fetch fails
    const now = Date.now();
    const sampleActivity = (mockData.startup_dashboard_data?.notifications || []).map((n, idx) => ({
      message: n.message,
      time: new Date(now - idx * 60 * 60 * 1000).toISOString(),
    }));

    return {
      kpis: mockData.kpis,
      startup_dashboard_data: mockData.startup_dashboard_data,
      deals: (mockData.deals || []).slice(0, 10).map((d) => ({
        id: d.id,
        company_name: d.companyName,
        investors: d.investors,
        value_usd: d.value,
        stage: d.type,
        country: d.country,
        date: d.date,
        sector: d.sector,
      })),
      companies: Object.keys(mockData.companies).slice(0, 5),
      investors: Array.from(new Set(mockData.deals.flatMap((d) => d.investors))).slice(0, 5),
      sample_activity: sampleActivity,
    };
  }
} 