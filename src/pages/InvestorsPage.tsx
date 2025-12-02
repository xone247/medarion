import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Filter, DollarSign, Building2, TrendingUp, Globe, Mail, Phone, Bot, FileDown, ExternalLink, X, MapPin, Eye, Star } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

const InvestorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showInvestorDetails, setShowInvestorDetails] = useState<any>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));

  useEffect(() => {
    const fetchInvestorsData = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/admin/investors', { all: 'true' });
        console.log('[InvestorsPage] API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          const transformed = response.data.map((inv: any) => {
            // Use enriched data from database first, fallback to calculated values
            let totalInvested = parseFloat(inv.total_invested || 0);
            if (totalInvested === 0) {
              // Fallback: calculate from recent_investments if available
              if (Array.isArray(inv.recent_investments) && inv.recent_investments.length > 0) {
                totalInvested = inv.recent_investments.reduce((sum: number, investment: any) => {
                  return sum + (parseFloat(investment.amount) || 0);
                }, 0);
              } else if (inv.assets_under_management) {
                const match = String(inv.assets_under_management).match(/[\d.]+/);
                if (match) {
                  totalInvested = parseFloat(match[0]) * 1000000;
                }
              }
            }
            
            // Use enriched deal_count from database
            let dealCount = parseInt(inv.deal_count || 0);
            if (dealCount === 0 && Array.isArray(inv.recent_investments)) {
              dealCount = inv.recent_investments.length;
            } else if (dealCount === 0) {
              dealCount = parseInt(inv.total_investments || 0);
            }
            
            // Use portfolio_companies from database
            let portfolioCompanies = [];
            if (Array.isArray(inv.portfolio_companies)) {
              portfolioCompanies = inv.portfolio_companies;
            }
            
            // Use focus_sectors from database (sectors or focus_sectors)
            let focusSectors = [];
            if (Array.isArray(inv.focus_sectors)) {
              focusSectors = inv.focus_sectors;
            } else if (Array.isArray(inv.sectors)) {
              focusSectors = inv.sectors;
            }
            
            // Use geographic_focus from database (geographic_focus or countries)
            let countries = [];
            if (Array.isArray(inv.countries)) {
              countries = inv.countries;
            } else if (Array.isArray(inv.geographic_focus)) {
              countries = inv.geographic_focus;
            }
            
            return {
              id: inv.id,
              name: inv.name,
              logo: inv.logo_url || inv.logo || null,
              description: inv.description || inv.bio || inv.about || null,
              type: inv.type || 'VC',
              headquarters: inv.headquarters,
              website: inv.website || inv.website_url || null,
              totalInvested: totalInvested,
              dealCount: dealCount,
              portfolioCompanies: portfolioCompanies,
              focusSectors: focusSectors,
              countries: countries,
              contact_email: inv.contact_email || null,
              social_media: inv.social_media || {},
              assets_under_management: inv.assets_under_management || null,
              investment_stages: Array.isArray(inv.investment_stages) ? inv.investment_stages : [],
              avgDealSize: parseFloat(inv.avg_deal_size || 0),
            };
          });
          
          console.log('[InvestorsPage] Transformed data:', transformed);
          setInvestors(transformed);
        } else {
          console.warn('[InvestorsPage] Invalid response format:', response);
          setInvestors([]);
        }
      } catch (error) {
        console.error('[InvestorsPage] Error fetching investors data:', error);
        setInvestors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestorsData();
  }, []);

  // Enrich investor type heuristically
  const investorsList = useMemo(() => investors.map((inv: any) => ({
    ...inv,
    type: inv.name.includes('Foundation') || inv.name.includes('Fund') ? 'Foundation/Fund' : 
          inv.name.includes('Ventures') || inv.name.includes('Capital') ? 'VC' : 
          inv.name.includes('Partners') ? 'Private Equity (PE)' :
          inv.name.includes('Impact') || inv.name.includes('Development') ? 'Impact & ESG Investors' :
          inv.name.includes('Bank') || inv.name.includes('Group') ? 'Institutional Investors' :
          inv.name.includes('Health') || inv.name.includes('Pharma') ? 'Strategic & Corporate Investors' :
          inv.name.includes('Angels') || inv.name.includes('Family') ? 'Angel & Family Office Investors' :
          'Public Market Investors'
  })), [investors]);

  const types = useMemo(() => ['All', ...new Set(investorsList.map((inv: any) => inv.type))], [investorsList]);
  const countries = useMemo(() => ['All', ...new Set(investorsList.flatMap((inv: any) => inv.countries || []))], [investorsList]);

  const filteredInvestors = useMemo(() => investorsList.filter((investor: any) => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || investor.type === selectedType;
    return matchesSearch && matchesType;
  }), [investorsList, searchTerm, selectedType]);

  const totalDeployed = useMemo(() => filteredInvestors.reduce((sum: number, inv: any) => sum + (inv.totalInvested || 0), 0), [filteredInvestors]);
  const avgDealSize = useMemo(() => {
    const totalDeals = filteredInvestors.reduce((sum: number, inv: any) => sum + (inv.dealCount || 0), 0);
    return totalDeals > 0 ? totalDeployed / totalDeals : 0;
  }, [filteredInvestors, totalDeployed]);

  const topTypes = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvestors.forEach((inv: any) => map.set(inv.type, (map.get(inv.type) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredInvestors]);

  const topCountries = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvestors.forEach((inv: any) => {
      (inv.countries || []).forEach((country: string) => {
        map.set(country, (map.get(country) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredInvestors]);

  const handleViewInvestorDetails = (investor: any) => {
    setShowInvestorDetails(investor);
  };

  const exportExcel = () => {
    try {
      const excelData = filteredInvestors.map((inv: any) => ({
        Name: inv.name,
        Type: inv.type,
        'Total Invested (USD)': inv.totalInvested || 0,
        'Deal Count': inv.dealCount || 0,
        'Portfolio Companies': (inv.portfolioCompanies || []).length,
        Headquarters: inv.headquarters || '',
        Website: inv.website || '',
        'Focus Sectors': (inv.focusSectors || []).join('; '),
        Countries: (inv.countries || []).join('; ')
      }));
      exportToExcel(excelData, 'investors', 'Investors');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedType }, investors: filteredInvestors, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'investors');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['Name','Type','TotalInvestedUSD','DealCount','PortfolioCompanies','Headquarters','Website','FocusSectors','Countries']];
      filteredInvestors.forEach((inv: any) => rows.push([
        inv.name,
        inv.type,
        String(inv.totalInvested || 0),
        String(inv.dealCount || 0),
        String((inv.portfolioCompanies || []).length),
        inv.headquarters || '',
        inv.website || '',
        (inv.focusSectors || []).join('; '),
        (inv.countries || []).join('; ')
      ]));
      exportToCSV(rows, 'investors');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };


  const runAISummary = () => {
    try {
      const total = filteredInvestors.length;
      const topType = (() => {
        const map = new Map<string, number>();
        filteredInvestors.forEach((i: any) => map.set(i.type, (map.get(i.type) || 0) + 1));
        const arr = [...map.entries()].sort((a, b) => b[1] - a[1]);
        return arr[0]?.[0] || 'N/A';
      })();
      const totalDeployed = filteredInvestors.reduce((s: number, i: any) => s + (i.totalInvested || 0), 0);
      setAiSummary(`Investors: ${total} • Top type: ${topType} • Total deployed: $${(totalDeployed / 1e6).toFixed(1)}M`);
    } catch {
      setAiSummary('No data available for summary.');
    }
  };

  return (
    <div className="w-full space-y-2 sm:space-y-3 md:space-y-4 p-2 sm:p-3 md:p-4">
      {/* Top Bar: Filters and Actions - Compact Mobile Optimized */}
      <div className="card-glass p-2.5 sm:p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search investors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 min-w-full sm:min-w-[180px]"
            >
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Actions Section - Compact Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-2.5">
            {canAI && (
              <button 
                onClick={runAISummary} 
                className="btn-primary-elevated flex items-center justify-center px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto"
                title="AI Summary"
              >
                <Bot className="h-4 w-4" />
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
                  <FileDown className="h-4 w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button 
                  onClick={exportJSON} 
                  className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" 
                  title="Export JSON"
                >
                  <FileDown className="h-4 w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button 
                  onClick={exportCSV} 
                  className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" 
                  title="Export CSV"
                >
                  <FileDown className="h-4 w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="card-glass p-2 sm:p-3 md:p-4 rounded-lg">
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">{aiSummary}</div>
        </div>
      )}

      {/* Summary Stats - Compact Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Active Investors</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{filteredInvestors.length}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Total Deployed</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">${(totalDeployed / 1000000).toFixed(1)}M</p>
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
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Avg Deal Size</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">${(avgDealSize / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Most Active</p>
              <p className="text-sm sm:text-base md:text-lg font-medium text-slate-700 dark:text-slate-200 truncate">
                {filteredInvestors.sort((a: any, b: any) => b.dealCount - a.dealCount)[0]?.name.split(' ')[0] || 'N/A'}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights - Compact Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Top Types */}
        <div className="card-glass p-2 sm:p-3 rounded-lg">
          <h3 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2 uppercase tracking-wide">Top Investor Types</h3>
          <ul className="space-y-1 sm:space-y-1.5">
            {topTypes.map(([type, count]) => (
              <li key={type} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{type}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium ml-1.5 sm:ml-2 bg-slate-100 dark:bg-slate-800/50 px-1.5 sm:px-2 py-0.5 rounded">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Top Countries */}
        <div className="card-glass p-2 sm:p-3 rounded-lg">
          <h3 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2 uppercase tracking-wide">Top Countries</h3>
          <ul className="space-y-1 sm:space-y-1.5">
            {topCountries.map(([country, count]) => (
              <li key={country} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{country}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium ml-1.5 sm:ml-2 bg-slate-100 dark:bg-slate-800/50 px-1.5 sm:px-2 py-0.5 rounded">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Investors Grid - Rich Information, Compact Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {filteredInvestors.sort((a: any, b: any) => b.totalInvested - a.totalInvested).map((investor: any) => (
          <div
            key={investor.id || investor.name}
            className="card-glass p-2.5 sm:p-3 md:p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200 group relative overflow-hidden flex flex-col h-full"
          >
            {/* Investor Header with Logo */}
            <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
              {investor.logo ? (
                <img
                  src={investor.logo}
                  alt={investor.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${investor.logo ? 'hidden' : 'flex'} w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl items-center justify-center border border-cyan-600/20 flex-shrink-0 shadow-sm`}>
                <span className="text-white font-medium text-sm sm:text-base">{investor.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 truncate leading-tight mb-0.5 sm:mb-1">{investor.name}</h3>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {investor.type && (
                    <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] sm:text-xs font-medium">
                      {investor.type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description if available */}
            {investor.description && (
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 sm:mb-3 leading-relaxed">
                {investor.description}
              </p>
            )}

            {/* Key Metrics - Well Organized */}
            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
              <div className="flex justify-between items-center p-1.5 sm:p-2 bg-cyan-50/50 dark:bg-cyan-950/30 rounded-lg">
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">Total Invested</span>
                <span className="text-sm sm:text-base font-medium text-cyan-600 dark:text-cyan-400">${(investor.totalInvested / 1000000).toFixed(1)}M</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Deals</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{investor.dealCount || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Portfolio</span>
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{(investor.portfolioCompanies || []).length}</span>
                </div>
              </div>

              {investor.headquarters && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300 truncate">{investor.headquarters}</span>
                </div>
              )}
            </div>

            {/* Focus Sectors */}
            {investor.focusSectors && investor.focusSectors.length > 0 && (
              <div className="pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700 mb-2 sm:mb-3">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 sm:mb-1.5">Focus Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {investor.focusSectors.slice(0, 2).map((sector: string, index: number) => (
                    <span key={index} className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs border border-slate-200 dark:border-slate-700 truncate max-w-[100px] sm:max-w-[120px]">
                      {sector}
                    </span>
                  ))}
                  {investor.focusSectors.length > 2 && (
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 self-center">
                      +{investor.focusSectors.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Countries */}
            {investor.countries && investor.countries.length > 0 && (
              <div className="pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700 mb-2 sm:mb-3">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 sm:mb-1.5">Active in</p>
                <div className="flex flex-wrap gap-1">
                  {investor.countries.slice(0, 3).map((country: string, index: number) => (
                    <span key={index} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium truncate max-w-[80px] sm:max-w-[100px]">
                      {country}
                    </span>
                  ))}
                  {investor.countries.length > 3 && (
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 self-center">
                      +{investor.countries.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions - Well Organized - Always at bottom */}
            <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <button onClick={() => handleViewInvestorDetails(investor)} className="flex-1 btn-primary-elevated flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm">
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>View</span>
              </button>
              {investor.website && (
                <a
                  href={investor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center justify-center"
                  title="Visit Website"
                >
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </a>
              )}
              <button onClick={() => {}} className="btn-outline px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg" title="Follow">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Investor Details Modal - Modern & Beautiful with Scrollable Content */}
      {showInvestorDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 overflow-y-auto" onClick={() => setShowInvestorDetails(null)}>
          <div className="card-glass max-w-4xl w-full shadow-2xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 my-4 sm:my-6 md:my-8 flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }} onClick={(e) => e.stopPropagation()}>
            {/* Header with Logo - Fixed */}
            <div className="flex items-start justify-between p-5 sm:p-6 md:p-8 pb-4 sm:pb-5 md:pb-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 sticky top-0 bg-[var(--color-background-surface)] dark:bg-[var(--color-background-surface)] z-10 -mx-3 sm:-mx-4 md:-mx-6 px-5 sm:px-6 md:px-8">
              <div className="flex items-start gap-4 sm:gap-5 md:gap-6 flex-1 min-w-0">
                {showInvestorDetails.logo ? (
                  <img
                    src={showInvestorDetails.logo}
                    alt={showInvestorDetails.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${showInvestorDetails.logo ? 'hidden' : 'flex'} w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl items-center justify-center border-2 border-cyan-600/20 flex-shrink-0 shadow-lg`}>
                  <span className="text-white font-medium text-lg sm:text-xl md:text-2xl">{showInvestorDetails.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2">{showInvestorDetails.name}</h3>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {showInvestorDetails.type && (
                      <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs sm:text-sm font-medium">
                        {showInvestorDetails.type}
                      </span>
                    )}
                    {showInvestorDetails.headquarters && (
                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{showInvestorDetails.headquarters}</span>
                      </div>
                    )}
                    {showInvestorDetails.website && (
                      <a
                        href={showInvestorDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInvestorDetails(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 px-5 sm:px-6 md:px-8" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {/* Description if available */}
              {showInvestorDetails.description && (
                <div className="mb-4 sm:mb-6 pt-4 sm:pt-5 md:pt-6">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{showInvestorDetails.description}</p>
                </div>
              )}

              {/* Key Metrics - Compact Modern Style */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:mb-6">
              <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Invested</p>
                  <p className="text-base sm:text-lg md:text-xl font-medium text-cyan-600 dark:text-cyan-400">${(showInvestorDetails.totalInvested / 1000000).toFixed(1)}M</p>
                </div>
              </div>
              <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Deal Count</p>
                  <p className="text-base sm:text-lg md:text-xl font-medium text-slate-700 dark:text-slate-200">{showInvestorDetails.dealCount || 0}</p>
                </div>
              </div>
              <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Portfolio</p>
                  <p className="text-base sm:text-lg md:text-xl font-medium text-slate-700 dark:text-slate-200">{(showInvestorDetails.portfolioCompanies || []).length}</p>
                </div>
              </div>
              <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg Deal Size</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                    ${(showInvestorDetails.dealCount > 0 ? (showInvestorDetails.totalInvested / showInvestorDetails.dealCount / 1000000) : 0).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>

              {/* Focus Areas */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Focus Areas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">Sectors</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(showInvestorDetails.focusSectors || []).map((sector: string, index: number) => (
                        <span key={index} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm border border-indigo-200 dark:border-indigo-700 font-medium">
                          {sector}
                        </span>
                      ))}
                      {(showInvestorDetails.focusSectors || []).length === 0 && (
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">No sectors specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2">Geographic Focus</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(showInvestorDetails.countries || []).map((country: string, index: number) => (
                        <span key={index} className="bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm border border-cyan-200 dark:border-cyan-700 font-medium">
                          {country}
                        </span>
                      ))}
                      {(showInvestorDetails.countries || []).length === 0 && (
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">No countries specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Companies */}
              {showInvestorDetails.portfolioCompanies && showInvestorDetails.portfolioCompanies.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Portfolio Companies ({(showInvestorDetails.portfolioCompanies || []).length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(showInvestorDetails.portfolioCompanies || []).map((company: string, index: number) => (
                      <div key={index} className="card-glass p-2 sm:p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all text-xs sm:text-sm">
                        {company}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(showInvestorDetails.contact_email || showInvestorDetails.website) && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Contact Information
                  </h4>
                  <div className="card-glass p-3 sm:p-4 rounded-lg space-y-2">
                    {showInvestorDetails.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />
                        <a
                          href={showInvestorDetails.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs sm:text-sm font-medium break-all"
                        >
                          {showInvestorDetails.website}
                        </a>
                      </div>
                    )}
                    {showInvestorDetails.contact_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-400" />
                        <a
                          href={`mailto:${showInvestorDetails.contact_email}`}
                          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs sm:text-sm font-medium break-all"
                        >
                          {showInvestorDetails.contact_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Fixed Footer */}
            <div className="flex gap-2 p-5 sm:p-6 md:p-8 pt-4 sm:pt-5 md:pt-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 sticky bottom-0 bg-[var(--color-background-surface)] dark:bg-[var(--color-background-surface)] z-10 -mx-3 sm:-mx-4 md:-mx-6 px-5 sm:px-6 md:px-8">
              <button onClick={() => setShowInvestorDetails(null)} className="flex-1 btn-primary-elevated px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Close</span>
              </button>
              {showInvestorDetails.website && (
                <a
                  href={showInvestorDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Website</span>
                </a>
              )}
              <button onClick={() => {}} className="btn-outline px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Follow</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorsPage;
