import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Filter, Search, Calendar, MapPin, Building2, Users, Download, FileText, Eye, Clock, Bot, FileDown } from 'lucide-react';
import MonthlyGrantChart from '../components/MonthlyGrantChart';
import InteractiveMap from '../components/InteractiveMap';
import { suggestGrantTargets } from '../services/ai';
import { apiService } from '../services/apiService';
import { badgeClassesFromVar, grantTypeToVar } from '../lib/badges';
import { useAuth } from '../contexts/AuthContext';

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
        const response = await apiService.get('/admin/grants', { limit: '200' });
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

  const exportCSV = () => { try { const rows = [['Organization','Amount(USD)','Type','Sector','Country','Duration','Date','Funders']]; filteredGrants.forEach(g => rows.push([g.organizationName, String(g.value), g.type, g.sector, g.country, g.duration, g.date, (g.funders||[]).join('; ')])); const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='grants.csv'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const exportJSON = () => { try { const data = { filters: { searchTerm, selectedSector, selectedType, selectedCountry, timeframe }, grants: filteredGrants, exportedAt: new Date().toISOString() }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='grants.json'; a.click(); URL.revokeObjectURL(a.href);} catch {} };

  const copyJSON = async () => {
    try {
      const data = { filters: { searchTerm, selectedSector, selectedType, selectedCountry, timeframe }, grants: filteredGrants, exportedAt: new Date().toISOString() };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      alert('Copied grants JSON to clipboard');
    } catch {}
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

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Grants & Funding</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">Track non-dilutive grants, VC rounds, donor funding, and other financing</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(() => { try { const { useAuth } = require('../contexts/AuthContext'); const { profile } = useAuth(); const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier))); return canAI; } catch { return false; } })() && <button onClick={runAISuggest} className="btn-primary-elevated btn-sm flex items-center gap-2 w-full sm:w-auto"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
            {canExport && (
              <>
                <button onClick={copyJSON} className="btn-outline btn-sm w-full sm:w-auto">Copy</button>
                <button onClick={exportJSON} className="btn-outline btn-sm w-full sm:w-auto"><FileDown className="h-4 w-4 inline mr-2" /><span>Export JSON</span></button>
                <button onClick={exportCSV} className="btn-outline btn-sm w-full sm:w-auto"><FileDown className="h-4 w-4 inline mr-2" /><span>Export CSV</span></button>
              </>
            )}
          </div>
        </div>
      </div>

      {aiSuggest && (
        <div className="card-glass p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-text-primary)]">AI Suggestions</h3>
            {aiLoading && <span className="text-xs text-[var(--color-text-secondary)]">Updating…</span>}
          </div>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-[var(--color-text-primary)]">{aiSuggest}</pre>
        </div>
      )}

      {/* Summary Stats with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Value</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">${(totalValue / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Grants</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{filteredGrants.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Avg Grant Size</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">${(filteredGrants.length > 0 ? (totalValue / filteredGrants.length / 1000000) : 0).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Countries</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{new Set(filteredGrants.map((g: any) => g.country)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section with glassmorphism */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyGrantChart grants={grants} />
        
        <div className="card-glass overflow-hidden shadow-soft">
          <div className="p-4 border-b border-[var(--color-divider-gray)] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">African Funding Map</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Grant and funding activity across Africa</p>
            </div>
            <div className="flex bg-[var(--color-background-default)] rounded-lg p-1 border border-[var(--color-divider-gray)]">
              <button onClick={() => setMapDataType('value')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mapDataType === 'value' ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'}`}>Value</button>
              <button onClick={() => setMapDataType('count')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mapDataType === 'count' ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'}`}>Count</button>
            </div>
          </div>
          <div className="h-80">
            <InteractiveMap title="" dataType={mapDataType as 'value' | 'count' | 'investment'} height={320} heightSm={240} />
          </div>
        </div>
      </div>

      {/* Filters with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input type="text" placeholder="Search organizations or funders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
          </div>
          <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="input">{sectors.map(sector => (<option key={sector} value={sector}>{sector}</option>))}</select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input">{types.map(type => (<option key={type} value={type}>{type}</option>))}</select>
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="input">{countries.map(country => (<option key={country} value={country}>{country}</option>))}</select>
          <select value={timeframe} onChange={(e)=> setTimeframe(e.target.value as any)} className="input">
            <option value="3m">3m</option>
            <option value="6m">6m</option>
            <option value="12m">12m</option>
            <option value="24m">24m</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Grants Table with glassmorphism */}
      <div className="card-glass overflow-hidden shadow-soft">
        <div className="p-6 border-b border-[var(--color-divider-gray)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Recent Grants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-background-default)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Sector</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Country</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider-gray)]">
              {filteredGrants.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((grant: any) => (
                <tr key={grant.id} className="hover:bg-[var(--color-background-default)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <button onClick={() => handleOpenOrganization(grant.organizationName)} className="text-sm font-medium link hover:text-[var(--color-primary-light)]">{grant.organizationName}</button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-[var(--color-primary-teal)] font-bold">${(grant.value / 1000000).toFixed(1)}M</span></td>
                  <td className="px-6 py-4">
                    <span className={`${badgeClassesFromVar(grantTypeToVar(grant.type))} px-2 py-1 rounded text-xs font-medium`}>{grant.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{grant.sector}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{grant.country}</td>
                  <td className="px-6 py-4"><div className="flex items-center space-x-1"><Clock className="h-3 w-3 text-[var(--color-text-secondary)]" /><span className="text-sm text-[var(--color-text-primary)]">{grant.duration}</span></div></td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{new Date(grant.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => handleViewGrant(grant)} className="btn-outline btn-sm"><Eye className="h-3 w-3" /></button>
                      <button onClick={() => handleSaveGrant(grant.id)} className="btn-outline btn-sm">Save</button>
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
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Export Grants Data</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">Export {filteredGrants.length} grants in your preferred format:</p>
            <div className="space-y-3">
              <button onClick={() => { exportCSV(); setShowExportModal(false); }} className="btn-primary-elevated w-full btn-sm">Export as CSV</button>
              <button onClick={() => { exportJSON(); setShowExportModal(false); }} className="btn-outline w-full btn-sm">Export as JSON</button>
              <button onClick={() => { try{ window.print(); }catch{}; setShowExportModal(false); }} className="btn-outline w-full btn-sm">Print (PDF)</button>
            </div>
            <button onClick={() => setShowExportModal(false)} className="btn-outline w-full mt-4 btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Grant Details Modal with glassmorphism */}
      {showGrantDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-2xl w-full mx-auto max-h-96 overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{showGrantDetails.organizationName}</h3>
              <button onClick={() => setShowGrantDetails(null)} className="text-[var(--color-text-secondary)] hover:opacity-80">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><p className="text-sm text-[var(--color-text-secondary)]">Grant Amount</p><p className="text-2xl font-bold text-[var(--color-primary-teal)]">${(showGrantDetails.value / 1000000).toFixed(1)}M</p></div>
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