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
    <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Deals & Grants" value={kpis?.deals_and_grants ?? '—'} icon={TrendingUp} trend="+12% this week" />
        <KPICard title="Companies" value={kpis?.companies ?? '—'} icon={User} trend="+8% this week" />
        <KPICard title="Investors" value={kpis?.investors ?? '—'} icon={Eye} trend="+5% this week" />
        <KPICard title="Total Value ($)" value={kpis?.total_value_usd ?? 0} icon={Download} trend="+18% this week" />
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
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">African Healthcare Investment Landscape</h3>
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

      {/* Market Opportunity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>

      {/* AI Investor Matches */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI Investor Matches</h3>
          <span className="bg-[var(--color-secondary-gold)] text-black text-xs px-2 py-1 rounded-full font-bold">NEW</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchedInvestors.map((investor, index) => (
            <div key={index} className="bg-[var(--color-background-default)] p-4 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-background-default),black_5%)] transition-colors cursor-pointer shadow-sm border border-[var(--color-divider-gray)]">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-[var(--color-text-primary)] font-medium">{investor.name}</h4>
                <span className="bg-[var(--color-primary-teal)] text-[var(--color-background-surface)] text-xs px-2 py-1 rounded-full border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  {investor.match}% Match
                </span>
              </div>
              <div className="space-y-1">
                <span className="inline-block bg-[var(--color-background-default)] text-[var(--color-text-secondary)] text-xs px-2 py-1 rounded border border-[var(--color-divider-gray)]">
                  Focus: {investor.focus}
                </span>
                <span className="inline-block bg-[var(--color-background-default)] text-[var(--color-text-secondary)] text-xs px-2 py-1 rounded ml-2 border border-[var(--color-divider-gray)]">
                  Stage: {investor.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fundraising CRM */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Fundraising CRM</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(crmData).map(([stage, investors]) => (
            <div key={stage} className="bg-[var(--color-background-default)] p-4 rounded-lg shadow-sm border border-[var(--color-divider-gray)]">
              <h4 className="text-[var(--color-text-primary)] font-medium mb-3 text-center border-b border-[var(--color-divider-gray)] pb-2">
                {stage}
              </h4>
              <div className="space-y-2">
                {investors.map((investor, index) => (
                  <div key={index} className="bg-[var(--color-background-surface)] p-3 rounded-lg cursor-pointer hover:bg-[var(--color-background-default)] transition-colors shadow-sm border border-[var(--color-divider-gray)]">
                    <p className="text-[var(--color-text-primary)] text-sm font-medium">{investor.name}</p>
                    <p className="text-[var(--color-text-secondary)] text-xs">{investor.type} • {investor.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {activity.map((notification, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-[var(--color-background-default)] rounded-lg shadow-sm border border-[var(--color-divider-gray)]">
              <div className="w-2 h-2 bg-[var(--color-primary-teal)] rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-[var(--color-text-primary)] text-sm">{notification.message}</p>
                <p className="text-[var(--color-text-secondary)] text-xs mt-1">{new Date(notification.time).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StartupDashboard;