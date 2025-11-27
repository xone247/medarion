import React, { useMemo, useState } from 'react';
import { aiToolsData, aiToolCategories, aiToolTiers } from '../data/aiToolsData';
import { useAuth } from '../contexts/AuthContext';
import { ACCESS_MATRIX } from '../types/accessControl';
import {
  assessMarketRisk,
  analyzeCompetitors,
  benchmarkValuation,
  generateDueDiligenceSummary,
  detectTrends,
  analyzePitchDeck,
  generateFundraisingStrategy,
  askMedarion,
  marketEntryReport,
  generateImpactReport,
  summarizeDeals,
  suggestGrantTargets,
  matchInvestors,
  draftIntroEmail,
} from '../services/ai';
import {
  X, Loader2, Copy, Download, ArrowRight
} from 'lucide-react';
import AIChatInterface from '../components/ai/AIChatInterface';


const AIToolsPage: React.FC = () => {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [actionParams, setActionParams] = useState<Record<string, any>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<any>(null);
  const [runHistory, setRunHistory] = useState<Array<{ id: string; at: string; params: any; result?: any }>>([]);

  // AI policy & usage
  const aiPolicy = useMemo(() => {
    try {
      if (!profile) return { enabled: false, quota: 0 };
      const role = (profile as any).user_type as keyof typeof ACCESS_MATRIX;
      const tier = ((profile as any).account_tier || 'free') as keyof typeof ACCESS_MATRIX[typeof role];
      const node: any = (ACCESS_MATRIX as any)?.[role]?.[tier] || {};
      return { enabled: !!node.aiEnabled, quota: Number(node.aiMonthlyQuota || 0) };
    } catch {
      return { enabled: false, quota: 0 };
    }
  }, [profile]);

  const usageKey = useMemo(() => {
    const ym = new Date();
    const stamp = `${ym.getFullYear()}${String(ym.getMonth()+1).padStart(2,'0')}`;
    return `medarionAIUsage_${(profile as any)?.email || 'anon'}_${stamp}`;
  }, [profile?.email]);

  const getUsage = () => {
    try { const raw = localStorage.getItem(usageKey); return raw ? Number(raw) : 0; } catch { return 0; }
  };
  const setUsage = (n: number) => { try { localStorage.setItem(usageKey, String(n)); } catch {} };
  const historyKey = useMemo(() => `${usageKey}_history`, [usageKey]);
  const loadHistory = () => { try { const raw = localStorage.getItem(historyKey); setRunHistory(raw? JSON.parse(raw): []);} catch { setRunHistory([]);} };
  const saveHistory = (h: Array<{id:string;at:string;params:any;result?:any}>) => { setRunHistory(h); try { localStorage.setItem(historyKey, JSON.stringify(h)); } catch {} };
  React.useEffect(() => { loadHistory(); }, [historyKey]);

  const isAdmin = useMemo(() => {
    if (!profile) return false;
    const p: any = profile as any;
    const roleStr = String(p.role || p.user_type || '').toLowerCase();
    return !!p.is_admin || roleStr.includes('admin');
  }, [profile]);
  const userTier = useMemo(() => {
    return ((profile as any)?.account_tier || 'free').toString();
  }, [profile]);

  const filteredTools = aiToolsData.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesTier = selectedTier === 'all' || tool.requiredTier === selectedTier;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Enforce: Medarion AI Assistant is NOT free; show only for paid/enterprise or admin
    if (tool.id === 'medarion-assistant' && !isAdmin && !['paid','enterprise'].includes(userTier)) {
      return false;
    }

    return matchesCategory && matchesTier && matchesSearch;
  });

  const canAccessTool = (tool: typeof aiToolsData[0]) => {
    if (!profile) return false;
    if (profile.is_admin) return true;
    const userTier = (profile as any).account_tier || 'free';
    const tierHierarchy = { 'free': 0, 'paid': 1, 'academic': 2, 'enterprise': 3 };
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
    const toolTierLevel = tierHierarchy[tool.requiredTier];
    return userTierLevel >= toolTierLevel;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white';
      case 'beta': return 'bg-blue-500 text-white dark:bg-blue-500 border border-blue-400';
      case 'coming_soon': return 'bg-amber-500 text-white dark:bg-amber-500 border border-amber-400';
      default: return 'bg-gray-500 text-white dark:bg-gray-500 border border-gray-400';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white';
      case 'paid': return 'bg-blue-500 text-white dark:bg-blue-500 border border-blue-400';
      case 'academic': return 'bg-purple-500 text-white dark:bg-purple-500 border border-purple-400';
      case 'enterprise': return 'bg-orange-500 text-white dark:bg-orange-500 border border-orange-400';
      default: return 'bg-gray-500 text-white dark:bg-gray-500 border border-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'from-blue-500/5 to-cyan-500/5';
      case 'prediction': return 'from-purple-500/5 to-pink-500/5';
      case 'automation': return 'from-[var(--color-primary-teal)]/5 to-[var(--color-primary-teal)]/5';
      case 'insights': return 'from-amber-500/5 to-orange-500/5';
      case 'research': return 'from-indigo-500/5 to-blue-500/5';
      default: return 'from-gray-500/5 to-gray-600/5';
    }
  };

  // Format AI tool results for display (not raw JSON)
  const formatActionResult = (result: any): React.ReactNode => {
    if (!result) return null;
    
    // String result - display directly with scrolling
    if (typeof result === 'string') {
      return (
        <pre className="text-sm text-[var(--color-text-primary)] overflow-x-auto overflow-y-auto whitespace-pre-wrap font-medium leading-relaxed max-h-[500px] p-4 bg-[var(--color-background-surface)]/50 rounded-lg border border-[var(--color-divider-gray)]/30" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {result}
        </pre>
      );
    }
    
    // Object with answer property (from askMedarion)
    if (result.answer) {
      return (
        <pre className="text-sm text-[var(--color-text-primary)] overflow-x-auto overflow-y-auto whitespace-pre-wrap font-medium leading-relaxed max-h-[500px] p-4 bg-[var(--color-background-surface)]/50 rounded-lg border border-[var(--color-divider-gray)]/30" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {result.answer}
        </pre>
      );
    }
    
    // Object with statement property (from generateImpactReport)
    if (result.statement) {
      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Impact Statement</div>
          <pre className="text-sm text-[var(--color-text-primary)] overflow-x-auto overflow-y-auto whitespace-pre-wrap font-medium leading-relaxed max-h-[500px] p-4 bg-[var(--color-background-surface)]/50 rounded-lg border border-[var(--color-divider-gray)]/30" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {result.statement}
          </pre>
        </div>
      );
    }
    
    // Object with score and factors (from assessMarketRisk)
    if (result.score !== undefined && result.factors) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-medium text-[var(--color-primary-teal)]">{result.score}</div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">Risk Score (0-100)</div>
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Key Risk Factors:</div>
            <ul className="space-y-2">
              {result.factors.map((factor: string, idx: number) => (
                <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                  <span className="text-[var(--color-primary-teal)] mt-1">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
    // Object with SWOT (from generateDueDiligenceSummary)
    if (result.swot) {
      return (
        <div className="space-y-4 max-h-[500px] overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--color-primary-teal)]/10 border border-[var(--color-primary-teal)]/30">
              <div className="text-sm font-medium text-[var(--color-primary-teal)] mb-2">Strengths</div>
              <ul className="space-y-1">
                {result.swot.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Weaknesses</div>
              <ul className="space-y-1">
                {result.swot.weaknesses?.map((w: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {w}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Opportunities</div>
              <ul className="space-y-1">
                {result.swot.opportunities?.map((o: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {o}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">Threats</div>
              <ul className="space-y-1">
                {result.swot.threats?.map((t: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {t}</li>
                ))}
              </ul>
            </div>
          </div>
          {result.questions && result.questions.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Key Questions for Investors:</div>
              <ul className="space-y-2">
                {result.questions.map((q: string, idx: number) => (
                  <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                    <span className="text-[var(--color-primary-teal)] mt-1">{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    // Object with opportunities and challenges (from marketEntryReport)
    if (result.opportunities || result.challenges) {
      return (
        <div className="space-y-4 max-h-[500px] overflow-y-auto overflow-x-hidden">
          {result.opportunities && result.opportunities.length > 0 && (
            <div>
              <div className="text-sm font-medium text-[var(--color-primary-teal)] mb-2">Opportunities</div>
              <ul className="space-y-2">
                {result.opportunities.map((opp: string, idx: number) => (
                  <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                    <span className="text-[var(--color-primary-teal)] mt-1">✓</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.challenges && result.challenges.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Challenges</div>
              <ul className="space-y-2">
                {result.challenges.map((ch: string, idx: number) => (
                  <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                    <span className="text-red-500 mt-1">⚠</span>
                    <span>{ch}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    // Object with low/high (from benchmarkValuation)
    if (result.low !== undefined && result.high !== undefined) {
      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Valuation Range</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Low</div>
              <div className="text-lg font-medium text-[var(--color-text-primary)]">
                ${(result.low / 1_000_000).toFixed(1)}M
              </div>
            </div>
            <div className="text-[var(--color-text-secondary)]">→</div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">High</div>
              <div className="text-lg font-medium text-[var(--color-text-primary)]">
                ${(result.high / 1_000_000).toFixed(1)}M
              </div>
            </div>
            {result.currency && (
              <div className="text-xs text-[var(--color-text-secondary)] ml-auto">
                {result.currency}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Array of strings (from detectTrends, generateFundraisingStrategy, matchInvestors, etc.)
    if (Array.isArray(result)) {
      return (
        <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
          <ul className="space-y-2">
            {result.map((item: any, idx: number) => (
              <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                <span className="text-[var(--color-primary-teal)] mt-1">•</span>
                <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{typeof item === 'string' ? item : item.topic || JSON.stringify(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Array of objects with topic (from detectTrends)
    if (Array.isArray(result) && result.length > 0 && result[0]?.topic) {
      return (
        <ul className="space-y-3">
          {result.map((item: any, idx: number) => (
            <li key={idx} className="text-sm text-[var(--color-text-primary)]">
              <div className="font-medium">{item.topic}</div>
              {item.change && <div className="text-xs text-[var(--color-text-secondary)]">{item.change}</div>}
            </li>
          ))}
        </ul>
      );
    }
    
    // Object with feedback array (from analyzePitchDeck)
    if (result.feedback && Array.isArray(result.feedback)) {
      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Feedback</div>
          <ul className="space-y-2">
            {result.feedback.map((fb: string, idx: number) => (
              <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                <span className="text-[var(--color-primary-teal)] mt-1">•</span>
                <span>{fb}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Object with competitors (from analyzeCompetitors)
    if (result.competitors && Array.isArray(result.competitors)) {
      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Top Competitors</div>
          <ul className="space-y-2">
            {result.competitors.map((comp: any, idx: number) => (
              <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                <span className="text-[var(--color-primary-teal)] mt-1 font-medium">{idx + 1}.</span>
                <span>{typeof comp === 'string' ? comp : comp.name || JSON.stringify(comp)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Fallback: format as readable text (not raw JSON)
    const formatObject = (obj: any, indent = 0): string => {
      if (typeof obj === 'string') return obj;
      if (typeof obj !== 'object' || obj === null) return String(obj);
      if (Array.isArray(obj)) {
        return obj.map((item, idx) => `${'  '.repeat(indent)}${idx + 1}. ${formatObject(item, indent + 1)}`).join('\n');
      }
      return Object.entries(obj)
        .map(([key, value]) => {
          const formattedValue = typeof value === 'object' && value !== null 
            ? `\n${formatObject(value, indent + 1)}`
            : String(value);
          return `${'  '.repeat(indent)}${key}: ${formattedValue}`;
        })
        .join('\n');
    };
    
    return (
      <pre className="text-sm text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap font-medium leading-relaxed">
        {formatObject(result)}
      </pre>
    );
  };

  const runAction = async (toolId: string) => {
    if (!aiPolicy.enabled) {
      setActionResult({ error: 'Your plan does not include AI access. Upgrade to enable.' });
      return;
    }
    if (aiPolicy.quota && getUsage() >= aiPolicy.quota) {
      setActionResult({ error: `Monthly AI quota reached (${aiPolicy.quota}). Upgrade for more.` });
      return;
    }
    
    setActionLoading(true);
    setActionResult(null);
    
    try {
      let res: any = null;
      const tool = aiToolsData.find(t => t.id === toolId);
      
      switch (toolId) {
        case 'market-risk-assessment': res = await assessMarketRisk({ country: actionParams.country }); break;
        case 'competitor-analysis': res = await analyzeCompetitors({ companyId: actionParams.companyId }); break;
        case 'valuation-benchmarking': res = await benchmarkValuation({ sector: actionParams.sector, stage: actionParams.stage }); break;
        case 'due-diligence-summary': res = await generateDueDiligenceSummary({ companyId: actionParams.companyId }); break;
        case 'trend-detection': res = await detectTrends({ timeframe: actionParams.timeframe }); break;
        case 'pitch-deck-analyzer': res = await analyzePitchDeck(actionParams.file); break;
        case 'fundraising-strategy': res = await generateFundraisingStrategy({ sector: actionParams.sector, stage: actionParams.stage, amount: Number(actionParams.amount||0) }); break;
        case 'medarion-assistant': res = await askMedarion(actionParams.query); break;
        case 'market-entry-report': res = await marketEntryReport({ country: actionParams.country, sector: actionParams.sector }); break;
        case 'impact-report-generator': res = await generateImpactReport({ users: Number(actionParams.users||0), condition: actionParams.condition }); break;
        case 'deal-summarizer': res = await summarizeDeals({ sector: actionParams.sector || undefined, stage: actionParams.stage || undefined, country: actionParams.country || undefined }); break;
        case 'grant-target-suggester': res = await suggestGrantTargets({ sector: actionParams.sector || undefined, type: actionParams.type || undefined, country: actionParams.country || undefined }); break;
        case 'investor-matcher': res = await matchInvestors({ sector: actionParams.sector || undefined, stage: actionParams.stage || undefined, country: actionParams.country || undefined }); break;
        case 'email-drafter': res = await draftIntroEmail({ investorName: actionParams.investorName, companyName: actionParams.companyName, sector: actionParams.sector, stage: actionParams.stage }); break;
      }
      
      setActionResult(res);
      
      if (aiPolicy.enabled) {
        const cur = getUsage();
        setUsage(cur + 1);
        const next = [{ id: toolId, at: new Date().toISOString(), params: actionParams, result: res }, ...runHistory].slice(0,20);
        saveHistory(next);
      }
    } catch (error: any) {
      setActionResult({ error: error.message || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const selectedToolData = selectedTool ? aiToolsData.find(t => t.id === selectedTool) : null;

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (selectedTool) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedTool]);

  // Build parameter fields based on tool
  const getToolParams = (toolId: string) => {
    const params: Array<{ key: string; label: string; type: string; placeholder?: string; options?: string[] }> = [];
    
    switch (toolId) {
      case 'market-risk-assessment':
        params.push({ key: 'country', label: 'Country', type: 'text', placeholder: 'e.g., Nigeria, Kenya, Ghana' });
        break;
      case 'competitor-analysis':
        params.push({ key: 'companyId', label: 'Company Name or ID', type: 'text', placeholder: 'Enter company identifier' });
        break;
      case 'valuation-benchmarking':
        params.push({ key: 'sector', label: 'Sector', type: 'text', placeholder: 'e.g., Telemedicine, AI Diagnostics' });
        params.push({ key: 'stage', label: 'Stage', type: 'text', placeholder: 'e.g., Seed, Series A, Series B' });
        break;
      case 'due-diligence-summary':
        params.push({ key: 'companyId', label: 'Company Name or ID', type: 'text', placeholder: 'Enter company identifier' });
        break;
      case 'trend-detection':
        params.push({ key: 'timeframe', label: 'Timeframe', type: 'text', placeholder: 'e.g., Last 6 months, 2025, Q1 2025' });
        break;
      case 'pitch-deck-analyzer':
        params.push({ key: 'file', label: 'Upload Pitch Deck (PDF)', type: 'file' });
        break;
      case 'fundraising-strategy':
        params.push({ key: 'sector', label: 'Sector', type: 'text', placeholder: 'e.g., Health Tech, Telemedicine' });
        params.push({ key: 'stage', label: 'Stage', type: 'text', placeholder: 'e.g., Seed, Series A' });
        params.push({ key: 'amount', label: 'Funding Amount (USD)', type: 'number', placeholder: 'e.g., 5000000' });
        break;
      case 'medarion-assistant':
        params.push({ key: 'query', label: 'Your Question', type: 'textarea', placeholder: 'Ask anything about African healthcare markets...' });
        break;
      case 'market-entry-report':
        params.push({ key: 'country', label: 'Country', type: 'text', placeholder: 'e.g., Nigeria, Kenya' });
        params.push({ key: 'sector', label: 'Sector', type: 'text', placeholder: 'e.g., Medical Devices, Telemedicine' });
        break;
      case 'impact-report-generator':
        params.push({ key: 'users', label: 'Number of Users/Patients', type: 'number', placeholder: 'e.g., 50000' });
        params.push({ key: 'condition', label: 'Medical Condition/Focus', type: 'text', placeholder: 'e.g., Primary care, Diabetes, Maternal health' });
        break;
      case 'deal-summarizer':
        params.push({ key: 'sector', label: 'Sector (Optional)', type: 'text', placeholder: 'e.g., Health Tech' });
        params.push({ key: 'stage', label: 'Stage (Optional)', type: 'text', placeholder: 'e.g., Series A' });
        params.push({ key: 'country', label: 'Country (Optional)', type: 'text', placeholder: 'e.g., Nigeria' });
        break;
      case 'grant-target-suggester':
        params.push({ key: 'sector', label: 'Sector (Optional)', type: 'text', placeholder: 'e.g., Health Tech' });
        params.push({ key: 'type', label: 'Grant Type (Optional)', type: 'text', placeholder: 'e.g., Innovation, Research' });
        params.push({ key: 'country', label: 'Country (Optional)', type: 'text', placeholder: 'e.g., Kenya' });
        break;
      case 'investor-matcher':
        params.push({ key: 'sector', label: 'Sector (Optional)', type: 'text', placeholder: 'e.g., Health Tech' });
        params.push({ key: 'stage', label: 'Stage (Optional)', type: 'text', placeholder: 'e.g., Seed, Series A' });
        params.push({ key: 'country', label: 'Country (Optional)', type: 'text', placeholder: 'e.g., Nigeria' });
        break;
      case 'email-drafter':
        params.push({ key: 'investorName', label: 'Investor Name', type: 'text', placeholder: 'e.g., Savannah Capital' });
        params.push({ key: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., HealthTech Solutions' });
        params.push({ key: 'sector', label: 'Sector', type: 'text', placeholder: 'e.g., Telemedicine' });
        params.push({ key: 'stage', label: 'Stage', type: 'text', placeholder: 'e.g., Seed' });
        break;
    }
    
    return params;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Status Bar - Compact */}
        {profile && (
          <div className="mb-3">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 border border-cyan-200/50 dark:border-cyan-800/50">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${aiPolicy.enabled ? 'bg-cyan-600 dark:bg-cyan-400 shadow-lg shadow-cyan-500/50' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  AI Access: <span className={`${aiPolicy.enabled ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {aiPolicy.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </span>
              </div>
              {aiPolicy.quota ? (
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Usage: <span className="text-cyan-600 dark:text-cyan-400 font-medium">{getUsage()}</span> / <span className="text-slate-700 dark:text-slate-200">{aiPolicy.quota}</span> this month
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Quota: <span className="text-cyan-600 dark:text-cyan-400">{aiPolicy.enabled ? 'Unlimited (demo)' : '—'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filters - Compact */}
        <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg mb-3 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-2">
            <input
              type="text"
              placeholder="Search AI tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[160px]"
            >
              <option value="all">All Categories</option>
              {Object.entries(aiToolCategories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[140px]"
            >
              <option value="all">All Tiers</option>
              {Object.entries(aiToolTiers).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {filteredTools.map((tool) => {
            const enabled = canAccessTool(tool);
            
            return (
              <div
                key={tool.id}
                onClick={() => enabled && setSelectedTool(tool.id)}
                className={`group relative bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  enabled ? 'hover:border-cyan-500/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tool.status)}`}>
                    {tool.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTierColor(tool.requiredTier)}`}>
                    {aiToolTiers[tool.requiredTier as keyof typeof aiToolTiers]}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-1.5 pr-20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>

                {/* Features Preview */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {tool.features.slice(0, 2).map((feature, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                      {feature.split('(')[0].trim()}
                    </span>
                  ))}
                  {tool.features.length > 2 && (
                    <span className="px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      +{tool.features.length - 2} more
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {aiToolCategories[tool.category as keyof typeof aiToolCategories]}
                  </span>
                  {enabled ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTool(tool.id);
                        setActionParams({});
                        setActionResult(null);
                      }}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded transition-colors"
                    >
                      Launch
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Upgrade Required</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        {runHistory.length > 0 && (
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {runHistory.slice(0, 5).map((run, idx) => {
                const tool = aiToolsData.find(t => t.id === run.id);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTool(run.id);
                      setActionParams(run.params);
                      setActionResult(run.result);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:border-cyan-500/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{tool?.name || run.id}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(run.at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {!aiPolicy.enabled && (
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 p-6 rounded-lg border-2 border-cyan-200/50 dark:border-cyan-800/50 shadow-sm mb-6 text-center">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">Unlock AI Tools</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-2xl mx-auto">
              Upgrade your plan to access AI-powered insights, automation, and research copilots that accelerate your healthcare innovation journey.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('medarion:navigate:static', { detail: { page: 'pricing' } }))}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
              >
                View Plans
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Contact Sales</button>
            </div>
          </div>
        )}
      </div>

      {/* Tool Modal */}
      {selectedTool && selectedToolData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          style={{ overscrollBehavior: 'contain', overflow: 'hidden' }}
          onClick={() => {
            setSelectedTool(null);
            setActionResult(null);
            setActionParams({});
          }}
        >
          <div 
            className={`relative w-full ${selectedTool === 'medarion-assistant' ? 'max-w-5xl h-[90vh]' : 'max-w-4xl'} ${selectedTool === 'medarion-assistant' ? '' : 'card-glass'} shadow-elevated border-2 border-[var(--color-primary-teal)]/20 flex flex-col`}
            style={selectedTool === 'medarion-assistant' ? { maxHeight: '90vh', padding: 0, overflow: 'hidden' } : { maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Hidden for chat interface */}
            {selectedTool !== 'medarion-assistant' && (
              <div className="sticky top-0 z-10 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">{selectedToolData.name}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedToolData.status)}`}>
                        {selectedToolData.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedToolData.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setActionResult(null);
                      setActionParams({});
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Features & Use Cases */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Key Features
                    </h4>
                    <ul className="space-y-1">
                      {selectedToolData.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Use Cases
                    </h4>
                    <ul className="space-y-1">
                      {selectedToolData.useCases.slice(0, 3).map((useCase, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          • {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-hidden flex flex-col" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Use Chat Interface for Medarion AI Assistant */}
              {selectedTool === 'medarion-assistant' ? (
                <div className="flex-1 flex flex-col overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <AIChatInterface
                    toolName={selectedToolData.name}
                    toolDescription={selectedToolData.description}
                    useCases={selectedToolData.useCases}
                    examples={selectedToolData.examples}
                    onClose={() => {
                      setSelectedTool(null);
                      setActionResult(null);
                      setActionParams({});
                    }}
                  />
                </div>
              ) : (
                <div className="p-6 overflow-y-auto overflow-x-hidden flex-1" style={{ maxHeight: '100%' }}>
                  {/* Parameters Form */}
                  <div className="mb-4">
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">Configure Parameters</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getToolParams(selectedTool).map((param) => (
                        <div key={param.key} className={param.type === 'textarea' ? 'col-span-2' : ''}>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            {param.label}
                          </label>
                          {param.type === 'textarea' ? (
                            <textarea
                              value={actionParams[param.key] || ''}
                              onChange={(e) => setActionParams(prev => ({...prev, [param.key]: e.target.value}))}
                              placeholder={param.placeholder}
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all resize-none"
                            />
                          ) : param.type === 'file' ? (
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setActionParams(prev => ({...prev, file: e.target.files?.[0]}))}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
                            />
                          ) : (
                            <input
                              type={param.type}
                              value={actionParams[param.key] || ''}
                              onChange={(e) => setActionParams(prev => ({...prev, [param.key]: e.target.value}))}
                              placeholder={param.placeholder}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {aiPolicy.enabled ? (
                        <>
                          <span className="text-cyan-600 dark:text-cyan-400">✓</span> AI Enabled
                          {aiPolicy.quota && <span className="ml-2 text-cyan-600 dark:text-cyan-400">Usage: {getUsage()} / {aiPolicy.quota}</span>}
                        </>
                      ) : (
                        <>
                          <span className="text-amber-500">⚠</span> AI Access Disabled
                        </>
                      )}
                    </div>
                    <button
                      disabled={actionLoading || !aiPolicy.enabled}
                      onClick={() => runAction(selectedTool)}
                      className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Run Analysis
                        </>
                      )}
                    </button>
                  </div>

                  {/* Results - Very Prominent */}
                  {actionResult && (
                    <div className="mt-4 bg-white dark:bg-slate-800/50 p-4 rounded-lg border-2 border-cyan-200 dark:border-cyan-800 shadow-sm">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          {actionResult.error ? (
                            <>
                              <span className="text-red-500">⚠</span>
                              <span>Error</span>
                            </>
                          ) : (
                            <>
                              <span className="text-cyan-600 dark:text-cyan-400">✓</span>
                              <span>AI Results</span>
                            </>
                          )}
                        </h3>
                        {!actionResult.error && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(typeof actionResult === 'string' ? actionResult : JSON.stringify(actionResult, null, 2))}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([typeof actionResult === 'string' ? actionResult : JSON.stringify(actionResult, null, 2)], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${selectedToolData.id}-results.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              title="Download results"
                            >
                              <Download className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {actionResult.error ? (
                          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-sm">
                            {actionResult.error}
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                            {formatActionResult(actionResult)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  {selectedToolData.examples && selectedToolData.examples.length > 0 && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Example</h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                        <div>
                          <span className="font-medium text-cyan-600 dark:text-cyan-400">Input: </span>
                          {selectedToolData.examples[0].input}
                        </div>
                        <div>
                          <span className="font-medium text-cyan-600 dark:text-cyan-400">Output: </span>
                          {selectedToolData.examples[0].output}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsPage; 