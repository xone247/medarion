import React, { useState, useEffect, useMemo } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { Building2, MapPin, ExternalLink, Loader2, FileDown, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

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
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));

  useEffect(() => {
    const fetchRegulatoryBodies = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/regulatory-bodies', { limit: '100' });
        if (response.success && response.data) {
          setRegulatoryBodies(response.data);
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

  return (
    <div className="w-full space-y-3">
      {/* Top Bar: Filters and Actions - Well Organized */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search regulatory bodies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[140px]"
            >
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Actions Section - Grouped */}
          {canExport && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2.5">
              <button onClick={exportExcel} className="btn-outline px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm" title="Export Excel"><FileDown className="h-3.5 w-3.5"/>Excel</button>
              <button onClick={exportJSON} className="btn-outline px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm" title="Export JSON"><FileDown className="h-3.5 w-3.5"/>JSON</button>
              <button onClick={exportCSV} className="btn-outline px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm" title="Export CSV"><FileDown className="h-3.5 w-3.5"/>CSV</button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats - Compact Modern Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Bodies</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{regulatoryBodies.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{Object.keys(bodiesByCountry).length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Filtered Results</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{filteredBodies.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Search className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Avg per Country</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">
                {Object.keys(bodiesByCountry).length > 0 
                  ? Math.round(regulatoryBodies.length / Object.keys(bodiesByCountry).length) 
                  : 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Map and List Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Interactive Map */}
        <div className="card-glass overflow-hidden rounded-lg">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Regulatory Bodies Map</h3>
              <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                {Object.keys(filteredBodiesByCountry).length} countries
              </span>
            </div>
          </div>
          <div className="h-[300px]">
            <InteractiveMap title="" dataType="count" height={300} />
          </div>
        </div>

        {/* Top Countries - Compact */}
        <div className="card-glass p-3 rounded-lg">
          <h3 className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Top Countries</h3>
          <ul className="space-y-1.5">
            {Object.entries(filteredBodiesByCountry)
              .map(([country, bodies]) => [country, bodies.length] as [string, number])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([country, count]) => (
                <li key={country} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{country}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium ml-2 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded">{count}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Regulatory Bodies List */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Regulatory Bodies</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredBodies.length} of {regulatoryBodies.length}
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Loading regulatory bodies...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && filteredBodies.length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {regulatoryBodies.length === 0 
              ? 'No regulatory bodies found in the database.'
              : 'No regulatory bodies match your search criteria.'}
          </div>
        )}

        {!loading && !error && filteredBodies.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Object.entries(filteredBodiesByCountry).sort().map(([country, bodies]) => (
              <div key={country} className="space-y-1.5">
                <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                  {country} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({bodies.length})</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {bodies.map((body) => (
                    <div key={body.id} className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <div className="font-medium text-xs text-slate-700 dark:text-slate-200">{body.name}</div>
                            {(body.abbreviation || body.acronym) && (
                              <span className="text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                                {body.abbreviation || body.acronym}
                              </span>
                            )}
                          </div>
                          {body.description && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1 mb-1">
                              {body.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {body.type && (
                              <span className="capitalize bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-xs">{body.type}</span>
                            )}
                            {body.website && (
                              <a
                                href={body.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline text-xs"
                              >
                                <span>Website</span>
                                <ExternalLink className="h-2.5 w-2.5" />
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
    </div>
  );
};

export default RegulatoryEcosystemPage; 