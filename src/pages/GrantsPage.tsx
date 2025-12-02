import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Filter, Search, Calendar, MapPin, Building2, Users, Download, FileText, Eye, Clock, Bot, FileDown } from 'lucide-react';
import MonthlyGrantChart from '../components/MonthlyGrantChart';
import InteractiveMap from '../components/InteractiveMap';
import { suggestGrantTargets } from '../services/ai';
import { apiService } from '../services/apiService';
import { badgeClassesFromVar, grantTypeToVar } from '../lib/badges';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

type GrantsView = {
  name: string;
  q?: string;
  sector?: string;
  type?: string;
  country?: string;
  tf?: '3m'|'6m'|'12m'|'24m'|'all';
};

const VIEWS_STORAGE_KEY = 'medarionGrantsViews';

const GrantsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [timeframe, setTimeframe] = useState<'3m'|'6m'|'12m'|'24m'|'all'>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const [showGrantDetails, setShowGrantDetails] = useState<any>(null);
  const [mapDataType, setMapDataType] = useState<'value' | 'count' | 'investment'>('value');
  const [aiSuggest, setAiSuggest] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [grants, setGrants] = useState<any[]>([]);
  const [views, setViews] = useState<GrantsView[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');

  useEffect(() => {
    const fetchGrantsData = async () => {
      try {
        console.log('[GrantsPage] Fetching grants data...');
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/grants', { all: 'true' });
        console.log('[GrantsPage] Response:', response);
        if (response && response.success && response.data && Array.isArray(response.data)) {
          console.log('[GrantsPage] Processing', response.data.length, 'grants');
          // Transform API data to match expected format
          const transformed = response.data.map((grant: any) => ({
            id: grant.id,
            organizationName: grant.title || grant.funding_agency || 'Unknown',
            value: parseFloat(grant.amount || 0),
            type: grant.grant_type || 'Research',
            sector: grant.sector || 'Healthcare',
            country: grant.country || 'Unknown',
            duration: grant.duration || '12 months',
            date: grant.award_date || grant.application_deadline || grant.created_at,
            funders: grant.funders ? (typeof grant.funders === 'string' ? JSON.parse(grant.funders) : grant.funders) : [grant.funding_agency || 'Unknown'],
            status: grant.status || 'active',
            requirements: grant.requirements,
            contact_email: grant.contact_email,
            website: grant.website,
          }));
          console.log('[GrantsPage] Transformed', transformed.length, 'grants');
          setGrants(transformed);
        } else {
          console.warn('[GrantsPage] Invalid response structure:', response);
          setGrants([]);
        }
      } catch (error) {
        console.error('[GrantsPage] Error fetching grants data:', error);
        setGrants([]);
      }
    };
    fetchGrantsData();
  }, []);

  // Load saved views
  useEffect(() => { try { const raw = localStorage.getItem(VIEWS_STORAGE_KEY); if (raw) setViews(JSON.parse(raw)); } catch {} }, []);

  const sectors = useMemo(() => ['All', ...new Set(grants.map((g: any) => g.sector))], [grants]);
  const types = useMemo(() => ['All', ...new Set(grants.map((g: any) => g.type))], [grants]);
  const countries = useMemo(() => ['All', ...new Set(grants.map((g: any) => g.country))], [grants]);

  // Initialize from query params
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') || '';
      const sector = sp.get('sector') || 'All';
      const type = sp.get('type') || 'All';
      const country = sp.get('country') || 'All';
      const tf = (sp.get('tf') as any) || 'all';
      setSearchTerm(q);
      setSelectedSector(sector);
      setSelectedType(type);
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
      selectedType !== 'All' ? sp.set('type', selectedType) : sp.delete('type');
      selectedCountry !== 'All' ? sp.set('country', selectedCountry) : sp.delete('country');
      timeframe !== '12m' ? sp.set('tf', timeframe) : sp.delete('tf');
      const next = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', next);
    } catch {}
  }, [searchTerm, selectedSector, selectedType, selectedCountry, timeframe]);

  const filteredGrants = useMemo(() => {
    if (timeframe === 'all') {
      // No time filtering for 'all'
      return grants.filter((grant: any) => {
        const matchesSearch = grant.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) || (grant.funders && Array.isArray(grant.funders) && grant.funders.some((funder: string) => funder.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesSector = selectedSector === 'All' || grant.sector === selectedSector;
        const matchesType = selectedType === 'All' || grant.type === selectedType;
        const matchesCountry = selectedCountry === 'All' || grant.country === selectedCountry;
        return matchesSearch && matchesSector && matchesType && matchesCountry;
      });
    }
    
    const monthsBack = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : timeframe === '24m' ? 24 : 120;
    const cutoff = new Date(); 
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    
    return grants.filter((grant: any) => {
      const matchesSearch = grant.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) || (grant.funders && Array.isArray(grant.funders) && grant.funders.some((funder: string) => funder.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesSector = selectedSector === 'All' || grant.sector === selectedSector;
      const matchesType = selectedType === 'All' || grant.type === selectedType;
      const matchesCountry = selectedCountry === 'All' || grant.country === selectedCountry;
      
      // For time filtering, check if grant.date exists and is valid
      let matchesTime = true;
      if (grant.date) {
        try {
          const grantDate = new Date(grant.date);
          if (!isNaN(grantDate.getTime())) {
            matchesTime = grantDate >= cutoff;
          }
        } catch (e) {
          // If date parsing fails, include the grant
          matchesTime = true;
        }
      }
      
      return matchesSearch && matchesSector && matchesType && matchesCountry && matchesTime;
    });
  }, [grants, searchTerm, selectedSector, selectedType, selectedCountry, timeframe]);

  const totalValue = useMemo(() => filteredGrants.reduce((sum: number, grant: any) => sum + grant.value, 0), [filteredGrants]);

  const exportCSV = () => {
    try {
      const rows = [['Organization','Amount(USD)','Type','Sector','Country','Duration','Date','Funders']];
      filteredGrants.forEach(g => rows.push([g.organizationName, String(g.value), g.type, g.sector, g.country, g.duration, g.date, (g.funders||[]).join('; ')]));
      exportToCSV(rows, 'grants');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedSector, selectedType, selectedCountry, timeframe }, grants: filteredGrants, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'grants');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportExcel = () => {
    try {
      const excelData = filteredGrants.map(g => ({
        Organization: g.organizationName,
        'Amount (USD)': g.value,
        Type: g.type,
        Sector: g.sector,
        Country: g.country,
        Duration: g.duration,
        Date: g.date,
        Funders: (g.funders || []).join('; ')
      }));
      exportToExcel(excelData, 'grants', 'Grants');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };


  const applyView = (name: string) => {
    setSelectedView(name);
    const v = views.find(v => v.name === name);
    if (!v) return;
    setSearchTerm(v.q || '');
    setSelectedSector(v.sector || 'All');
    setSelectedType(v.type || 'All');
    setSelectedCountry(v.country || 'All');
    setTimeframe((v.tf as any) || '12m');
  };

  const deleteView = () => {};

  // Share disabled platform-wide for data protection

  const handleViewGrant = (grant: any) => { setShowGrantDetails(grant); };
  const handleSaveGrant = (grantId: number) => { alert(`Saved grant ${grantId} to watchlist`); };
  const handleContactFunder = (funder: string) => { alert(`Contacting funder: ${funder}`); };

  const handleOpenOrganization = (name: string) => {
		try {
			window.dispatchEvent(new CustomEvent('medarion:navigate:organization', { detail: { name } }));
			// Also reuse company navigation if applicable
			window.dispatchEvent(new CustomEvent('medarion:navigate:company', { detail: { name } }));
		} catch {}
	};

  const runAISuggest = async () => {
    setAiLoading(true);
    const text = await suggestGrantTargets({ sector: selectedSector !== 'All' ? selectedSector : undefined, type: selectedType !== 'All' ? selectedType : undefined, country: selectedCountry !== 'All' ? selectedCountry : undefined });
    setAiSuggest(text);
    setAiLoading(false);
  };

  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));

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
              placeholder="Search organizations or funders..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all" 
            />
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end">
            {canAI && (
              <button 
                onClick={runAISuggest} 
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

      {aiSuggest && (
        <div className="card-glass p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[var(--color-text-primary)]">AI Suggestions</h3>
            {aiLoading && <span className="text-xs text-[var(--color-text-secondary)]">Updating…</span>}
          </div>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-[var(--color-text-primary)]">{aiSuggest}</pre>
        </div>
      )}

      {/* Summary Stats - Matching Deals Page Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-glass p-3 sm:p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Value</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">${(totalValue / 1000000).toFixed(1)}M</p>
            </div>
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="card-glass p-3 sm:p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Grants</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">{filteredGrants.length}</p>
            </div>
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="card-glass p-3 sm:p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Avg Grant Size</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">${(filteredGrants.length > 0 ? (totalValue / filteredGrants.length / 1000000) : 0).toFixed(1)}M</p>
            </div>
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div className="card-glass p-3 sm:p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Countries</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">{new Set(filteredGrants.map((g: any) => g.country)).size}</p>
            </div>
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Charts Section - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Chart - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block min-h-[500px]">
          <MonthlyGrantChart grants={filteredGrants} />
        </div>
        
        {/* Map - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block card-glass overflow-hidden shadow-soft rounded-lg flex flex-col" style={{ minHeight: '600px', height: '100%' }}>
          <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-row items-center justify-between gap-4 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">African Funding Map</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Grant and funding activity across Africa</p>
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
          <div className="flex-1 min-h-0 w-full h-full">
            <div className="h-full w-full">
              <InteractiveMap 
                title="" 
                dataType={mapDataType as 'value' | 'count' | 'investment'} 
                height={600}
                heightSm={280}
                showPopup={true}
                deals={filteredGrants.map(g => ({ country: g.country, value_usd: g.value, date: g.date }))}
                itemType="grant"
              />
            </div>
          </div>
        </div>
      </div>

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
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            {sectors.map(sector => (<option key={sector} value={sector}>{sector}</option>))}
          </select>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)} 
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            {types.map(type => (<option key={type} value={type}>{type}</option>))}
          </select>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)} 
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            {countries.map(country => (<option key={country} value={country}>{country}</option>))}
          </select>
          <select 
            value={timeframe} 
            onChange={(e)=> setTimeframe(e.target.value as any)} 
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
          >
            <option value="3m">3m</option>
            <option value="6m">6m</option>
            <option value="12m">12m</option>
            <option value="24m">24m</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Grants Table with glassmorphism - Desktop Table, Mobile Cards */}
      <div className="card-glass overflow-hidden shadow-soft">
        <div className="p-4 sm:p-6 border-b border-[var(--color-divider-gray)]">
          <h2 className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)]">Recent Grants</h2>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1500px' }}>
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" style={{ width: '300px', minWidth: '300px' }}>Organization</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '110px', minWidth: '110px' }}>Amount</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" style={{ width: '90px', minWidth: '90px' }}>Type</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" style={{ width: '110px', minWidth: '110px' }}>Sector</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '90px', minWidth: '90px' }}>Country</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '110px', minWidth: '110px' }}>Duration</th>
                <th className="px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '220px', minWidth: '220px' }}>Date</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap" style={{ width: '120px', minWidth: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredGrants.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((grant: any) => (
                <tr key={grant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 sm:py-3" style={{ width: '300px', minWidth: '300px', maxWidth: '300px', overflow: 'hidden' }}>
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-600 flex-shrink-0 p-2">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <button onClick={() => handleOpenOrganization(grant.organizationName)} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 truncate block w-full text-left max-w-full">
                          {grant.organizationName}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap" style={{ width: '110px', minWidth: '110px', maxWidth: '110px', overflow: 'hidden' }}><span className="text-cyan-600 dark:text-cyan-400 font-medium">${(grant.value / 1000000).toFixed(1)}M</span></td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3" style={{ width: '90px', minWidth: '90px', maxWidth: '90px', overflow: 'hidden' }}>
                    <span className={`${badgeClassesFromVar(grantTypeToVar(grant.type))} px-2 py-1 rounded text-xs font-medium`}>{grant.type}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-700 dark:text-slate-200" style={{ width: '110px', minWidth: '110px' }}>{grant.sector}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap" style={{ width: '90px', minWidth: '90px', maxWidth: '90px', overflow: 'hidden' }}>{grant.country}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap" style={{ width: '110px', minWidth: '110px', maxWidth: '110px', overflow: 'hidden' }}><div className="flex items-center space-x-1"><Clock className="h-3 w-3 text-slate-500 dark:text-slate-400 flex-shrink-0" /><span className="text-sm text-slate-700 dark:text-slate-200 truncate">{grant.duration}</span></div></td>
                  <td className="px-4 py-2.5 sm:py-3 text-sm text-slate-700 dark:text-slate-200" style={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}>
                    <div className="whitespace-nowrap">{new Date(grant.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3" style={{ width: '120px', minWidth: '120px' }}>
                    <div className="flex space-x-1.5 sm:space-x-2">
                      <button onClick={() => handleViewGrant(grant)} className="btn-outline btn-sm p-1.5 sm:p-2" title="View"><Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
                      <button onClick={() => handleSaveGrant(grant.id)} className="btn-outline btn-sm p-1.5 sm:p-2" title="Save">Save</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {filteredGrants.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((grant: any) => (
            <div key={grant.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-600 flex-shrink-0 p-2">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <button onClick={() => handleOpenOrganization(grant.organizationName)} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 truncate flex-1 min-w-0">
                      {grant.organizationName}
                    </button>
                    <span className="text-cyan-600 dark:text-cyan-400 font-medium text-sm flex-shrink-0 whitespace-nowrap">${(grant.value / 1000000).toFixed(1)}M</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{grant.sector}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span className={`${badgeClassesFromVar(grantTypeToVar(grant.type))} px-2 py-1 rounded font-medium flex-shrink-0`}>{grant.type}</span>
                <span className="flex items-center flex-shrink-0 gap-1 min-w-0">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-[70px] sm:max-w-[100px]">{grant.country}</span>
                </span>
                <span className="flex items-center flex-shrink-0 gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap text-[10px] sm:text-xs">{grant.duration}</span>
                </span>
                <span className="flex items-center flex-shrink-0 gap-1 min-w-0">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap text-[10px] sm:text-xs">{new Date(grant.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleViewGrant(grant)} className="btn-outline btn-sm flex-1"><Eye className="h-3 w-3 mr-1" />View</button>
                <button onClick={() => handleSaveGrant(grant.id)} className="btn-outline btn-sm flex-1">Save</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Modal with glassmorphism */}
      {showExportModal && canExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-md w-full mx-auto shadow-elevated">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Export Grants Data</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">Export {filteredGrants.length} grants in your preferred format:</p>
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

      {/* Grant Details Modal with glassmorphism */}
      {showGrantDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="card-glass p-4 sm:p-6 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)] pr-2">{showGrantDetails.organizationName}</h3>
              <button onClick={() => setShowGrantDetails(null)} className="text-[var(--color-text-secondary)] hover:opacity-80 flex-shrink-0">✕</button>
            </div>
            <div className="grid-2-col gap-3 sm:gap-4 mb-4">
              <div><p className="text-sm text-[var(--color-text-secondary)]">Grant Amount</p><p className="text-2xl font-medium text-[var(--color-primary-teal)]">${(showGrantDetails.value / 1000000).toFixed(1)}M</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Grant Type</p><p className="font-medium text-[var(--color-text-primary)]">{showGrantDetails.type}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Sector</p><p className="font-medium text-[var(--color-text-primary)]">{showGrantDetails.sector}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Duration</p><p className="font-medium text-[var(--color-text-primary)]">{showGrantDetails.duration}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Country</p><p className="font-medium text-[var(--color-text-primary)]">{showGrantDetails.country}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Date</p><p className="font-medium text-[var(--color-text-primary)]">{new Date(showGrantDetails.date).toLocaleDateString()}</p></div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Funders</p>
              <div className="space-y-2">
                {showGrantDetails.funders.map((funder: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-[var(--color-background-default)] rounded border border-[var(--color-divider-gray)]">
                    <span className="text-sm text-[var(--color-text-primary)]">{funder}</span>
                    <button onClick={() => handleContactFunder(funder)} className="btn-primary-elevated btn-sm">Contact</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => handleSaveGrant(showGrantDetails.id)} className="btn-primary-elevated btn-sm">Save to Watchlist</button>
              <button className="btn-outline btn-sm">Share Grant</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrantsPage;