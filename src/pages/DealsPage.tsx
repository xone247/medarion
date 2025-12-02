import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Filter, Search, Calendar, MapPin, Building2, Users, Download, FileText, Eye, Bot, FileDown } from 'lucide-react';
import MonthlyDealflowChart from '../components/MonthlyDealflowChart';
import InteractiveMap from '../components/InteractiveMap';
import DealsBySectorChart from '../components/DealsBySectorChart';
import { summarizeDeals } from '../services/ai';
import { apiService } from '../services/apiService';
import { badgeClassesFromVar, dealStageToVar } from '../lib/badges';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

type Deal = {
  id: number;
  company_name: string;
  investors: string[];
  value_usd: number;
  stage: string;
  country: string;
  date: string;
  sector: string;
  company_logo?: string; // Added company_logo to the type
};

type DealsView = {
  name: string;
  q?: string;
  sector?: string;
  stage?: string;
  country?: string;
  tf?: '3m'|'6m'|'12m'|'24m'|'all';
};

const VIEWS_STORAGE_KEY = 'medarionDealsViews';

const DealsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [timeframe, setTimeframe] = useState<'3m'|'6m'|'12m'|'24m'|'all'>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const [showDealDetails, setShowDealDetails] = useState<Deal | null>(null);
  const [mapDataType, setMapDataType] = useState<'value' | 'count'>('value');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [views, setViews] = useState<DealsView[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');

  useEffect(() => {
    const fetchDealsData = async () => {
      try {
        // Fetch deals and companies in parallel - use same endpoints as Data Management tab
        const [dealsResponse, companiesResponse] = await Promise.all([
          apiService.get('/admin/deals', { all: 'true' }),
          apiService.get('/admin/companies', { all: 'true' })
        ]);

        if (dealsResponse.success && dealsResponse.data && Array.isArray(dealsResponse.data)) {
          // Create a map of company names to logos for quick lookup
          const companyLogoMap = new Map<string, string>();
          if (companiesResponse.success && companiesResponse.data && Array.isArray(companiesResponse.data)) {
            companiesResponse.data.forEach((company: any) => {
              if (company.name && company.logo_url) {
                companyLogoMap.set(company.name.toLowerCase().trim(), company.logo_url);
              }
            });
          }

          // Transform API data to match expected format
          const transformed = dealsResponse.data.map((deal: any) => ({
            id: deal.id,
            company_name: deal.company_name || 'Unknown',
            investors: deal.participants ? (typeof deal.participants === 'string' ? JSON.parse(deal.participants) : deal.participants) : (deal.lead_investor ? [deal.lead_investor] : []),
            value_usd: parseFloat(deal.amount || 0),
            stage: deal.deal_type || 'Unknown',
            country: deal.country || (deal.headquarters ? deal.headquarters.split(',')[deal.headquarters.split(',').length - 1]?.trim() : 'Unknown'),
            date: deal.deal_date || deal.created_at,
            sector: deal.sector || deal.industry || 'Unknown',
            company_logo: companyLogoMap.get((deal.company_name || '').toLowerCase().trim()) || null,
            status: deal.status || 'closed',
          }));
          console.log('[DealsPage] Loaded deals from API:', transformed.length);
          console.log('[DealsPage] Sample deals:', transformed.slice(0, 5).map(d => ({ name: d.company_name, date: d.date, stage: d.stage })));
          setDeals(transformed);
        } else {
          setDeals([]);
        }
      } catch (error) {
        console.error('Error fetching deals data:', error);
        setDeals([]);
      }
    };
    fetchDealsData();
  }, []);

  // Load saved views
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEWS_STORAGE_KEY);
      if (raw) setViews(JSON.parse(raw));
    } catch {}
  }, []);

  const sectors = useMemo(() => ['All', ...new Set(deals.map((d) => d.sector))], [deals]);
  const stages = useMemo(() => ['All', ...new Set(deals.map((d) => d.stage))], [deals]);
  const countries = useMemo(() => ['All', ...new Set(deals.map((d) => d.country))], [deals]);

  // Initialize from query params
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') || '';
      const sector = sp.get('sector') || 'All';
      const stage = sp.get('stage') || 'All';
      const country = sp.get('country') || 'All';
      const tf = (sp.get('tf') as any) || 'all';
      setSearchTerm(q);
      setSelectedSector(sector);
      setSelectedStage(stage);
      setSelectedCountry(country);
      setTimeframe(['3m','6m','12m','24m','all'].includes(tf) ? (tf as any) : 'all');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync query params on filter changes
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      searchTerm ? sp.set('q', searchTerm) : sp.delete('q');
      selectedSector !== 'All' ? sp.set('sector', selectedSector) : sp.delete('sector');
      selectedStage !== 'All' ? sp.set('stage', selectedStage) : sp.delete('stage');
      selectedCountry !== 'All' ? sp.set('country', selectedCountry) : sp.delete('country');
      timeframe !== 'all' ? sp.set('tf', timeframe) : sp.delete('tf');
      const next = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', next);
    } catch {}
  }, [searchTerm, selectedSector, selectedStage, selectedCountry, timeframe]);

  const filteredDeals = useMemo(() => {
    let cutoff: Date | null = null;
    if (timeframe !== 'all') {
      const monthsBack = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : timeframe === '24m' ? 24 : 120;
      cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - monthsBack);
      cutoff.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    }
    const filtered = deals.filter((deal: Deal) => {
      const matchesSearch = deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || (deal.investors || []).some((inv: string) => inv.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSector = selectedSector === 'All' || deal.sector === selectedSector;
      const matchesStage = selectedStage === 'All' || deal.stage === selectedStage;
      const matchesCountry = selectedCountry === 'All' || deal.country === selectedCountry;
      let matchesTime = true;
      if (timeframe !== 'all' && deal.date && cutoff) {
        const dealDate = new Date(deal.date);
        dealDate.setHours(0, 0, 0, 0);
        matchesTime = dealDate >= cutoff;
      }
      return matchesSearch && matchesSector && matchesStage && matchesCountry && matchesTime;
    });
    console.log('[DealsPage] Filtered deals:', filtered.length, 'from', deals.length, 'total. Timeframe:', timeframe, cutoff ? 'Cutoff: ' + cutoff.toISOString() : 'No cutoff');
    return filtered;
  }, [deals, searchTerm, selectedSector, selectedStage, selectedCountry, timeframe]);

  const totalValue = useMemo(() => filteredDeals.reduce((sum: number, deal: Deal) => sum + (deal.value_usd || 0), 0), [filteredDeals]);

  const exportExcel = () => {
    exportToExcel(filteredDeals, 'deals-export', 'Deals');
  };

  const exportCSV = () => {
    try {
      const rows = [['Company','Amount(USD)','Stage','Sector','Country','Date','Investors']];
      filteredDeals.forEach(d => rows.push([d.company_name, String(d.value_usd), d.stage, d.sector, d.country, d.date, (d.investors||[]).join('; ')]));
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'deals.csv'; a.click(); URL.revokeObjectURL(a.href);
    } catch {}
  };
  const exportJSON = () => {
    try { const data = { filters: { searchTerm, selectedSector, selectedStage, selectedCountry, timeframe }, deals: filteredDeals, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='deals.json'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };

  const copyJSON = async () => {
    try {
      const data = { filters: { searchTerm, selectedSector, selectedStage, selectedCountry, timeframe }, deals: filteredDeals, exportedAt: new Date().toISOString() };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      alert('Copied deals JSON to clipboard');
    } catch {}
  };

  const applyView = (name: string) => {
    setSelectedView(name);
    const v = views.find(v => v.name === name);
    if (!v) return;
    setSearchTerm(v.q || '');
    setSelectedSector(v.sector || 'All');
    setSelectedStage(v.stage || 'All');
    setSelectedCountry(v.country || 'All');
    setTimeframe((v.tf as any) || 'all');
  };

  const deleteView = () => {};

  // Share disabled platform-wide for data protection

  const handleViewDeal = (deal: Deal) => { setShowDealDetails(deal); };
  const handleSaveDeal = (dealId: number) => { alert(`Saved deal ${dealId} to watchlist`); };
  const handleContactInvestor = (investor: string) => { alert(`Contacting investor: ${investor}`); };

  const handleOpenCompany = (name: string) => {
		try {
			window.dispatchEvent(new CustomEvent('medarion:navigate:company', { detail: { name } }));
		} catch {}
	};

  const runAISummary = async () => {
    setAiLoading(true);
    const summary = await summarizeDeals({ sector: selectedSector !== 'All' ? selectedSector : undefined, stage: selectedStage !== 'All' ? selectedStage : undefined, country: selectedCountry !== 'All' ? selectedCountry : undefined });
    setAiSummary(summary);
    setAiLoading(false);
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6 p-2.5 sm:p-3 md:p-4 lg:p-6">
      {/* Top Bar: Search and Actions - Mobile Optimized */}
      <div className="card-glass p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search Bar - Prominent */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search companies or investors..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all" 
            />
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end">
            {canAI && (
            <button 
              onClick={runAISummary} 
              className="btn-primary-elevated flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto"
              title="AI Summary"
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI Summary</span>
            </button>
            )}
            {canExport && (
              <>
                <button onClick={exportExcel} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export Excel">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">Excel</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button onClick={exportJSON} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export JSON">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">JSON</span>
                  <span className="sm:hidden">JSON</span>
                </button>
                <button onClick={exportCSV} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export CSV">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-3 sm:p-4 shadow-soft rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">AI Summary</h3>
            </div>
            {aiLoading && <span className="text-xs text-slate-500 dark:text-slate-400">Updating…</span>}
          </div>
          <div className="mt-2 text-xs sm:text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200 leading-relaxed">{aiSummary}</div>
        </div>
      )}

      {/* Summary Stats - Compact Modern Style (Mobile Optimized) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Value</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">${(totalValue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Deals</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{filteredDeals.length}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg Deal Size</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">${(filteredDeals.length > 0 ? (totalValue / filteredDeals.length / 1000000) : 0).toFixed(1)}M</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{new Set(filteredDeals.map(d => d.country)).size}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <MonthlyDealflowChart deals={filteredDeals} />
        
        {/* Map - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block card-glass overflow-hidden shadow-soft rounded-lg">
          <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-row items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">African Investment Map</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deal activity across Africa</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <button 
                onClick={() => setMapDataType('value')} 
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${mapDataType === 'value' ? 'bg-cyan-600 dark:bg-cyan-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                Value
              </button>
              <button 
                onClick={() => setMapDataType('count')} 
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${mapDataType === 'count' ? 'bg-cyan-600 dark:bg-cyan-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                Count
              </button>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <InteractiveMap 
              title="" 
              dataType={mapDataType} 
              height={500}
              heightSm={280}
              showPopup={true}
              deals={filteredDeals.map(d => ({ country: d.country, value_usd: d.value_usd, date: d.date }))}
              itemType="deal"
            />
          </div>
        </div>
      </div>

      {/* Sector Distribution Chart - Full Width */}
      <DealsBySectorChart deals={filteredDeals} />

      {/* Filters - Mobile Optimized */}
      <div className="card-glass p-4 sm:p-5 md:p-6 shadow-soft rounded-lg">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          <select 
            value={selectedSector} 
            onChange={(e) => setSelectedSector(e.target.value)} 
            className="w-full px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            {sectors.map(sector =>  (<option key={sector} value={sector}>{sector}</option>))}
          </select>
          <select 
            value={selectedStage} 
            onChange={(e) => setSelectedStage(e.target.value)} 
            className="w-full px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            {stages.map(stage => (<option key={stage} value={stage}>{stage}</option>))}
          </select>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)} 
            className="w-full px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            {countries.map(country => (<option key={country} value={country}>{country}</option>))}
          </select>
          <select 
            value={timeframe} 
            onChange={(e)=> setTimeframe(e.target.value as any)} 
            className="w-full px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            <option value="3m">3m</option>
            <option value="6m">6m</option>
            <option value="12m">12m</option>
            <option value="24m">24m</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Deals Table - Desktop Table, Mobile Cards */}
      <div className="card-glass overflow-hidden shadow-soft rounded-lg">
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">Recent Deals</h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5">{filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''} found</p>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stage</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sector</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Country</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDeals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-600 flex-shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <button onClick={() => handleOpenCompany(deal.company_name)} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 truncate block">
                          {deal.company_name}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap"><span className="text-cyan-600 dark:text-cyan-400 font-medium">${(deal.value_usd / 1000000).toFixed(1)}M</span></td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <span className={`${badgeClassesFromVar(dealStageToVar(deal.stage))} px-2 py-1 rounded text-xs font-medium`}>{deal.stage}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-700 dark:text-slate-200">{deal.sector}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap">{deal.country}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap min-w-[100px]">{new Date(deal.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex space-x-1.5 sm:space-x-2">
                      <button onClick={() => handleViewDeal(deal)} className="btn-outline btn-sm p-1.5 sm:p-2" title="View"><Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
                      <button onClick={() => handleSaveDeal(deal.id)} className="btn-outline btn-sm px-2 sm:px-3 py-1.5 sm:py-2 text-xs">Save</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {filteredDeals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((deal) => (
            <div key={deal.id} className="p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-start justify-between mb-2.5 sm:mb-3">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-600 flex-shrink-0">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <button onClick={() => handleOpenCompany(deal.company_name)} className="text-sm sm:text-base font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 truncate block">
                      {deal.company_name}
                    </button>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{deal.sector}</p>
                  </div>
                </div>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium text-sm sm:text-base ml-2 flex-shrink-0">${(deal.value_usd / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2.5 sm:mb-3">
                <span className={`${badgeClassesFromVar(dealStageToVar(deal.stage))} px-2 py-1 rounded font-medium`}>{deal.stage}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate">{deal.country}</span></span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 flex-shrink-0" /><span>{new Date(deal.date).toLocaleDateString()}</span></span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleViewDeal(deal)} className="btn-outline btn-sm flex-1 flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /><span>View</span></button>
                <button onClick={() => handleSaveDeal(deal.id)} className="btn-outline btn-sm flex-1">Save</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Modal with glassmorphism */}
      {showExportModal && canExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-md w-full mx-auto shadow-elevated">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Export Deals Data</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">Export {filteredDeals.length} deals in your preferred format:</p>
            <div className="space-y-3">
              <button onClick={() => { exportExcel(); setShowExportModal(false); }} className="btn-primary-elevated w-full px-4 py-2 rounded-lg">Export as Excel</button>
              <button onClick={() => { exportCSV(); setShowExportModal(false); }} className="btn-outline w-full px-4 py-2 rounded-lg">Export as CSV</button>
              <button onClick={() => { exportJSON(); setShowExportModal(false); }} className="btn-outline w-full px-4 py-2 rounded-lg">Export as JSON</button>
              <button onClick={() => { try{ window.print(); }catch{}; setShowExportModal(false); }} className="btn-outline w-full px-4 py-2 rounded-lg">Print (PDF)</button>
            </div>
            <button onClick={() => setShowExportModal(false)} className="btn-outline w-full mt-4 btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Deal Details Modal with glassmorphism */}
      {showDealDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="card-glass p-4 sm:p-6 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)] pr-2">{showDealDetails.company_name}</h3>
              <button onClick={() => setShowDealDetails(null)} className="text-[var(--color-text-secondary)] hover:opacity-80 flex-shrink-0">✕</button>
            </div>
            <div className="grid-2-col gap-3 sm:gap-4 mb-4">
              <div><p className="text-sm text-[var(--color-text-secondary)]">Deal Amount</p><p className="text-2xl font-medium text-[var(--color-primary-teal)]">${(showDealDetails.value_usd / 1000000).toFixed(1)}M</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Deal Type</p><p className="font-medium text-[var(--color-text-primary)]">{showDealDetails.stage}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Sector</p><p className="font-medium text-[var(--color-text-primary)]">{showDealDetails.sector}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Country</p><p className="font-medium text-[var(--color-text-primary)]">{showDealDetails.country}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Date</p><p className="font-medium text-[var(--color-text-primary)]">{new Date(showDealDetails.date).toLocaleDateString()}</p></div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Investors</p>
              <div className="space-y-2">
                {(showDealDetails.investors || []).map((investor, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-[var(--color-background-default)] rounded border border-[var(--color-divider-gray)]">
                    <span className="text-sm text-[var(--color-text-primary)]">{investor}</span>
                    <button onClick={() => handleContactInvestor(investor)} className="btn-primary-elevated btn-sm">Contact</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => handleSaveDeal(showDealDetails.id)} className="btn-primary-elevated btn-sm">Save to Watchlist</button>
              <button className="btn-outline btn-sm">Share Deal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPage;