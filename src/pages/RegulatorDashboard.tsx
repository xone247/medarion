import React, { useEffect, useState } from 'react';
import { Shield, Building2, TrendingUp, Users, Globe, Target, BarChart3, DollarSign, FileText, CheckCircle } from 'lucide-react';
import NationPulseWidget from '../components/NationPulseWidget';
import HealthcareMarketWidget from '../components/HealthcareMarketWidget';
import InteractiveMap from '../components/InteractiveMap';
import KPICard from '../components/KPICard';
import { fetchDashboard } from '../services/ai';

const RegulatorDashboard = () => {
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

  const regulatoryInitiatives = [
    { title: 'Digital Health Policy Framework', status: 'Active', budget: '$1.2M', progress: 75, owner: 'Policy Team' },
    { title: 'Clinical Trial Oversight Program', status: 'Active', budget: '$800K', progress: 60, owner: 'Regulatory Affairs' },
    { title: 'Healthcare Data Protection Standards', status: 'Planning', budget: '$600K', progress: 30, owner: 'Compliance Team' }
  ];

  const complianceMetrics = [
    { region: 'West Africa', complianceRate: '87%', inspections: 45, violations: 3 },
    { region: 'East Africa', complianceRate: '92%', inspections: 38, violations: 2 },
    { region: 'Southern Africa', complianceRate: '95%', inspections: 42, violations: 1 },
    { region: 'North Africa', complianceRate: '89%', inspections: 35, violations: 4 }
  ];

  const regulatoryUpdates = [
    {
      title: 'New Telemedicine Guidelines',
      status: 'Published',
      date: '2024-01-15',
      impact: 'High',
      description: 'Updated guidelines for telemedicine services across Africa'
    },
    {
      title: 'Clinical Trial Protocol Standards',
      status: 'Draft',
      date: '2024-02-01',
      impact: 'Medium',
      description: 'New standards for clinical trial protocols'
    },
    {
      title: 'Data Privacy Regulations',
      status: 'Review',
      date: '2024-01-20',
      impact: 'High',
      description: 'Updated data privacy requirements for healthcare providers'
    }
  ];

  return (
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Regulator Dashboard</h1>
                <p className="mt-1 text-[var(--color-text-secondary)]">Regulatory oversight and compliance monitoring</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-[var(--color-primary-teal)]" />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Regulator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Compliance Rate"
            value="91%"
            icon={CheckCircle}
            trend="+2% this quarter"
            color="green"
          />
          <KPICard
            title="Active Inspections"
            value="160"
            icon={FileText}
            trend="+12 this month"
            color="blue"
          />
          <KPICard
            title="Policy Updates"
            value="8"
            icon={Shield}
            trend="+3 this quarter"
            color="purple"
          />
          <KPICard
            title="Regulatory Reviews"
            value="24"
            icon={Target}
            trend="+5 this month"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Regulatory Initiatives */}
          <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-6 w-6 text-[var(--color-primary-teal)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regulatory Initiatives</h3>
            </div>
            <div className="space-y-4">
              {regulatoryInitiatives.map((initiative, index) => (
                <div key={index} className="border border-[var(--color-divider-gray)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-[var(--color-text-primary)]">{initiative.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      initiative.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {initiative.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                      <span>Budget: {initiative.budget}</span>
                      <span>Owner: {initiative.owner}</span>
                    </div>
                    <div className="w-full bg-[var(--color-background-default)] rounded-full h-2">
                      <div 
                        className="bg-[var(--color-primary-teal)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${initiative.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {initiative.progress}% Complete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] p-6">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-6 w-6 text-[var(--color-primary-teal)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regional Compliance</h3>
            </div>
            <div className="space-y-4">
              {complianceMetrics.map((metric, index) => (
                <div key={index} className="border border-[var(--color-divider-gray)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-[var(--color-text-primary)]">{metric.region}</h4>
                    <span className="text-lg font-semibold text-[var(--color-primary-teal)]">{metric.complianceRate}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                    <span>Inspections: {metric.inspections}</span>
                    <span>Violations: {metric.violations}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regulatory Updates */}
        <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="h-6 w-6 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Regulatory Updates</h3>
          </div>
          <div className="space-y-4">
            {regulatoryUpdates.map((update, index) => (
              <div key={index} className="border border-[var(--color-divider-gray)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[var(--color-text-primary)]">{update.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      update.status === 'Published' 
                        ? 'bg-green-100 text-green-800'
                        : update.status === 'Draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {update.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      update.impact === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {update.impact} Impact
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">{update.description}</p>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Date: {update.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map and Nation Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="h-6 w-6 text-[var(--color-primary-teal)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regulatory Coverage Map</h3>
            </div>
            <div className="mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setMapDataType('value')}
                  className={`px-3 py-1 text-sm rounded ${
                    mapDataType === 'value'
                      ? 'bg-[var(--color-primary-teal)] text-white'
                      : 'bg-[var(--color-background-default)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Compliance Rate
                </button>
                <button
                  onClick={() => setMapDataType('count')}
                  className={`px-3 py-1 text-sm rounded ${
                    mapDataType === 'count'
                      ? 'bg-[var(--color-primary-teal)] text-white'
                      : 'bg-[var(--color-background-default)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Inspection Count
                </button>
              </div>
            </div>
            <InteractiveMap height={400} />
          </div>

          <div className="space-y-6">
            <NationPulseWidget />
            <HealthcareMarketWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatorDashboard;
