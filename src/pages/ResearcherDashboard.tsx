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
    <div className="w-full space-y-3">

      {/* Page Header - Compact */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">Researcher Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your research projects and publications</p>
      </div>

      {/* KPI Row - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <KPICard title="Active Projects" value="3" icon={Microscope} trend="+1 this month" />
        <KPICard title="Publications" value="12" icon={FileText} trend="+2 this year" />
        <KPICard title="Citations" value="156" icon={TrendingUp} trend="+23 this quarter" />
        <KPICard title="Collaborations" value="8" icon={Users} trend="+1 this month" />
      </div>

      {/* Research Overview - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card-glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg">
              <Microscope className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Active Research Projects</h3>
          </div>
          <div className="space-y-2">
            {researchProjects.map((project, index) => (
              <div key={index} className="p-2 card-glass rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate">{project.title}</h4>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ml-2 ${
                    project.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300' :
                    project.status === 'Planning' ? 'bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300' :
                    'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-300'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div>Funding: {project.funding}</div>
                  <div>Duration: {project.duration}</div>
                  <div>Collaborators: {project.collaborators}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Recent Publications</h3>
          </div>
          <div className="space-y-2">
            {publications.map((pub, index) => (
              <div key={index} className="p-2 card-glass rounded-lg hover:shadow-md transition-all">
                <h4 className="text-slate-700 dark:text-slate-200 font-medium text-xs mb-1 truncate">{pub.title}</h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate">{pub.journal} • {pub.year}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex-shrink-0 ml-2">{pub.citations} citations</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collaborations */}
      <div className="card-glass p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Research Collaborations</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
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
      <div className="grid grid-cols-2 gap-6">
        <NationPulseWidget type="overview" />
        <HealthcareMarketWidget />
      </div>

      {/* Interactive Map Section */}
      <div className="card-glass overflow-hidden">
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
                  ? 'bg-slate-800 dark:bg-slate-700 text-white dark:text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)] dark:hover:bg-[var(--color-background-default)]'
              }`}
            >
              Research Value
            </button>
            <button
              onClick={() => setMapDataType('count')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                mapDataType === 'count'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white dark:text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)] dark:hover:bg-[var(--color-background-default)]'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="card-glass p-3 rounded-lg text-center">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg w-fit mx-auto mb-2">
            <Award className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Funding</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">$450K</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+$50K this year</p>
        </div>
        <div className="card-glass p-3 rounded-lg text-center">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg w-fit mx-auto mb-2">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Research Impact</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">8.2</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+0.3 this quarter</p>
        </div>
        <div className="card-glass p-3 rounded-lg text-center">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg w-fit mx-auto mb-2">
            <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Countries</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">5</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+1 this year</p>
        </div>
        <div className="card-glass p-3 rounded-lg text-center">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/30 rounded-lg w-fit mx-auto mb-2">
            <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Conferences</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">3</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">This year</p>
        </div>
      </div>

      {/* Market Opportunity Charts */}
      <div className="grid grid-cols-2 gap-6">
        <NationPulseWidget type="health-metrics" />
        <NationPulseWidget type="investment-opportunities" />
      </div>
    </div>
  );
};

export default ResearcherDashboard;
