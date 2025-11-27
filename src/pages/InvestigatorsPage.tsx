import React, { useEffect, useMemo, useState } from 'react';
import { User, Search, MapPin, Stethoscope, Building2, Mail, Phone, GraduationCap, FileText, FileDown, Loader2, ChevronDown, ChevronUp, Award, Languages, Briefcase } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

const InvestigatorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedAffiliation, setSelectedAffiliation] = useState('All');
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const [expandedInvestigators, setExpandedInvestigators] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchInvestigatorsData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/investigators', { all: 'true' });
        if (response.success && response.data) {
          // Process investigators: parse JSON fields and normalize field names
          const processedInvestigators = response.data.map((investigator: any) => {
            // Parse JSON fields
            const specialties = typeof investigator.specialties === 'string' ? JSON.parse(investigator.specialties || '[]') : (investigator.specialties || []);
            const therapeutic_areas = typeof investigator.therapeutic_areas === 'string' ? JSON.parse(investigator.therapeutic_areas || '[]') : (investigator.therapeutic_areas || []);
            const education = typeof investigator.education === 'string' ? JSON.parse(investigator.education || '[]') : (investigator.education || []);
            const certifications = typeof investigator.certifications === 'string' ? JSON.parse(investigator.certifications || '[]') : (investigator.certifications || []);
            const languages = typeof investigator.languages === 'string' ? JSON.parse(investigator.languages || '[]') : (investigator.languages || []);
            
            // Handle name field - split if it's a single name field, or use first_name/last_name
            let first_name = investigator.first_name || '';
            let last_name = investigator.last_name || '';
            if (!first_name && !last_name && investigator.name) {
              const nameParts = investigator.name.split(' ');
              first_name = nameParts[0] || '';
              last_name = nameParts.slice(1).join(' ') || '';
            }
            
            // Get affiliation from institution or affiliation field
            const affiliation = investigator.affiliation || investigator.institution || '';
            
            // Get specialization from specialties array or use specialization field
            const specialization = investigator.specialization || (Array.isArray(specialties) && specialties.length > 0 ? specialties[0] : '');
            
            // Get research_interests from therapeutic_areas
            const research_interests = investigator.research_interests || (Array.isArray(therapeutic_areas) && therapeutic_areas.length > 0 ? therapeutic_areas.join(', ') : '');
            
            // Get trials_count from trial_count or trials_count
            const trials_count = investigator.trials_count !== undefined ? investigator.trials_count : (investigator.trial_count || 0);
            
            return {
              ...investigator,
              specialties,
              therapeutic_areas,
              education,
              certifications,
              languages,
              first_name,
              last_name,
              affiliation,
              specialization,
              research_interests,
              trials_count
            };
          });
          setInvestigators(processedInvestigators);
        } else {
          setInvestigators([]);
        }
      } catch (error) {
        console.error('Error fetching investigators data:', error);
        setInvestigators([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigatorsData();
  }, []);

  const toggleInvestigator = (investigatorId: number) => {
    setExpandedInvestigators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(investigatorId)) {
        newSet.delete(investigatorId);
      } else {
        newSet.add(investigatorId);
      }
      return newSet;
    });
  };

  const countries = useMemo(() => ['All', ...new Set(investigators.map(i => i.country))], [investigators]);
  const specializations = useMemo(() => ['All', ...new Set(investigators.map(i => i.specialization))], [investigators]);
  const affiliations = useMemo(() => ['All', ...new Set(investigators.map(i => i.affiliation))], [investigators]);

  const filteredInvestigators = useMemo(() => {
    return investigators.filter((investigator: any) => {
      const fullName = `${investigator.first_name || ''} ${investigator.last_name || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           investigator.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           investigator.affiliation?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = selectedCountry === 'All' || investigator.country === selectedCountry;
      const matchesSpecialization = selectedSpecialization === 'All' || investigator.specialization === selectedSpecialization;
      const matchesAffiliation = selectedAffiliation === 'All' || investigator.affiliation === selectedAffiliation;
      return matchesSearch && matchesCountry && matchesSpecialization && matchesAffiliation;
    });
  }, [investigators, searchTerm, selectedCountry, selectedSpecialization, selectedAffiliation]);

  const exportExcel = () => {
    try {
      const excelData = filteredInvestigators.map((i: any) => ({
        'First Name': i.first_name || '',
        'Last Name': i.last_name || '',
        Country: i.country || '',
        Affiliation: i.affiliation || '',
        Specialization: i.specialization || '',
        Title: i.title || '',
        Email: i.email || '',
        Phone: i.phone || ''
      }));
      exportToExcel(excelData, 'investigators', 'Investigators');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedCountry, selectedSpecialization, selectedAffiliation }, investigators: filteredInvestigators, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'investigators');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['FirstName','LastName','Country','Affiliation','Specialization']];
      filteredInvestigators.forEach((i:any)=> rows.push([i.first_name||'', i.last_name||'', i.country||'', i.affiliation||'', i.specialization||'']));
      exportToCSV(rows, 'investigators');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };
  // Group investigators by country
  const investigatorsByCountry = useMemo(() => {
    return filteredInvestigators.reduce((acc, investigator) => {
      const country = investigator.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(investigator);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredInvestigators]);

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
                placeholder="Search investigator name..."
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
            <select 
              value={selectedAffiliation}
              onChange={(e) => setSelectedAffiliation(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[160px]"
            >
              {affiliations.map(a => <option key={a} value={a}>{a || 'Unspecified'}</option>)}
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Investigators</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{filteredInvestigators.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{new Set(filteredInvestigators.map((i: any) => i.country)).size}</p>
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
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{new Set(filteredInvestigators.map((i: any) => i.specialization).filter(Boolean)).size}</p>
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
                {Object.keys(investigatorsByCountry).length > 0 
                  ? Math.round(filteredInvestigators.length / Object.keys(investigatorsByCountry).length) 
                  : 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Investigators List - Split into 2 Columns */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Investigators</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredInvestigators.length} of {investigators.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Loading investigators...</span>
          </div>
        ) : filteredInvestigators.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No investigators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(() => {
              const sortedCountries = Object.entries(investigatorsByCountry).sort();
              const midPoint = Math.ceil(sortedCountries.length / 2);
              const leftColumn = sortedCountries.slice(0, midPoint);
              const rightColumn = sortedCountries.slice(midPoint);
              
              return (
                <>
                  {/* Left Column */}
                  <div className="space-y-3">
                    {leftColumn.map(([country, countryInvestigators]) => (
                      <div key={country} className="space-y-1.5">
                        <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                          {country} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({countryInvestigators.length})</span>
                        </h4>
                        <div className="space-y-1.5">
                          {countryInvestigators.map((investigator: any) => {
                            const isExpanded = expandedInvestigators.has(investigator.id);
                            const hasExtraData = investigator.experience_years ||
                              (Array.isArray(investigator.specialties) && investigator.specialties.length > 1) ||
                              (Array.isArray(investigator.therapeutic_areas) && investigator.therapeutic_areas.length > 0) ||
                              (Array.isArray(investigator.education) && investigator.education.length > 0) ||
                              (Array.isArray(investigator.certifications) && investigator.certifications.length > 0) ||
                              (Array.isArray(investigator.languages) && investigator.languages.length > 0);
                            
                            return (
                              <div key={investigator.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                                <div className="p-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                        <div className="font-medium text-xs text-slate-700 dark:text-slate-200">
                        {investigator.title ? `${investigator.title} ` : ''}
                        {investigator.first_name} {investigator.last_name}
                    </div>
                      {investigator.specialization && (
                                          <span className="text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                            {investigator.specialization}
                          </span>
                                        )}
                        </div>
                      {investigator.affiliation && (
                                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                                          <Building2 className="h-2.5 w-2.5" />
                                          <span className="truncate">{investigator.affiliation}</span>
                        </div>
                      )}
                      {(investigator.city || investigator.country) && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                          <MapPin className="h-2.5 w-2.5" />
                          <span>{[investigator.city, investigator.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                                      {(investigator.trials_count !== undefined || investigator.publications_count !== undefined) && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                          {investigator.trials_count !== undefined && investigator.trials_count > 0 && (
                                            <span className="flex items-center gap-0.5">
                                              <FileText className="h-2.5 w-2.5" />
                                              {investigator.trials_count} trial{investigator.trials_count !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                          {investigator.publications_count !== undefined && investigator.publications_count > 0 && (
                                            <span className="flex items-center gap-0.5">
                                              <GraduationCap className="h-2.5 w-2.5" />
                                              {investigator.publications_count} pub{investigator.publications_count !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {investigator.research_interests && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">
                                          <span className="font-medium">Research:</span> {investigator.research_interests}
                                        </div>
                                      )}
                                      {(investigator.email || investigator.phone) && (
                                        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600 text-xs">
                                          {investigator.email && (
                                            <a href={`mailto:${investigator.email}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                              <Mail className="h-2.5 w-2.5" />
                                              <span>Email</span>
                                            </a>
                                          )}
                                          {investigator.phone && (
                                            <a href={`tel:${investigator.phone}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                              <Phone className="h-2.5 w-2.5" />
                                              <span>Phone</span>
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
                                        onClick={() => toggleInvestigator(investigator.id)}
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
                                          {investigator.experience_years && (
                                            <div className="text-slate-600 dark:text-slate-400">
                                              <span className="font-medium text-slate-700 dark:text-slate-300">Experience:</span> {investigator.experience_years} years
                                            </div>
                                          )}
                                          
                                          {Array.isArray(investigator.specialties) && investigator.specialties.length > 1 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Stethoscope className="h-3 w-3" />
                                                All Specialties:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {investigator.specialties.map((spec: string, idx: number) => (
                                                  <span key={idx} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs">
                                                    {spec}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {Array.isArray(investigator.therapeutic_areas) && investigator.therapeutic_areas.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                Therapeutic Areas:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {investigator.therapeutic_areas.map((area: string, idx: number) => (
                                                  <span key={idx} className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">
                                                    {area}
                                                  </span>
                                                ))}
                                              </div>
                        </div>
                      )}
                                          
                                          {Array.isArray(investigator.education) && investigator.education.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                                                Education:
                                              </div>
                                              <div className="space-y-0.5">
                                                {investigator.education.map((edu: string, idx: number) => (
                                                  <div key={idx} className="text-slate-600 dark:text-slate-400 text-xs">
                                                    • {edu}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {Array.isArray(investigator.certifications) && investigator.certifications.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Award className="h-3 w-3" />
                                                Certifications:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {investigator.certifications.map((cert: string, idx: number) => (
                                                  <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs">
                                                    {cert}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {Array.isArray(investigator.languages) && investigator.languages.length > 0 && (
                                            <div>
                                              <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                <Languages className="h-3 w-3" />
                                                Languages:
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {investigator.languages.map((lang: string, idx: number) => (
                                                  <span key={idx} className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs">
                                                    {lang}
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
                      rightColumn.map(([country, countryInvestigators]) => (
                        <div key={country} className="space-y-1.5">
                          <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                            {country} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({countryInvestigators.length})</span>
                          </h4>
                          <div className="space-y-1.5">
                            {countryInvestigators.map((investigator: any) => {
                              const isExpanded = expandedInvestigators.has(investigator.id);
                              const hasExtraData = investigator.experience_years ||
                                (Array.isArray(investigator.specialties) && investigator.specialties.length > 1) ||
                                (Array.isArray(investigator.therapeutic_areas) && investigator.therapeutic_areas.length > 0) ||
                                (Array.isArray(investigator.education) && investigator.education.length > 0) ||
                                (Array.isArray(investigator.certifications) && investigator.certifications.length > 0) ||
                                (Array.isArray(investigator.languages) && investigator.languages.length > 0);
                              
                              return (
                                <div key={investigator.id} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                                  <div className="p-2">
                                    <div className="flex items-start gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="h-3 w-3 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                          <div className="font-medium text-xs text-slate-700 dark:text-slate-200">
                                            {investigator.title ? `${investigator.title} ` : ''}
                                            {investigator.first_name} {investigator.last_name}
                                          </div>
                                          {investigator.specialization && (
                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                                              {investigator.specialization}
                                            </span>
                                          )}
                                        </div>
                                        {investigator.affiliation && (
                                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                                            <Building2 className="h-2.5 w-2.5" />
                                            <span className="truncate">{investigator.affiliation}</span>
                                          </div>
                                        )}
                                        {(investigator.city || investigator.country) && (
                                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                            <MapPin className="h-2.5 w-2.5" />
                                            <span>{[investigator.city, investigator.country].filter(Boolean).join(', ')}</span>
                                          </div>
                                        )}
                                        {(investigator.trials_count !== undefined || investigator.publications_count !== undefined) && (
                                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                            {investigator.trials_count !== undefined && investigator.trials_count > 0 && (
                                              <span className="flex items-center gap-0.5">
                                                <FileText className="h-2.5 w-2.5" />
                                                {investigator.trials_count} trial{investigator.trials_count !== 1 ? 's' : ''}
                                              </span>
                                            )}
                                            {investigator.publications_count !== undefined && investigator.publications_count > 0 && (
                                              <span className="flex items-center gap-0.5">
                                                <GraduationCap className="h-2.5 w-2.5" />
                                                {investigator.publications_count} pub{investigator.publications_count !== 1 ? 's' : ''}
                                              </span>
                                            )}
                        </div>
                      )}
                      {investigator.research_interests && (
                                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">
                          <span className="font-medium">Research:</span> {investigator.research_interests}
                        </div>
                      )}
                    {(investigator.email || investigator.phone) && (
                                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200 dark:border-slate-600 text-xs">
                        {investigator.email && (
                                              <a href={`mailto:${investigator.email}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                                <Mail className="h-2.5 w-2.5" />
                            <span>Email</span>
                          </a>
                        )}
                        {investigator.phone && (
                                              <a href={`tel:${investigator.phone}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                                <Phone className="h-2.5 w-2.5" />
                            <span>Phone</span>
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
                                          onClick={() => toggleInvestigator(investigator.id)}
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
                                            {investigator.experience_years && (
                                              <div className="text-slate-600 dark:text-slate-400">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">Experience:</span> {investigator.experience_years} years
                                              </div>
                                            )}
                                            
                                            {Array.isArray(investigator.specialties) && investigator.specialties.length > 1 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Stethoscope className="h-3 w-3" />
                                                  All Specialties:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {investigator.specialties.map((spec: string, idx: number) => (
                                                    <span key={idx} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs">
                                                      {spec}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {Array.isArray(investigator.therapeutic_areas) && investigator.therapeutic_areas.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Briefcase className="h-3 w-3" />
                                                  Therapeutic Areas:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {investigator.therapeutic_areas.map((area: string, idx: number) => (
                                                    <span key={idx} className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">
                                                      {area}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {Array.isArray(investigator.education) && investigator.education.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <GraduationCap className="h-3 w-3" />
                                                  Education:
                                                </div>
                                                <div className="space-y-0.5">
                                                  {investigator.education.map((edu: string, idx: number) => (
                                                    <div key={idx} className="text-slate-600 dark:text-slate-400 text-xs">
                                                      • {edu}
                                                    </div>
                                                  ))}
                    </div>
                  </div>
                                            )}
                                            
                                            {Array.isArray(investigator.certifications) && investigator.certifications.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Award className="h-3 w-3" />
                                                  Certifications:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {investigator.certifications.map((cert: string, idx: number) => (
                                                    <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs">
                                                      {cert}
                                                    </span>
                                                  ))}
                </div>
              </div>
                                            )}
                                            
                                            {Array.isArray(investigator.languages) && investigator.languages.length > 0 && (
                                              <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                                  <Languages className="h-3 w-3" />
                                                  Languages:
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {investigator.languages.map((lang: string, idx: number) => (
                                                    <span key={idx} className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-xs">
                                                      {lang}
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

export default InvestigatorsPage;

