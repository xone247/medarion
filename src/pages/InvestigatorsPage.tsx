import React, { useEffect, useMemo, useState } from 'react';
import { User, Search, Filter, MapPin, Stethoscope, Building2, Mail, Phone, GraduationCap, FileText, Bot, FileDown } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const InvestigatorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedAffiliation, setSelectedAffiliation] = useState('All');
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));

  useEffect(() => {
    const fetchInvestigatorsData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/investigators', { limit: '200' });
        if (response.success && response.data) {
          setInvestigators(response.data);
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

  const exportJSON = () => { try { const data = { filters: { searchTerm, selectedCountry, selectedSpecialization, selectedAffiliation }, investigators: filteredInvestigators, exportedAt: new Date().toISOString() }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='investigators.json'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const exportCSV = () => { try { const rows = [['FirstName','LastName','Country','Affiliation','Specialization']]; filteredInvestigators.forEach((i:any)=> rows.push([i.first_name||'', i.last_name||'', i.country||'', i.affiliation||'', i.specialization||''])); const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='investigators.csv'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const copyJSON = async () => { try { const data = { filters: { searchTerm, selectedCountry, selectedSpecialization, selectedAffiliation }, investigators: filteredInvestigators, exportedAt: new Date().toISOString() }; const text=JSON.stringify(data,null,2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} alert('Copied investigators JSON to clipboard'); } catch {} };
  const runAISummary = () => { try { const total = filteredInvestigators.length; const countries = new Set(filteredInvestigators.map((i:any)=> i.country)).size; setAiSummary(`Investigators: ${total} • Countries: ${countries}`); } catch { setAiSummary('No data available'); } };

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Investigators</h1>
              <p className="text-[var(--color-text-secondary)]">Clinical trial investigators and researchers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canAI && <button onClick={runAISummary} className="btn-primary-elevated btn-sm flex items-center gap-2"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
            <button onClick={copyJSON} className="btn-outline btn-sm">Copy</button>
            <button onClick={exportJSON} className="btn-outline btn-sm"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
            <button onClick={exportCSV} className="btn-outline btn-sm"><FileDown className="h-4 w-4 inline mr-2"/>Export CSV</button>
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 shadow-soft">
          <div className="text-sm text-[var(--color-text-primary)]">{aiSummary}</div>
        </div>
      )}

      {/* Filters */}
      <div className="card-glass p-6 shadow-soft">
        <div className="grid grid-cols-4 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <select 
              className="input pl-10"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <select 
              className="input pl-10"
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
            >
              {specializations.map(s => <option key={s} value={s}>{s || 'Unspecified'}</option>)}
            </select>
          </div>
          <div className="relative">
            <select 
              className="input pl-10"
              value={selectedAffiliation}
              onChange={(e) => setSelectedAffiliation(e.target.value)}
            >
              {affiliations.map(a => <option key={a} value={a}>{a || 'Unspecified'}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input 
              className="input pl-10" 
              placeholder="Search investigator name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Investigators List */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {filteredInvestigators.length} Investigator{filteredInvestigators.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading investigators...</div>
        ) : filteredInvestigators.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No investigators found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvestigators.map((investigator: any) => (
              <div key={investigator.id} className="card-glass p-4 shadow-soft hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)] flex-shrink-0">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {investigator.title ? `${investigator.title} ` : ''}
                        {investigator.first_name} {investigator.last_name}
                      </h3>
                    </div>
                    <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                      {investigator.specialization && (
                        <div className="flex items-center space-x-2">
                          <span className="bg-[var(--color-primary-teal)] text-white px-2 py-0.5 rounded-full text-xs font-medium border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                            {investigator.specialization}
                          </span>
                        </div>
                      )}
                      {investigator.affiliation && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3" />
                          <span>{investigator.affiliation}</span>
                        </div>
                      )}
                      {(investigator.city || investigator.country) && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{[investigator.city, investigator.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {investigator.trials_count !== undefined && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{investigator.trials_count} trial{investigator.trials_count !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {investigator.publications_count !== undefined && (
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-3 w-3" />
                          <span>{investigator.publications_count} publication{investigator.publications_count !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {investigator.research_interests && (
                        <div className="text-xs opacity-75 mt-1">
                          <span className="font-medium">Research:</span> {investigator.research_interests}
                        </div>
                      )}
                    </div>
                    {(investigator.email || investigator.phone) && (
                      <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-[var(--color-divider-gray)]">
                        {investigator.email && (
                          <a href={`mailto:${investigator.email}`} className="flex items-center space-x-1 text-xs text-[var(--color-primary-teal)] hover:underline">
                            <Mail className="h-3 w-3" />
                            <span>Email</span>
                          </a>
                        )}
                        {investigator.phone && (
                          <a href={`tel:${investigator.phone}`} className="flex items-center space-x-1 text-xs text-[var(--color-primary-teal)] hover:underline">
                            <Phone className="h-3 w-3" />
                            <span>Phone</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigatorsPage;

