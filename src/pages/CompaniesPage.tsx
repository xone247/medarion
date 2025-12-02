import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Search, Filter, MapPin, DollarSign, Download, Eye, Star, Mail, Bot, FileDown, ExternalLink, X, Users, Calendar, TrendingUp, Globe, Briefcase } from 'lucide-react';
import AISidePanel from '../components/ai/AISidePanel';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

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
  const [showCompanyDetails, setShowCompanyDetails] = useState<null | { name: string; totalFunding: number; dealCount: number; sector: string; deals: Array<{ type: string; date: string; value: number; investor?: string }>; investors: string[]; country: string; lastFunding: string; website?: string; logo?: string; description?: string; stage?: string; hasAccount?: boolean }>(null);
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
        // Fetch companies
        const companiesResponse = await apiService.get('/admin/companies', { all: 'true' });
        console.log('[CompaniesPage] Companies API response:', {
          success: companiesResponse.success,
          hasData: !!companiesResponse.data,
          isArray: Array.isArray(companiesResponse.data),
          length: companiesResponse.data?.length || 0,
          dataType: typeof companiesResponse.data
        });
        
        // Fetch deals to aggregate data
        let dealsData: any[] = [];
        try {
          const dealsResponse = await apiService.get('/admin/deals', { all: 'true', limit: '1000' });
          if (dealsResponse.success && dealsResponse.data) {
            if (Array.isArray(dealsResponse.data)) {
              dealsData = dealsResponse.data;
            } else if (dealsResponse.data.deals && Array.isArray(dealsResponse.data.deals)) {
              dealsData = dealsResponse.data.deals;
            } else if (dealsResponse.data.data && Array.isArray(dealsResponse.data.data)) {
              dealsData = dealsResponse.data.data;
            }
          }
          console.log('[CompaniesPage] Fetched deals:', dealsData.length);
        } catch (error) {
          console.error('[CompaniesPage] Error fetching deals:', error);
        }
        
        // Fetch users to check which companies have accounts
        let companiesWithAccounts: Set<string> = new Set();
        try {
          const usersResponse = await apiService.get('/admin/users', { all: 'true' });
          if (usersResponse.success && usersResponse.data && Array.isArray(usersResponse.data)) {
            usersResponse.data.forEach((user: any) => {
              if (user.company_name && user.company_name.trim()) {
                companiesWithAccounts.add(user.company_name.trim());
              }
            });
            console.log('[CompaniesPage] Companies with accounts:', companiesWithAccounts.size);
          }
        } catch (error) {
          console.error('[CompaniesPage] Error fetching users:', error);
        }
        
        if (companiesResponse.success && companiesResponse.data && Array.isArray(companiesResponse.data)) {
          console.log(`[CompaniesPage] Total companies from API: ${companiesResponse.data.length}`);
          // Transform API data to match expected format
          const transformed = companiesResponse.data.map((company: any) => {
            // Get deals for this company
            const companyDeals = dealsData.filter((d: any) => 
              d.company_id === company.id || d.company_name === company.name
            );
            
            // Parse investors from JSON or extract from deals
            let investors: string[] = [];
            try {
              if (company.investors) {
                if (typeof company.investors === 'string') {
                  investors = JSON.parse(company.investors);
                } else if (Array.isArray(company.investors)) {
                  investors = company.investors;
                }
              }
            } catch (e) {
              // If parsing fails, try to extract from deals
            }
            
            // Always extract investors from deals as well (in case company.investors is empty)
            const dealInvestors = Array.from(new Set(
              companyDeals
                .map((d: any) => d.lead_investor || d.investor_name || d.investor)
                .filter((inv: any) => inv && inv !== '' && inv !== null)
            ));
            
            // Merge investors, removing duplicates
            investors = Array.from(new Set([...investors, ...dealInvestors]));
            
            // Calculate total funding from deals
            const calculatedFunding = companyDeals
              .filter((d: any) => d.amount && d.amount > 0)
              .reduce((sum: number, d: any) => sum + parseFloat(d.amount || d.value || 0), 0);
            
            // Use company total_funding if available, otherwise use calculated
            const totalFunding = company.total_funding ? parseFloat(company.total_funding) : calculatedFunding;
            
            // Format deals for display
            const formattedDeals = companyDeals
              .filter((d: any) => d.amount && d.amount > 0)
              .map((d: any) => ({
                type: d.deal_type || d.type || 'Funding Round',
                date: d.deal_date || d.date || d.created_at || d.updated_at,
                value: parseFloat(d.amount || d.value || 0),
                investor: d.lead_investor || d.investor_name || d.investor || null
              }))
              .sort((a: any, b: any) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA; // Sort descending (newest first)
              });
            
            console.log(`[CompaniesPage] Company ${company.name}: ${formattedDeals.length} deals, ${investors.length} investors, $${totalFunding} total funding`);
            
            return {
              id: company.id,
              name: company.name,
              sector: company.industry || company.sector || 'Unknown',
              country: company.headquarters?.split(',')[1]?.trim() || company.country || 'Unknown',
              totalFunding: totalFunding,
              dealCount: companyDeals.length,
              lastFunding: company.last_funding_date || (formattedDeals.length > 0 ? formattedDeals[0].date : company.updated_at),
              investors: investors,
              deals: formattedDeals,
              logo: company.logo_url || company.logo || company.logo_image || null,
              website: company.website || company.website_url || null,
              description: company.description || company.bio || company.about || null,
              stage: company.stage || company.funding_stage || 'Unknown',
              // Check if company has an account on the platform (user with matching company_name)
              hasAccount: companiesWithAccounts.has(company.name.trim())
            };
          });
          console.log(`[CompaniesPage] Transformed companies: ${transformed.length}`);
          setCompanies(transformed);
        } else {
          console.error('[CompaniesPage] Invalid API response:', companiesResponse);
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

  const sectors = useMemo(() => ['All', ...new Set(companies.map((c: any) => c.sector).filter(Boolean))], [companies]);
  const countries = useMemo(() => ['All', ...new Set(companies.map((c: any) => c.country).filter(Boolean))], [companies]);

  const filteredCompanies = useMemo(() => companies.filter((company: any) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.description && company.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (company.sector && company.sector.toLowerCase().includes(searchTerm.toLowerCase()));
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
      exportToCSV(rows, 'companies');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedSector, selectedCountry }, companies: filteredCompanies, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'companies');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportExcel = () => {
    try {
      const excelData = filteredCompanies.map((c: any) => ({
        Name: c.name,
        Sector: c.sector,
        Country: c.country,
        'Total Funding (USD)': c.totalFunding || 0,
        'Deal Count': c.dealCount || 0,
        'Investors Count': (c.investors || []).length,
        'Last Funding': c.lastFunding || '',
        Website: c.website || ''
      }));
      exportToExcel(excelData, 'companies', 'Companies');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };


  // Views UI removed on mobile per design; keeping state for future use
  const applyView = (_name: string) => {};

  const handleViewCompanyDetails = (company: any) => { 
    setShowCompanyDetails({
      ...company,
      deals: company.deals || []
    }); 
  };
  const handleFollowCompany = (companyName: string) => { alert(`Following company: ${companyName}`); };
  const handleContactCompany = (companyName: string) => { alert(`Contacting company: ${companyName}`); };

  return (
    <div className="w-full space-y-2 sm:space-y-3 md:space-y-4 p-2 sm:p-3 md:p-4">
      {/* Top Bar: Filters and Actions - Compact Desktop Design - Mobile Optimized */}
      <div className="card-glass p-2.5 sm:p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-1 min-w-0">
            {/* Search Bar - Full width on mobile */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-4 sm:w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 text-sm sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
              />
            </div>
            
            {/* Filters - Stack on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <select 
                value={selectedSector} 
                onChange={(e) => setSelectedSector(e.target.value)} 
                className="px-3 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 min-w-full sm:min-w-[140px]"
              >
                {sectors.map((sector: string) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
              <select 
                value={selectedCountry} 
                onChange={(e) => setSelectedCountry(e.target.value)} 
                className="px-3 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 min-w-full sm:min-w-[140px]"
              >
                {countries.map((country: string) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions Section - Compact Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-2.5">
            {canAI && (
              <button 
                onClick={() => setAiOpen(true)} 
                className="btn-primary-elevated flex items-center justify-center px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto"
                title="AI Summary"
              >
                <Bot className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1.5">AI Summary</span>
              </button>
            )}
            {canExport && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end sm:justify-start">
                <button 
                  onClick={exportExcel} 
                  className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" 
                  title="Export Excel"
                >
                  <FileDown className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button 
                  onClick={exportJSON} 
                  className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" 
                  title="Export JSON"
                >
                  <FileDown className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button 
                  onClick={exportCSV} 
                  className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" 
                  title="Export CSV"
                >
                  <FileDown className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats - Compact Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Total Companies</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{filteredCompanies.length}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Total Funding</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">${(totalFundingAll / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Countries</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{new Set(filteredCompanies.map((c: any) => c.country)).size}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Avg Funding</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">${(avgFunding / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Top Sectors */}
        <div className="card-glass p-2 sm:p-3 rounded-lg">
          <h3 className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Top Sectors</h3>
          <ul className="space-y-1.5">
            {topSectors.length > 0 ? topSectors.map(([sector,count]) => (
              <li key={sector} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1 pr-2">{sector}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded flex-shrink-0">{count}</span>
              </li>
            )) : (
              <li className="text-xs text-slate-500 dark:text-slate-400">No sectors available</li>
            )}
          </ul>
        </div>
        {/* Top Countries */}
        <div className="card-glass p-2 sm:p-3 rounded-lg">
          <h3 className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Top Countries</h3>
          <ul className="space-y-1.5">
            {topCountries.length > 0 ? topCountries.map(([country,count]) => (
              <li key={country} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1 pr-2">{country}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded flex-shrink-0">{count}</span>
              </li>
            )) : (
              <li className="text-xs text-slate-500 dark:text-slate-400">No countries available</li>
            )}
          </ul>
        </div>
      </div>

      {/* Companies Grid - Compact Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 items-stretch">
        {filteredCompanies.length > 0 ? filteredCompanies.slice().sort((a: any, b: any) => b.totalFunding - a.totalFunding).map((company: any) => (
          <div key={company.name || company.id} className="card-glass p-2.5 sm:p-3 md:p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200 group relative overflow-hidden flex flex-col h-full">
            {/* Company Header with Logo */}
            <div className="flex items-start gap-2 sm:gap-2.5 mb-2 sm:mb-2.5">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${company.logo ? 'hidden' : 'flex'} w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg items-center justify-center border border-cyan-600/20 flex-shrink-0 shadow-sm`}>
                <span className="text-white font-medium text-sm sm:text-base">{company.name?.charAt(0)?.toUpperCase() || 'C'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 truncate leading-tight mb-1">{company.name}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {company.sector && company.sector !== 'Unknown' && (
                    <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] sm:text-xs font-medium">
                      {company.sector}
                    </span>
                  )}
                  {company.stage && company.stage !== 'Unknown' && (
                    <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] sm:text-xs font-medium">
                      {company.stage}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Description if available */}
            {company.description && (
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                {company.description}
              </p>
            )}
            
            {/* Key Metrics - Compact */}
            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-2.5 flex-grow">
              <div className="flex justify-between items-center p-1.5 sm:p-2 bg-cyan-50/50 dark:bg-cyan-950/30 rounded-lg">
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Total Funding</span>
                <span className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  {company.totalFunding > 0 ? `$${(company.totalFunding / 1000000).toFixed(1)}M` : "N/A"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="flex flex-col p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Rounds</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{company.dealCount || 0}</span>
                </div>
                <div className="flex flex-col p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Location</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{company.country}</span>
                  </div>
                </div>
              </div>
              
              {company.lastFunding && (
                <div className="flex justify-between items-center text-[10px] sm:text-xs p-1.5 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    Last Funding
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {new Date(company.lastFunding).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              
              {/* Investors */}
              {company.investors && company.investors.length > 0 && (
                <div className="pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Key Investors</p>
                  <div className="flex flex-wrap gap-1">
                    {company.investors.slice(0, 3).map((investor: string, index: number) => (
                      <span 
                        key={index} 
                        className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs border border-slate-200 dark:border-slate-700 truncate max-w-[100px] sm:max-w-[120px]"
                        title={investor}
                      >
                        {investor}
                      </span>
                    ))}
                    {company.investors.length > 3 && (
                      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 self-center px-1">
                        +{company.investors.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Compact */}
            <div className="flex flex-col sm:flex-row gap-1.5 pt-2 sm:pt-2.5 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <button 
                onClick={() => handleViewCompanyDetails(company)} 
                className="flex-1 btn-primary-elevated flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>View</span>
              </button>
              <div className="flex gap-1.5">
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-outline px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg flex items-center justify-center flex-1 sm:flex-initial" 
                    title="Visit Website"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1 text-xs">Site</span>
                  </a>
                )}
                <button 
                  onClick={() => handleFollowCompany(company.name)} 
                  className="btn-outline px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg flex items-center justify-center" 
                  title="Follow"
                >
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12 sm:py-16">
            <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-200 mb-2">No companies found</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              {searchTerm || selectedSector !== 'All' || selectedCountry !== 'All' 
                ? 'Try adjusting your filters' 
                : 'No companies available'}
            </p>
          </div>
        )}
      </div>

      {/* Company Details Modal - Modern & Beautiful - Mobile Optimized */}
      {showCompanyDetails && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 overflow-y-auto" 
          onClick={() => setShowCompanyDetails(null)}
        >
          <div 
            className="card-glass max-w-4xl w-full my-4 sm:my-6 md:my-8 shadow-2xl rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >
            {/* Header with Logo - Mobile Optimized - Sticky */}
            <div className="flex items-start justify-between p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                {showCompanyDetails.logo ? (
                  <img 
                    src={showCompanyDetails.logo} 
                    alt={showCompanyDetails.name} 
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg object-cover border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${showCompanyDetails.logo ? 'hidden' : 'flex'} w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg items-center justify-center border-2 border-cyan-600/20 flex-shrink-0 shadow-md`}>
                  <span className="text-white font-medium text-lg sm:text-xl md:text-2xl">{showCompanyDetails.name?.charAt(0)?.toUpperCase() || 'C'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-medium text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2 break-words">{showCompanyDetails.name}</h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {showCompanyDetails.sector && showCompanyDetails.sector !== 'Unknown' && (
                      <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] sm:text-xs font-medium">
                        {showCompanyDetails.sector}
                      </span>
                    )}
                    {showCompanyDetails.stage && showCompanyDetails.stage !== 'Unknown' && (
                      <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] sm:text-xs font-medium">
                        {showCompanyDetails.stage}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span>{showCompanyDetails.country}</span>
                    </div>
                    {showCompanyDetails.website && (
                      <a 
                        href={showCompanyDetails.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowCompanyDetails(null)} 
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 ml-1.5 sm:ml-2"
                aria-label="Close"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 px-3 sm:px-4 md:px-6" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {/* Description if available */}
              {showCompanyDetails.description && (
                <div className="mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{showCompanyDetails.description}</p>
                </div>
              )}
              
              {/* Key Metrics - Mobile Optimized */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 pt-3 sm:pt-4">
                <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Total Funding</p>
                    <p className="text-sm sm:text-base md:text-lg font-medium text-cyan-600 dark:text-cyan-400">
                      {showCompanyDetails.totalFunding > 0 ? `$${(showCompanyDetails.totalFunding / 1000000).toFixed(1)}M` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Rounds</p>
                    <p className="text-sm sm:text-base md:text-lg font-medium text-slate-700 dark:text-slate-200">{showCompanyDetails.dealCount}</p>
                  </div>
                </div>
                <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Investors</p>
                    <p className="text-sm sm:text-base md:text-lg font-medium text-slate-700 dark:text-slate-200">{showCompanyDetails.investors?.length || 0}</p>
                  </div>
                </div>
                {showCompanyDetails.lastFunding && (
                  <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Last Funding</p>
                      <p className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200">
                        {new Date(showCompanyDetails.lastFunding).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Funding History - Modern Style - Mobile Optimized */}
              {showCompanyDetails.deals && showCompanyDetails.deals.length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-sm sm:text-base md:text-lg font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Funding History ({showCompanyDetails.deals.length})
                  </h4>
                  <div className="space-y-2">
                    {showCompanyDetails.deals.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((deal: any, index: number) => (
                      <div key={index} className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm">{deal.type}</span>
                                {deal.investor && (
                                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">by {deal.investor}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400 flex-shrink-0" />
                                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(deal.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm sm:text-base md:text-lg font-medium text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                            ${(deal.value / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investors - Modern Style - Mobile Optimized */}
              {showCompanyDetails.investors && showCompanyDetails.investors.length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-sm sm:text-base md:text-lg font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Investors ({showCompanyDetails.investors.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {showCompanyDetails.investors.map((investor: string, index: number) => (
                      <span 
                        key={index} 
                        className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={investor}
                      >
                        {investor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Mobile Optimized - Fixed at bottom */}
            <div className="flex flex-col sm:flex-row gap-2 p-3 sm:p-4 md:p-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              {showCompanyDetails.hasAccount && (
                <button 
                  onClick={() => {
                    onViewCompany(showCompanyDetails.name);
                    setShowCompanyDetails(null);
                  }} 
                  className="flex-1 btn-primary-elevated px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>View Full Profile</span>
                </button>
              )}
              {showCompanyDetails.website && (
                <a 
                  href={showCompanyDetails.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-outline px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Website</span>
                </a>
              )}
              <button 
                onClick={() => handleFollowCompany(showCompanyDetails.name)} 
                className="btn-outline px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Follow</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AISidePanel open={aiOpen} onClose={() => setAiOpen(false)} context={{ sector: selectedSector === 'All' ? undefined : selectedSector }} />
    </div>
  );
};

export default CompaniesPage;
