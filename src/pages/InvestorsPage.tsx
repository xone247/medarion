import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Filter, DollarSign, Building2, TrendingUp, Globe, Mail, Phone, Bot, FileDown } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const InvestorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showInvestorDetails, setShowInvestorDetails] = useState<any>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));

  useEffect(() => {
    const fetchInvestorsData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/investors', { limit: '200' });
        console.log('[InvestorsPage] API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API data to match expected format
          const transformed = response.data.map((inv: any) => {
            // Calculate total invested from recent_investments array
            let totalInvested = 0;
            if (Array.isArray(inv.recent_investments) && inv.recent_investments.length > 0) {
              totalInvested = inv.recent_investments.reduce((sum: number, investment: any) => {
                return sum + (parseFloat(investment.amount) || 0);
              }, 0);
            } else if (inv.assets_under_management) {
              // Try to extract number from string like "$500M+"
              const match = String(inv.assets_under_management).match(/[\d.]+/);
              if (match) {
                totalInvested = parseFloat(match[0]) * 1000000; // Convert M to actual number
              }
            }
            
            // Handle portfolio_companies - could be number or array
            let portfolioCompanies = [];
            if (Array.isArray(inv.portfolio_companies)) {
              portfolioCompanies = inv.portfolio_companies;
            } else if (typeof inv.portfolio_companies === 'number') {
              // If it's a number, we can't convert it to an array of companies
              portfolioCompanies = [];
            }
            
            return {
              id: inv.id,
              name: inv.name,
              logo: inv.logo,
              description: inv.description,
              type: inv.type || 'VC',
              headquarters: inv.headquarters,
              website: inv.website,
              totalInvested: totalInvested,
              dealCount: Array.isArray(inv.recent_investments) ? inv.recent_investments.length : (inv.total_investments || 0),
              portfolioCompanies: portfolioCompanies,
              focusSectors: Array.isArray(inv.focus_sectors) ? inv.focus_sectors : [],
              countries: Array.isArray(inv.countries) ? inv.countries : [],
              contact_email: inv.contact_email,
              social_media: inv.social_media || {},
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

  const types = [
    'All', 
    'VC', 
    'Foundation/Fund', 
    'Private Equity (PE)', 
    'Impact & ESG Investors', 
    'Institutional Investors', 
    'Strategic & Corporate Investors', 
    'Angel & Family Office Investors', 
    'Public Market Investors'
  ];

  const filteredInvestors = investorsList.filter((investor: any) => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || investor.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleViewInvestorDetails = (investor: any) => {
    setShowInvestorDetails(investor);
  };

  const exportJSON = () => {
    try { const data = { filters: { searchTerm, selectedType }, investors: filteredInvestors, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='investors.json'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };
  const exportCSV = () => {
    try { const rows = [['Name','Type','TotalInvestedUSD','DealCount','CountriesCount']]; filteredInvestors.forEach((i:any)=> rows.push([i.name,i.type,String(i.totalInvested||0),String(i.dealCount||0),String((i.countries||[]).length)])); const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='investors.csv'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };
  const copyJSON = async () => {
    try { const data = { filters: { searchTerm, selectedType }, investors: filteredInvestors, exportedAt: new Date().toISOString() }; const text = JSON.stringify(data, null, 2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} alert('Copied investors JSON to clipboard'); } catch {}
  };

  const runAISummary = () => {
    // Quick inline summary based on current filtered data
    try {
      const total = filteredInvestors.length;
      const topType = (() => {
        const map = new Map<string, number>(); filteredInvestors.forEach((i:any)=> map.set(i.type,(map.get(i.type)||0)+1)); const arr=[...map.entries()].sort((a,b)=>b[1]-a[1]); return arr[0]?.[0] || 'N/A';
      })();
      const totalDeployed = filteredInvestors.reduce((s:number,i:any)=> s + (i.totalInvested||0), 0);
      setAiSummary(`Investors: ${total} • Top type: ${topType} • Total deployed: $${(totalDeployed/1e6).toFixed(1)}M`);
    } catch { setAiSummary('No data available for summary.'); }
  };

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Investors</h1>
              <p className="text-[var(--color-text-secondary)]">Discover healthcare investors and funding opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canAI && <button onClick={runAISummary} className="btn-primary-elevated btn-sm flex items-center gap-2"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
            <button onClick={copyJSON} className="btn-outline btn-sm">Copy</button>
            <button onClick={exportJSON} className="btn-outline btn-sm"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
            <button onClick={exportCSV} className="btn-outline btn-sm"><FileDown className="h-4 w-4 inline mr-2"/>Export CSV</button>
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 shadow-soft">
          <div className="text-sm text-[var(--color-text-primary)]">{aiSummary}</div>
        </div>
      )}

      {/* Summary Stats with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Active Investors</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{filteredInvestors.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Deployed</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                ${(filteredInvestors.reduce((sum: number, inv: any) => sum + inv.totalInvested, 0) / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Avg Deal Size</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {(filteredInvestors.length > 0 ? (filteredInvestors.reduce((sum: number, inv: any) => sum + inv.totalInvested, 0) / 
                  filteredInvestors.reduce((sum: number, inv: any) => sum + inv.dealCount, 0) / 1000000) : 0).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Most Active</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">
                {filteredInvestors.sort((a: any, b: any) => b.dealCount - a.dealCount)[0]?.name.split(' ')[0] || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Investors Grid with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvestors.sort((a: any, b: any) => b.totalInvested - a.totalInvested).map((investor: any) => (
          <div 
            key={investor.name} 
            className="card-glass p-6 shadow-soft hover:shadow-elevated transition-all duration-300 cursor-pointer card-hover"
            onClick={() => handleViewInvestorDetails(investor)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{investor.name}</h3>
                  <span className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs font-medium border border-[var(--color-divider-gray)]">
                    {investor.type}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Total Invested</span>
                <span className="text-lg font-bold text-[var(--color-primary-teal)]">${(investor.totalInvested / 1000000).toFixed(1)}M</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Deals</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{investor.dealCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Portfolio Companies</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{(investor.portfolioCompanies || []).length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-secondary)]">Last Investment</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {investor.lastInvestment ? new Date(investor.lastInvestment).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="pt-2 border-t border-[var(--color-divider-gray)]">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Focus Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {(investor.focusSectors || []).slice(0, 2).map((sector: string, index: number) => (
                    <span key={index} className="bg-[var(--color-background-default)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-divider-gray)]">
                      {sector}
                    </span>
                  ))}
                  {(investor.focusSectors || []).length > 2 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      +{(investor.focusSectors || []).length - 2} more
                    </span>
                  )}
                  {(investor.focusSectors || []).length === 0 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">No sectors</span>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Active in</p>
                <div className="flex flex-wrap gap-1">
                  {(investor.countries || []).slice(0, 3).map((country: string, index: number) => (
                    <span key={index} className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-divider-gray)]">
                      {country}
                    </span>
                  ))}
                  {(investor.countries || []).length > 3 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      +{(investor.countries || []).length - 3} more
                    </span>
                  )}
                  {(investor.countries || []).length === 0 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">No countries</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Investor Details Modal with glassmorphism */}
      {showInvestorDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-glass p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{showInvestorDetails.name}</h3>
                  <span className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs font-medium border border-[var(--color-divider-gray)]">
                    {showInvestorDetails.type}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowInvestorDetails(null)}
                className="text-[var(--color-text-secondary)] hover:opacity-80"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Investment Profile</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">Total Invested</span>
                    <span className="text-lg font-bold text-[var(--color-primary-teal)]">
                      ${(showInvestorDetails.totalInvested / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">Deal Count</span>
                    <span className="text-base font-medium text-[var(--color-text-primary)]">
                      {showInvestorDetails.dealCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">Average Deal Size</span>
                    <span className="text-base font-medium text-[var(--color-text-primary)]">
                      ${(showInvestorDetails.dealCount > 0 ? (showInvestorDetails.totalInvested / showInvestorDetails.dealCount / 1000000) : 0).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">Preferred Stage</span>
                    <span className="text-base font-medium text-[var(--color-text-primary)]">
                      {(showInvestorDetails.stages && showInvestorDetails.stages[0]) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--color-text-secondary)]">Last Investment</span>
                    <span className="text-base font-medium text-[var(--color-text-primary)]">
                      {showInvestorDetails.lastInvestment ? new Date(showInvestorDetails.lastInvestment).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Contact Information</h4>
                <div className="space-y-3 card-glass p-4 shadow-soft">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <a 
                      href={showInvestorDetails.website || `https://www.${showInvestorDetails.name.toLowerCase().replace(/\s+/g, '')}.com`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link hover:text-[var(--color-primary-light)]"
                    >
                      {showInvestorDetails.website || `https://www.${showInvestorDetails.name.toLowerCase().replace(/\s+/g, '')}.com`}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <a 
                      href={`mailto:${showInvestorDetails.email || `info@${showInvestorDetails.name.toLowerCase().replace(/\s+/g, '')}.com`}`}
                      className="link hover:text-[var(--color-primary-light)]"
                    >
                      {showInvestorDetails.email || `info@${showInvestorDetails.name.toLowerCase().replace(/\s+/g, '')}.com`}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <span className="text-[var(--color-text-primary)]">
                      {showInvestorDetails.phone || '+1 (555) 123-4567'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Focus Areas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">Sectors</p>
                  <div className="flex flex-wrap gap-2">
                    {(showInvestorDetails.focusSectors || []).map((sector: string, index: number) => (
                      <span key={index} className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-divider-gray)]">
                        {sector}
                      </span>
                    ))}
                    {(showInvestorDetails.focusSectors || []).length === 0 && (
                      <span className="text-sm text-[var(--color-text-secondary)]">No sectors specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">Geographic Focus</p>
                  <div className="flex flex-wrap gap-2">
                    {(showInvestorDetails.countries || []).map((country: string, index: number) => (
                      <span key={index} className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-divider-gray)]">
                        {country}
                      </span>
                    ))}
                    {(showInvestorDetails.countries || []).length === 0 && (
                      <span className="text-sm text-[var(--color-text-secondary)]">No countries specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Portfolio Companies</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(showInvestorDetails.portfolioCompanies || []).map((company: string, index: number) => (
                  <div key={index} className="card-glass p-2 shadow-soft text-sm">
                    {company}
                  </div>
                ))}
                {(showInvestorDetails.portfolioCompanies || []).length === 0 && (
                  <span className="text-sm text-[var(--color-text-secondary)]">No portfolio companies listed</span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInvestorDetails(null)}
                className="btn-primary-elevated"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorsPage;