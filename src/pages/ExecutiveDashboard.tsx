import React, { useEffect, useState } from 'react';
import { Briefcase, Building2, TrendingUp, Users, Globe, Target, BarChart3, DollarSign } from 'lucide-react';
import NationPulseWidget from '../components/NationPulseWidget';
import HealthcareMarketWidget from '../components/HealthcareMarketWidget';
import InteractiveMap from '../components/InteractiveMap';
import KPICard from '../components/KPICard';
import { fetchDashboard } from '../services/ai';

const ExecutiveDashboard = () => {
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

  const strategicInitiatives = [
    { title: 'Digital Transformation Program', status: 'Active', budget: '$2.5M', progress: 65, owner: 'Innovation Team' },
    { title: 'Market Expansion Strategy', status: 'Planning', budget: '$1.8M', progress: 25, owner: 'Strategy Team' },
    { title: 'Partnership Development', status: 'Active', budget: '$800K', progress: 80, owner: 'Business Development' }
  ];

  const marketAnalysis = [
    { region: 'West Africa', marketSize: '$2.1B', growth: '+12%', opportunities: 15 },
    { region: 'East Africa', marketSize: '$1.8B', growth: '+8%', opportunities: 12 },
    { region: 'Southern Africa', marketSize: '$1.5B', growth: '+15%', opportunities: 18 },
    { region: 'North Africa', marketSize: '$1.2B', growth: '+6%', opportunities: 8 }
  ];

  const partnerships = [
    { partner: 'African Health Consortium', type: 'Strategic Alliance', status: 'Active', value: '$5M' },
    { partner: 'Global Health Initiative', type: 'Research Partnership', status: 'Negotiating', value: '$2M' },
    { partner: 'Tech Innovation Hub', type: 'Technology Transfer', status: 'Active', value: '$1.5M' }
  ];

  return (
    <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Market Cap" value={kpis?.total_value_usd ? `$${(kpis.total_value_usd / 1000000).toFixed(1)}B` : '—'} icon={DollarSign} trend="+8% this quarter" />
        <KPICard title="Strategic Initiatives" value="12" icon={Target} trend="+2 this month" />
        <KPICard title="Active Partnerships" value="8" icon={Users} trend="+1 this quarter" />
        <KPICard title="Market Opportunities" value="53" icon={Globe} trend="+5 this week" />
      </div>

      {/* Strategic Initiatives */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Strategic Initiatives</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategicInitiatives.map((initiative, index) => (
            <div key={index} className="p-4 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[var(--color-text-primary)] font-medium text-sm">{initiative.title}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  initiative.status === 'Active' ? 'bg-green-100 text-green-800' :
                  initiative.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {initiative.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Budget: {initiative.budget}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Owner: {initiative.owner}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[var(--color-primary-teal)] h-2 rounded-full" 
                    style={{ width: `${initiative.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {initiative.progress}% Complete
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regional Market Analysis</h3>
          </div>
          <div className="space-y-3">
            {marketAnalysis.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                <div>
                  <h4 className="text-[var(--color-text-primary)] font-medium">{region.region}</h4>
                  <p className="text-[var(--color-text-secondary)] text-sm">{region.opportunities} opportunities</p>
                </div>
                <div className="text-right">
                  <span className="text-[var(--color-primary-teal)] font-semibold">{region.marketSize}</span>
                  <p className="text-[var(--color-text-secondary)] text-xs">{region.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Strategic Partnerships</h3>
          </div>
          <div className="space-y-3">
            {partnerships.map((partnership, index) => (
              <div key={index} className="p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[var(--color-text-primary)] font-medium text-sm">{partnership.partner}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    partnership.status === 'Active' ? 'bg-green-100 text-green-800' :
                    partnership.status === 'Negotiating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {partnership.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {partnership.type} • {partnership.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NationPulseWidget type="overview" />
        <HealthcareMarketWidget />
      </div>

      {/* Interactive Map Section */}
      <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-divider-gray)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Strategic Market Map</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Explore market opportunities and competitive landscape across Africa
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
              Market Value
            </button>
            <button
              onClick={() => setMapDataType('count')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'count'
                  ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'
              }`}
            >
              Opportunity Count
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

      {/* Executive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Building2 className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Market Share</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">12.5%</p>
          <p className="text-xs text-green-500 mt-1">+1.2% this quarter</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Revenue Growth</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">18.3%</p>
          <p className="text-xs text-green-500 mt-1">+3.1% this quarter</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Globe className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Countries</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">8</p>
          <p className="text-xs text-green-500 mt-1">+1 this year</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Briefcase className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Strategic Deals</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">5</p>
          <p className="text-xs text-green-500 mt-1">+2 this quarter</p>
        </div>
      </div>

      {/* Market Opportunity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
