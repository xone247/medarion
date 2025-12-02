import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Search, MapPin, Stethoscope, Globe, Mail, Phone, FileDown, Loader2, ChevronDown, ChevronUp, Calendar, Users, Award, Briefcase, Bot, X } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import { askMedarion } from '../services/ai';

const ClinicalCentersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [centers, setCenters] = useState<any[]>([]);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const [loading, setLoading] = useState(false);
  const [expandedCenters, setExpandedCenters] = useState<Set<number>>(new Set());
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');

  useEffect(() => {
    const fetchCentersData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/clinical-centers', { all: 'true' });
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

  const runAI = async () => {
    setAiSummaryLoading(true);
    setShowAISummary(true);
    try {
      const countryFilter = selectedCountry !== 'All' ? ` in ${selectedCountry}` : '';
      const specializationFilter = selectedSpecialization !== 'All' ? ` specializing in ${selectedSpecialization}` : '';
      const prompt = `Summarize clinical centers for African healthcare${countryFilter}${specializationFilter}. Highlight key centers, their specializations, distribution across countries, capacity, and important trends in clinical research infrastructure.`;
      const res = await askMedarion(prompt);
      setAiSummaryText(res.answer || 'Unable to generate summary at this time.');
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummaryText('Unable to generate summary at this time. Please try again later.');
    } finally {
      setAiSummaryLoading(false);
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

  if (loading && centers.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading clinical centers...</p>
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
                placeholder="Search center name, city, or address..."
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
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Total Centers</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{filteredCenters.length}</p>
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
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{new Set(filteredCenters.map((c: any) => c.country)).size}</p>
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
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{new Set(filteredCenters.map((c: any) => c.specialization).filter(Boolean)).size}</p>
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
                {Object.keys(centersByCountry).length > 0 
                  ? Math.round(filteredCenters.length / Object.keys(centersByCountry).length) 
                  : 0}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Centers List - Mobile Optimized */}
      <div className="card-glass p-3 sm:p-3 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-3 gap-2">
          <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Clinical Centers</h3>
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {filteredCenters.length} of {centers.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span className="ml-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">Loading centers...</span>
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-slate-500 dark:text-slate-400">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No clinical centers found</p>
          </div>
        ) : (
          <>
            {/* Desktop: Split into 2 Columns */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-2 sm:gap-3">
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
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">{center.address}</div>
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
                                            <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
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

            {/* Mobile: Single Column with Better Layout */}
            <div className="lg:hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {Object.entries(centersByCountry).sort().map(([country, countryCenters]) => (
                  <div key={country} className="py-2 sm:py-3">
                    <h4 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{country}</span>
                      <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 flex-shrink-0">({countryCenters.length})</span>
                    </h4>
                    <div className="space-y-2 sm:space-y-2.5">
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
                          <div key={center.id} className="bg-slate-50 dark:bg-slate-700/30 p-2.5 sm:p-3 rounded-lg border border-slate-200/50 dark:border-slate-600/50 hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-sm transition-all">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-1">
                                  <div className="font-medium text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 truncate">{center.name}</div>
                                  {center.type && (
                                    <span className="text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1 sm:px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                      {center.type}
                                    </span>
                                  )}
                                </div>
                                {center.specialization && (
                                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1 leading-tight">
                                    <Stethoscope className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate">{center.specialization}</span>
                                  </div>
                                )}
                                {(center.city || center.country) && (
                                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 leading-tight">
                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate">{[center.city, center.country].filter(Boolean).join(', ')}</span>
                                  </div>
                                )}
                                {center.address && (
                                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1.5 leading-relaxed">{center.address}</div>
                                )}
                                {(center.email || center.phone || center.website) && (
                                  <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs flex-wrap">
                                    {center.email && (
                                      <a href={`mailto:${center.email}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                        <Mail className="h-2.5 w-2.5 flex-shrink-0" />
                                        <span>Email</span>
                                      </a>
                                    )}
                                    {center.phone && (
                                      <a href={`tel:${center.phone}`} className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                        <Phone className="h-2.5 w-2.5 flex-shrink-0" />
                                        <span>Phone</span>
                                      </a>
                                    )}
                                    {center.website && (
                                      <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 hover:underline">
                                        <Globe className="h-2.5 w-2.5 flex-shrink-0" />
                                        <span>Website</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                                
                                {/* Expandable Section */}
                                {hasExtraData && (
                                  <>
                                    <button
                                      onClick={() => toggleCenter(center.id)}
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
                                        {center.description && (
                                          <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
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
                                                <span key={idx} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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
                                                <span key={idx} className="bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
                                                  Phase {phase}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {(center.capacity_patients || center.established_year) && (
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                            {center.capacity_patients && (
                                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                <Users className="h-3 w-3 flex-shrink-0" />
                                                <span><span className="font-medium">Capacity:</span> {center.capacity_patients} patients</span>
                                              </div>
                                            )}
                                            {center.established_year && (
                                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                <Calendar className="h-3 w-3 flex-shrink-0" />
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
                                                <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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
                                                <span key={idx} className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
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

export default ClinicalCentersPage;

