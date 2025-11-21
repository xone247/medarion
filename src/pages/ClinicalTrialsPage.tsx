import React, { useEffect, useMemo, useState } from 'react';
import { Microscope, Search, Filter, Calendar, MapPin, Building2, Sparkles, Globe, Bot, FileDown } from 'lucide-react';
import { askMedarion } from '../services/ai';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const ClinicalTrialsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showTrialDetails, setShowTrialDetails] = useState<any>(null);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const exportJSON = () => {
    try { const data = { filters: { searchTerm, selectedPhase, selectedStatus }, trials: filteredTrials, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='clinical_trials.json'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };
  const copyJSON = async () => {
    try {
      const data = { filters: { searchTerm, selectedPhase, selectedStatus }, trials: filteredTrials, exportedAt: new Date().toISOString() };
      const text = JSON.stringify(data, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      alert('Copied clinical trials JSON to clipboard');
    } catch {}
  };

  useEffect(() => {
    const fetchTrialsData = async () => {
      setLoading(true);
      try {
        console.log('[ClinicalTrialsPage] Fetching trials data...');
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/clinical-trials', { limit: '200' });
        console.log('[ClinicalTrialsPage] Response:', response);
        if (response && response.success && response.data && Array.isArray(response.data)) {
          console.log('[ClinicalTrialsPage] Processing', response.data.length, 'trials');
          // Transform API data to match expected format
          const transformed = response.data.map((trial: any) => ({
            id: trial.id,
            title: trial.title || 'Clinical Trial',
            phase: trial.phase || 'Unknown',
            status: trial.status || 'Unknown',
            indication: trial.medical_condition || trial.title || 'Not specified',
            medical_condition: trial.medical_condition || trial.title || 'Not specified',
            intervention: trial.intervention || 'Not specified',
            sponsor: trial.sponsor || 'Unknown',
            location: trial.location || 'Unknown',
            start_date: trial.start_date || trial.created_at,
            end_date: trial.end_date,
            nct_number: trial.nct_number,
            trial_id: trial.nct_number || `CT-${trial.id}`,
            companyName: trial.sponsor || trial.company_name || 'Unknown',
            sector: trial.sector || 'Healthcare',
            country: trial.country || 'Unknown',
          }));
          console.log('[ClinicalTrialsPage] Transformed', transformed.length, 'trials');
          setTrials(transformed);
        } else {
          console.warn('[ClinicalTrialsPage] Invalid response structure:', response);
          setTrials([]);
        }
      } catch (error) {
        console.error('[ClinicalTrialsPage] Error fetching clinical trials data:', error);
        setTrials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrialsData();
  }, []);

  const phases = useMemo(() => ['All', ...new Set(trials.map(trial => trial.phase))], [trials]);
  const statuses = useMemo(() => ['All', ...new Set(trials.map(trial => trial.status))], [trials]);

  const enhancedTrialData = trials;

  const countryStats = useMemo(() => enhancedTrialData.reduce((acc: any, trial: any) => {
    if (!acc[trial.country]) {
      acc[trial.country] = { count: 0, active: 0 };
    }
    acc[trial.country].count += 1;
    if (trial.status === 'Active' || trial.status === 'Recruiting') {
      acc[trial.country].active += 1;
    }
    return acc;
  }, {}), [enhancedTrialData]);

  const topCountries = useMemo(() => Object.entries(countryStats)
    .map(([country, stats]) => ({ country, ...(stats as any) }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 6), [countryStats]);

  const filteredTrials = useMemo(() => enhancedTrialData.filter((trial: any) => {
    const indication = (trial.indication || trial.medical_condition || '').toLowerCase();
    const companyName = (trial.companyName || '').toLowerCase();
    const trialId = (trial.trial_id || trial.nct_number || trial.id?.toString() || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || 
                         indication.includes(searchLower) ||
                         companyName.includes(searchLower) ||
                         trialId.includes(searchLower) ||
                         (trial.title || '').toLowerCase().includes(searchLower);
    const matchesPhase = selectedPhase === 'All' || trial.phase === selectedPhase;
    const matchesStatus = selectedStatus === 'All' || trial.status === selectedStatus;
    return matchesSearch && matchesPhase && matchesStatus;
  }), [enhancedTrialData, searchTerm, selectedPhase, selectedStatus]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'I': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'II': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'III': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'IV': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'Research': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Recruiting': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Completed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'Suspended': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const handleRowClick = (trial: any) => {
    setShowTrialDetails(trial);
  };

  const generateAISummary = () => {
    if (!showTrialDetails) return;
    setAiSummaryLoading(true);
    setShowAISummary(true);
    setTimeout(() => {
      const summary = `
        ## Clinical Trial Summary: ${showTrialDetails.trial_id}
        
        This ${showTrialDetails.phase ? `Phase ${showTrialDetails.phase}` : 'Research'} trial by ${showTrialDetails.companyName} is investigating treatments for ${showTrialDetails.indication}. 
        
        Currently ${showTrialDetails.status.toLowerCase()}, this study spans multiple sites and locations.
      `;
      setAiSummaryText(summary);
      setAiSummaryLoading(false);
    }, 600);
  };

  const runAI = async () => {
    setLoading(true);
    const res = await askMedarion('Summarize ongoing clinical trial activity in African healthcare and highlight key indications and geographies.');
    setAiText(res.answer);
    setLoading(false);
  };

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Microscope className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Clinical Trials</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">Track ongoing clinical trials and research studies across Africa</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canAI && (
              <button onClick={runAI} className="btn-primary-elevated btn-sm flex items-center gap-2 w-full sm:w-auto">
                <Bot className="h-4 w-4" />
                <span className="text-sm">AI Summary</span>
              </button>
            )}
            <button onClick={copyJSON} className="btn-outline btn-sm w-full sm:w-auto">Copy</button>
            <button onClick={exportJSON} className="btn-outline btn-sm w-full sm:w-auto"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
          </div>
        </div>
      </div>

      {aiText && (
        <div className="card-glass p-4 shadow-soft">
          <h3 className="font-semibold text-[var(--color-text-primary)]">AI Trial Landscape</h3>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-[var(--color-text-primary)]">{aiText}</pre>
          {loading && <p className="text-xs text-[var(--color-text-secondary)]">Updating…</p>}
        </div>
      )}

      {/* Summary Stats with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Microscope className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Trials</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{filteredTrials.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Active Trials</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {filteredTrials.filter((t: any) => t.status === 'Active' || t.status === 'Recruiting').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Completed</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {filteredTrials.filter((t: any) => t.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Countries</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {new Set(filteredTrials.map((t: any) => t.country)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Most Active Clinical Trials Countries with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-6">
          <Globe className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Most Active Clinical Trials Countries</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topCountries.map((country: any, index: number) => (
            <div key={country.country} className="card-glass p-4 shadow-soft hover:shadow-elevated transition-all duration-300 card-hover">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center text-white font-bold border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                    {index + 1}
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">{country.country}</h4>
                </div>
                <span className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded-full text-xs font-medium border border-[var(--color-divider-gray)]">
                  {country.count} trials
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-secondary)]">Active Trials</span>
                  <span className="text-[var(--color-primary-teal)]">{(country as any).active}</span>
                </div>
                <div className="w-full bg-[var(--color-background-default)] rounded-full h-2">
                  <div 
                    className="bg-[var(--color-primary-teal)] h-2 rounded-full" 
                    style={{ width: `${((country as any).active / (country as any).count) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search trials, companies, or indications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="input"
          >
            {phases.map(phase => (
              <option key={phase} value={phase}>Phase {phase}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trials Table with glassmorphism */}
      <div className="card-glass overflow-hidden shadow-soft">
        <div className="p-6 border-b border-[var(--color-divider-gray)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Clinical Trials</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-background-default)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Trial ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Indication</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Phase</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Sector</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider-gray)]">
              {filteredTrials.map((trial: any, index: number) => (
                <tr 
                  key={`${trial.companyName}-${trial.trial_id}-${index}`} 
                  className="hover:bg-[var(--color-background-default)] transition-colors cursor-pointer"
                  onClick={() => handleRowClick(trial)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-[var(--color-primary-teal)]">{trial.trial_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">{trial.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--color-text-primary)] font-medium">{trial.indication}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(trial.phase)}`}>
                      Phase {trial.phase}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trial.status)}`}>
                      {trial.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{trial.sector}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{trial.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trial Details Modal with glassmorphism */}
      {showTrialDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-6 max-w-4xl w-full mx-auto max-h-[80vh] overflow-y-auto shadow-elevated">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{showTrialDetails.trial_id}</h3>
                <p className="text-[var(--color-text-secondary)]">{showTrialDetails.companyName}</p>
              </div>
              <button 
                onClick={() => { setShowTrialDetails(null); setShowAISummary(false); setAiSummaryText(''); }}
                className="text-[var(--color-text-secondary)] hover:opacity-80"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="card-glass p-4 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Indication</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{showTrialDetails.indication}</p>
              </div>
              <div className="card-glass p-4 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Phase</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">Phase {showTrialDetails.phase}</p>
              </div>
              <div className="card-glass p-4 shadow-soft">
                <p className="text-sm text-[var(--color-text-secondary)]">Status</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{showTrialDetails.status}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Trial Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-glass p-4 shadow-soft">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">Number of Trial Sites</p>
                  <p className="text-base font-medium text-[var(--color-text-primary)]">{showTrialDetails.sites}</p>
                </div>
                <div className="card-glass p-4 shadow-soft">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">Principal Investigator</p>
                  <p className="text-base font-medium text-[var(--color-text-primary)]">{showTrialDetails.principalInvestigator}</p>
                </div>
                <div className="md:col-span-2 card-glass p-4 shadow-soft">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">Site Locations</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {showTrialDetails.locations.map((location: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="chip bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs border border-[var(--color-divider-gray)]"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!showAISummary ? (
              <button
                onClick={generateAISummary}
                className="btn-primary-elevated btn-sm flex items-center gap-2 mb-6"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate AI Summary</span>
              </button>
            ) : (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 icon-primary" />
                    AI-Generated Summary
                  </h4>
                  <button
                    onClick={() => setShowAISummary(false)}
                    className="text-[var(--color-text-secondary)] hover:opacity-80 text-sm"
                  >
                    Hide
                  </button>
                </div>
                
                {aiSummaryLoading ? (
                  <div className="card-glass p-4 shadow-soft flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary-teal)]"></div>
                    <span className="ml-3 text-[var(--color-text-secondary)]">Generating summary...</span>
                  </div>
                ) : (
                  <div className="card-glass p-4 shadow-soft">
                    <div className="prose max-w-none">
                      {aiSummaryText.split('\n').map((line: string, index: number) => {
                        if (line.startsWith('##')) {
                          return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-[var(--color-text-primary)]">{line.replace('##', '').trim()}</h2>;
                        } else if (line.startsWith('###')) {
                          return <h3 key={index} className="text-lg font-semibold mt-3 mb-2 text-[var(--color-text-primary)]">{line.replace('###', '').trim()}</h3>;
                        } else if (line.startsWith('-')) {
                          return <li key={index} className="ml-4 text-[var(--color-text-primary)]">{line.replace('-', '').trim()}</li>;
                        } else if (line.trim() === '') {
                          return <br key={index} />;
                        } else {
                          return <p key={index} className="mb-2 text-[var(--color-text-primary)]">{line}</p>;
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTrialDetails(null)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalTrialsPage;