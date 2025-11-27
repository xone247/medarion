import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Search, MapPin, Stethoscope, Globe, Mail, Phone, FileDown, Loader2, ChevronDown, ChevronUp, Calendar, Users, Award, Briefcase } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

const ClinicalCentersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [centers, setCenters] = useState<any[]>([]);
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const [loading, setLoading] = useState(false);
  const [expandedCenters, setExpandedCenters] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchCentersData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/clinical-centers', { limit: '200' });
        if (response.success && response.data) {
          // Process centers: parse JSON fields and normalize field names
          const processedCenters = response.data.map((center: any) => {
            // Parse JSON fields
            const specialties = typeof center.specialties === 'string' ? JSON.parse(center.specialties || '[]') : (center.specialties || []);
            const phases_supported = typeof center.phases_supported === 'string' ? JSON.parse(center.phases_supported || '[]') : (center.phases_supported || []);
            const accreditation = typeof center.accreditation === 'string' ? JSON.parse(center.accreditation || '[]') : (center.accreditation || []);
            const contact_info = typeof center.contact_info === 'string' ? JSON.parse(center.contact_info || '{}') : (center.contact_info || {});
            const facilities = typeof center.facilities === 'string' ? JSON.parse(center.facilities || '[]') : (center.facilities || []);
            
            // Extract email/phone from contact_info if not in main fields
            const email = center.email || contact_info.email || contact_info.contact_email || '';
            const phone = center.phone || contact_info.phone || contact_info.contact_phone || '';
            
            // Get specialization from specialties array or use specialization field
            const specialization = center.specialization || (Array.isArray(specialties) && specialties.length > 0 ? specialties[0] : '');
            
            return {
              ...center,
              specialties,
              phases_supported,
              accreditation,
              contact_info,
              facilities,
              email,
              phone,
              specialization,
              // Ensure type field exists (might be in database or derived)
              type: center.type || ''
            };
          });
          setCenters(processedCenters);
        } else {
          setCenters([]);
        }
      } catch (error) {
        console.error('Error fetching clinical centers data:', error);
        setCenters([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCentersData();
  }, []);

  const toggleCenter = (centerId: number) => {
    setExpandedCenters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(centerId)) {
        newSet.delete(centerId);
      } else {
        newSet.add(centerId);
      }
      return newSet;
    });
  };

  const countries = useMemo(() => ['All', ...new Set(centers.map(c => c.country))], [centers]);
  const specializations = useMemo(() => ['All', ...new Set(centers.map(c => c.specialization))], [centers]);

  const filteredCenters = useMemo(() => {
    return centers.filter((center: any) => {
      const matchesSearch = center.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           center.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           center.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = selectedCountry === 'All' || center.country === selectedCountry;
      const matchesSpecialization = selectedSpecialization === 'All' || center.specialization === selectedSpecialization;
      return matchesSearch && matchesCountry && matchesSpecialization;
    });
  }, [centers, searchTerm, selectedCountry, selectedSpecialization]);

  const exportExcel = () => {
    try {
      const excelData = filteredCenters.map((c: any) => ({
        Name: c.name,
        Country: c.country,
        City: c.city,
        Type: c.type || '',
        Specialization: c.specialization || '',
        Address: c.address || ''
      }));
      exportToExcel(excelData, 'clinical_centers', 'Clinical Centers');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedCountry, selectedSpecialization }, centers: filteredCenters, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'clinical_centers');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['Name','Country','City','Type','Specialization','Address']];
      filteredCenters.forEach((c:any)=> rows.push([c.name,c.country,c.city,c.type||'',c.specialization||'',c.address||'']));
      exportToCSV(rows, 'clinical_centers');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };
  // Group centers by country
  const centersByCountry = useMemo(() => {
    return filteredCenters.reduce((acc, center) => {
      const country = center.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(center);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredCenters]);

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
                placeholder="Search center name, city, or address..."
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
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[160px]"
            >
              {specializations.map(s => <option key={s} value={s}>{s || 'Unspecified'}</option>)}
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Centers</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{filteredCenters.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{new Set(filteredCenters.map((c: any) => c.country)).size}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Specializations</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{new Set(filteredCenters.map((c: any) => c.specialization).filter(Boolean)).size}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Avg per Country</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">
                {Object.keys(centersByCountry).length > 0 
                  ? Math.round(filteredCenters.length / Object.keys(centersByCountry).length) 
                  : 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Centers List - Split into 2 Columns */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Clinical Centers</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredCenters.length} of {centers.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Loading centers...</span>
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No clinical centers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(() => {
              const sortedCountries = Object.entries(centersByCountry).sort();
              const midPoint = Math.ceil(sortedCountries.length / 2);
              const leftColumn = sortedCountries.slice(0, midPoint);
              const rightColumn = sortedCountries.slice(midPoint);
              
              return (
                <>
                  {/* Left Column */}
                  <div className="space-y-3">
                    {leftColumn.map(([country, countryCenters]) => (
                      <div key={country} className="space-y-1.5">
                        <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                          {country} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({countryCenters.length})</span>
                        </h4>
                        <div className="space-y-1.5">
                          {countryCenters.map((center: any) => {
                            const isExpanded = expandedCenters.has(center.id);
                            const hasExtraData = center.description || 
                              (Array.isArray(center.specialties) && center.specialties.length > 0) ||
                              (Array.isArray(center.phases_supported) && center.phases_supported.length > 0) ||
                              center.capacity_patients ||
                              center.established_year ||
                              (Array.isArray(center.accreditation) && center.accreditation.length > 0) ||
                              (Array.isArray(center.facilities) && center.facilities.length > 0);
                            
                            return (
                              <div key={center.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                                <div className="p-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Building2 className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                        <div className="font-medium text-xs text-slate-700 dark:text-slate-200">{center.name}</div>
                                        {center.type && (
                                          <span className="text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                                            {center.type}
                                          </span>
                                        )}
                                      </div>
                                      {center.specialization && (
                                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                                          <Stethoscope className="h-2.5 w-2.5" />
                                          <span>{center.specialization}</span>
                                        </div>
                                      )}
                                      {(center.city || center.country) && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                          <MapPin className="h-2.5 w-2.5" />
                                          <span>{[center.city, center.country].filter(Boolean).join(', ')}</span>
                                        </div>
                                      )}
                                      {center.address && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">{center.address}</div>
                                      )}
                                      {(center.email || center.phone || center.website) && (
                                        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600 text-xs">
                                          {center.email && (
                                            <a href={`mailto:${center.email}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                              <Mail className="h-2.5 w-2.5" />
                                              <span>Email</span>
                                            </a>
                                          )}
                                          {center.phone && (
                                            <a href={`tel:${center.phone}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                              <Phone className="h-2.5 w-2.5" />
                                              <span>Phone</span>
                                            </a>
                                          )}
                                          {center.website && (
                                            <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                              <Globe className="h-2.5 w-2.5" />
                                              <span>Website</span>
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Expandable Section */}
                                  {hasExtraData && (
                                    <>
                                      <button
                                        onClick={() => toggleCenter(center.id)}
                                        className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="h-3 w-3" />
                                            <span>Show Less</span>
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3" />
                                            <span>Show More Details</span>
                                          </>
                                        )}
                                      </button>
                                      
                                      {isExpanded && (
                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2 text-xs">
                                          {center.description && (
                                            <div className="text-slate-600 dark:text-slate-400">
                                              <span className="font-medium text-slate-700 dark:text-slate-300">Description:</span> {center.description}
                                            </div>
                                          )}
                                          
                                          {Array.isArray(center.specialties) && center.specialties.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Stethoscope className="h-3 w-3" />
                                                Specialties:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {center.specialties.map((spec: string, idx: number) => (
                                                  <span key={idx} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs">
                                                    {spec}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {Array.isArray(center.phases_supported) && center.phases_supported.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                Phases Supported:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {center.phases_supported.map((phase: string, idx: number) => (
                                                  <span key={idx} className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">
                                                    Phase {phase}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {(center.capacity_patients || center.established_year) && (
                                            <div className="flex items-center gap-4">
                                              {center.capacity_patients && (
                                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                  <Users className="h-3 w-3" />
                                                  <span><span className="font-medium">Capacity:</span> {center.capacity_patients} patients</span>
                                                </div>
                                              )}
                                              {center.established_year && (
                                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                  <Calendar className="h-3 w-3" />
                                                  <span><span className="font-medium">Established:</span> {center.established_year}</span>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          {Array.isArray(center.accreditation) && center.accreditation.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Award className="h-3 w-3" />
                                                Accreditations:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {center.accreditation.map((acc: string, idx: number) => (
                                                  <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs">
                                                    {acc}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {Array.isArray(center.facilities) && center.facilities.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Facilities:</div>
                                              <div className="flex flex-wrap gap-1">
                                                {center.facilities.map((facility: string, idx: number) => (
                                                  <span key={idx} className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs">
                                                    {facility}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {rightColumn.length > 0 ? (
                      rightColumn.map(([country, countryCenters]) => (
                        <div key={country} className="space-y-1.5">
                          <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                            {country} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({countryCenters.length})</span>
                          </h4>
                          <div className="space-y-1.5">
                            {countryCenters.map((center: any) => {
                              const isExpanded = expandedCenters.has(center.id);
                              const hasExtraData = center.description || 
                                (Array.isArray(center.specialties) && center.specialties.length > 0) ||
                                (Array.isArray(center.phases_supported) && center.phases_supported.length > 0) ||
                                center.capacity_patients ||
                                center.established_year ||
                                (Array.isArray(center.accreditation) && center.accreditation.length > 0) ||
                                (Array.isArray(center.facilities) && center.facilities.length > 0);
                              
                              return (
                                <div key={center.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                                  <div className="p-2">
                                    <div className="flex items-start gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Building2 className="h-3 w-3 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                          <div className="font-medium text-xs text-slate-700 dark:text-slate-200">{center.name}</div>
                                          {center.type && (
                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                                              {center.type}
                                            </span>
                                          )}
                                        </div>
                                        {center.specialization && (
                                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                                            <Stethoscope className="h-2.5 w-2.5" />
                                            <span>{center.specialization}</span>
                                          </div>
                                        )}
                                        {(center.city || center.country) && (
                                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                            <MapPin className="h-2.5 w-2.5" />
                                            <span>{[center.city, center.country].filter(Boolean).join(', ')}</span>
                                          </div>
                                        )}
                                        {center.address && (
                                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">{center.address}</div>
                                        )}
                                        {(center.email || center.phone || center.website) && (
                                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600 text-xs">
                                            {center.email && (
                                              <a href={`mailto:${center.email}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                                <Mail className="h-2.5 w-2.5" />
                                                <span>Email</span>
                                              </a>
                                            )}
                                            {center.phone && (
                                              <a href={`tel:${center.phone}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                                <Phone className="h-2.5 w-2.5" />
                                                <span>Phone</span>
                                              </a>
                                            )}
                                            {center.website && (
                                              <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                                <Globe className="h-2.5 w-2.5" />
                                                <span>Website</span>
                                              </a>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Expandable Section */}
                                    {hasExtraData && (
                                      <>
                                        <button
                                          onClick={() => toggleCenter(center.id)}
                                          className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <ChevronUp className="h-3 w-3" />
                                              <span>Show Less</span>
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown className="h-3 w-3" />
                                              <span>Show More Details</span>
                                            </>
                                          )}
                                        </button>
                                        
                                        {isExpanded && (
                                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2 text-xs">
                                            {center.description && (
                                              <div className="text-slate-600 dark:text-slate-400">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">Description:</span> {center.description}
                                              </div>
                                            )}
                                            
                                            {Array.isArray(center.specialties) && center.specialties.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Stethoscope className="h-3 w-3" />
                                                  Specialties:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {center.specialties.map((spec: string, idx: number) => (
                                                    <span key={idx} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs">
                                                      {spec}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {Array.isArray(center.phases_supported) && center.phases_supported.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Briefcase className="h-3 w-3" />
                                                  Phases Supported:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {center.phases_supported.map((phase: string, idx: number) => (
                                                    <span key={idx} className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">
                                                      Phase {phase}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {(center.capacity_patients || center.established_year) && (
                                              <div className="flex items-center gap-4">
                                                {center.capacity_patients && (
                                                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                    <Users className="h-3 w-3" />
                                                    <span><span className="font-medium">Capacity:</span> {center.capacity_patients} patients</span>
                                                  </div>
                                                )}
                                                {center.established_year && (
                                                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                    <Calendar className="h-3 w-3" />
                                                    <span><span className="font-medium">Established:</span> {center.established_year}</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            
                                            {Array.isArray(center.accreditation) && center.accreditation.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Award className="h-3 w-3" />
                                                  Accreditations:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {center.accreditation.map((acc: string, idx: number) => (
                                                    <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs">
                                                      {acc}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {Array.isArray(center.facilities) && center.facilities.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Facilities:</div>
                                                <div className="flex flex-wrap gap-1">
                                                  {center.facilities.map((facility: string, idx: number) => (
                                                    <span key={idx} className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs">
                                                      {facility}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                        {/* Empty space on right column if odd number of countries */}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalCentersPage;

