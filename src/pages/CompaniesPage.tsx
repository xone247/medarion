import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Search, Filter, MapPin, DollarSign, Download, Eye, Star, Mail, Bot, FileDown } from 'lucide-react';
import AISidePanel from '../components/ai/AISidePanel';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

type CompaniesView = {
  name: string;
  q?: string;
  sector?: string;
  country?: string;
};

const COMPANIES_VIEWS_KEY = 'medarionCompaniesViews';

const CompaniesPage: React.FC<{ onViewCompany: (name: string) => void }> = ({ onViewCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState<null | { name: string; totalFunding: number; dealCount: number; sector: string; deals: Array<{ type: string; date: string; value: number }>; investors: string[]; country: string; lastFunding: string; website?: string; logo?: string }>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const [companies, setCompanies] = useState<any[]>([]);
  const [views, setViews] = useState<CompaniesView[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');

  useEffect(() => {
    const fetchCompaniesData = async () => {
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/companies', { limit: '200' });
        if (response.success && response.data) {
          // Transform API data to match expected format
          // Note: Companies data structure may need aggregation from deals
          const transformed = response.data.map((company: any) => ({
            id: company.id,
            name: company.name,
            sector: company.industry || company.sector || 'Unknown',
            country: company.headquarters?.split(',')[1]?.trim() || company.country || 'Unknown',
            totalFunding: parseFloat(company.total_funding || 0),
            dealCount: 0, // Will need to aggregate from deals
            lastFunding: company.last_funding_date || company.updated_at,
            investors: [], // Will need to aggregate from deals
            deals: [],
            logo: company.logo_url,
            website: company.website,
            description: company.description,
            stage: company.stage || company.funding_stage || 'Unknown',
          }));
          setCompanies(transformed);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.error('Error fetching companies data:', error);
        setCompanies([]);
      }
    };
    fetchCompaniesData();
  }, []);

  // Load saved views
  useEffect(() => {
    try { const raw = localStorage.getItem(COMPANIES_VIEWS_KEY); if (raw) setViews(JSON.parse(raw)); } catch {}
  }, []);

  // Initialize from query params
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') || '';
      const sector = sp.get('sector') || 'All';
      const country = sp.get('country') || 'All';
      setSearchTerm(q);
      setSelectedSector(sector);
      setSelectedCountry(country);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync query params on filter changes
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      searchTerm ? sp.set('q', searchTerm) : sp.delete('q');
      selectedSector !== 'All' ? sp.set('sector', selectedSector) : sp.delete('sector');
      selectedCountry !== 'All' ? sp.set('country', selectedCountry) : sp.delete('country');
      const next = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', next);
    } catch {}
  }, [searchTerm, selectedSector, selectedCountry]);

  const sectors = useMemo(() => ['All', ...new Set(companies.map((c: any) => c.sector))], [companies]);
  const countries = useMemo(() => ['All', ...new Set(companies.map((c: any) => c.country))], [companies]);

  const filteredCompanies = useMemo(() => companies.filter((company: any) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'All' || company.sector === selectedSector;
    const matchesCountry = selectedCountry === 'All' || company.country === selectedCountry;
    return matchesSearch && matchesSector && matchesCountry;
  }), [companies, searchTerm, selectedSector, selectedCountry]);

  const totalFundingAll = useMemo(() => filteredCompanies.reduce((sum: number, c: any) => sum + (c.totalFunding || 0), 0), [filteredCompanies]);
  const avgFunding = useMemo(() => filteredCompanies.length ? totalFundingAll / filteredCompanies.length : 0, [totalFundingAll, filteredCompanies.length]);

  const topSectors = useMemo(() => {
    const map = new Map<string, number>();
    filteredCompanies.forEach((c:any)=> map.set(c.sector, (map.get(c.sector)||0)+1));
    return Array.from(map.entries()).sort((a,b)=> b[1]-a[1]).slice(0,5);
  }, [filteredCompanies]);
  const topCountries = useMemo(() => {
    const map = new Map<string, number>();
    filteredCompanies.forEach((c:any)=> map.set(c.country, (map.get(c.country)||0)+1));
    return Array.from(map.entries()).sort((a,b)=> b[1]-a[1]).slice(0,5);
  }, [filteredCompanies]);

  const exportCSV = () => {
    try {
      const rows = [['Name','Sector','Country','TotalFundingUSD','DealCount','InvestorsCount','LastFunding','Website']];
      filteredCompanies.forEach((c:any)=> rows.push([c.name, c.sector, c.country, String(c.totalFunding||0), String(c.dealCount||0), String((c.investors||[]).length), c.lastFunding || '', c.website || '' ]));
      const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='companies.csv'; a.click(); URL.revokeObjectURL(a.href);
    } catch {}
  };
  const exportJSON = () => {
    try { const data = { filters: { searchTerm, selectedSector, selectedCountry }, companies: filteredCompanies, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='companies.json'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };

  const copyJSON = async () => {
    try {
      const data = { filters: { searchTerm, selectedSector, selectedCountry }, companies: filteredCompanies, exportedAt: new Date().toISOString() };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      alert('Copied companies JSON to clipboard');
    } catch {}
  };

  // Views UI removed on mobile per design; keeping state for future use
  const applyView = (_name: string) => {};

  const handleViewCompanyDetails = (company: any) => { setShowCompanyDetails(company); };
  const handleFollowCompany = (companyName: string) => { alert(`Following company: ${companyName}`); };
  const handleContactCompany = (companyName: string) => { alert(`Contacting company: ${companyName}`); };

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Companies</h1>
              <p className="text-[var(--color-text-secondary)]">Explore African healthcare companies and their funding history</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canAI && <button onClick={() => setAiOpen(true)} className="btn-primary-elevated btn-sm flex items-center gap-2 w-auto"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
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

      {/* Summary Stats with glassmorphism */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Companies</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{filteredCompanies.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Funding</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">${(totalFundingAll / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Countries</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{new Set(filteredCompanies.map((c: any) => c.country)).size}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Avg Funding / Co</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">${(avgFunding / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights with glassmorphism */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Top Sectors</h3>
          <ul className="space-y-2">
            {topSectors.map(([sector,count]) => (
              <li key={sector} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-primary)]">{sector}</span>
                <span className="text-[var(--color-text-secondary)]">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Top Countries</h3>
          <ul className="space-y-2">
            {topCountries.map(([country,count]) => (
              <li key={country} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-primary)]">{country}</span>
                <span className="text-[var(--color-text-secondary)]">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Filters with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="input">
            {sectors.map((sector: string) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="input">
            {countries.map((country: string) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Grid with glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCompanies.slice().sort((a: any, b: any) => b.totalFunding - a.totalFunding).map((company: any) => (
          <div key={company.name} className="card-glass p-5 sm:p-6 shadow-soft hover:shadow-elevated transition-all duration-300 cursor-pointer card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">{company.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{company.sector}</p>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-primary-teal)] underline hover:text-[var(--color-primary-light)]">Website</a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Total Funding</span>
                <span className="text-lg font-bold text-[var(--color-primary-teal)]">${(company.totalFunding / 1000000).toFixed(1)}M</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Funding Rounds</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{company.dealCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Location</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{company.country}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Last Funding</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{new Date(company.lastFunding).toLocaleDateString()}</span>
              </div>
              
              <div className="pt-2 border-t border-[var(--color-divider-gray)]">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Key Investors</p>
                <div className="flex flex-wrap gap-1">
                  {company.investors.slice(0, 2).map((investor: string, index: number) => (
                    <span key={index} className="bg-[var(--color-background-default)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-divider-gray)]">
                      {investor}
                    </span>
                  ))}
                  {company.investors.length > 2 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      +{company.investors.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button onClick={() => handleViewCompanyDetails(company)} className="flex-1 btn-primary-elevated btn-sm flex items-center justify-center gap-1"><Eye className="h-3 w-3" /><span>View</span></button>
              <button onClick={() => handleFollowCompany(company.name)} className="btn-outline btn-sm"><Star className="h-3 w-3" /></button>
              <button onClick={() => handleContactCompany(company.name)} className="btn-outline btn-sm"><Mail className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Export Modal with glassmorphism */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-glass p-6 max-w-md w-full mx-4 shadow-elevated">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Export Companies Data</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">Export {filteredCompanies.length} companies in your preferred format:</p>
            <div className="space-y-3">
              <button onClick={() => { exportCSV(); setShowExportModal(false); }} className="btn-primary-elevated w-full btn-sm">Export as CSV</button>
              <button onClick={() => { exportJSON(); setShowExportModal(false); }} className="btn-outline w-full btn-sm">Export as JSON</button>
              <button onClick={() => { try{ window.print(); }catch{}; setShowExportModal(false); }} className="btn-outline w-full btn-sm">Print (PDF)</button>
            </div>
            <button onClick={() => setShowExportModal(false)} className="btn-outline w-full mt-4 btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Company Details Modal with glassmorphism */}
      {showCompanyDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-glass p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{showCompanyDetails.name}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">{showCompanyDetails.sector} • {showCompanyDetails.country}</p>
                </div>
              </div>
              <button onClick={() => setShowCompanyDetails(null)} className="text-[var(--color-text-secondary)] hover:opacity-80">✕</button>
            </div>
            
            {/* Key Metrics with glassmorphism */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card-glass p-4 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Total Funding</p>
                <p className="text-2xl font-bold text-[var(--color-primary-teal)]">${(showCompanyDetails.totalFunding / 1000000).toFixed(1)}M</p>
              </div>
              <div className="card-glass p-4 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Funding Rounds</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{showCompanyDetails.dealCount}</p>
              </div>
              <div className="card-glass p-4 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Key Investors</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{showCompanyDetails.investors.length}</p>
              </div>
            </div>

            {/* Funding History with glassmorphism */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Funding History</h4>
              <div className="space-y-2">
                {showCompanyDetails.deals.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((deal: any, index: number) => (
                  <div key={index} className="card-glass p-3 shadow-soft">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">{deal.type}</span>
                        <span className="text-sm text-[var(--color-text-secondary)] ml-2">{new Date(deal.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[var(--color-primary-teal)] font-bold">${(deal.value / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investors with glassmorphism */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Investors</h4>
              <div className="flex flex-wrap gap-2">
                {showCompanyDetails.investors.map((investor: string, index: number) => (
                  <span key={index} className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-3 py-1 rounded-full text-sm border border-[var(--color-divider-gray)]">
                    {investor}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => onViewCompany(showCompanyDetails.name)} className="btn-primary-elevated btn-sm">View Full Profile</button>
              <button onClick={() => handleFollowCompany(showCompanyDetails.name)} className="btn-outline btn-sm">Follow Company</button>
            </div>
          </div>
        </div>
      )}

      <AISidePanel open={aiOpen} onClose={() => setAiOpen(false)} context={{ sector: selectedSector === 'All' ? undefined : selectedSector }} />
    </div>
  );
};

export default CompaniesPage;