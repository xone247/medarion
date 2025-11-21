import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, Eye, Download, Users, DollarSign, MapPin, Globe, SlidersHorizontal, FileDown, Printer } from 'lucide-react';
import { dataService } from '../services/dataService';
import VCInvestmentOverTimeChart from '../components/VCInvestmentOverTimeChart';
import DealsByStageChart from '../components/DealsByStageChart';
import DealsBySectorChart from '../components/DealsBySectorChart';
import SectorTreemap from '../components/SectorTreemap';

const StartupAnalyticsPage = () => {
  // Engagement mock data (kept as-is)
  const profileViewsData = [
    { month: 'Jul', views: 45 },
    { month: 'Aug', views: 78 },
    { month: 'Sep', views: 92 },
    { month: 'Oct', views: 134 },
    { month: 'Nov', views: 156 },
    { month: 'Dec', views: 189 }
  ];

  const investorTypeData = [
    { name: 'African VC Funds', value: 45, color: '#00665C' },
    { name: 'Pan-African Angels', value: 30, color: '#ffc107' },
    { name: 'International VCs', value: 15, color: '#2196f3' },
    { name: 'Development Finance', value: 10, color: '#ff9800' }
  ];

  const africanGeographicData = [
    { region: 'West Africa', views: 142, percentage: 35 },
    { region: 'East Africa', views: 118, percentage: 29 },
    { region: 'Southern Africa', views: 89, percentage: 22 },
    { region: 'North Africa', views: 57, percentage: 14 }
  ];

  const countryViewsData = [
    { country: 'Nigeria', views: 89, flag: '🇳🇬' },
    { country: 'Kenya', views: 67, flag: '🇰🇪' },
    { country: 'South Africa', views: 54, flag: '🇿🇦' },
    { country: 'Ghana', views: 43, flag: '🇬🇭' },
    { country: 'Egypt', views: 38, flag: '🇪🇬' },
    { country: 'Rwanda', views: 32, flag: '🇷🇼' },
    { country: 'Uganda', views: 28, flag: '🇺🇬' },
    { country: 'Tanzania', views: 25, flag: '🇹🇿' }
  ];

  const engagementData = [
    { metric: 'Profile Views', value: 472, change: '+24%', description: 'Across 15 African countries' },
    { metric: 'Pitch Deck Downloads', value: 89, change: '+12%', description: 'From African investors' },
    { metric: 'Contact Requests', value: 23, change: '+45%', description: 'Pan-African interest' },
    { metric: 'Meeting Requests', value: 8, change: '+33%', description: 'Scheduled with African VCs' }
  ];

  const sectorInterestData = [
    { sector: 'AI Diagnostics', interest: 85, african_relevance: 'High demand in rural areas' },
    { sector: 'Telemedicine', interest: 72, african_relevance: 'Critical for remote regions' },
    { sector: 'Health Tech', interest: 68, african_relevance: 'Growing digital adoption' },
    { sector: 'Medical Devices', interest: 45, african_relevance: 'Infrastructure development' },
    { sector: 'Pharma Supply', interest: 32, african_relevance: 'Supply chain challenges' }
  ];

  const marketInsights = [
    { title: 'West African Dominance', description: 'Nigeria leads with 89 profile views, representing 35% of total African engagement', icon: '🌍', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
    { title: 'East African Growth', description: 'Kenya and Rwanda show highest engagement rates, with 67 and 32 views respectively', icon: '📈', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    { title: 'Southern Africa Interest', description: 'South African investors show strong interest in AI diagnostics solutions', icon: '🎯', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
    { title: 'Pan-African Opportunity', description: 'Your solution addresses healthcare challenges across all African regions', icon: '🚀', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' }
  ];

  // Investment data (filters and datasets)
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ sector?: string; country?: string; stage?: string; timeframe?: string }>({ timeframe: '12m' });
  const [options, setOptions] = useState<{ sectors: string[]; countries: string[]; stages: string[] }>({ sectors: [], countries: [], stages: [] });
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const sectionsKey = 'medarionAnalyticsSections';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(sectionsKey);
      if (raw) setVisibleSections(JSON.parse(raw)); else setVisibleSections(['engagementMetrics','viewsTrend','investorTypePie','regionalDistribution','topCountries','sectorInterest','marketInsights','marketSummary','investmentOverTime','dealsByStage','dealsBySector','sectorTreemap']);
    } catch {
      setVisibleSections(['engagementMetrics','viewsTrend','investorTypePie','regionalDistribution','topCountries','sectorInterest','marketInsights','marketSummary','investmentOverTime','dealsByStage','dealsBySector','sectorTreemap']);
    }
  }, []);

  const saveSections = (arr: string[]) => { setVisibleSections(arr); try{ localStorage.setItem(sectionsKey, JSON.stringify(arr)); }catch{} };

  useEffect(() => {
    dataService.getDeals({ limit: 200 }).then((response: any) => {
      if (!response.success || !response.data) return;
      const d = response.data.map((deal: any) => ({
        id: deal.id,
        company_name: deal.company_name || 'Unknown',
        investors: deal.participants ? (typeof deal.participants === 'string' ? JSON.parse(deal.participants) : deal.participants) : (deal.lead_investor ? [deal.lead_investor] : []),
        value_usd: parseFloat(deal.amount || 0),
        stage: deal.deal_type || 'Unknown',
        country: deal.country || 'Unknown',
        date: deal.deal_date || deal.created_at,
        sector: deal.sector || deal.industry || 'Unknown',
      }));
      setAllDeals(d);
      const secs = Array.from(new Set(d.map(x=>x.sector).filter(Boolean))).sort();
      const ctry = Array.from(new Set(d.map(x=>x.country).filter(Boolean))).sort();
      const stg = Array.from(new Set(d.map(x=>x.stage || x.type).filter(Boolean))).sort();
      setOptions({ sectors: secs, countries: ctry, stages: stg });
    }).catch(()=>setAllDeals([]));
  }, []);

  const filteredDeals = useMemo(() => {
    const monthsBack = (() => { switch(filters.timeframe){ case '3m': return 3; case '6m': return 6; case '12m': return 12; case '24m': return 24; default: return 120; } })();
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - monthsBack);
    return allDeals.filter((d) => {
      const okSector = !filters.sector || d.sector === filters.sector;
      const okCountry = !filters.country || d.country === filters.country;
      const okStage = !filters.stage || (d.stage || d.type) === filters.stage;
      const okDate = (()=>{ if(!d.date) return true; const dt = new Date(d.date); return dt >= cutoff; })();
      return okSector && okCountry && okStage && okDate;
    });
  }, [allDeals, filters]);

  const CustomTooltip = ({ active, payload, label }: { active: any; payload: any; label: any }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] p-3 rounded-lg shadow-lg">
          <p className="text-[var(--color-text-primary)] font-medium">{label}</p>
          <p className="text-[var(--color-primary-teal)]">
            {payload[0].dataKey === 'views' ? 'Views: ' : 
             payload[0].dataKey === 'interest' ? 'Interest: ' : 'Value: '}
            {payload[0].value}{payload[0].dataKey === 'interest' ? '%' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 icon-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Startup Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="toolbar">
              <select className="input w-40" value={filters.sector||''} onChange={(e)=>setFilters(prev=>({...prev, sector: e.target.value || undefined}))}>
                <option value="">All sectors</option>
                {options.sectors.map(s=> (<option key={s} value={s}>{s}</option>))}
              </select>
              <select className="input w-40" value={filters.country||''} onChange={(e)=>setFilters(prev=>({...prev, country: e.target.value || undefined}))}>
                <option value="">All countries</option>
                {options.countries.map(c=> (<option key={c} value={c}>{c}</option>))}
              </select>
              <select className="input w-36" value={filters.stage||''} onChange={(e)=>setFilters(prev=>({...prev, stage: e.target.value || undefined}))}>
                <option value="">All stages</option>
                {options.stages.map(s=> (<option key={s} value={s}>{s}</option>))}
              </select>
              <select className="input w-32" value={filters.timeframe||'12m'} onChange={(e)=>setFilters(prev=>({...prev, timeframe: e.target.value || '12m'}))}>
                <option value="3m">3m</option>
                <option value="6m">6m</option>
                <option value="12m">12m</option>
                <option value="24m">24m</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="toolbar">
              <button className="btn-outline px-3 py-2 rounded" onClick={()=>{
                try{ const data = { filters, generatedAt:new Date().toISOString(), deals: filteredDeals.slice(0,200) }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'analytics-export.json'; a.click(); URL.revokeObjectURL(a.href);}catch{}
              }}><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
              <button className="btn-primary px-3 py-2 rounded" onClick={()=>{ try{ window.print(); }catch{} }}><Printer className="h-4 w-4 inline mr-2"/>Print</button>
            </div>
            <button className="btn-outline px-3 py-2 rounded" onClick={()=>{
              const next = visibleSections.length ? [] : ['engagementMetrics','viewsTrend','investorTypePie','regionalDistribution','topCountries','sectorInterest','marketInsights','marketSummary','investmentOverTime','dealsByStage','dealsBySector','sectorTreemap'];
              saveSections(next);
            }}><SlidersHorizontal className="h-4 w-4 inline mr-2"/>Customize</button>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      {visibleSections.includes('engagementMetrics') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {engagementData.map((metric, index) => (
            <div key={index} className="card-glass p-4 md:p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--color-text-secondary)] text-sm">{metric.metric}</p>
                  <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">{metric.value}</p>
                  <p className="text-[var(--color-primary-teal)] text-sm">{metric.change} this month</p>
                  <p className="text-[var(--color-text-secondary)] text-xs mt-1">{metric.description}</p>
                </div>
                <div className="bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] p-2 md:p-3 rounded-lg border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  {index === 0 && <Eye className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                  {index === 1 && <Download className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                  {index === 2 && <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                  {index === 3 && <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Views Trend + Investor Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {visibleSections.includes('viewsTrend') && (
          <div className="card-glass p-4 md:p-6 shadow-soft">
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">African Market Profile Views Trend</h3>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profileViewsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
                  <XAxis dataKey="month" stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} />
                  <YAxis stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} />
                  <Tooltip content={<CustomTooltip active={false} payload={[]} label={''} />} />
                  <Line type="monotone" dataKey="views" stroke="#00665C" strokeWidth={3} dot={{ fill: '#00665C', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {visibleSections.includes('investorTypePie') && (
          <div className="card-glass p-4 md:p-6 shadow-soft">
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">African Investor Type Distribution</h3>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={investorTypeData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }: { name: string; percent?: number }) => `${name} ${Number(((percent ?? 0) * 100).toFixed(0))}%`} labelLine={false}>
                    {investorTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip active={false} payload={[]} label={''} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Regional Distribution + Top Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {visibleSections.includes('regionalDistribution') && (
          <div className="card-glass p-4 md:p-6 shadow-soft">
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">African Regional Distribution</h3>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={africanGeographicData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
                  <XAxis dataKey="region" stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} />
                  <YAxis stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} />
                  <Tooltip content={<CustomTooltip active={false} payload={[]} label={''} />} />
                  <Bar dataKey="views" fill="#ffc107" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {visibleSections.includes('topCountries') && (
          <div className="card-glass p-4 md:p-6 shadow-soft">
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">Top African Countries by Engagement</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-64 md:h-72 overflow-y-auto pr-2">
              {countryViewsData.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between p-3 card-glass rounded-lg shadow-soft">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{country.country}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Rank #{index + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--color-primary-teal)]">{country.views}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sector Interest */}
      {visibleSections.includes('sectorInterest') && (
        <div className="card-glass p-4 md:p-6 shadow-soft mb-6">
          <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">African Investor Interest by Sector</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorInterestData} layout="horizontal" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
                  <XAxis type="number" stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} domain={[0, 100]} tickCount={6} label={{ value: 'Interest Level (%)', position: 'insideBottom', offset: -5 }} />
                  <YAxis type="category" dataKey="sector" stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} width={120} />
                  <Tooltip content={<CustomTooltip active={false} payload={[]} label={''} />} />
                  <Bar dataKey="interest" fill="#2196f3" radius={[0, 4, 4, 0]}>
                    {sectorInterestData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2196f3' : '#00665C'} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-[var(--color-text-primary)]">African Market Relevance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-64 overflow-y-auto pr-2">
                {sectorInterestData.map((sector, index) => (
                  <div key={sector.sector} className="p-3 card-glass rounded-lg shadow-soft">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{sector.sector}</span>
                      <span className="text-sm text-[var(--color-primary-teal)] font-medium">{sector.interest}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-background-default)] rounded-full h-1.5 mb-2">
                      <div className="bg-[var(--color-primary-teal)] h-1.5 rounded-full" style={{ width: `${sector.interest}%` }}></div>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">{sector.african_relevance}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Insights */}
      {visibleSections.includes('marketInsights') && (
        <div className="card-glass p-4 md:p-6 shadow-soft mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)]">African Market Insights</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {marketInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border card-glass shadow-soft ${insight.color}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{insight.icon}</span>
                  <h4 className="font-medium text-[var(--color-text-primary)]">{insight.title}</h4>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Summary */}
      {visibleSections.includes('marketSummary') && (
        <div className="card-glass p-4 md:p-6 shadow-soft">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)]">African Healthcare Market Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary-teal)] mb-2">54</div>
              <div className="text-sm text-[var(--color-text-secondary)]">African Countries</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Market Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary-teal)] mb-2">1.4B</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Total Population</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Addressable Market</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary-teal)] mb-2">$180B</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Healthcare Market Size</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Growing at 8.2% CAGR</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your AI diagnostic solution is positioned to address critical healthcare challenges across the African continent, 
              with strong investor interest from pan-African funds and development finance institutions.
            </p>
          </div>
        </div>
      )}

      {/* Investment Analytics (using filtered deals) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {visibleSections.includes('investmentOverTime') && (<VCInvestmentOverTimeChart deals={filteredDeals} />)}
        {visibleSections.includes('dealsByStage') && (<DealsByStageChart deals={filteredDeals} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleSections.includes('dealsBySector') && (<DealsBySectorChart deals={filteredDeals} />)}
        {visibleSections.includes('sectorTreemap') && (<SectorTreemap deals={filteredDeals} />)}
      </div>
    </div>
  );
};

export default StartupAnalyticsPage;