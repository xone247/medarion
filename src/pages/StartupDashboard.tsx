import React, { useEffect, useState } from 'react';
import { Eye, Download, User, TrendingUp, MessageSquare, Clock } from 'lucide-react';
import NationPulseWidget from '../components/NationPulseWidget';
import HealthcareMarketWidget from '../components/HealthcareMarketWidget';
import InteractiveMap from '../components/InteractiveMap';
import KPICard from '../components/KPICard';
import { fetchDashboard } from '../services/ai';

const StartupDashboard = () => {
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

  const matchedInvestors = [
    { name: 'Pan-African Health Ventures', match: 95, focus: 'Telemedicine', stage: 'Series A' },
    { name: 'Bio-Advance Fund', match: 88, focus: 'AI Diagnostics', stage: 'Seed' },
    { name: 'Nile Ventures', match: 85, focus: 'Health Tech', stage: 'Series A' },
    { name: 'Savannah Capital', match: 82, focus: 'Digital Health', stage: 'Seed' }
  ];

  const crmData: Record<string, Array<{ name: string; type: string; focus: string }>> = {
    'Not Contacted': [
      { name: 'Life Science Partners', type: 'Series A', focus: 'Biotech' },
      { name: 'Launch Africa', type: 'Seed', focus: 'Health Tech' }
    ],
    'Contacted': [
      { name: 'TLcom Capital', type: 'Series A', focus: 'AI Health' },
      { name: 'Kepple Africa Ventures', type: 'Seed', focus: 'Digital Health' }
    ],
    'Meeting Set': [
      { name: 'Global Ventures', type: 'Series A', focus: 'Health Tech' }
    ]
  };

  return (
    <div className="w-full space-y-3">

      {/* Page Header - Compact */}
      <div className="mb-2">
        <h1 className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">Startup Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your fundraising and investor connections</p>
      </div>

      {/* KPI Row - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <KPICard title="Deals & Grants" value={kpis?.deals_and_grants ?? '—'} icon={TrendingUp} trend="+12% this week" />
        <KPICard title="Companies" value={kpis?.companies ?? '—'} icon={User} trend="+8% this week" />
        <KPICard title="Investors" value={kpis?.investors ?? '—'} icon={Eye} trend="+5% this week" />
        <KPICard title="Total Value ($)" value={kpis?.total_value_usd ?? 0} icon={Download} trend="+18% this week" />
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
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">African Healthcare Investment Landscape</h3>
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

      {/* Market Opportunity Charts - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>

      {/* AI Investor Matches - Compact */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg">
            <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">AI Investor Matches</h3>
          <span className="bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">NEW</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {matchedInvestors.map((investor, index) => (
            <div key={index} className="card-glass p-3 rounded-lg hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 dark:from-cyan-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex justify-between items-start mb-2">
                <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate">{investor.name}</h4>
                <span className="bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2">
                  {investor.match}% Match
                </span>
              </div>
              <div className="space-y-1">
                <span className="inline-block bg-cyan-50 dark:bg-cyan-950/30 text-slate-600 dark:text-slate-400 text-xs px-1.5 py-0.5 rounded border border-cyan-100 dark:border-cyan-900/50">
                  Focus: {investor.focus}
                </span>
                <span className="inline-block bg-indigo-50 dark:bg-indigo-950/30 text-slate-600 dark:text-slate-400 text-xs px-1.5 py-0.5 rounded ml-2 border border-indigo-100 dark:border-indigo-900/50">
                  Stage: {investor.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fundraising CRM - Compact */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg">
            <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Fundraising CRM</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(crmData).map(([stage, investors]) => (
            <div key={stage} className="card-glass p-3 rounded-lg">
              <h4 className="text-slate-700 dark:text-slate-200 font-medium mb-2 text-center border-b border-slate-200 dark:border-slate-700 pb-2 text-sm">
                {stage}
              </h4>
              <div className="space-y-1.5">
                {investors.map((investor, index) => (
                  <div key={index} className="card-glass p-2 rounded-lg cursor-pointer hover:shadow-md transition-all">
                    <p className="text-slate-700 dark:text-slate-200 text-xs font-medium truncate">{investor.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{investor.type} • {investor.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications - Compact */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-500/30 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Recent Activity</h3>
        </div>
        <div className="space-y-2">
          {activity.map((notification, index) => (
            <div key={index} className="card-glass p-2 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 dark:text-slate-200 text-xs">{notification.message}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{new Date(notification.time).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartupDashboard;