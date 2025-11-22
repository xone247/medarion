import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Building2, Users, TrendingUp, Bot } from 'lucide-react';
import KPICard from '../components/KPICard';
import MonthlyDealflowChart from '../components/MonthlyDealflowChart';
import InteractiveMap from '../components/InteractiveMap';
import TopDealsWidget from '../components/TopDealsWidget';
import MostActiveInvestorsWidget from '../components/MostActiveInvestorsWidget';
import DealsBySectorChart from '../components/DealsBySectorChart';
import DealsByStageChart from '../components/DealsByStageChart';
import NationPulseWidget from '../components/NationPulseWidget';
import HealthcareMarketWidget from '../components/HealthcareMarketWidget';
import RegionalTrendsChart from '../components/RegionalTrendsChart';
import AISidePanel from '../components/ai/AISidePanel';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import SectorTreemap from '../components/SectorTreemap';
import VCInvestmentOverTimeChart from '../components/VCInvestmentOverTimeChart';

const InvestorOverview = () => {
  const [mapDataType, setMapDataType] = useState('value');
  const [aiOpen, setAiOpen] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsResponse, grantsResponse, investorsResponse] = await Promise.all([
          dataService.getDeals({ limit: 200 }).catch(() => ({ success: false, data: [] })),
          dataService.getGrants({ limit: 200 }).catch(() => ({ success: false, data: [] })),
          dataService.getInvestors({ limit: 200 }).catch(() => ({ success: false, data: [] })),
        ]);
        
        if (dealsResponse.success) {
          const d = dealsResponse.data.map((deal: any) => ({
            id: deal.id,
            company_name: deal.company_name || 'Unknown',
            investors: deal.participants ? (typeof deal.participants === 'string' ? JSON.parse(deal.participants) : deal.participants) : (deal.lead_investor ? [deal.lead_investor] : []),
            value_usd: parseFloat(deal.amount || 0),
            stage: deal.deal_type || 'Unknown',
            country: deal.country || 'Unknown',
            date: deal.deal_date || deal.created_at,
            sector: deal.sector || deal.industry || 'Unknown',
          }));
          setDeals(d);
        }
        
        if (grantsResponse.success) {
          const g = grantsResponse.data.map((grant: any) => ({
            id: grant.id,
            organizationName: grant.title || grant.funding_agency || 'Unknown',
            value: parseFloat(grant.amount || 0),
            type: grant.grant_type || 'Research',
            sector: grant.sector || 'Healthcare',
            country: grant.country || 'Unknown',
            date: grant.award_date || grant.application_deadline || grant.created_at,
            funders: grant.funders ? (typeof grant.funders === 'string' ? JSON.parse(grant.funders) : grant.funders) : [grant.funding_agency || 'Unknown'],
          }));
          setGrants(g);
        }
        
        if (investorsResponse.success) {
          const i = investorsResponse.data.map((inv: any) => ({
            id: inv.id,
            name: inv.name,
            totalInvested: parseFloat(inv.recent_investments?.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount) || 0), 0) || inv.assets_under_management || 0),
            dealCount: inv.recent_investments?.length || inv.total_investments || 0,
            portfolioCompanies: inv.portfolio_companies || [],
            focusSectors: inv.focus_sectors || [],
            countries: inv.countries || [],
            contact_email: inv.contact_email,
            type: inv.type || 'VC',
            description: inv.description,
            website: inv.website,
          }));
          setInvestors(i);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const kpis = useMemo(() => {
    const totalValue = deals.reduce((sum, d) => sum + (d.value_usd || 0), 0);
    const companiesCount = new Set(deals.map(d => d.company_name)).size;
    return {
      deals_and_grants: deals.length + grants.length,
      companies: companiesCount,
      investors: investors.length,
      total_value_usd: totalValue,
    };
  }, [deals, grants, investors]);

  const notableInvestors = useMemo(() => (
    investors.slice(0, 12).map((inv: any) => ({ name: inv.name }))
  ), [investors]);

  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  return (
    <div className="p-4 md:p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-divider-gray)] pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-1">Investment Overview</h1>
          <p className="text-[var(--color-text-secondary)]">Comprehensive view of African healthcare investments and market intelligence</p>
        </div>
        {canAI && (
          <button onClick={() => setAiOpen(true)} className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-[var(--color-primary-teal)] text-[var(--color-background-surface)] border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
            <Bot className="h-4 w-4" />
            <span className="text-sm">AI insights</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm font-medium">Deals & Grants</p>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1">{kpis.deals_and_grants || 0}</p>
              <p className="text-[var(--color-primary-teal)] text-sm mt-1">+12% vs last quarter</p>
            </div>
            <div className="bg-[var(--color-primary-teal)] p-2 md:p-3 rounded-lg shadow-sm border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-[var(--color-background-surface)]" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm font-medium">Companies</p>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1">{kpis.companies || 0}</p>
              <p className="text-[var(--color-primary-teal)] text-sm mt-1">+8% vs last quarter</p>
            </div>
            <div className="bg-[var(--color-primary-teal)] p-2 md:p-3 rounded-lg shadow-sm border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-[var(--color-background-surface)]" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm font-medium">Investors</p>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1">{kpis.investors || 0}</p>
              <p className="text-[var(--color-primary-teal)] text-sm mt-1">+5% vs last quarter</p>
            </div>
            <div className="bg-[var(--color-primary-teal)] p-2 md:p-3 rounded-lg shadow-sm border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-[var(--color-background-surface)]" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm font-medium">Total Value (USD)</p>
              <p className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                {kpis.total_value_usd ? `$${(kpis.total_value_usd / 1000000).toFixed(1)}M` : '$0M'}
              </p>
              <p className="text-[var(--color-primary-teal)] text-sm mt-1">+18% vs last quarter</p>
            </div>
            <div className="bg-[var(--color-primary-teal)] p-2 md:p-3 rounded-lg shadow-sm border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-[var(--color-background-surface)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Notable investors logos removed */}

      {/* Charts Section with Interactive Map */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="border border-[var(--color-divider-gray)] rounded-lg">
          <MonthlyDealflowChart />
        </div>
        <div className="border border-[var(--color-divider-gray)] rounded-lg">
          <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--color-divider-gray)] flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)]">African Investment Map</h3>
                <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
                  Interactive visualization of deal activity across Africa
                </p>
              </div>
              <div className="flex bg-[var(--color-background-default)] rounded-lg p-1 border border-[var(--color-divider-gray)]">
                <button
                  onClick={() => setMapDataType('value')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    mapDataType === 'value'
                      ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'
                  }`}
                >
                  Value
                </button>
                <button
                  onClick={() => setMapDataType('count')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    mapDataType === 'count'
                      ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'
                  }`}
                >
                  Count
                </button>
              </div>
            </div>
            <div className="h-64 md:h-80">
              <InteractiveMap 
                title="" 
                dataType={mapDataType as any} 
                height={320}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Nation Pulse Charts Section */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="economic-overview" />
      </div>

      {/* Regional Trends */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <RegionalTrendsChart />
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="border border-[var(--color-divider-gray)] rounded-lg">
          <TopDealsWidget />
        </div>
        <div className="border border-[var(--color-divider-gray)] rounded-lg">
          <MostActiveInvestorsWidget />
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="border border-[var(--color-divider-gray)] rounded-lg">
          <DealsByStageChart />
        </div>
        <div className="border border-[var(--color-divider-gray)] rounded-lg">
          <DealsBySectorChart />
        </div>
      </div>

      {/* Dealroom-style Charts */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <VCInvestmentOverTimeChart />
        <SectorTreemap />
      </div>

      <AISidePanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        context={{ country: 'Kenya', sector: 'Health Tech', stage: 'Seed' }}
      />
    </div>
  );
};

export default InvestorOverview;