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
    <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Portfolio Value" value={kpis?.total_value_usd ? `$${(kpis.total_value_usd / 1000000).toFixed(1)}M` : '—'} icon={DollarSign} trend="+18% this quarter" />
        <KPICard title="Active Deals" value={kpis?.deals_and_grants ?? '—'} icon={TrendingUp} trend="+5 this month" />
        <KPICard title="Portfolio Companies" value={kpis?.companies ?? '—'} icon={Building2} trend="+2 this quarter" />
        <KPICard title="Market Opportunities" value={kpis?.investors ?? '—'} icon={Eye} trend="+12% this week" />
      </div>

      {/* Market Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NationPulseWidget type="overview" />
        <HealthcareMarketWidget />
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Portfolio Companies</h3>
          </div>
          <div className="space-y-3">
            {portfolioCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                <div>
                  <h4 className="text-[var(--color-text-primary)] font-medium">{company.name}</h4>
                  <p className="text-[var(--color-text-secondary)] text-sm">{company.stage} • {company.investment}</p>
                </div>
                <div className="text-right">
                  <span className="text-[var(--color-primary-teal)] font-semibold">{company.growth}</span>
                  <p className="text-[var(--color-text-secondary)] text-xs">{company.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Deal Flow</h3>
          </div>
          <div className="space-y-3">
            {dealFlow.map((deal, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                <div>
                  <h4 className="text-[var(--color-text-primary)] font-medium">{deal.company}</h4>
                  <p className="text-[var(--color-text-secondary)] text-sm">{deal.stage} • {deal.sector}</p>
                </div>
                <div className="text-right">
                  <span className="text-[var(--color-primary-teal)] font-semibold">{deal.amount}</span>
                  <p className="text-[var(--color-text-secondary)] text-xs">{deal.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-divider-gray)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Investment Opportunities Map</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Explore investment opportunities and market activity across Africa
            </p>
          </div>
          <div className="flex bg-[var(--color-background-default)] rounded-lg p-1 border border-[var(--color-divider-gray)]">
            <button
              onClick={() => setMapDataType('value')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'value'
                  ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'
              }`}
            >
              Deal Value
            </button>
            <button
              onClick={() => setMapDataType('count')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'count'
                  ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'
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

      {/* Market Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {marketInsights.map((insight, index) => (
          <div key={index} className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
            <div className="flex items-center justify-center mb-2">
              {insight.trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-red-500 rotate-180" />
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">{insight.metric}</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{insight.value}</p>
            <p className="text-xs text-green-500 mt-1">{insight.change}</p>
          </div>
        ))}
      </div>

      {/* Market Opportunity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>
    </div>
  );
};

export default InvestorDashboard;
