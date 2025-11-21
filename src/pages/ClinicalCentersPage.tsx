import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Search, Filter, MapPin, Calendar, Stethoscope, Globe, Mail, Phone, Bot, FileDown } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const ClinicalCentersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [centers, setCenters] = useState<any[]>([]);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    const fetchCentersData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/clinical-centers', { limit: '200' });
        if (response.success && response.data) {
          setCenters(response.data);
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

  const exportJSON = () => { try { const data = { filters: { searchTerm, selectedCountry, selectedSpecialization }, centers: filteredCenters, exportedAt: new Date().toISOString() }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='clinical_centers.json'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const exportCSV = () => { try { const rows = [['Name','Country','City','Type','Specialization','Address']]; filteredCenters.forEach((c:any)=> rows.push([c.name,c.country,c.city,c.type||'',c.specialization||'',c.address||''])); const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='clinical_centers.csv'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const copyJSON = async () => { try { const data = { filters: { searchTerm, selectedCountry, selectedSpecialization }, centers: filteredCenters, exportedAt: new Date().toISOString() }; const text = JSON.stringify(data, null, 2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} alert('Copied clinical centers JSON to clipboard'); } catch {} };
  const runAISummary = () => { try { const count = filteredCenters.length; const distinctCountries = new Set(filteredCenters.map((c:any)=>c.country)).size; setAiSummary(`Centers: ${count} • Countries: ${distinctCountries}`); } catch { setAiSummary('No data available'); } };

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Clinical Centers</h1>
              <p className="text-[var(--color-text-secondary)]">Explore clinical trial centers across Africa</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input 
              className="input pl-10" 
              placeholder="Search center name, city, or address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Centers List */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {filteredCenters.length} Clinical Center{filteredCenters.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading centers...</div>
        ) : filteredCenters.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clinical centers found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCenters.map((center: any) => (
              <div key={center.id} className="card-glass p-4 shadow-soft hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)] flex-shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{center.name}</h3>
                    <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                      {center.type && (
                        <div className="flex items-center space-x-2">
                          <span className="bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-0.5 rounded-full text-xs font-medium border border-[var(--color-divider-gray)]">
                            {center.type}
                          </span>
                        </div>
                      )}
                      {(center.city || center.country) && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{[center.city, center.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {center.specialization && (
                        <div className="flex items-center space-x-1">
                          <Stethoscope className="h-3 w-3" />
                          <span>{center.specialization}</span>
                        </div>
                      )}
                      {center.address && (
                        <div className="text-xs opacity-75">{center.address}</div>
                      )}
                    </div>
                    {(center.email || center.phone || center.website) && (
                      <div className="flex items-center space-x-4 mt-2 pt-2 border-t border-[var(--color-divider-gray)]">
                        {center.email && (
                          <a href={`mailto:${center.email}`} className="flex items-center space-x-1 text-xs text-[var(--color-primary-teal)] hover:underline">
                            <Mail className="h-3 w-3" />
                            <span>Email</span>
                          </a>
                        )}
                        {center.phone && (
                          <a href={`tel:${center.phone}`} className="flex items-center space-x-1 text-xs text-[var(--color-primary-teal)] hover:underline">
                            <Phone className="h-3 w-3" />
                            <span>Phone</span>
                          </a>
                        )}
                        {center.website && (
                          <a href={center.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-xs text-[var(--color-primary-teal)] hover:underline">
                            <Globe className="h-3 w-3" />
                            <span>Website</span>
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

export default ClinicalCentersPage;

