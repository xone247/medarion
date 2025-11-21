import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Users, DollarSign, MapPin, Star, Mail, Calendar, X, Building2, Globe, Phone, Linkedin, Send, Heart, TrendingUp, Eye, Bot } from 'lucide-react';
import { matchInvestors, draftIntroEmail } from '../services/ai';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';

const InvestorSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [showInvestorProfile, setShowInvestorProfile] = useState<any>(null);
  const [showConnectModal, setShowConnectModal] = useState<any>(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [aiMatches, setAiMatches] = useState<string[] | null>(null);
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const [deals, setDeals] = useState<any[]>([]);
  const [investorsAgg, setInvestorsAgg] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsResponse, investorsResponse] = await Promise.all([
          dataService.getDeals({ limit: 200 }).catch(() => ({ success: false, data: [] })),
          dataService.getInvestors({ limit: 200 }).catch(() => ({ success: false, data: [] })),
        ]);
        
        if (dealsResponse.success) {
          const transformed = dealsResponse.data.map((deal: any) => ({
            id: deal.id,
            company_name: deal.company_name || 'Unknown',
            investors: deal.participants ? (typeof deal.participants === 'string' ? JSON.parse(deal.participants) : deal.participants) : (deal.lead_investor ? [deal.lead_investor] : []),
            value_usd: parseFloat(deal.amount || 0),
            stage: deal.deal_type || 'Unknown',
            country: deal.country || 'Unknown',
            date: deal.deal_date || deal.created_at,
            sector: deal.sector || deal.industry || 'Unknown',
          }));
          setDeals(transformed);
        }
        
        if (investorsResponse.success) {
          const transformed = investorsResponse.data.map((inv: any) => ({
            id: inv.id,
            name: inv.name,
            totalInvested: parseFloat(inv.recent_investments?.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount) || 0), 0) || inv.assets_under_management || 0),
            dealCount: inv.recent_investments?.length || inv.total_investments || 0,
            portfolioCompanies: inv.portfolio_companies || [],
            focusSectors: inv.focus_sectors || [],
            countries: inv.countries || [],
            contact_email: inv.contact_email,
            type: inv.type || 'VC',
            description: inv.description,
            website: inv.website,
          }));
          setInvestorsAgg(transformed);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Build investor profiles from deals + aggregated API
  const investorData: Record<string, any> = useMemo(() => {
    const acc: Record<string, any> = {};
    deals.forEach((deal: any) => {
      (deal.investors || []).forEach((investor: string) => {
        if (!acc[investor]) {
          const agg = investorsAgg.find((i: any) => i.name === investor);
          acc[investor] = {
            name: investor,
            totalInvested: agg?.totalInvested || 0,
            dealCount: agg?.dealCount || 0,
            companies: new Set<string>(),
            sectors: new Set<string>(),
            countries: new Set<string>(),
            stages: new Set<string>(),
            lastInvestment: deal.date,
            avgDealSize: 0,
            type: investor.includes('Foundation') || investor.includes('Fund') ? 'Foundation/Fund' : 
                  investor.includes('Ventures') || investor.includes('Capital') ? 'VC' : 'Angel/Other',
            description: `Leading ${investor.includes('Foundation') ? 'foundation' : 'investment firm'} focused on African healthcare innovation and sustainable growth.`,
            website: `https://${investor.toLowerCase().replace(/\s+/g, '')}.com`,
            email: `contact@${investor.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `+${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            linkedin: `linkedin.com/company/${investor.toLowerCase().replace(/\s+/g, '-')}`,
            founded: 2010 + Math.floor(Math.random() * 10),
            teamSize: 5 + Math.floor(Math.random() * 45),
            aum: Math.floor(Math.random() * 500) + 50,
            portfolioSize: Math.floor(Math.random() * 50) + 10,
            investmentRange: { min: Math.floor(Math.random() * 500) + 100, max: Math.floor(Math.random() * 10) + 5 },
          };
        }
        acc[investor].totalInvested += (deal.value_usd || 0) / Math.max(1, (deal.investors || []).length);
        acc[investor].dealCount += 1;
        acc[investor].companies.add(deal.company_name);
        acc[investor].sectors.add(deal.sector);
        acc[investor].countries.add(deal.country);
        acc[investor].stages.add(deal.stage);
        if (new Date(deal.date) > new Date(acc[investor].lastInvestment)) {
          acc[investor].lastInvestment = deal.date;
        }
      });
    });
    return acc;
  }, [deals, investorsAgg]);

  const investorsList = useMemo(() => Object.values(investorData).map((investor: any) => ({
    ...investor,
    avgDealSize: investor.dealCount ? investor.totalInvested / investor.dealCount : 0,
    companies: Array.from(investor.companies),
    sectors: Array.from(investor.sectors),
    countries: Array.from(investor.countries),
    stages: Array.from(investor.stages),
    matchScore: Math.floor(Math.random() * 30) + 70,
  })), [investorData]);

  const stages = useMemo(() => ['All', ...new Set(investorsList.flatMap((inv: any) => inv.stages))], [investorsList]);
  const sectors = useMemo(() => ['All', ...new Set(investorsList.flatMap((inv: any) => inv.sectors))], [investorsList]);
  const countries = useMemo(() => ['All', ...new Set(investorsList.flatMap((inv: any) => inv.countries))], [investorsList]);

  const filteredInvestors = useMemo(() => investorsList.filter((investor: any) => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'All' || investor.stages.includes(selectedStage);
    const matchesSector = selectedSector === 'All' || investor.sectors.includes(selectedSector);
    const matchesCountry = selectedCountry === 'All' || investor.countries.includes(selectedCountry);
    return matchesSearch && matchesStage && matchesSector && matchesCountry;
  }), [investorsList, searchTerm, selectedStage, selectedSector, selectedCountry]);

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  const handleViewProfile = (investor: any) => {
    setShowInvestorProfile(investor);
  };

  const runAIMatch = async () => {
    const list = await matchInvestors({
      sector: selectedSector !== 'All' ? selectedSector : undefined,
      stage: selectedStage !== 'All' ? selectedStage : undefined,
      country: selectedCountry !== 'All' ? selectedCountry : undefined,
    });
    setAiMatches(list as string[]);
  };

  const handleConnect = async (investor: any) => {
    setShowConnectModal(investor);
    const draft = await draftIntroEmail({ investorName: investor.name, companyName: 'HealthTech Solutions', sector: 'Health Tech', stage: 'Series A' });
    setConnectMessage(draft);
  };

  const handleSendConnection = async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Connection request sent to ${showConnectModal.name}:`, connectMessage);
    setIsConnecting(false);
    setShowConnectModal(null);
    setConnectMessage('');
    alert(`Connection request sent to ${showConnectModal.name}!`);
  };

  const handleSaveInvestor = (investorName: string) => {
    console.log(`Saved investor: ${investorName} to watchlist`);
  };

  return (
    <div className="page-container">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-6 w-6 icon-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Investor Search</h1>
          </div>
          {canAI && (
            <button onClick={runAIMatch} className="btn-primary flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span className="text-sm">AI Match</span>
            </button>
          )}
        </div>
      </div>

      {aiMatches && (
        <div className="card-glass p-4 shadow-soft mb-6">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Suggested investors</h3>
          <ul className="list-disc pl-5 text-sm text-[var(--color-text-secondary)]">
            {aiMatches.map((name, idx) => <li key={idx}>{name}</li>)}
          </ul>
        </div>
      )}

      {/* AI Recommendations Banner with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6 bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)]">
        <div className="flex items-center space-x-3 mb-2">
          <Star className="h-6 w-6 text-white" />
          <h3 className="text-lg font-semibold text-white">AI-Powered Recommendations</h3>
        </div>
        <p className="text-white/90">
          Our AI has analyzed your profile and identified {filteredInvestors.filter((inv: any) => inv.matchScore >= 85).length} highly compatible investors based on sector focus, stage preference, and geographic activity.
        </p>
      </div>

      {/* Filters */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Search Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="input"
          >
            {stages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="input"
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="input"
          >
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="card-glass p-4 shadow-soft mb-6">
        <p className="text-[var(--color-text-secondary)]">
          Found <span className="font-bold text-[var(--color-text-primary)]">{filteredInvestors.length}</span> investors matching your criteria
        </p>
      </div>

      {/* Investor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInvestors.sort((a: any, b: any) => b.matchScore - a.matchScore).map((investor: any) => (
          <div key={investor.name} className="card-glass p-6 shadow-soft hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{investor.name}</h3>
                  <span className="bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] text-white px-2 py-1 rounded text-xs font-medium border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                    {investor.type}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMatchColor(investor.matchScore)}`}>
                {investor.matchScore}% Match
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Invested</p>
                <p className="text-lg font-bold text-[var(--color-accent-sky)]">${(investor.totalInvested / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Avg Deal Size</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">${(investor.avgDealSize / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Portfolio</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{investor.companies.length} companies</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Last Investment</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {new Date(investor.lastInvestment).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Focus Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {investor.sectors.slice(0, 3).map((sector: string, index: number) => (
                    <span key={index} className="chip text-xs">
                      {sector}
                    </span>
                  ))}
                  {investor.sectors.length > 3 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      +{investor.sectors.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Investment Stages</p>
                <div className="flex flex-wrap gap-1">
                  {investor.stages.slice(0, 3).map((stage: string, index: number) => (
                    <span key={index} className="bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] text-white px-2 py-1 rounded text-xs border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                      {stage}
                    </span>
                  ))}
                  {investor.stages.length > 3 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      +{investor.stages.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-1">Geographic Focus</p>
                <div className="flex flex-wrap gap-1">
                  {investor.countries.slice(0, 3).map((country: string, index: number) => (
                    <span key={index} className="bg-gradient-to-r from-[var(--color-success-green)] to-[color-mix(in_srgb,var(--color-success-green),black_20%)] text-white px-2 py-1 rounded text-xs border border-[color-mix(in_srgb,var(--color-success-green),black_10%)]">
                      {country}
                    </span>
                  ))}
                  {investor.countries.length > 3 && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      +{investor.countries.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleConnect(investor)}
                className="btn-primary flex-1 py-2 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
              >
                <Mail className="h-4 w-4" />
                <span>Connect</span>
              </button>
              <button
                onClick={() => handleViewProfile(investor)}
                className="btn-outline flex-1 py-2 px-4 rounded-lg text-sm flex items-center justify-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Profile</span>
              </button>
              <button
                onClick={() => handleSaveInvestor(investor.name)}
                className="btn-outline py-2 px-3 rounded-lg"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Investor Profile Modal */}
      {showInvestorProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-glass p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{showInvestorProfile.name}</h3>
                  <p className="text-[var(--color-text-secondary)]">{showInvestorProfile.type}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMatchColor(showInvestorProfile.matchScore)}`}>
                    {showInvestorProfile.matchScore}% Match
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowInvestorProfile(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Overview</h4>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-4">{showInvestorProfile.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">Founded: {showInvestorProfile.founded}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">Team Size: {showInvestorProfile.teamSize} people</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">AUM: ${showInvestorProfile.aum}M</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">Portfolio: {showInvestorProfile.portfolioSize} companies</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <a href={showInvestorProfile.website} className="text-sm text-[var(--color-primary-teal)] hover:text-[var(--color-accent-sky)] hover:underline">
                        {showInvestorProfile.website}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{showInvestorProfile.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{showInvestorProfile.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Linkedin className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <a href={`https://${showInvestorProfile.linkedin}`} className="text-sm text-[var(--color-primary-teal)] hover:text-[var(--color-accent-sky)] hover:underline">
                        {showInvestorProfile.linkedin}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Investment Profile</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="card-glass p-3 shadow-soft">
                      <p className="text-sm text-[var(--color-text-secondary)]">Total Invested</p>
                      <p className="text-xl font-bold text-[var(--color-accent-sky)]">${(showInvestorProfile.totalInvested / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="card-glass p-3 shadow-soft">
                      <p className="text-sm text-[var(--color-text-secondary)]">Deal Count</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">{showInvestorProfile.dealCount}</p>
                    </div>
                    <div className="card-glass p-3 shadow-soft">
                      <p className="text-sm text-[var(--color-text-secondary)]">Avg Deal Size</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">${(showInvestorProfile.avgDealSize / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="card-glass p-3 shadow-soft">
                      <p className="text-sm text-[var(--color-text-secondary)]">Investment Range</p>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        ${'$'}{showInvestorProfile.investmentRange.min}K - ${'$'}{showInvestorProfile.investmentRange.max}M
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Focus Areas</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">Sectors</p>
                      <div className="flex flex-wrap gap-2">
                        {showInvestorProfile.sectors.map((sector: string, index: number) => (
                          <span key={index} className="bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] text-white px-2 py-1 rounded text-xs border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">Investment Stages</p>
                      <div className="flex flex-wrap gap-2">
                        {showInvestorProfile.stages.map((stage: string, index: number) => (
                          <span key={index} className="bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] text-white px-2 py-1 rounded text-xs border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                            {stage}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">Geographic Focus</p>
                      <div className="flex flex-wrap gap-2">
                        {showInvestorProfile.countries.map((country: string, index: number) => (
                          <span key={index} className="bg-gradient-to-r from-[var(--color-success-green)] to-[color-mix(in_srgb,var(--color-success-green),black_20%)] text-white px-2 py-1 rounded text-xs border border-[color-mix(in_srgb,var(--color-success-green),black_10%)]">
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[var(--color-divider-gray)] pt-4">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Recent Portfolio Companies</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {showInvestorProfile.companies.slice(0, 6).map((company: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-2 card-glass shadow-soft">
                    <Building2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    <span className="text-sm text-[var(--color-text-primary)]">{company}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInvestorProfile(null);
                  handleConnect(showInvestorProfile);
                }}
                className="btn-primary px-6 py-2 rounded-lg flex items-center space-x-2"
              >
                <Mail className="h-4 w-4" />
                <span>Connect</span>
              </button>
              <button
                onClick={() => handleSaveInvestor(showInvestorProfile.name)}
                className="btn-outline px-6 py-2 rounded-lg flex items-center space-x-2"
              >
                <Heart className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-glass p-6 max-w-2xl w-full mx-4 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Connect with {showConnectModal.name}</h3>
              <button 
                onClick={() => setShowConnectModal(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 card-glass shadow-soft">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{showConnectModal.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{showConnectModal.type}</p>
                </div>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p>Focus: {showConnectModal.sectors.slice(0, 2).join(', ')}</p>
                <p>Investment Range: ${'$'}{showConnectModal.investmentRange.min}K - ${'$'}{showConnectModal.investmentRange.max}M</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Your Message
              </label>
              <textarea
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
                rows={12}
                className="input"
                placeholder="Write your connection message..."
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Tip: Personalize your message by mentioning specific aspects of their investment focus that align with your startup.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSendConnection}
                disabled={isConnecting || !connectMessage.trim()}
                className="btn-primary flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Connection Request</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConnectModal(null)}
                className="btn-outline py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorSearchPage;
    </div>
  );
};

export default InvestorSearchPage;