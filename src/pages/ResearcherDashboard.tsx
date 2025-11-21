import React, { useEffect, useState } from 'react';
import { Microscope, FileText, Calendar, Users, TrendingUp, Globe, Award, Activity } from 'lucide-react';
import NationPulseWidget from '../components/NationPulseWidget';
import HealthcareMarketWidget from '../components/HealthcareMarketWidget';
import InteractiveMap from '../components/InteractiveMap';
import KPICard from '../components/KPICard';
import { fetchDashboard } from '../services/ai';

const ResearcherDashboard = () => {
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

  const researchProjects = [
    { title: 'AI-based Malaria Detection', status: 'Active', funding: '$150K', duration: '18 months', collaborators: 3 },
    { title: 'Telemedicine in Rural Areas', status: 'Planning', funding: '$200K', duration: '24 months', collaborators: 5 },
    { title: 'Digital Health Interventions', status: 'Completed', funding: '$100K', duration: '12 months', collaborators: 2 }
  ];

  const publications = [
    { title: 'AI-based malaria screening in rural clinics', journal: 'MedAI 2024', year: '2024', citations: 12 },
    { title: 'Telemedicine adoption in sub-Saharan Africa', journal: 'Health Informatics Journal', year: '2023', citations: 8 },
    { title: 'Digital health solutions for resource-limited settings', journal: 'Global Health Innovation', year: '2023', citations: 15 }
  ];

  const collaborations = [
    { institution: 'University of Lagos', type: 'Research Partnership', status: 'Active', projects: 2 },
    { institution: 'African Health Research Institute', type: 'Data Sharing', status: 'Active', projects: 1 },
    { institution: 'WHO Regional Office', type: 'Policy Research', status: 'Planning', projects: 1 }
  ];

  return (
    <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Active Projects" value="3" icon={Microscope} trend="+1 this month" />
        <KPICard title="Publications" value="12" icon={FileText} trend="+2 this year" />
        <KPICard title="Citations" value="156" icon={TrendingUp} trend="+23 this quarter" />
        <KPICard title="Collaborations" value="8" icon={Users} trend="+1 this month" />
      </div>

      {/* Research Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Microscope className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Active Research Projects</h3>
          </div>
          <div className="space-y-3">
            {researchProjects.map((project, index) => (
              <div key={index} className="p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[var(--color-text-primary)] font-medium">{project.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'Active' ? 'bg-green-100 text-green-800' :
                    project.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-[var(--color-text-secondary)]">
                  <div>Funding: {project.funding}</div>
                  <div>Duration: {project.duration}</div>
                  <div>Collaborators: {project.collaborators}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-[var(--color-primary-teal)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Publications</h3>
          </div>
          <div className="space-y-3">
            {publications.map((pub, index) => (
              <div key={index} className="p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                <h4 className="text-[var(--color-text-primary)] font-medium text-sm mb-1">{pub.title}</h4>
                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>{pub.journal} • {pub.year}</span>
                  <span className="text-[var(--color-primary-teal)]">{pub.citations} citations</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collaborations */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Research Collaborations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collaborations.map((collab, index) => (
            <div key={index} className="p-4 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
              <h4 className="text-[var(--color-text-primary)] font-medium mb-2">{collab.institution}</h4>
              <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                <div>Type: {collab.type}</div>
                <div>Status: {collab.status}</div>
                <div>Projects: {collab.projects}</div>
              </div>
            </div>
          ))}
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
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Research Activity Map</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Explore research activity and clinical trials across Africa
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
              Research Value
            </button>
            <button
              onClick={() => setMapDataType('count')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'count'
                  ? 'bg-[var(--color-primary-teal)] text-[var(--color-background-surface)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)]'
              }`}
            >
              Trial Count
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

      {/* Research Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Award className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Total Funding</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">$450K</p>
          <p className="text-xs text-green-500 mt-1">+$50K this year</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Activity className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Research Impact</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">8.2</p>
          <p className="text-xs text-green-500 mt-1">+0.3 this quarter</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Globe className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Countries</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">5</p>
          <p className="text-xs text-green-500 mt-1">+1 this year</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Calendar className="h-5 w-5 mx-auto text-[var(--color-primary-teal)] mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Conferences</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">3</p>
          <p className="text-xs text-green-500 mt-1">This year</p>
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

export default ResearcherDashboard;
