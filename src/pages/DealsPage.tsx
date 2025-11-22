import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Filter, Search, Calendar, MapPin, Building2, Users, Download, FileText, Eye, Bot, FileDown } from 'lucide-react';
import MonthlyDealflowChart from '../components/MonthlyDealflowChart';
import InteractiveMap from '../components/InteractiveMap';
import VCInvestmentOverTimeChart from '../components/VCInvestmentOverTimeChart';
import { summarizeDeals } from '../services/ai';
import { apiService } from '../services/apiService';
import { badgeClassesFromVar, dealStageToVar } from '../lib/badges';
import { useAuth } from '../contexts/AuthContext';

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
  const [timeframe, setTimeframe] = useState<'3m'|'6m'|'12m'|'24m'|'all'>('12m');
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
          apiService.get('/admin/deals', { limit: '200' }),
          apiService.get('/admin/companies', { limit: '200' })
        ]);

        if (dealsResponse.success && dealsResponse.data) {
          // Create a map of company names to logos for quick lookup
          const companyLogoMap = new Map<string, string>();
          if (companiesResponse.success && companiesResponse.data) {
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
      const tf = (sp.get('tf') as any) || '12m';
      setSearchTerm(q);
      setSelectedSector(sector);
      setSelectedStage(stage);
      setSelectedCountry(country);
      setTimeframe(['3m','6m','12m','24m','all'].includes(tf) ? (tf as any) : '12m');
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
      timeframe !== '12m' ? sp.set('tf', timeframe) : sp.delete('tf');
      const next = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', next);
    } catch {}
  }, [searchTerm, selectedSector, selectedStage, selectedCountry, timeframe]);

  const filteredDeals = useMemo(() => {
    const monthsBack = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : timeframe === '24m' ? 24 : 120;
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - monthsBack);
    return deals.filter((deal: Deal) => {
      const matchesSearch = deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || (deal.investors || []).some((inv: string) => inv.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSector = selectedSector === 'All' || deal.sector === selectedSector;
      const matchesStage = selectedStage === 'All' || deal.stage === selectedStage;
      const matchesCountry = selectedCountry === 'All' || deal.country === selectedCountry;
      const matchesTime = timeframe === 'all' || !deal.date ? true : (new Date(deal.date) >= cutoff);
      return matchesSearch && matchesSector && matchesStage && matchesCountry && matchesTime;
    });
  }, [deals, searchTerm, selectedSector, selectedStage, selectedCountry, timeframe]);

  const totalValue = useMemo(() => filteredDeals.reduce((sum: number, deal: Deal) => sum + (deal.value_usd || 0), 0), [filteredDeals]);

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
    setTimeframe((v.tf as any) || '12m');
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
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Deal-flow</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">Track mergers & acquisitions, in-licensing of drugs, and out-licensing activity</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {canAI && <button onClick={runAISummary} className="btn-primary-elevated btn-sm flex items-center gap-2 w-auto"><Bot className="h-4 w-4" /><span className="hidden sm:inline">AI Summary</span></button>}
            {canExport && (
              <>
                <button onClick={copyJSON} className="btn-outline btn-sm w-auto">Copy</button>
                <button onClick={exportJSON} className="btn-outline btn-sm w-auto"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
                <button onClick={exportCSV} className="btn-outline btn-sm w-auto"><FileDown className="h-4 w-4 inline mr-2"/>Export CSV</button>
              </>
            )}
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-text-primary)]">AI Summary</h3>
            {aiLoading && <span className="text-xs text-[var(--color-text-secondary)]">Updating…</span>}
          </div>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-[var(--color-text-primary)]">{aiSummary}</pre>
        </div>
      )}

      {/* Summary Stats with glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="card-glass p-4 md:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 md:h-6 md:w-6 icon-primary" />
            <div>
              <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">Total Value</p>
              <p className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)]">${(totalValue / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4 md:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 md:h-6 md:w-6 icon-primary" />
            <div>
              <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">Total Deals</p>
              <p className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)]">{filteredDeals.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4 md:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 md:h-6 md:w-6 icon-primary" />
            <div>
              <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">Avg Deal Size</p>
              <p className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)]">${(filteredDeals.length > 0 ? (totalValue / filteredDeals.length / 1000000) : 0).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4 md:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 md:h-6 md:w-6 icon-primary" />
            <div>
              <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">Countries</p>
              <p className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)]">{new Set(filteredDeals.map(d => d.country)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section with glassmorphism */}
      <div className="grid grid-cols-2 gap-6">
        <MonthlyDealflowChart />
        
        <div className="card-glass overflow-hidden shadow-soft">
          <div className="p-4 border-b border-[var(--color-divider-gray)] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">African Investment Map</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Deal activity across Africa</p>
            </div>
            <div className="flex bg-[var(--color-background-default)] rounded-lg p-1 border border-[var(--color-divider-gray)]">
              <button onClick={() => setMapDataType('value')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mapDataType === 'value' ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'}`}>Value</button>
              <button onClick={() => setMapDataType('count')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mapDataType === 'count' ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'}`}>Count</button>
            </div>
          </div>
          <div className="h-80">
            <InteractiveMap 
              title="" 
              dataType={mapDataType} 
              height={320}
              heightSm={240}
            />
          </div>
        </div>
      </div>

      {/* VC Investment Over Time */}
      <VCInvestmentOverTimeChart deals={filteredDeals} />

      {/* Filters with glassmorphism */}
      <div className="card-glass p-4 md:p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input type="text" placeholder="Search companies or investors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
          </div>
          <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="input">
            {sectors.map(sector =>  (<option key={sector} value={sector}>{sector}</option>))}
          </select>
          <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="input">
            {stages.map(stage => (<option key={stage} value={stage}>{stage}</option>))}
          </select>
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="input">
            {countries.map(country => (<option key={country} value={country}>{country}</option>))}
          </select>
          <select value={timeframe} onChange={(e)=> setTimeframe(e.target.value as any)} className="input">
            <option value="3m">3m</option>
            <option value="6m">6m</option>
            <option value="12m">12m</option>
            <option value="24m">24m</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Deals Table with glassmorphism */}
      <div className="card-glass overflow-hidden shadow-soft">
        <div className="p-4 md:p-6 border-b border-[var(--color-divider-gray)]">
          <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-primary)]">Recent Deals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-background-default)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider-gray)]">
              {filteredDeals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((deal) => (
                <tr key={deal.id} className="hover:bg-[var(--color-background-default)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <button onClick={() => handleOpenCompany(deal.company_name)} className="text-sm font-medium link hover:text-[var(--color-primary-light)]">
                          {deal.company_name}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-[var(--color-primary-teal)] font-bold">${(deal.value_usd / 1000000).toFixed(1)}M</span></td>
                  <td className="px-4 py-3">
                    <span className={`${badgeClassesFromVar(dealStageToVar(deal.stage))} px-2 py-1 rounded text-xs font-medium`}>{deal.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{deal.sector}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{deal.country}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{new Date(deal.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => handleViewDeal(deal)} className="btn-outline btn-sm"><Eye className="h-3 w-3" /></button>
                      <button onClick={() => handleSaveDeal(deal.id)} className="btn-outline btn-sm">Save</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal with glassmorphism */}
      {showExportModal && canExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-md w-full mx-auto shadow-elevated">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Export Deals Data</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">Export {filteredDeals.length} deals in your preferred format:</p>
            <div className="space-y-3">
              <button onClick={() => { exportCSV(); setShowExportModal(false); }} className="btn-primary-elevated w-full btn-sm">Export as CSV</button>
              <button onClick={() => { exportJSON(); setShowExportModal(false); }} className="btn-outline w-full btn-sm">Export as JSON</button>
              <button onClick={() => { try{ window.print(); }catch{}; setShowExportModal(false); }} className="btn-outline w-full btn-sm">Print (PDF)</button>
            </div>
            <button onClick={() => setShowExportModal(false)} className="btn-outline w-full mt-4 btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Deal Details Modal with glassmorphism */}
      {showDealDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-2xl w-full mx-auto max-h-[80vh] overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{showDealDetails.company_name}</h3>
              <button onClick={() => setShowDealDetails(null)} className="text-[var(--color-text-secondary)] hover:opacity-80">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><p className="text-sm text-[var(--color-text-secondary)]">Deal Amount</p><p className="text-2xl font-bold text-[var(--color-primary-teal)]">${(showDealDetails.value_usd / 1000000).toFixed(1)}M</p></div>
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