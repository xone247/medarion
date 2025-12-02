import React, { useEffect, useMemo, useState } from 'react';
import { FileCheck, Search, Filter, Calendar, MapPin, Building2, ExternalLink, Sparkles, Globe, FileText, Bot, FileDown, X, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { marketEntryReport } from '../services/ai';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import AISidePanel from '../components/ai/AISidePanel';

const RegulatoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBody, setSelectedBody] = useState('All');
  const [aiOpen, setAiOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regulatory, setRegulatory] = useState<any[]>([]);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));

  useEffect(() => {
    const fetchRegulatoryData = async () => {
      setLoading(true);
      try {
        // Fetch from database API - use all: 'true' to get all data
        const response = await apiService.get('/admin/regulatory', { all: 'true' });
        console.log('[RegulatoryPage] API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API data to match expected format
          const transformed = response.data.map((reg: any) => ({
            id: reg.id,
            product: reg.product_name || reg.product || reg.approval_type || 'Regulatory Approval',
            body: reg.regulatory_body_name || reg.regulatory_body || reg.body_name || reg.regulatory_body_id || 'Unknown Body',
            date: reg.approval_date || reg.application_date || reg.created_at,
            status: reg.status || 'pending',
            companyName: reg.company_name || 'Unknown Company',
            sector: reg.sector || reg.region || 'Unknown',
            country: reg.country || reg.region || 'Unknown',
            dataSource: reg.data_source || reg.body_website || (reg.regulatory_body_name ? `https://regulatory.${String(reg.regulatory_body_name).toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}.org/approvals/${reg.id}` : ''),
            validity_period: reg.validity_period || reg.expiry_date,
            notes: reg.notes,
            region: reg.region,
            expiry_date: reg.expiry_date,
            application_date: reg.application_date
          }));
          transformed.sort((a: any, b: any) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            return dateB - dateA;
          });
          
          console.log('[RegulatoryPage] Transformed data:', transformed);
          setRegulatory(transformed);
        } else {
          console.warn('[RegulatoryPage] Invalid response format:', response);
          setRegulatory([]);
        }
      } catch (error: any) {
        console.error('[RegulatoryPage] Error fetching regulatory data:', error);
        console.error('[RegulatoryPage] Error details:', error.message, error.stack);
        setRegulatory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRegulatoryData();
  }, []);

  const statuses = useMemo(() => ['All', ...new Set(regulatory.map(reg => reg.status))], [regulatory]);
  const bodies = useMemo(() => ['All', ...new Set(regulatory.map(reg => reg.body))], [regulatory]);

  const filteredRegulatory = useMemo(() => regulatory.filter((reg: any) => {
    const matchesSearch = reg.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || reg.status === selectedStatus;
    const matchesBody = selectedBody === 'All' || reg.body === selectedBody;
    
    return matchesSearch && matchesStatus && matchesBody;
  }), [regulatory, searchTerm, selectedStatus, selectedBody]);

  // Calculate statistics
  const approvedCount = useMemo(() => filteredRegulatory.filter(r => r.status === 'Approved' || r.status === '510(k) Cleared').length, [filteredRegulatory]);
  const pendingCount = useMemo(() => filteredRegulatory.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length, [filteredRegulatory]);
  const rejectedCount = useMemo(() => filteredRegulatory.filter(r => r.status === 'Rejected').length, [filteredRegulatory]);
  const uniqueBodies = useMemo(() => new Set(filteredRegulatory.map((r: any) => r.body)).size, [filteredRegulatory]);
  const uniqueCountries = useMemo(() => new Set(filteredRegulatory.map((r: any) => r.country)).size, [filteredRegulatory]);

  // Calculate country statistics
  const countryStats = useMemo(() => filteredRegulatory.reduce((acc: any, reg: any) => {
    if (!acc[reg.country]) {
      acc[reg.country] = { count: 0, approved: 0 };
    }
    acc[reg.country].count += 1;
    if (reg.status === 'Approved' || reg.status === '510(k) Cleared') {
      acc[reg.country].approved += 1;
    }
    return acc;
  }, {} as Record<string, { count: number; approved: number }>), [filteredRegulatory]);

  const topCountries = useMemo(() => Object.entries(countryStats)
    .map(([country, stats]: any) => ({ country, ...(stats as any) }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5), [countryStats]);

  // Calculate body statistics
  const bodyStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredRegulatory.forEach((r: any) => map.set(r.body, (map.get(r.body) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredRegulatory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case '510(k) Cleared': return 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300';
      case 'Submitted':
      case 'Under Review': return 'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300';
      case 'Rejected': return 'bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300';
      default: return 'bg-teal-100 dark:bg-teal-500/30 text-teal-700 dark:text-teal-300'; // Changed from gray to teal
    }
  };

  const getBodyColor = (body: string) => {
    if (!body) return 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300';
    const bodyStr = String(body).trim();
    const bodyLower = bodyStr.toLowerCase();
    
    // Check for NAFDAC first (most common)
    if (bodyLower === 'nafdac' || bodyLower.includes('nafdac') || bodyStr === 'NAFDAC') {
      return 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300';
    }
    // Ghana Food and Drugs Authority - explicit check with vibrant color
    if (bodyLower.includes('ghana food') || bodyLower.includes('gfda') || bodyLower.includes('ghana food and drugs')) {
      return 'bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300';
    }
    if (bodyLower.includes('fda') || bodyLower.includes('food and drug')) {
      return 'bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300';
    }
    if (bodyLower.includes('sahpra') || bodyLower.includes('south african health')) {
      return 'bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300';
    }
    if (bodyLower.includes('kenya medical') || bodyLower.includes('kmpdb') || bodyLower.includes('kenya medical practitioners')) {
      return 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300';
    }
    if (bodyLower.includes('kppb') || bodyLower.includes('kenya pharmacy')) {
      return 'bg-orange-100 dark:bg-orange-500/30 text-orange-700 dark:text-orange-300';
    }
    // Default fallback - use emerald for unknown bodies (NO gray/ash backgrounds)
    return 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300';
  };

  const exportExcel = () => {
    try {
      const excelData = filteredRegulatory.map((reg: any) => ({
        Product: reg.product,
        'Regulatory Body': reg.body,
        Status: reg.status,
        'Company Name': reg.companyName,
        Country: reg.country,
        Date: reg.date,
        'Validity Period': reg.validity_period || '',
        'Expiry Date': reg.expiry_date || '',
        'Application Date': reg.application_date || ''
      }));
      exportToExcel(excelData, 'regulatory', 'Regulatory');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedStatus, selectedBody }, regulatory: filteredRegulatory, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'regulatory');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['Product','Regulatory Body','Status','Company Name','Country','Date']];
      filteredRegulatory.forEach((reg: any) => rows.push([
        reg.product,
        reg.body,
        reg.status,
        reg.companyName,
        reg.country,
        reg.date
      ]));
      exportToCSV(rows, 'regulatory');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 dark:border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:space-y-3 md:space-y-4 p-2 sm:p-3 md:p-4">
      {/* Top Bar: Filters and Actions - Compact Mobile Optimized */}
      <div className="card-glass p-2.5 sm:p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search products, companies, or regulatory bodies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 min-w-full sm:min-w-[140px]"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={selectedBody}
                onChange={(e) => setSelectedBody(e.target.value)}
                className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 min-w-full sm:min-w-[160px]"
              >
                {bodies.map(body => (
                  <option key={body} value={body}>{body}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Actions Section - Compact Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-2.5">
            {canAI && (
              <button 
                onClick={() => setAiOpen(true)} 
                className="btn-primary-elevated flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm flex-shrink-0 min-w-[60px] h-[40px] sm:h-auto"
                title="AI Summary"
              >
                <Bot className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI Summary</span>
              </button>
            )}
            {canExport && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end sm:justify-start">
                <button onClick={exportExcel} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export Excel">
                  <FileDown className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button onClick={exportJSON} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export JSON">
                  <FileDown className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button onClick={exportCSV} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export CSV">
                  <FileDown className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats - Compact Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Total Submissions</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{filteredRegulatory.length}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Approved</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{approvedCount}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Pending</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{pendingCount}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-2 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wide">Regulatory Bodies</p>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200">{uniqueBodies}</p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-1.5 sm:ml-2">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights - Compact Side by Side (Matching Companies Page) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Top Countries */}
        <div className="card-glass p-2.5 sm:p-3 rounded-lg">
          <h3 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2 uppercase tracking-wide">Top Countries</h3>
          <ul className="space-y-1 sm:space-y-1.5">
            {topCountries.map((country: any) => (
              <li key={country.country} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{country.country}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium ml-2 bg-slate-100 dark:bg-slate-800/50 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">{country.count}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Top Regulatory Bodies */}
        <div className="card-glass p-2.5 sm:p-3 rounded-lg">
          <h3 className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2 uppercase tracking-wide">Top Regulatory Bodies</h3>
          <ul className="space-y-1 sm:space-y-1.5">
            {bodyStats.map(([body, count]) => (
              <li key={body} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{body}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium ml-2 bg-slate-100 dark:bg-slate-800/50 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Regulatory Table - Mobile Responsive */}
      <div className="card-glass overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Body</th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Country</th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredRegulatory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    No regulatory data found. {loading ? 'Loading...' : 'Try adjusting your filters.'}
                  </td>
                </tr>
              ) : (
                filteredRegulatory.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((reg: any, index: number) => (
                  <tr key={`${reg.id || reg.companyName}-${reg.product}-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px] sm:max-w-[150px]">{reg.companyName}</div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                      <div className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[200px]">{reg.product}</div>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getBodyColor(reg.body)}`}>
                        {reg.body}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                      <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(reg.status)}`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      {reg.date ? new Date(reg.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">{reg.country}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 hidden lg:table-cell">
                      {reg.dataSource ? (
                        <a 
                          href={reg.dataSource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="text-[10px] sm:text-xs">View</span>
                        </a>
                      ) : (
                        <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Side Panel */}
      {canAI && (
        <AISidePanel
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          context={{
            type: 'regulatory',
            data: filteredRegulatory,
            filters: { searchTerm, selectedStatus, selectedBody }
          }}
        />
      )}
    </div>
  );
};

export default RegulatoryPage;
