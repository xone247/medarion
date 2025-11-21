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
  Shield, Users, BarChart3, FileSearch, TrendingUp, Presentation,
  Target, Bot, Map, Heart, FileText, Award, Handshake, Mail,
  Search, Filter, X, Sparkles, Zap, CheckCircle, AlertCircle,
  Clock, Loader2, Copy, Download, ExternalLink, ChevronRight,
  Star, ArrowRight, Info
} from 'lucide-react';
import AIChatInterface from '../components/ai/AIChatInterface';

// Icon mapping for tools
const iconMap: Record<string, React.ComponentType<any>> = {
  'market-risk-assessment': Shield,
  'competitor-analysis': Users,
  'valuation-benchmarking': BarChart3,
  'due-diligence-summary': FileSearch,
  'trend-detection': TrendingUp,
  'pitch-deck-analyzer': Presentation,
  'fundraising-strategy': Target,
  'medarion-assistant': Bot,
  'market-entry-report': Map,
  'impact-report-generator': Heart,
  'deal-summarizer': FileText,
  'grant-target-suggester': Award,
  'investor-matcher': Handshake,
  'email-drafter': Mail,
};

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
      case 'active': return 'bg-[var(--color-primary-teal)] text-white border border-[var(--color-primary-teal)]';
      case 'beta': return 'bg-blue-500 text-white dark:bg-blue-500 border border-blue-400';
      case 'coming_soon': return 'bg-amber-500 text-white dark:bg-amber-500 border border-amber-400';
      default: return 'bg-gray-500 text-white dark:bg-gray-500 border border-gray-400';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-[var(--color-primary-teal)] text-white border border-[var(--color-primary-teal)]';
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
          <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Impact Statement</div>
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
            <div className="text-3xl font-bold text-[var(--color-primary-teal)]">{result.score}</div>
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">Risk Score (0-100)</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Key Risk Factors:</div>
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
              <div className="text-sm font-semibold text-[var(--color-primary-teal)] mb-2">Strengths</div>
              <ul className="space-y-1">
                {result.swot.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Weaknesses</div>
              <ul className="space-y-1">
                {result.swot.weaknesses?.map((w: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {w}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Opportunities</div>
              <ul className="space-y-1">
                {result.swot.opportunities?.map((o: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {o}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">Threats</div>
              <ul className="space-y-1">
                {result.swot.threats?.map((t: string, idx: number) => (
                  <li key={idx} className="text-xs text-[var(--color-text-primary)]">• {t}</li>
                ))}
              </ul>
            </div>
          </div>
          {result.questions && result.questions.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Key Questions for Investors:</div>
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
              <div className="text-sm font-semibold text-[var(--color-primary-teal)] mb-2">Opportunities</div>
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
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Challenges</div>
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
          <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Valuation Range</div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">Low</div>
              <div className="text-lg font-bold text-[var(--color-text-primary)]">
                ${(result.low / 1_000_000).toFixed(1)}M
              </div>
            </div>
            <div className="text-[var(--color-text-secondary)]">→</div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">High</div>
              <div className="text-lg font-bold text-[var(--color-text-primary)]">
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
              <div className="font-semibold">{item.topic}</div>
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
          <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Feedback</div>
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
          <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Top Competitors</div>
          <ul className="space-y-2">
            {result.competitors.map((comp: any, idx: number) => (
              <li key={idx} className="text-sm text-[var(--color-text-primary)] flex items-start gap-2">
                <span className="text-[var(--color-primary-teal)] mt-1 font-bold">{idx + 1}.</span>
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
  const ToolIcon = selectedToolData ? iconMap[selectedToolData.id] || Bot : Bot;

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
    <div className="min-h-screen bg-[var(--color-background-default)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="mb-8">
          <div className="card-glass p-6 shadow-soft mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-xl bg-[var(--color-primary-teal)] shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">AI Tools</h1>
                <p className="text-[var(--color-text-primary)] mt-1 opacity-90">Powerful AI-driven insights for African healthcare innovation</p>
              </div>
            </div>
            
            {/* Status Bar */}
            {profile && (
              <div className="flex items-center gap-4 p-4 rounded-lg card-glass shadow-soft">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${aiPolicy.enabled ? 'bg-[var(--color-primary-teal)] shadow-lg shadow-[var(--color-primary-teal)]/50' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    AI Access: <span className={`${aiPolicy.enabled ? 'text-[var(--color-primary-teal)]' : 'text-gray-600 dark:text-gray-400'}`}>
                      {aiPolicy.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </span>
                </div>
                {aiPolicy.quota ? (
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">
                    Usage: <span className="text-[var(--color-primary-teal)] font-bold">{getUsage()}</span> / <span className="text-[var(--color-text-primary)]">{aiPolicy.quota}</span> this month
                  </div>
                ) : (
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">
                    Quota: <span className="text-[var(--color-primary-teal)]">{aiPolicy.enabled ? 'Unlimited (demo)' : '—'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card-glass p-6 shadow-soft mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="Search AI tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]/80 backdrop-blur-sm text-[var(--color-text-primary)] dark:text-white placeholder:text-[var(--color-text-secondary)] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/30 focus:border-[var(--color-primary-teal)] transition-all"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)] dark:bg-[var(--color-background-surface)] backdrop-blur-sm text-[var(--color-text-primary)] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/30 focus:border-[var(--color-primary-teal)] transition-all"
            >
              <option value="all" className="bg-[var(--color-background-surface)] text-[var(--color-text-primary)] dark:bg-[var(--color-background-surface)] dark:text-white">All Categories</option>
              {Object.entries(aiToolCategories).map(([key, label]) => (
                <option key={key} value={key} className="bg-[var(--color-background-surface)] text-[var(--color-text-primary)] dark:bg-[var(--color-background-surface)] dark:text-white">{label}</option>
              ))}
            </select>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)] dark:bg-[var(--color-background-surface)] backdrop-blur-sm text-[var(--color-text-primary)] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/30 focus:border-[var(--color-primary-teal)] transition-all"
            >
              <option value="all" className="bg-[var(--color-background-surface)] text-[var(--color-text-primary)] dark:bg-[var(--color-background-surface)] dark:text-white">All Tiers</option>
              {Object.entries(aiToolTiers).map(([key, label]) => (
                <option key={key} value={key} className="bg-[var(--color-background-surface)] text-[var(--color-text-primary)] dark:bg-[var(--color-background-surface)] dark:text-white">{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTools.map((tool) => {
            const enabled = canAccessTool(tool);
            const Icon = iconMap[tool.id] || Bot;
            const categoryColor = getCategoryColor(tool.category);
            
            return (
              <div
                key={tool.id}
                onClick={() => enabled && setSelectedTool(tool.id)}
                className={`group relative card-glass p-6 shadow-soft hover:shadow-md transition-all duration-300 cursor-pointer ${
                  enabled ? 'hover:scale-[1.02] hover:border-[var(--color-primary-teal)]/30' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(tool.status)} shadow-lg`}>
                    {tool.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getTierColor(tool.requiredTier)} shadow-lg`}>
                    {aiToolTiers[tool.requiredTier as keyof typeof aiToolTiers]}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-teal)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-primary-teal)] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-[var(--color-text-primary)]/80 mb-4 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>

                {/* Features Preview */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tool.features.slice(0, 2).map((feature, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs font-medium bg-[var(--color-background-surface)]/60 rounded-md border border-[var(--color-divider-gray)] text-[var(--color-text-primary)]/90 backdrop-blur-sm">
                      {feature.split('(')[0].trim()}
                    </span>
                  ))}
                  {tool.features.length > 2 && (
                    <span className="px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)]/70">
                      +{tool.features.length - 2} more
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-divider-gray)]/50">
                  <span className="text-xs font-medium text-[var(--color-text-primary)]/70">
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
                      className="btn-primary-elevated rounded-md px-3 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1.5"
                    >
                      Launch
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-[var(--color-text-primary)]/60">Upgrade Required</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        {runHistory.length > 0 && (
          <div className="card-glass p-6 shadow-soft mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-teal)] flex items-center justify-center shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Recent Activity</h3>
            </div>
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
                    className="flex items-center justify-between p-3 rounded-lg card-glass shadow-soft hover:shadow-md cursor-pointer transition-all hover:border-[var(--color-primary-teal)]/30"
                  >
                    <div className="flex items-center gap-3">
                      {tool && iconMap[tool.id] ? (
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-teal)] flex items-center justify-center shadow-lg">
                          {React.createElement(iconMap[tool.id], { className: "h-5 w-5 text-white" })}
                        </div>
                      ) : null}
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">{tool?.name || run.id}</div>
                        <div className="text-xs text-[var(--color-text-primary)]/70 font-medium">{new Date(run.at).toLocaleString()}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--color-text-primary)]/70" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {!aiPolicy.enabled && (
          <div className="card-glass p-8 shadow-soft mb-8 text-center border-2 border-[var(--color-primary-teal)]/20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-teal)] flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Unlock AI Tools</h3>
            </div>
            <p className="text-[var(--color-text-primary)]/90 mb-6 max-w-2xl mx-auto font-medium">
              Upgrade your plan to access AI-powered insights, automation, and research copilots that accelerate your healthcare innovation journey.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('medarion:navigate:static', { detail: { page: 'pricing' } }))}
                className="btn-primary-elevated px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
              >
                View Plans
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="btn-outline px-6 py-3 rounded-lg font-semibold">Contact Sales</button>
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
              <div className="sticky top-0 z-10 p-6 border-b border-[var(--color-divider-gray)]/50 card-glass backdrop-blur-lg flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--color-primary-teal)] flex items-center justify-center shadow-lg">
                      <ToolIcon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedToolData.name}</h2>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(selectedToolData.status)} shadow-lg`}>
                          {selectedToolData.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[var(--color-text-primary)]/90 font-medium">{selectedToolData.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setActionResult(null);
                      setActionParams({});
                    }}
                    className="p-2 rounded-lg hover:bg-[var(--color-divider-gray)]/50 transition-colors"
                  >
                    <X className="h-5 w-5 text-[var(--color-text-primary)]" />
                  </button>
                </div>

                {/* Features & Use Cases */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="card-glass p-3 shadow-soft">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-[var(--color-primary-teal)]" />
                      Key Features
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedToolData.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="text-xs text-[var(--color-text-primary)]/90 flex items-start gap-2 font-medium">
                          <CheckCircle className="h-3.5 w-3.5 text-[var(--color-primary-teal)] mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card-glass p-3 shadow-soft">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-[var(--color-primary-teal)]" />
                      Use Cases
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedToolData.useCases.slice(0, 3).map((useCase, idx) => (
                        <li key={idx} className="text-xs text-[var(--color-text-primary)]/90 flex items-start gap-2 font-medium">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          {useCase}
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
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Configure Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getToolParams(selectedTool).map((param) => (
                        <div key={param.key} className={param.type === 'textarea' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                            {param.label}
                          </label>
                          {param.type === 'textarea' ? (
                            <textarea
                              value={actionParams[param.key] || ''}
                              onChange={(e) => setActionParams(prev => ({...prev, [param.key]: e.target.value}))}
                              placeholder={param.placeholder}
                              rows={4}
                              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]/80 backdrop-blur-sm text-[var(--color-text-primary)] dark:text-white placeholder:text-[var(--color-text-secondary)] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/30 focus:border-[var(--color-primary-teal)] transition-all resize-none font-medium"
                            />
                          ) : param.type === 'file' ? (
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setActionParams(prev => ({...prev, file: e.target.files?.[0]}))}
                              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]/80 backdrop-blur-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/30 focus:border-[var(--color-primary-teal)] transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-teal)] file:text-white hover:file:bg-[var(--color-primary-teal)]/90"
                            />
                          ) : (
                            <input
                              type={param.type}
                              value={actionParams[param.key] || ''}
                              onChange={(e) => setActionParams(prev => ({...prev, [param.key]: e.target.value}))}
                              placeholder={param.placeholder}
                              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]/80 backdrop-blur-sm text-[var(--color-text-primary)] dark:text-white placeholder:text-[var(--color-text-secondary)] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/30 focus:border-[var(--color-primary-teal)] transition-all font-medium"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between mb-6 p-4 rounded-lg card-glass shadow-soft">
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {aiPolicy.enabled ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-[var(--color-primary-teal)] inline mr-2" />
                          AI Enabled
                          {aiPolicy.quota && <span className="ml-2 text-[var(--color-primary-teal)]">Usage: {getUsage()} / {aiPolicy.quota}</span>}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-500 inline mr-2" />
                          AI Access Disabled
                        </>
                      )}
                    </div>
                    <button
                      disabled={actionLoading || !aiPolicy.enabled}
                      onClick={() => runAction(selectedTool)}
                      className="btn-primary-elevated px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5" />
                          Run Analysis
                        </>
                      )}
                    </button>
                  </div>

                  {/* Results - Very Prominent */}
                  {actionResult && (
                    <div className="mt-6 card-glass p-6 shadow-elevated border-2 border-[var(--color-primary-teal)]/30">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-divider-gray)]/50">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                          {actionResult.error ? (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                              </div>
                              <span>Error</span>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-teal)]/20 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-[var(--color-primary-teal)]" />
                              </div>
                              <span>AI Results</span>
                            </>
                          )}
                        </h3>
                        {!actionResult.error && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(typeof actionResult === 'string' ? actionResult : JSON.stringify(actionResult, null, 2))}
                              className="p-2.5 rounded-lg bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] shadow-soft hover:shadow-md transition-all hover:border-[var(--color-primary-teal)]/30 hover:bg-[var(--color-background-default)]"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-5 w-5 text-[var(--color-text-primary)]" />
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
                              className="p-2.5 rounded-lg bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] shadow-soft hover:shadow-md transition-all hover:border-[var(--color-primary-teal)]/30 hover:bg-[var(--color-background-default)]"
                              title="Download results"
                            >
                              <Download className="h-5 w-5 text-[var(--color-text-primary)]" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {actionResult.error ? (
                          <div className="p-5 rounded-lg bg-red-500/10 border-2 border-red-500/30 text-red-600 dark:text-red-400 font-semibold text-base">
                            {actionResult.error}
                          </div>
                        ) : (
                          <div className="card-glass p-5 shadow-soft border border-[var(--color-primary-teal)]/20">
                            {formatActionResult(actionResult)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Example */}
                  {selectedToolData.examples && selectedToolData.examples.length > 0 && (
                    <div className="mt-6 card-glass p-4 shadow-soft border border-[var(--color-primary-teal)]/20">
                      <div className="flex items-start gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Example</h4>
                      </div>
                      <div className="text-sm text-[var(--color-text-primary)]/90 space-y-2 font-medium">
                        <div>
                          <span className="font-bold text-[var(--color-primary-teal)]">Input: </span>
                          {selectedToolData.examples[0].input}
                        </div>
                        <div>
                          <span className="font-bold text-[var(--color-primary-teal)]">Output: </span>
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