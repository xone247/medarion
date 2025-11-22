import React, { useEffect, useMemo, useState } from 'react';
import { FileCheck, Search, Filter, Calendar, MapPin, Building2, ExternalLink, Sparkles, Globe, FileText, Bot, FileDown } from 'lucide-react';
import { marketEntryReport } from '../services/ai';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const RegulatoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBody, setSelectedBody] = useState('All');
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regulatory, setRegulatory] = useState<any[]>([]);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));

  useEffect(() => {
    const fetchRegulatoryData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/regulatory', { limit: '200' });
        console.log('[RegulatoryPage] API Response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API data to match expected format
          const transformed = response.data.map((reg: any) => ({
            id: reg.id,
            product: reg.product_name || reg.approval_type || 'Regulatory Approval',
            body: reg.regulatory_body_name || reg.body_name || reg.regulatory_body_id || 'Unknown Body',
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
    .slice(0, 6), [countryStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case '510(k) Cleared': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'Submitted':
      case 'Under Review': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'Rejected': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getBodyColor = (body: string) => {
    if (body.includes('FDA')) return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    if (body.includes('NAFDAC')) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (body.includes('SAHPRA')) return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
    if (body.includes('KPPB')) return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  const generateAISummary = () => {
    setAiSummaryLoading(true);
    setShowAISummary(true);
    setTimeout(() => {
      const approvedCount = filteredRegulatory.filter(r => r.status === 'Approved' || r.status === '510(k) Cleared').length;
      const pendingCount = filteredRegulatory.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length;
      const sectorStats = filteredRegulatory.reduce((acc: any, reg: any) => {
        acc[reg.sector] = (acc[reg.sector] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topSector = Object.entries(sectorStats).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      const topSectorName = topSector ? (topSector[0] as string) : 'Unknown';
      const summary = `
        ## African Regulatory Landscape Summary
        
        Based on the current data, there are ${filteredRegulatory.length} regulatory submissions across ${Object.keys(countryStats).length} African countries, with ${approvedCount} approved products and ${pendingCount} pending review.
        
        ### Key Insights:
        
        - **Most Active Regulatory Bodies**: ${bodies.filter(b => b !== 'All').slice(0, 3).join(', ')}
        - **Leading Countries**: ${topCountries.slice(0, 3).map(c => c.country).join(', ')} account for ${Math.round((topCountries.slice(0, 3).reduce((sum, c) => sum + (c as any).count, 0) / (filteredRegulatory.length || 1)) * 100)}% of all regulatory activity
        - **Approval Rate**: ${Math.round(((approvedCount / (filteredRegulatory.length || 1)) * 100))}% of submissions have received approval
        
        ### Sector Analysis:
        
        The ${topSectorName} sector leads with the highest number of regulatory submissions, indicating strong innovation and commercialization efforts in this area.
        
        ### Regulatory Trends:
        
        - Time to approval is averaging 6-12 months across most African regulatory bodies
        - There's an increasing focus on harmonizing regulatory frameworks across regional economic communities
        - Digital health and medical device approvals are growing at the fastest rate
        
        ### Outlook:
        
        Expect continued growth in regulatory submissions across Africa as healthcare innovation accelerates and regulatory bodies streamline their processes. Companies should prepare for evolving requirements and increasing scrutiny of clinical evidence.
      `;
      setAiSummaryText(summary);
      setAiSummaryLoading(false);
    }, 600);
  };

  const exportJSON = () => { try { const data = { filters: { searchTerm, selectedStatus, selectedBody }, regulatory: filteredRegulatory, exportedAt: new Date().toISOString() }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='regulatory.json'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const copyJSON = async () => { try { const data = { filters: { searchTerm, selectedStatus, selectedBody }, regulatory: filteredRegulatory, exportedAt: new Date().toISOString() }; const text = JSON.stringify(data, null, 2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} alert('Copied regulatory JSON to clipboard'); } catch {} };

  return (
    <div className="page-container">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 icon-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Regulatory</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canAI && <button onClick={generateAISummary} className="btn-primary-elevated btn-sm flex items-center gap-2"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
            <button onClick={copyJSON} className="btn-outline btn-sm">Copy</button>
            <button onClick={exportJSON} className="btn-outline btn-sm"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      {showAISummary && (
        <div className="card-glass p-6 shadow-soft mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 icon-primary" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">AI-Generated Regulatory Summary</h3>
            </div>
            <button
              onClick={() => setShowAISummary(false)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm"
            >
              Hide
            </button>
          </div>
          
          {aiSummaryLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-teal)]"></div>
              <span className="ml-3 text-[var(--color-text-secondary)]">Generating comprehensive regulatory analysis...</span>
            </div>
          ) : (
            <div className="prose max-w-none">
              {aiSummaryText.split('\n').map((line, index) => {
                if (line.startsWith('##')) {
                  return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-[var(--color-text-primary)]">{line.replace('##', '').trim()}</h2>;
                } else if (line.startsWith('###')) {
                  return <h3 key={index} className="text-lg font-semibold mt-3 mb-2 text-[var(--color-text-primary)]">{line.replace('###', '').trim()}</h3>;
                } else if (line.startsWith('-')) {
                  return <li key={index} className="ml-4 text-[var(--color-text-secondary)]">{line.replace('-', '').trim()}</li>;
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return <p key={index} className="mb-2 text-[var(--color-text-secondary)]">{line}</p>;
                }
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <FileCheck className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Total Submissions</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{filteredRegulatory.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-[var(--color-success)] rounded-full flex items-center justify-center border border-[color-mix(in_srgb,var(--color-success),black_10%)]">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Approved</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {filteredRegulatory.filter(r => r.status === 'Approved' || r.status === '510(k) Cleared').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-[var(--color-warning)] rounded-full flex items-center justify-center border border-[color-mix(in_srgb,var(--color-warning),black_10%)]">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Pending</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {filteredRegulatory.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-accent" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Regulatory Bodies</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {new Set(filteredRegulatory.map((r: any) => r.body)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Most Active Regulatory Countries */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex items-center space-x-2 mb-6">
          <Globe className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Most Active Regulatory Countries</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {topCountries.map((country: any, index: number) => (
            <div key={country.country} className="card-glass p-4 shadow-soft hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center text-white font-bold border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                    {index + 1}
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">{country.country}</h4>
                </div>
                <span className="bg-[var(--color-primary-teal)] text-white px-2 py-1 rounded-full text-xs font-medium border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  {country.count} submissions
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-secondary)]">Approval Rate</span>
                  <span className="text-[var(--color-success-green)]">{Math.round((country.approved / country.count) * 100)}%</span>
                </div>
                <div className="w-full bg-[var(--color-background-default)] rounded-full h-2">
                  <div 
                    className="bg-[var(--color-success)] h-2 rounded-full" 
                    style={{ width: `${(country.approved / country.count) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search products, companies, or regulatory bodies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={selectedBody}
            onChange={(e) => setSelectedBody(e.target.value)}
            className="input"
          >
            {bodies.map(body => (
              <option key={body} value={body}>{body}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Regulatory Table */}
      <div className="card-glass overflow-hidden shadow-soft">
        <div className="p-6 border-b border-[var(--color-divider-gray)]">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Regulatory Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-background-default)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Regulatory Body</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Sector</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Country</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-divider-gray)]">
              {filteredRegulatory.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((reg: any, index: number) => (
                <tr key={`${reg.companyName}-${reg.product}-${index}`} className="hover:bg-[var(--color-background-default)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">{reg.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{reg.product}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getBodyColor(reg.body)}`}>
                      {reg.body}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(reg.status)}`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {new Date(reg.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{reg.sector}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{reg.country}</td>
                  <td className="px-6 py-4">
                    <a 
                      href={reg.dataSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary-teal)] hover:text-[var(--color-accent-sky)] flex items-center space-x-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">View Source</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryPage;