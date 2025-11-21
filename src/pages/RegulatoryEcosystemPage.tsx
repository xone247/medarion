import React, { useState, useEffect } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { Globe, Building2, MapPin, ExternalLink, Loader2, Bot, FileDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));

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
  const bodiesByCountry = regulatoryBodies.reduce((acc, body) => {
    const country = body.country || 'Unknown';
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(body);
    return acc;
  }, {} as Record<string, RegulatoryBody[]>);

  const exportJSON = () => { try { const data = { count: regulatoryBodies.length, countries: Object.keys(bodiesByCountry).length, bodies: regulatoryBodies, exportedAt: new Date().toISOString() }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='regulatory_ecosystem.json'; a.click(); URL.revokeObjectURL(a.href);} catch {} };
  const copyJSON = async () => { try { const data = { count: regulatoryBodies.length, countries: Object.keys(bodiesByCountry).length, bodies: regulatoryBodies, exportedAt: new Date().toISOString() }; const text=JSON.stringify(data,null,2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} alert('Copied regulatory ecosystem JSON to clipboard'); } catch {} };
  const runAISummary = () => { try { const countries = Object.keys(bodiesByCountry).length; const bodies = regulatoryBodies.length; setAiSummary(`Regulatory bodies: ${bodies} • Countries: ${countries}`); } catch { setAiSummary('No data available'); } };

  return (
    <div className="page-container">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Globe className="h-6 w-6 icon-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Regulatory Ecosystem</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canAI && <button onClick={runAISummary} className="btn-primary-elevated btn-sm flex items-center gap-2"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
            <button onClick={copyJSON} className="btn-outline btn-sm">Copy</button>
            <button onClick={exportJSON} className="btn-outline btn-sm"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 shadow-soft mb-6">
          <div className="text-sm text-[var(--color-text-primary)]">{aiSummary}</div>
        </div>
      )}

      {/* Overview Section with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Overview</h3>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Overview of regulatory bodies across Africa. Click countries on the map to view details.
          {regulatoryBodies.length > 0 && (
            <span className="ml-2 text-[var(--color-primary-teal)] font-semibold">
              {regulatoryBodies.length} regulatory bodies
            </span>
          )}
        </p>
      </div>

      {/* Interactive Map with glassmorphism */}
      <div className="card-glass overflow-hidden shadow-soft mb-6">
        <div className="p-6 border-b border-[var(--color-divider-gray)]">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 icon-primary" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regulatory Bodies Map</h3>
          </div>
        </div>
        <InteractiveMap title="" dataType="value" height={360} />
      </div>

      {/* Regulatory Bodies List with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Key Regulatory Bodies</h3>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary-teal)]" />
            <span className="ml-2 text-[var(--color-text-secondary)]">Loading regulatory bodies...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && regulatoryBodies.length === 0 && (
          <div className="p-4 text-center text-[var(--color-text-secondary)]">
            No regulatory bodies found in the database.
          </div>
        )}

        {!loading && !error && regulatoryBodies.length > 0 && (
          <div className="space-y-6">
            {Object.entries(bodiesByCountry).sort().map(([country, bodies]) => (
              <div key={country} className="space-y-3">
                <h4 className="text-md font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-divider-gray)] pb-2">
                  {country} ({bodies.length})
                </h4>
                <div className="space-y-3">
                  {bodies.map((body) => (
                    <div key={body.id} className="card-glass p-4 shadow-soft">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)] flex-shrink-0">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="font-semibold text-[var(--color-text-primary)]">{body.name}</div>
                            {(body.abbreviation || body.acronym) && (
                              <span className="text-xs bg-[var(--color-background-default)] px-2 py-1 rounded text-[var(--color-text-secondary)]">
                                {body.abbreviation || body.acronym}
                              </span>
                            )}
                          </div>
                          {body.description && (
                            <div className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                              {body.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-[var(--color-text-secondary)]">
                            {body.type && (
                              <span className="capitalize">{body.type}</span>
                            )}
                            {body.website && (
                              <a
                                href={body.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 text-[var(--color-primary-teal)] hover:underline"
                              >
                                <span>Website</span>
                                <ExternalLink className="h-3 w-3" />
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