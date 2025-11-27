import React, { useEffect, useMemo, useState } from 'react';
import { Microscope, Search, Filter, Calendar, MapPin, Building2, Sparkles, Globe, Bot, FileDown, FileText, X } from 'lucide-react';
import { askMedarion } from '../services/ai';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

const ClinicalTrialsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [showTrialDetails, setShowTrialDetails] = useState<any>(null);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trials, setTrials] = useState<any[]>([]);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const exportExcel = () => {
    try {
      const excelData = filteredTrials.map((trial: any) => ({
        Title: trial.title,
        Phase: trial.phase,
        Status: trial.status,
        Indication: trial.indication || trial.medical_condition,
        Intervention: trial.intervention,
        Sponsor: trial.sponsor || trial.companyName,
        Location: trial.location,
        Country: trial.country,
        'Start Date': trial.start_date,
        'End Date': trial.end_date,
        'NCT Number': trial.nct_number || trial.trial_id
      }));
      exportToExcel(excelData, 'clinical_trials', 'Clinical Trials');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedPhase, selectedStatus }, trials: filteredTrials, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'clinical_trials');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['Title','Phase','Status','Indication','Intervention','Sponsor','Location','Country','Start Date','End Date','NCT Number']];
      filteredTrials.forEach((trial: any) => rows.push([
        trial.title,
        trial.phase,
        trial.status,
        trial.indication || trial.medical_condition || '',
        trial.intervention || '',
        trial.sponsor || trial.companyName || '',
        trial.location || '',
        trial.country || '',
        trial.start_date || '',
        trial.end_date || '',
        trial.nct_number || trial.trial_id || ''
      ]));
      exportToCSV(rows, 'clinical_trials');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
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
        const response = await apiService.get('/admin/clinical-trials', { all: 'true' });
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
    
    // Date filtering
    let matchesDate = true;
    if (selectedDateRange !== 'All' && trial.start_date) {
      const trialDate = new Date(trial.start_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - trialDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (selectedDateRange) {
        case 'last7days':
          matchesDate = daysDiff <= 7;
          break;
        case 'last30days':
          matchesDate = daysDiff <= 30;
          break;
        case 'last90days':
          matchesDate = daysDiff <= 90;
          break;
        case 'lastyear':
          matchesDate = daysDiff <= 365;
          break;
      }
    }
    
    return matchesSearch && matchesPhase && matchesStatus && matchesDate;
  }), [enhancedTrialData, searchTerm, selectedPhase, selectedStatus, selectedDateRange]);

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
    <div className="w-full space-y-3">
      {/* Top Bar: Filters and Actions - Compact and Organized */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search trials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[120px]"
            >
              {phases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[140px]"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          {/* Actions Section */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {canAI && (
              <button onClick={runAI} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
                <Bot className="h-4 w-4" />
                <span>AI Summary</span>
              </button>
            )}
            <button onClick={exportExcel} className="btn-outline flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
              <FileDown className="h-4 w-4"/>
              <span>Excel</span>
            </button>
            <button onClick={exportJSON} className="btn-outline flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
              <FileDown className="h-4 w-4"/>
              <span>JSON</span>
            </button>
            <button onClick={exportCSV} className="btn-outline flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
              <FileDown className="h-4 w-4"/>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {aiText && (
        <div className="card-glass p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">AI Trial Landscape</h3>
            <button onClick={() => setAiText(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-400">{aiText}</pre>
          {loading && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Updating…</p>}
        </div>
      )}

      {/* Summary Stats - Compact Modern Style */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Trials</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{filteredTrials.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Microscope className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Active Trials</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">
                {filteredTrials.filter((t: any) => t.status === 'Active' || t.status === 'Recruiting').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">
                {filteredTrials.filter((t: any) => t.status === 'Completed').length}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">
                {new Set(filteredTrials.map((t: any) => t.country)).size}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Trials Statistics - Compact */}
      <div className="card-glass p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Clinical Trials Statistics</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Highest completed trials by country */}
          <div className="card-glass p-4 shadow-soft">
            <h4 className="font-medium text-[var(--color-text-primary)] mb-4">Highest completed trials</h4>
            <div className="space-y-2">
              {Object.entries(enhancedTrialData.reduce((acc: any, trial: any) => {
                if (trial.status === 'Completed') {
                  acc[trial.country] = (acc[trial.country] || 0) + 1;
                }
                return acc;
              }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([country, count]: any, index: number) => (
                <div key={country} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{index + 1}. {country}</span>
                  <span className="text-[var(--color-primary-teal)] font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent trials */}
          <div className="card-glass p-4 shadow-soft">
            <h4 className="font-medium text-[var(--color-text-primary)] mb-4">Recent trials</h4>
            <div className="space-y-2">
              {enhancedTrialData
                .sort((a: any, b: any) => new Date(b.start_date || b.created_at || 0).getTime() - new Date(a.start_date || a.created_at || 0).getTime())
                .slice(0, 5)
                .map((trial: any, index: number) => (
                  <div key={trial.trial_id || index} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)] truncate">{trial.trial_id || `Trial ${index + 1}`}</span>
                    <span className="text-[var(--color-primary-teal)] font-medium text-xs">{trial.companyName?.substring(0, 10)}...</span>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Top Phase */}
          <div className="card-glass p-4 shadow-soft">
            <h4 className="font-medium text-[var(--color-text-primary)] mb-4">Top Phase</h4>
            <div className="space-y-2">
              {Object.entries(enhancedTrialData.reduce((acc: any, trial: any) => {
                const phase = trial.phase || 'Unknown';
                acc[phase] = (acc[phase] || 0) + 1;
                return acc;
              }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([phase, count]: any, index: number) => (
                <div key={phase} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{index + 1}. Phase {phase}</span>
                  <span className="text-[var(--color-primary-teal)] font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trials Table */}
      <div className="card-glass overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Trial ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Indication</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTrials.map((trial: any, index: number) => (
                <tr 
                  key={`${trial.companyName}-${trial.trial_id}-${index}`} 
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(trial)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">{trial.trial_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{trial.companyName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate max-w-[200px]">{trial.indication}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(trial.phase)}`}>
                      Phase {trial.phase}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trial.status)}`}>
                      {trial.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{trial.country}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(trial);
                      }}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trial Details Modal */}
      {showTrialDetails && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowTrialDetails(null); setShowAISummary(false); setAiSummaryText(''); }}>
          <div className="card-glass p-6 max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto shadow-xl bg-white dark:bg-slate-800 rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.trial_id || 'Trial Details'}</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{showTrialDetails.companyName || 'Unknown Company'}</p>
              </div>
              <button 
                onClick={() => { setShowTrialDetails(null); setShowAISummary(false); setAiSummaryText(''); }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Indication</p>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.indication || showTrialDetails.medical_condition || 'Not specified'}</p>
              </div>
              <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Phase</p>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">Phase {showTrialDetails.phase || 'Unknown'}</p>
              </div>
              <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.status || 'Unknown'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">Trial Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Intervention</p>
                  <p className="text-base font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.intervention || 'Not specified'}</p>
                </div>
                <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Country</p>
                  <p className="text-base font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.country || 'Unknown'}</p>
                </div>
                <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Location</p>
                  <p className="text-base font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.location || 'Not specified'}</p>
                </div>
                <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Sponsor</p>
                  <p className="text-base font-medium text-slate-700 dark:text-slate-200">{showTrialDetails.sponsor || showTrialDetails.companyName || 'Unknown'}</p>
                </div>
                {showTrialDetails.start_date && (
                  <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Start Date</p>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-200">{new Date(showTrialDetails.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {showTrialDetails.end_date && (
                  <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">End Date</p>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-200">{new Date(showTrialDetails.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                {showTrialDetails.nct_number && (
                  <div className="card-glass p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">NCT Number</p>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-200 font-mono">{showTrialDetails.nct_number}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => { setShowTrialDetails(null); setShowAISummary(false); setAiSummaryText(''); }}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-2 rounded-lg transition-colors"
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