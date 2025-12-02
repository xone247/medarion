import React, { useState, useEffect, useMemo } from 'react';
import { Building2, MapPin, ExternalLink, Loader2, FileDown, Search, Bot, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import { askMedarion } from '../services/ai';

interface RegulatoryBody {
  id: number;
  name: string;
  country: string;
  abbreviation?: string;
  acronym?: string;
  website?: string;
  description?: string;
  type?: string;
  contact_email?: string;
  contact_phone?: string;
}

const RegulatoryEcosystemPage: React.FC = () => {
  const [regulatoryBodies, setRegulatoryBodies] = useState<RegulatoryBody[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));

  useEffect(() => {
    const fetchRegulatoryBodies = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all regulatory bodies
        const response = await apiService.get('/admin/regulatory-bodies', { all: 'true' });
        if (response.success && response.data) {
          const rawBodies = Array.isArray(response.data) ? response.data : [];
          
          // Deduplicate regulatory bodies by name and country combination
          // If same name and country exists, keep the one with the most complete data
          const uniqueBodiesMap = new Map<string, RegulatoryBody>();
          
          rawBodies.forEach((body: RegulatoryBody) => {
            const key = `${(body.name || '').toLowerCase().trim()}_${(body.country || '').toLowerCase().trim()}`;
            const existing = uniqueBodiesMap.get(key);
            
            if (!existing) {
              // First occurrence, add it
              uniqueBodiesMap.set(key, body);
            } else {
              // Duplicate found, keep the one with more complete data
              const existingCompleteness = (
                (existing.description ? 1 : 0) +
                (existing.website ? 1 : 0) +
                (existing.contact_email ? 1 : 0) +
                (existing.contact_phone ? 1 : 0) +
                (existing.type ? 1 : 0) +
                (existing.abbreviation || existing.acronym ? 1 : 0)
              );
              
              const newCompleteness = (
                (body.description ? 1 : 0) +
                (body.website ? 1 : 0) +
                (body.contact_email ? 1 : 0) +
                (body.contact_phone ? 1 : 0) +
                (body.type ? 1 : 0) +
                (body.abbreviation || body.acronym ? 1 : 0)
              );
              
              // Keep the one with more complete data, or the one with higher ID if equal
              if (newCompleteness > existingCompleteness || 
                  (newCompleteness === existingCompleteness && body.id > existing.id)) {
                uniqueBodiesMap.set(key, body);
              }
            }
          });
          
          // Convert map back to array
          const uniqueBodies = Array.from(uniqueBodiesMap.values());
          setRegulatoryBodies(uniqueBodies);
        } else {
          setError(response.error || 'Failed to load regulatory bodies');
          setRegulatoryBodies([]);
        }
      } catch (err: any) {
        console.error('Error fetching regulatory bodies:', err);
        setError('Failed to load regulatory bodies');
        setRegulatoryBodies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegulatoryBodies();
  }, []);

  // Group by country
  const bodiesByCountry = useMemo(() => {
    return regulatoryBodies.reduce((acc, body) => {
      const country = body.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(body);
      return acc;
    }, {} as Record<string, RegulatoryBody[]>);
  }, [regulatoryBodies]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    return ['All', ...new Set(regulatoryBodies.map(b => b.country).filter(Boolean))].sort();
  }, [regulatoryBodies]);

  // Filter regulatory bodies
  const filteredBodies = useMemo(() => {
    return regulatoryBodies.filter(body => {
      const matchesSearch = !searchTerm || 
        body.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (body.abbreviation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (body.acronym || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (body.country || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = selectedCountry === 'All' || body.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [regulatoryBodies, searchTerm, selectedCountry]);

  // Filtered bodies by country
  const filteredBodiesByCountry = useMemo(() => {
    return filteredBodies.reduce((acc, body) => {
      const country = body.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(body);
      return acc;
    }, {} as Record<string, RegulatoryBody[]>);
  }, [filteredBodies]);

  const exportExcel = () => {
    try {
      const excelData = regulatoryBodies.map((body: RegulatoryBody) => ({
        Name: body.name,
        Country: body.country,
        Abbreviation: body.abbreviation || body.acronym || '',
        Type: body.type || '',
        Website: body.website || '',
        'Contact Email': body.contact_email || '',
        'Contact Phone': body.contact_phone || '',
        Description: body.description || ''
      }));
      exportToExcel(excelData, 'regulatory_ecosystem', 'Regulatory Ecosystem');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { count: regulatoryBodies.length, countries: Object.keys(bodiesByCountry).length, bodies: regulatoryBodies, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'regulatory_ecosystem');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['Name','Country','Abbreviation','Type','Website','Contact Email','Contact Phone']];
      regulatoryBodies.forEach((body: RegulatoryBody) => rows.push([
        body.name,
        body.country,
        body.abbreviation || body.acronym || '',
        body.type || '',
        body.website || '',
        body.contact_email || '',
        body.contact_phone || ''
      ]));
      exportToCSV(rows, 'regulatory_ecosystem');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const runAI = async () => {
    setAiSummaryLoading(true);
    setShowAISummary(true);
    try {
      const countryFilter = selectedCountry !== 'All' ? ` in ${selectedCountry}` : '';
      const prompt = `Summarize the regulatory ecosystem for African healthcare${countryFilter}. Highlight key regulatory bodies, their roles, distribution across countries, and important trends in healthcare regulation.`;
      const res = await askMedarion(prompt);
      setAiSummaryText(res.answer || 'Unable to generate summary at this time.');
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummaryText('Unable to generate summary at this time. Please try again later.');
    } finally {
      setAiSummaryLoading(false);
    }
  };


  if (loading && regulatoryBodies.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading regulatory bodies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:space-y-3 md:space-y-4 p-3 sm:p-3 md:p-4">
      {/* Top Bar: Filters and Actions - Compact Mobile Optimized */}
      <div className="card-glass p-3 sm:p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search regulatory bodies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
              />
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all w-full sm:w-auto sm:min-w-[140px]"
            >
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Actions Section - Balanced Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-2.5">
            {canAI && (
              <button 
                onClick={runAI} 
                className="btn-primary-elevated flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto"
                title="AI Summary"
              >
                <Bot className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI Summary</span>
              </button>
            )}
            {canExport && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end sm:justify-start">
                <button onClick={exportExcel} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export Excel">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">Excel</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button onClick={exportJSON} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export JSON">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">JSON</span>
                  <span className="sm:hidden">JSON</span>
                </button>
                <button onClick={exportCSV} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export CSV">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats - Compact Modern Style (Mobile Optimized) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Bodies</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{regulatoryBodies.length}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{Object.keys(bodiesByCountry).length}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Filtered Results</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{filteredBodies.length}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg per Country</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">
                {Object.keys(bodiesByCountry).length > 0 
                  ? Math.round(regulatoryBodies.length / Object.keys(bodiesByCountry).length) 
                  : 0}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory Bodies List (Mobile Optimized) */}
      <div className="card-glass p-3 sm:p-3 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-3 gap-2">
          <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Regulatory Bodies</h3>
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {filteredBodies.length} of {regulatoryBodies.length}
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span className="ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">Loading regulatory bodies...</span>
          </div>
        )}

        {error && (
          <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-xs sm:text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && filteredBodies.length === 0 && (
          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {regulatoryBodies.length === 0 
              ? 'No regulatory bodies found in the database.'
              : 'No regulatory bodies match your search criteria.'}
          </div>
        )}

        {!loading && !error && filteredBodies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
            {Object.entries(filteredBodiesByCountry).sort().map(([country, bodies]) => (
              <div key={country} className="space-y-1 sm:space-y-1.5">
                <h4 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                  <span className="truncate">{country}</span>
                  <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 flex-shrink-0">({bodies.length})</span>
                </h4>
                <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
                  {bodies.map((body) => (
                    <div key={body.id} className="bg-slate-50 dark:bg-slate-700/30 p-2 sm:p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-0.5">
                            <div className="font-medium text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 truncate">{body.name}</div>
                            {(body.abbreviation || body.acronym) && (
                              <span className="text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                {body.abbreviation || body.acronym}
                              </span>
                            )}
                          </div>
                          {body.description && (
                            <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 mb-1 leading-relaxed">
                              {body.description}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            {body.type && (
                              <span className="capitalize bg-slate-200 dark:bg-slate-600 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs">{body.type}</span>
                            )}
                            {body.website && (
                              <a
                                href={body.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline text-[10px] sm:text-xs"
                              >
                                <span>Website</span>
                                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary Modal */}
      {showAISummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="card-glass w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">AI Summary</h3>
              </div>
              <button
                onClick={() => { setShowAISummary(false); setAiSummaryText(''); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {aiSummaryLoading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600 dark:border-cyan-400 mb-4"></div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Generating AI summary...</p>
                </div>
              ) : aiSummaryText ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {aiSummaryText}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No summary available.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              <button
                onClick={() => { setShowAISummary(false); setAiSummaryText(''); }}
                className="flex-1 sm:flex-initial bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
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

export default RegulatoryEcosystemPage; 