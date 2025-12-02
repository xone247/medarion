import React, { useEffect, useMemo, useState } from 'react';
import { User, Search, MapPin, Stethoscope, Building2, Mail, Phone, GraduationCap, FileText, FileDown, Loader2, ChevronDown, ChevronUp, Award, Languages, Briefcase, Bot, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import { askMedarion } from '../services/ai';

const InvestigatorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedAffiliation, setSelectedAffiliation] = useState('All');
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const [expandedInvestigators, setExpandedInvestigators] = useState<Set<number>>(new Set());
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');

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

  const runAI = async () => {
    setAiSummaryLoading(true);
    setShowAISummary(true);
    try {
      const countryFilter = selectedCountry !== 'All' ? ` in ${selectedCountry}` : '';
      const specializationFilter = selectedSpecialization !== 'All' ? ` specializing in ${selectedSpecialization}` : '';
      const affiliationFilter = selectedAffiliation !== 'All' ? ` affiliated with ${selectedAffiliation}` : '';
      const prompt = `Summarize clinical trial investigators for African healthcare${countryFilter}${specializationFilter}${affiliationFilter}. Highlight key investigators, their specializations, research interests, distribution across countries, and important trends in clinical research expertise.`;
      const res = await askMedarion(prompt);
      setAiSummaryText(res.answer || 'Unable to generate summary at this time.');
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummaryText('Unable to generate summary at this time. Please try again later.');
    } finally {
      setAiSummaryLoading(false);
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

  if (loading && investigators.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading investigators...</p>
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
                placeholder="Search investigator name..."
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
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all w-full sm:w-auto sm:min-w-[160px]"
            >
              {specializations.map(s => <option key={s} value={s}>{s || 'Unspecified'}</option>)}
            </select>
            <select 
              value={selectedAffiliation}
              onChange={(e) => setSelectedAffiliation(e.target.value)}
              className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all w-full sm:w-auto sm:min-w-[160px]"
            >
              {affiliations.map(a => <option key={a} value={a}>{a || 'Unspecified'}</option>)}
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
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Investigators</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{filteredInvestigators.length}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Countries</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{new Set(filteredInvestigators.map((i: any) => i.country)).size}</p>
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
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Specializations</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{new Set(filteredInvestigators.map((i: any) => i.specialization).filter(Boolean)).size}</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg per Country</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">
                {Object.keys(investigatorsByCountry).length > 0 
                  ? Math.round(filteredInvestigators.length / Object.keys(investigatorsByCountry).length) 
                  : 0}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Investigators List - Mobile Optimized */}
      <div className="card-glass p-3 sm:p-3 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-3 gap-2">
          <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Investigators</h3>
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {filteredInvestigators.length} of {investigators.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span className="ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">Loading investigators...</span>
          </div>
        ) : filteredInvestigators.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
            <User className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No investigators found</p>
          </div>
        ) : (
          <>
            {/* Desktop: Split into 2 Columns */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-2 sm:gap-3">
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
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
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
                                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">
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

            {/* Mobile: Single Column with Better Layout */}
            <div className="lg:hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {Object.entries(investigatorsByCountry).sort().map(([country, countryInvestigators]) => (
                  <div key={country} className="py-2 sm:py-3">
                    <h4 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{country}</span>
                      <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 flex-shrink-0">({countryInvestigators.length})</span>
                    </h4>
                    <div className="space-y-2 sm:space-y-2.5">
                      {countryInvestigators.map((investigator: any) => {
                        const isExpanded = expandedInvestigators.has(investigator.id);
                        const hasExtraData = investigator.experience_years ||
                          (Array.isArray(investigator.specialties) && investigator.specialties.length > 1) ||
                          (Array.isArray(investigator.therapeutic_areas) && investigator.therapeutic_areas.length > 0) ||
                          (Array.isArray(investigator.education) && investigator.education.length > 0) ||
                          (Array.isArray(investigator.certifications) && investigator.certifications.length > 0) ||
                          (Array.isArray(investigator.languages) && investigator.languages.length > 0);
                        
                        return (
                          <div key={investigator.id} className="bg-slate-50 dark:bg-slate-700/30 p-2.5 sm:p-3 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-1">
                                  <div className="font-medium text-[11px] sm:text-xs text-slate-700 dark:text-slate-200">
                                    {investigator.title ? `${investigator.title} ` : ''}
                                    {investigator.first_name} {investigator.last_name}
                                  </div>
                                  {investigator.specialization && (
                                    <span className="text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                      {investigator.specialization}
                                    </span>
                                  )}
                                </div>
                                {investigator.affiliation && (
                                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1 leading-tight">
                                    <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate">{investigator.affiliation}</span>
                                  </div>
                                )}
                                {(investigator.city || investigator.country) && (
                                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 leading-tight">
                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate">{[investigator.city, investigator.country].filter(Boolean).join(', ')}</span>
                                  </div>
                                )}
                                {(investigator.trials_count !== undefined || investigator.publications_count !== undefined) && (
                                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 flex-wrap">
                                    {investigator.trials_count !== undefined && investigator.trials_count > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <FileText className="h-2.5 w-2.5 flex-shrink-0" />
                                        {investigator.trials_count} trial{investigator.trials_count !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                    {investigator.publications_count !== undefined && investigator.publications_count > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <GraduationCap className="h-2.5 w-2.5 flex-shrink-0" />
                                        {investigator.publications_count} pub{investigator.publications_count !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {investigator.research_interests && (
                                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1.5 leading-relaxed">
                                    <span className="font-medium">Research:</span> {investigator.research_interests}
                                  </div>
                                )}
                                {(investigator.email || investigator.phone) && (
                                  <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs flex-wrap">
                                    {investigator.email && (
                                      <a href={`mailto:${investigator.email}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                        <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                                        <span>Email</span>
                                      </a>
                                    )}
                                    {investigator.phone && (
                                      <a href={`tel:${investigator.phone}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                        <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                                        <span>Phone</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                
                                {/* Expandable Section */}
                                {hasExtraData && (
                                  <>
                                    <button
                                      onClick={() => toggleInvestigator(investigator.id)}
                                      className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-center gap-1 text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
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
                                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2 text-[10px] sm:text-xs">
                                        {investigator.experience_years && (
                                          <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
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
                                                <span key={idx} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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
                                                <span key={idx} className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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
                                                <div key={idx} className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs leading-relaxed">
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
                                                <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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
                                                <span key={idx} className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
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

export default InvestigatorsPage;

