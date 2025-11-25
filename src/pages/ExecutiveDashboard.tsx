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
    <div className="w-full space-y-3">

      {/* Page Header - Compact */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Strategic overview and market insights</p>
      </div>

      {/* KPI Row - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <KPICard title="Market Cap" value={kpis?.total_value_usd ? `$${(kpis.total_value_usd / 1000000).toFixed(1)}B` : '—'} icon={DollarSign} trend="+8% this quarter" />
        <KPICard title="Strategic Initiatives" value="12" icon={Target} trend="+2 this month" />
        <KPICard title="Active Partnerships" value="8" icon={Users} trend="+1 this quarter" />
        <KPICard title="Market Opportunities" value="53" icon={Globe} trend="+5 this week" />
      </div>

      {/* Strategic Initiatives - Compact */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-500/30 rounded-lg">
            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Strategic Initiatives</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {strategicInitiatives.map((initiative, index) => (
            <div key={index} className="p-3 card-glass rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate">{initiative.title}</h4>
                <span className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ml-2 ${
                  initiative.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300' :
                  initiative.status === 'Planning' ? 'bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300' :
                  'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-300'
                }`}>
                  {initiative.status}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Budget: {initiative.budget}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Owner: {initiative.owner}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${initiative.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {initiative.progress}% Complete
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Analysis - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card-glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg">
              <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Regional Market Analysis</h3>
          </div>
          <div className="space-y-2">
            {marketAnalysis.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-2 card-glass rounded-lg hover:shadow-md transition-all">
                <div className="min-w-0 flex-1">
                  <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm">{region.region}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{region.opportunities} opportunities</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">{region.marketSize}</span>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{region.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Strategic Partnerships</h3>
          </div>
          <div className="space-y-2">
            {partnerships.map((partnership, index) => (
              <div key={index} className="p-2 card-glass rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate">{partnership.partner}</h4>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ml-2 ${
                    partnership.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300' :
                    partnership.status === 'Negotiating' ? 'bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300' :
                    'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-300'
                  }`}>
                    {partnership.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {partnership.type} • {partnership.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Intelligence Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NationPulseWidget type="overview" />
        <HealthcareMarketWidget />
      </div>

      {/* Interactive Map Section - Compact */}
      <div className="card-glass rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Strategic Market Map</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore market opportunities across Africa
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
              Market Value
            </button>
            <button
              onClick={() => setMapDataType('count')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'count'
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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

      {/* Executive Metrics - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="card-glass p-3 rounded-lg text-center group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 dark:from-cyan-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg w-fit mx-auto mb-1">
              <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Market Share</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">12.5%</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">+1.2% this quarter</p>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg text-center group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 dark:from-emerald-500/10 dark:to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg w-fit mx-auto mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Revenue Growth</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">18.3%</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">+3.1% this quarter</p>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg text-center group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg w-fit mx-auto mb-1">
              <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Countries</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">8</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">+1 this year</p>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg text-center group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-500/30 rounded-lg w-fit mx-auto mb-1">
              <Briefcase className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Strategic Deals</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">5</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">+2 this quarter</p>
          </div>
        </div>
      </div>

      {/* Market Opportunity Charts - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
