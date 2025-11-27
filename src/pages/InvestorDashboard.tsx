import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Building2, DollarSign, Eye, Search, BarChart3, Globe } from 'lucide-react';
import NationPulseWidget from '../components/NationPulseWidget';
import HealthcareMarketWidget from '../components/HealthcareMarketWidget';
import InteractiveMap from '../components/InteractiveMap';
import KPICard from '../components/KPICard';
import { fetchDashboard } from '../services/ai';
import { dataService } from '../services/dataService';

const InvestorDashboard = () => {
  const [mapDataType, setMapDataType] = useState<'value' | 'count'>('value');
  const [kpis, setKpis] = useState<{ deals_and_grants: number; companies: number; investors: number; total_value_usd: number } | null>(null);
  const [activity, setActivity] = useState<Array<{ message: string; time: string }>>([]);

  useEffect(() => {
    fetchDashboard().then((d) => {
      setKpis(d.kpis || null);
      setActivity(d.sample_activity || []);
    }).catch(() => {
      setKpis({ deals_and_grants: 0, companies: 0, investors: 0, total_value_usd: 0 });
      setActivity([]);
    });
  }, []);

  const [portfolioCompanies, setPortfolioCompanies] = useState<Array<{ name: string; stage: string; investment: string; status: string; growth: string }>>([]);
  const [dealFlow, setDealFlow] = useState<Array<{ company: string; stage: string; amount: string; sector: string; status: string }>>([]);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Fetch recent companies from database
        const companiesResponse = await dataService.getCompanies({ limit: 10 });
        if (companiesResponse.success && companiesResponse.data) {
          const topCompanies = companiesResponse.data
            .filter((c: any) => c.total_funding && parseFloat(c.total_funding) > 0)
            .sort((a: any, b: any) => parseFloat(b.total_funding || 0) - parseFloat(a.total_funding || 0))
            .slice(0, 3)
            .map((c: any) => ({
              name: c.name,
              stage: c.funding_stage || c.stage || 'Unknown',
              investment: `$${(parseFloat(c.total_funding || 0) / 1000000).toFixed(1)}M`,
              status: c.is_active ? 'Active' : 'Inactive',
              growth: `+${Math.floor(Math.random() * 50 + 20)}%` // TODO: Calculate real growth from historical data
            }));
          setPortfolioCompanies(topCompanies);
        }

        // Fetch recent deals for deal flow
        const dealsResponse = await dataService.getDeals({ limit: 10 });
        if (dealsResponse.success && dealsResponse.data) {
          const recentDeals = dealsResponse.data
            .sort((a: any, b: any) => new Date(b.deal_date || b.created_at).getTime() - new Date(a.deal_date || a.created_at).getTime())
            .slice(0, 3)
            .map((d: any) => ({
              company: d.company_name || 'Unknown',
              stage: d.deal_type || 'Unknown',
              amount: `$${(parseFloat(d.amount || 0) / 1000000).toFixed(1)}M`,
              sector: d.sector || d.industry || 'Unknown',
              status: d.status === 'closed' ? 'Closed' : d.status === 'pending' ? 'Due Diligence' : 'Under Review'
            }));
          setDealFlow(recentDeals);
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        // Set empty arrays on error
        setPortfolioCompanies([]);
        setDealFlow([]);
      }
    };
    fetchPortfolioData();
  }, []);

  const marketInsights = [
    { metric: 'Total AUM', value: '$120M', change: '+12%', trend: 'up' },
    { metric: 'Active Investments', value: '24', change: '+3', trend: 'up' },
    { metric: 'Deals This Quarter', value: '8', change: '+2', trend: 'up' },
    { metric: 'Portfolio IRR', value: '18.5%', change: '+2.1%', trend: 'up' }
  ];

  return (
    <div className="w-full space-y-3">

      {/* Page Header - Compact */}
      <div className="mb-2">
        <h1 className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">Investor Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Portfolio overview and investment opportunities</p>
      </div>

      {/* KPI Row - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <KPICard title="Portfolio Value" value={kpis?.total_value_usd ? `$${(kpis.total_value_usd / 1000000).toFixed(1)}M` : '—'} icon={DollarSign} trend="+18% this quarter" />
        <KPICard title="Active Deals" value={kpis?.deals_and_grants ?? '—'} icon={TrendingUp} trend="+5 this month" />
        <KPICard title="Portfolio Companies" value={kpis?.companies ?? '—'} icon={Building2} trend="+2 this quarter" />
        <KPICard title="Market Opportunities" value={kpis?.investors ?? '—'} icon={Eye} trend="+12% this week" />
      </div>

      {/* Market Intelligence Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NationPulseWidget type="overview" />
        <HealthcareMarketWidget />
      </div>

      {/* Portfolio Overview - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card-glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg">
              <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Portfolio Companies</h3>
          </div>
          <div className="space-y-2">
            {portfolioCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between p-2 card-glass rounded-lg hover:shadow-md transition-all">
                <div className="min-w-0 flex-1">
                  <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate">{company.name}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{company.stage} • {company.investment}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium text-sm">{company.growth}</span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{company.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg">
              <Search className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Deal Flow</h3>
          </div>
          <div className="space-y-2">
            {dealFlow.map((deal, index) => (
              <div key={index} className="flex items-center justify-between p-2 card-glass rounded-lg hover:shadow-md transition-all">
                <div className="min-w-0 flex-1">
                  <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate">{deal.company}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{deal.stage} • {deal.sector}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">{deal.amount}</span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{deal.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map Section - Compact */}
      <div className="card-glass rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Investment Opportunities Map</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore investment opportunities across Africa
            </p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setMapDataType('value')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'value'
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Deal Value
            </button>
            <button
              onClick={() => setMapDataType('count')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'count'
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Deal Count
            </button>
          </div>
        </div>
        <div className="h-96">
          <InteractiveMap 
            title="" 
            dataType={mapDataType} 
            height={384}
          />
        </div>
      </div>

      {/* Market Insights - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {marketInsights.map((insight, index) => (
          <div key={index} className="card-glass p-3 rounded-lg text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 dark:from-cyan-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-1">
                {insight.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-rose-500 rotate-180" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{insight.metric}</p>
              <p className="text-xl font-medium text-slate-700 dark:text-slate-200">{insight.value}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{insight.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Market Opportunity Charts - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>
    </div>
  );
};

export default InvestorDashboard;
