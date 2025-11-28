import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, DollarSign, Microscope, FileCheck, MapPin, Users, Calendar, ExternalLink, TrendingUp, Award, Handshake, Globe } from 'lucide-react';
import { apiService } from '../services/apiService';
import { dealStageToVar, badgeClassesFromVar } from '../lib/badges';

interface CompanyProfileProps {
  companyName: string;
  onBack: () => void;
}

interface CompanyData {
  id: number;
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  sector?: string;
  industry?: string;
  stage?: string;
  country?: string;
  headquarters?: string;
  founded_year?: number;
  employees_count?: number;
  total_funding?: number;
  last_funding_date?: string;
  funding_stage?: string;
  investors?: string | any[];
  products?: string | any[];
  markets?: string | any[];
  achievements?: string | any[];
  partnerships?: string | any[];
  awards?: string | any[];
}

interface Deal {
  id: number;
  deal_type: string;
  amount: number;
  deal_date: string;
  lead_investor?: string;
  participants?: string | any[];
  description?: string;
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyName, onBack }) => {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const fetchCompanyData = async () => {
      setLoading(true);
      try {
        // Fetch company data
        const companyResponse = await apiService.get('/admin/companies', { 
          all: 'true',
          search: companyName 
        });
        
        if (companyResponse.success && companyResponse.data && Array.isArray(companyResponse.data)) {
          const foundCompany = companyResponse.data.find((c: any) => 
            c.name === companyName || c.name.toLowerCase() === companyName.toLowerCase()
          );
          
          if (foundCompany) {
            // Check if company has sufficient data for a profile
            const hasEnoughData = 
              foundCompany.description ||
              foundCompany.total_funding > 0 ||
              foundCompany.founded_year ||
              foundCompany.website ||
              foundCompany.logo_url;
            
            if (hasEnoughData) {
              setCompany(foundCompany);
              setHasProfile(true);
              
              // Fetch deals for this company
              try {
                const dealsResponse = await apiService.get('/admin/deals', {
                  all: 'true',
                  company_id: foundCompany.id
                });
                
                if (dealsResponse.success && dealsResponse.data && Array.isArray(dealsResponse.data)) {
                  const companyDeals = dealsResponse.data.filter((d: any) => 
                    d.company_id === foundCompany.id || 
                    d.company_name === foundCompany.name
                  );
                  setDeals(companyDeals);
                }
              } catch (error) {
                console.error('Error fetching deals:', error);
              }
            } else {
              setHasProfile(false);
            }
          } else {
            setHasProfile(false);
          }
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanyData();
  }, [companyName]);

  // Parse JSON fields
  const parseJsonField = (field: string | any[] | null | undefined): any[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      const parsed = typeof field === 'string' ? JSON.parse(field) : field;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const investors = parseJsonField(company?.investors);
  const products = parseJsonField(company?.products);
  const markets = parseJsonField(company?.markets);
  const achievements = parseJsonField(company?.achievements);
  const partnerships = parseJsonField(company?.partnerships);
  const awards = parseJsonField(company?.awards);

  const totalFunding = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0) || company?.total_funding || 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!hasProfile || !company) {
    return (
      <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={onBack} className="btn-outline p-2 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-medium text-slate-700 dark:text-slate-200">{companyName}</h1>
        </div>
        
        <div className="card-glass p-8 rounded-lg text-center max-w-2xl mx-auto">
          <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-2">Profile Not Available</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This company doesn't have sufficient data to display a profile yet. 
            We're continuously adding more company information to the platform.
          </p>
          <button onClick={onBack} className="btn-primary-elevated px-6 py-2 rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="btn-outline p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-4 flex-1">
          {company.logo_url ? (
            <img 
              src={company.logo_url} 
              alt={company.name} 
              className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center border-2 border-cyan-600/20 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-medium text-slate-700 dark:text-slate-200 mb-2">{company.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {company.sector && (
                <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                  {company.sector}
                </span>
              )}
              {company.stage && company.stage !== 'Unknown' && (
                <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                  {company.stage}
                </span>
              )}
              {company.country && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span>{company.country}</span>
                </div>
              )}
              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <div className="card-glass p-6 rounded-lg">
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{company.description}</p>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {totalFunding > 0 && (
          <div className="card-glass p-4 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Funding</p>
            <p className="text-2xl font-medium text-cyan-600 dark:text-cyan-400">${(totalFunding / 1000000).toFixed(1)}M</p>
          </div>
        )}
        {deals.length > 0 && (
          <div className="card-glass p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Funding Rounds</p>
            <p className="text-2xl font-medium text-slate-700 dark:text-slate-200">{deals.length}</p>
          </div>
        )}
        {investors.length > 0 && (
          <div className="card-glass p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Investors</p>
            <p className="text-2xl font-medium text-slate-700 dark:text-slate-200">{investors.length}</p>
          </div>
        )}
        {company.founded_year && (
          <div className="card-glass p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/30">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Founded</p>
            <p className="text-2xl font-medium text-slate-700 dark:text-slate-200">{company.founded_year}</p>
          </div>
        )}
      </div>

      {/* Company Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Rounds */}
        {deals.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Funding Rounds
            </h2>
            <div className="space-y-3">
              {deals
                .sort((a, b) => new Date(b.deal_date || '').getTime() - new Date(a.deal_date || '').getTime())
                .map((deal, index) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{deal.deal_type || 'Funding Round'}</span>
                    <span className="text-lg font-medium text-cyan-600 dark:text-cyan-400">
                      ${deal.amount ? (deal.amount / 1000000).toFixed(1) + 'M' : 'N/A'}
                    </span>
                  </div>
                  {deal.deal_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(deal.deal_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  {deal.lead_investor && (
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Lead: <span className="font-medium">{deal.lead_investor}</span>
                    </div>
                  )}
                  {deal.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{deal.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investors */}
        {investors.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Investors ({investors.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {investors.map((investor, index) => (
                <span 
                  key={index} 
                  className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 font-medium"
                >
                  {investor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Products & Services
            </h2>
            <ul className="space-y-2">
              {products.map((product, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                  <span>{product}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Markets */}
        {markets.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Markets
            </h2>
            <div className="flex flex-wrap gap-2">
              {markets.map((market, index) => (
                <span 
                  key={index} 
                  className="bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {market}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Achievements
            </h2>
            <ul className="space-y-2">
              {achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Partnerships */}
        {partnerships.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Handshake className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Partnerships
            </h2>
            <ul className="space-y-2">
              {partnerships.map((partnership, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{partnership}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Awards */}
        {awards.length > 0 && (
          <div className="card-glass p-6 rounded-lg">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Awards & Recognition
            </h2>
            <ul className="space-y-2">
              {awards.map((award, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                  <span>{award}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {company.headquarters && (
          <div className="card-glass p-4 rounded-lg">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Headquarters</p>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">{company.headquarters}</p>
          </div>
        )}
        {company.employees_count && (
          <div className="card-glass p-4 rounded-lg">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Employees</p>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">{company.employees_count.toLocaleString()}</p>
          </div>
        )}
        {company.last_funding_date && (
          <div className="card-glass p-4 rounded-lg">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Last Funding</p>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">
              {new Date(company.last_funding_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
        {company.funding_stage && (
          <div className="card-glass p-4 rounded-lg">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Funding Stage</p>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">{company.funding_stage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
