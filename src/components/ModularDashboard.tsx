import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDashboard } from '../contexts/DashboardContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { ACCESS_MATRIX } from '../types/accessControl';
import { 
  Grid3X3, 
  TrendingUp, 
  Users, 
  Building2, 
  Activity,
  BarChart3,
  DollarSign,
  LineChart,
  MessageSquare,
  FileCheck,
  Microscope,
  User,
  PieChart,
  Search,
  Square,
  Map as MapIcon,
  Globe,
  Target,
  Shield,
  Heart,
  BookOpen,
  Calendar,
  Settings,
  Bot,
  Megaphone as MegaphoneIcon,
  Newspaper as NewspaperIcon
} from 'lucide-react';

// Import all module components
import InvestorOverview from '../pages/InvestorOverview';
import StartupDashboard from '../pages/StartupDashboard';
import DealsPage from '../pages/DealsPage';
import GrantsPage from '../pages/GrantsPage';
import PublicMarkets from '../pages/PublicMarkets';
import CompaniesPage from '../pages/CompaniesPage';
import InvestorsPage from '../pages/InvestorsPage';
import FundraisingCRMPage from '../pages/FundraisingCRMPage';
import RegulatoryPage from '../pages/RegulatoryPage';
import ClinicalTrialsPage from '../pages/ClinicalTrialsPage';
import NationPulsePage from '../pages/NationPulsePage';
import StartupProfile from '../pages/StartupProfile';
import InvestorProfile from '../pages/InvestorProfile';
import ExecutiveProfile from '../pages/ExecutiveProfile';
import ResearcherProfile from '../pages/ResearcherProfile';
import RegulatorProfile from '../pages/RegulatorProfile';
import RegulatorDashboard from '../pages/RegulatorDashboard';
import StartupAnalyticsPage from '../pages/StartupAnalyticsPage';
import InteractiveMap from '../components/InteractiveMap';
import MonthlyDealflowChart from '../components/MonthlyDealflowChart';
import AIToolsPage from '../pages/AIToolsPage';
import ClinicalCentersPage from '../pages/ClinicalCentersPage';
import InvestigatorsPage from '../pages/InvestigatorsPage';
import GlossaryPage from '../pages/GlossaryPage';
import RegulatoryEcosystemPage from '../pages/RegulatoryEcosystemPage';
import BlogManagerDashboard from '../pages/BlogManagerDashboard';
import AdSlot from './AdSlot';
import ConsultingScheduler from './ConsultingScheduler';
import UsersManagerDashboard from '../pages/UsersManagerDashboard';
import AdsManagerDashboard from '../pages/AdsManagerDashboard';
import TopDealsWidget from './TopDealsWidget';
import MostActiveInvestorsWidget from './MostActiveInvestorsWidget';
import HealthcareMarketWidget from './HealthcareMarketWidget';
import SectorTreemap from './SectorTreemap';
import DealsByStageChart from './DealsByStageChart';
import DealsBySectorChart from './DealsBySectorChart';
import VCInvestmentOverTimeChart from './VCInvestmentOverTimeChart';
import RegionalTrendsChart from './RegionalTrendsChart';
import MonthlyGrantChart from './MonthlyGrantChart';
import KPICard from './KPICard';
import { dataService } from '../services/dataService';

interface ModularDashboardProps {
  onViewCompany?: (companyName: string) => void;
}

const ModularDashboard: React.FC<ModularDashboardProps> = ({ onViewCompany }) => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { 
    moduleOrder, 
    getModuleById, 
    currentModule, 
    showDashboardSummary,
    setCurrentModule,
    setShowDashboardSummary,
    availableModules: dashboardAvailableModules
  } = useDashboard();
  const { availableModules: navigationAvailableModules, navigateToModule } = useNavigation();
  const { profile } = useAuth();
  const profileWithAdmin = profile as any;
  const canSuper = !!(profileWithAdmin && (profileWithAdmin.is_admin || profileWithAdmin.app_roles?.includes('super_admin')));

  // Set current module from URL param if it exists
  useEffect(() => {
    if (moduleId && moduleId !== currentModule) {
      setCurrentModule(moduleId);
      setShowDashboardSummary(false);
    }
  }, [moduleId, currentModule, setCurrentModule, setShowDashboardSummary]);

  useEffect(() => {
		const handleCompanyNav = (e: any) => {
			const name = e?.detail?.name as string | undefined;
			if (!name) return;
			try {
				// Switch to Companies module
				setCurrentModule('companies');
				setShowDashboardSummary(false);
				// Open company profile if callback exists
				if (onViewCompany) onViewCompany(name);
			} catch {}
		};
		const handleOrgNav = (e: any) => {
			const name = e?.detail?.name as string | undefined;
			if (!name) return;
			try {
				setCurrentModule('companies');
				setShowDashboardSummary(false);
				if (onViewCompany) onViewCompany(name);
			} catch {}
		};
		window.addEventListener('medarion:navigate:company' as any, handleCompanyNav as any);
		window.addEventListener('medarion:navigate:organization' as any, handleOrgNav as any);
		return () => {
			window.removeEventListener('medarion:navigate:company' as any, handleCompanyNav as any);
			window.removeEventListener('medarion:navigate:organization' as any, handleOrgNav as any);
		};
	}, [onViewCompany, setCurrentModule, setShowDashboardSummary]);

  // Simple filters affecting summary
  const [summaryFilters, setSummaryFilters] = React.useState<{ sector?: string; country?: string; stage?: string; timeframe?: string }>({ timeframe: '12m' });
  const applyFilters = React.useCallback((arr: any[]) => {
    const monthsBack = (() => {
      switch (summaryFilters.timeframe) {
        case '3m': return 3; case '6m': return 6; case '12m': return 12; case '24m': return 24; default: return 120;
      }
    })();
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - monthsBack);
    return arr.filter((d) => {
      const okSector = !summaryFilters.sector || d.sector === summaryFilters.sector;
      const okCountry = !summaryFilters.country || d.country === summaryFilters.country;
      const okStage = !summaryFilters.stage || (d.stage || d.type) === summaryFilters.stage;
      const okDate = (() => { if (!d.date) return true; const dt = new Date(d.date); return dt >= cutoff; })();
      return okSector && okCountry && okStage && okDate;
    });
  }, [summaryFilters]);

  // Filter options populated from dataset
  const [filterOptions, setFilterOptions] = React.useState<{ sectors: string[]; countries: string[]; stages: string[] }>({ sectors: [], countries: [], stages: [] });

  const [summary, setSummary] = React.useState<{
    totalInvestment: number;
    dealsCount: number;
    grantsCount: number;
    investorsCount: number;
    companiesCount: number;
    avgDealSize: number;
    topSector: string;
    activeCountries: number;
    monthlySeries: number[];
    topSectors: Array<{ name: string; count: number; pct: number }>;
    topCountries: Array<{ name: string; count: number }>;
  }>({ totalInvestment: 0, dealsCount: 0, grantsCount: 0, investorsCount: 0, companiesCount: 0, avgDealSize: 0, topSector: '-', activeCountries: 0, monthlySeries: [], topSectors: [], topCountries: [] });

  // Summary cards customization
  const [isCustomizeOpen, setIsCustomizeOpen] = React.useState(false);
  const [visibleCards, setVisibleCards] = React.useState<string[]>([]);
  const summaryCardsKey = React.useMemo(() => `medarionSummaryCards_${profile?.id || 'anon'}`,[profile?.id]);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(summaryCardsKey);
      if (raw) setVisibleCards(JSON.parse(raw)); else setVisibleCards(['grants','avgDeal','topSector','activeCountries','pipeline','dataFreshness','yoyGrowth','regionLeaders','sectorShare']);
    } catch {
      setVisibleCards(['grants','avgDeal','topSector','activeCountries','pipeline','dataFreshness','yoyGrowth','regionLeaders','sectorShare']);
    }
  }, [summaryCardsKey]);
  const saveVisibleCards = (next: string[]) => {
    setVisibleCards(next);
    try { localStorage.setItem(summaryCardsKey, JSON.stringify(next)); } catch {}
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Check which modules user has access to
        // Ensure moduleOrder is initialized before checking
        if (!moduleOrder || moduleOrder.length === 0) {
          return; // Wait for modules to initialize
        }
        
        const hasDealflow = moduleOrder.includes('dealflow_tracker');
        const hasGrants = moduleOrder.includes('grant_funding_tracker');
        const hasInvestors = moduleOrder.includes('investors') || moduleOrder.includes('investor_search');
        
        // Only fetch data for modules user has access to
        const [dealsRes, grantsRes, investorsRes] = await Promise.all([
          hasDealflow ? dataService.getDeals({ limit: 200 }).catch(() => ({ success: false, data: [] })) : Promise.resolve({ success: false, data: [] }),
          hasGrants ? dataService.getGrants({ limit: 200 }).catch(() => ({ success: false, data: [] })) : Promise.resolve({ success: false, data: [] }),
          hasInvestors ? dataService.getInvestors({ limit: 200 }).catch(() => ({ success: false, data: [] })) : Promise.resolve({ success: false, data: [] }),
        ]);
        
        // Transform API data to match expected format
        const dealsAll = (dealsRes.data || []).map((d: any) => ({
          id: d.id,
          company_name: d.company_name || 'Unknown',
          investors: d.participants ? (typeof d.participants === 'string' ? JSON.parse(d.participants) : d.participants) : (d.lead_investor ? [d.lead_investor] : []),
          value_usd: parseFloat(d.amount || 0),
          stage: d.deal_type || 'Unknown',
          country: d.country || 'Unknown',
          date: d.deal_date || d.created_at,
          sector: d.sector || d.industry || 'Unknown',
          company_logo: null, // Will be enriched if needed
        }));
        
        const grantsAll = (grantsRes.data || []).map((g: any) => ({
          id: g.id,
          organizationName: g.title || g.funding_agency || 'Unknown',
          value: parseFloat(g.amount || 0),
          type: g.grant_type || 'Research',
          sector: g.sector || 'Healthcare',
          country: g.country || 'Unknown',
          date: g.award_date || g.application_deadline || g.created_at,
        }));
        
        const investorsAll = (investorsRes.data || []).map((inv: any) => ({
          id: inv.id,
          name: inv.name,
          totalInvested: parseFloat(inv.recent_investments?.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount) || 0), 0) || inv.assets_under_management || 0),
          dealCount: inv.recent_investments?.length || inv.total_investments || 0,
          companies: inv.portfolio_companies || [],
          sectors: inv.focus_sectors || [],
          countries: inv.countries || [],
          stages: inv.investment_stages || [],
          lastInvestment: inv.recent_investments?.[0]?.date || null,
        }));
        if (!mounted) return;
        // Populate filter options once from full dataset
        if (filterOptions.sectors.length === 0) {
          try {
            const sec = Array.from(new Set((dealsAll as any[]).map(d=>d.sector).filter(Boolean))).sort();
            const ctry = Array.from(new Set((dealsAll as any[]).map(d=>d.country).filter(Boolean))).sort();
            const stg = Array.from(new Set((dealsAll as any[]).map(d=>(d.stage||d.type)).filter(Boolean))).sort();
            setFilterOptions({ sectors: sec, countries: ctry, stages: stg });
          } catch {}
        }
        const deals = applyFilters(dealsAll as any[]);
        const grants = grantsAll as any[]; // not filtered for now
        const investors = investorsAll as any[]; // not filtered for now
        const totalInvestment = (deals as any[]).reduce((s, d) => s + (d.value_usd || 0), 0);
        const dealsCount = (deals as any[]).length;
        const grantsCount = (grants as any[]).length;
        const investorsCount = (investors as any[]).length;
        const companiesCount = new Set((deals as any[]).map((d) => d.company_name)).size;
        const avgDealSize = dealsCount > 0 ? Math.round(totalInvestment / dealsCount) : 0;
        const sectorCounts = new Map<string, number>();
        const countryCounts = new Set<string>();
        const monthlyMap = new Map<string, number>();
        (deals as any[]).forEach((d) => {
          if (d.sector) sectorCounts.set(d.sector, (sectorCounts.get(d.sector) || 0) + 1);
          if (d.country) countryCounts.add(d.country);
          const ym = (d.date || '').slice(0,7);
          if (ym) monthlyMap.set(ym, (monthlyMap.get(ym) || 0) + 1);
        });
        const sectorSorted = Array.from(sectorCounts.entries()).sort((a,b)=>b[1]-a[1]);
        const topSector = sectorSorted[0]?.[0] || '-';
        const activeCountries = countryCounts.size;
        // Build last 12 months series
        const months: string[] = [];
        const now = new Date();
        const windowMonths = (()=>{ switch(summaryFilters.timeframe){ case '3m': return 3; case '6m': return 6; case '24m': return 24; default: return 12; } })();
        for (let i = windowMonths - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          months.push(ym);
        }
        const monthlySeries = months.map((m)=> monthlyMap.get(m) || 0);
        const totalCounts = sectorSorted.reduce((s, [,c])=>s+c,0) || 1;
        const topSectors = sectorSorted.slice(0,3).map(([name,count])=>({ name, count, pct: Math.round((count/totalCounts)*100) }));
        // Top countries by count
        const countryCountMap = new Map<string, number>();
        (deals as any[]).forEach((d)=>{ if(d.country){ countryCountMap.set(d.country, (countryCountMap.get(d.country)||0)+1); }});
        const topCountries = Array.from(countryCountMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=>({ name, count }));
        setSummary({ totalInvestment, dealsCount, grantsCount, investorsCount, companiesCount, avgDealSize, topSector, activeCountries, monthlySeries, topSectors, topCountries });
      } catch {
        // keep defaults
      }
    })();
    return () => { mounted = false; };
  }, [applyFilters, filterOptions.sectors.length, summaryFilters.timeframe, moduleOrder]);

  const getModuleIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'Grid3X3': Grid3X3,
      'TrendingUp': TrendingUp,
      'Users': Users,
      'Building2': Building2,
      'Activity': Activity,
      'BarChart3': BarChart3,
      'DollarSign': DollarSign,
      'LineChart': LineChart,
      'MessageSquare': MessageSquare,
      'FileCheck': FileCheck,
      'Microscope': Microscope,
      'User': User,
      'PieChart': PieChart,
      'Search': Search,
      'Square': Square,
      'Map': MapIcon,
      'Globe': Globe,
      'Target': Target,
      'Shield': Shield,
      'Heart': Heart,
      'BookOpen': BookOpen,
      'Calendar': Calendar,
      'Settings': Settings,
      'Bot': Bot,
      'Megaphone': MegaphoneIcon,
      'Newspaper': NewspaperIcon
    };
    return iconMap[iconName] || Square;
  };

  const renderModule = (moduleId: string) => {
    // First try to find module in DashboardContext (database modules)
    let module = getModuleById(moduleId);
    
    // If not found, try NavigationContext (hardcoded modules with components)
    if (!module) {
      module = navigationAvailableModules.find(m => m.id === moduleId) as any;
    }
    
    // If still not found, try common ID variations
    if (!module) {
      const idVariations: Record<string, string> = {
        'grants': 'grant_funding_tracker',
        'grant_funding_tracker': 'grants',
        'deals': 'dealflow_tracker',
        'dealflow_tracker': 'deals',
        'companies': 'companies',
        'investors': 'investors',
        'clinical-trials': 'clinical_trials',
        'clinical_trials': 'clinical-trials',
        'nation-pulse': 'nation_pulse',
        'nation_pulse': 'nationpulse',
        'nationpulse': 'nation_pulse',
        'public-markets': 'public_markets',
        'public_markets': 'public-markets',
        'fundraising-crm': 'fundraising_crm',
        'fundraising_crm': 'fundraising-crm',
        'startup-analytics': 'analytics',
        'analytics': 'startup-analytics',
        'ai-tools': 'ai_tools',
        'ai_tools': 'ai-tools',
        'clinical-centers': 'clinical_centers',
        'clinical_centers': 'clinical-centers',
        'regulatory-ecosystem': 'regulatory_ecosystem',
        'regulatory_ecosystem': 'regulatory-ecosystem',
      };
      
      const mappedId = idVariations[moduleId];
      if (mappedId) {
        module = getModuleById(mappedId);
        if (!module) {
          module = navigationAvailableModules.find(m => m.id === mappedId) as any;
        }
      }
    }
    
    // If still not found, render component directly based on moduleId pattern
    if (!module) {
      console.warn(`Module not found: ${moduleId}, attempting direct component render`);
      
      // Direct component mapping as last resort
      const directComponentMap: Record<string, React.ComponentType<any>> = {
        'companies': CompaniesPage,
        'grants': GrantsPage,
        'deals': DealsPage,
        'investors': InvestorsPage,
        'clinical-trials': ClinicalTrialsPage,
        'clinical_trials': ClinicalTrialsPage,
        'nationpulse': NationPulsePage,
        'nation-pulse': NationPulsePage,
        'nation_pulse': NationPulsePage,
        'public-markets': PublicMarkets,
        'regulatory': RegulatoryPage,
        'fundraising-crm': FundraisingCRMPage,
        'startup-analytics': StartupAnalyticsPage,
        'ai-tools': AIToolsPage,
        'clinical-centers': ClinicalCentersPage,
        'investigators': InvestigatorsPage,
        'regulatory-ecosystem': RegulatoryEcosystemPage,
        'grant_funding_tracker': GrantsPage,
        'dealflow_tracker': DealsPage,
        'public_markets': PublicMarkets,
      };
      
      const DirectComponent = directComponentMap[moduleId];
      if (DirectComponent) {
        return <DirectComponent key={moduleId} onViewCompany={onViewCompany} />;
      }
      
      return (
        <div className="p-6">
          <div className="text-center text-[var(--color-text-secondary)]">
            <p>Module "{moduleId}" not found</p>
          </div>
        </div>
      );
    }

    // Map legacy/new component names to actual component renders
    const componentName = module.component;

    try {
      switch (componentName) {
        case 'Dashboard':
        case 'DashboardOverview':
          return (profile as any)?.user_type === 'startup' ? 
            <StartupDashboard key={moduleId} /> : 
            <InvestorOverview key={moduleId} />;

        case 'DealflowTracker':
        case 'dealflow_tracker':
          return <DealsPage key={moduleId} />;

        case 'GrantFundingTracker':
        case 'grant_funding_tracker':
          return <GrantsPage key={moduleId} />;

        case 'PublicMarkets':
        case 'public_markets':
          return <PublicMarkets key={moduleId} />;

        case 'Companies':
        case 'companies':
          return <CompaniesPage key={moduleId} onViewCompany={onViewCompany || (() => {})} />;

        case 'Investors':
        case 'investors':
          return <InvestorsPage key={moduleId} />;

        case 'FundraisingCRM':
        case 'fundraising_crm':
          return <FundraisingCRMPage key={moduleId} />;

        case 'Regulatory':
        case 'regulatory':
          return <RegulatoryPage key={moduleId} />;

        case 'ClinicalTrials':
        case 'clinical_trials':
          return <ClinicalTrialsPage key={moduleId} />;

        case 'NationPulse':
        case 'nation_pulse':
          return <NationPulsePage key={moduleId} />;

        case 'StartupProfile':
        case 'MyProfile':
        case 'my_profile':
          const profileType = (profile as any)?.user_type;
          if (profileType === 'startup') return <StartupProfile key={moduleId} />;
          if (profileType === 'investors_finance') return <InvestorProfile key={moduleId} />;
          if (profileType === 'industry_executives') return <ExecutiveProfile key={moduleId} />;
          if (profileType === 'health_science_experts') return <ResearcherProfile key={moduleId} />;
          if (profileType === 'regulator') return <RegulatorProfile key={moduleId} />;
          // Fallback to role-based selection
          const role = (profile as any)?.role || (profile as any)?.user_type || 'startup';
          if (role === 'startup') return <StartupProfile key={moduleId} />;
          if (role === 'investor' || role === 'investors_finance') return <InvestorProfile key={moduleId} />;
          if (role === 'industry_executives') return <ExecutiveProfile key={moduleId} />;
          if (role === 'researcher' || role === 'health_science_experts') return <ResearcherProfile key={moduleId} />;
          if (role === 'regulator') return <RegulatorProfile key={moduleId} />;
          return (
            <div className="p-6">
              <div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
                <p>Profile is not available for this role yet.</p>
              </div>
            </div>
          );

        case 'RegulatorDashboard':
        case 'regulator-dashboard':
          return <RegulatorDashboard key={moduleId} />;

        case 'StartupAnalytics':
        case 'Analytics':
        case 'analytics':
          if ((profile as any)?.user_type === 'startup') return <StartupAnalyticsPage key={moduleId} />;
          return (
            <div className="p-6">
              <div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
                <p>Analytics is available for Startup accounts.</p>
              </div>
            </div>
          );


        case 'InteractiveMap':
          return <InteractiveMap key={moduleId} />;

        case 'MonthlyDealflowChart':
          return <MonthlyDealflowChart key={moduleId} />;

        case 'AITools':
        case 'ai_tools':
          {
            const role = (profile as any)?.user_type;
            const tier = (profile as any)?.account_tier || 'free';
            const node: any = (ACCESS_MATRIX as any)?.[role]?.[tier];
            const canAI = !!node?.aiEnabled;
            if (canAI) return <AIToolsPage key={moduleId} />;
            return (
              <div className="p-6">
                <div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
                  <p>AI Tools are not available for your plan. Please upgrade to access this feature.</p>
                </div>
              </div>
            );
          }

        case 'ClinicalCenters':
        case 'clinical_centers':
          return <ClinicalCentersPage key={moduleId} />;

        case 'Investigators':
        case 'investigators':
          return <InvestigatorsPage key={moduleId} />;

        case 'Glossary':
        case 'glossary':
          return <GlossaryPage key={moduleId} />;

        case 'RegulatoryEcosystem':
        case 'regulatory_ecosystem':
          return <RegulatoryEcosystemPage key={moduleId} />;

        case 'BlogManager':
        case 'BlogManagerDashboard':
        case 'blog_manager':
          return <BlogManagerDashboard key={moduleId} />;

        case 'AdSlot':
          return <AdSlot key={moduleId} placement="dashboard_inline" category="dashboard_personalized" />;

        case 'ConsultingScheduler':
        case 'fundraising_crm_scheduler':
          return <ConsultingScheduler key={moduleId} />;



        case 'UsersManagerDashboard':
        case 'users_manager':
          return <UsersManagerDashboard key={moduleId} />;

        case 'AdsManagerDashboard':
        case 'ads_manager':
          return <AdsManagerDashboard key={moduleId} />;

        case 'TopDealsWidget':
        case 'recent-deals':
          return <TopDealsWidget key={moduleId} />;

        case 'MostActiveInvestorsWidget':
        case 'most-active-investors':
          return <MostActiveInvestorsWidget key={moduleId} />;

        case 'HealthcareMarketWidget':
        case 'healthcare-market':
          return <HealthcareMarketWidget key={moduleId} />;

        case 'SectorTreemap':
        case 'sector-treemap':
          return <SectorTreemap key={moduleId} />;

        case 'DealsByStageChart':
        case 'deals-by-stage':
          return <DealsByStageChart key={moduleId} />;

        case 'DealsBySectorChart':
        case 'deals-by-sector':
          return <DealsBySectorChart key={moduleId} />;

        case 'VCInvestmentOverTimeChart':
        case 'vc-investment-timeline':
          return <VCInvestmentOverTimeChart key={moduleId} />;

        case 'RegionalTrendsChart':
        case 'regional-trends':
          return <RegionalTrendsChart key={moduleId} />;

        case 'MonthlyGrantChart':
        case 'monthly-grants':
          return <MonthlyGrantChart key={moduleId} />;

        case 'KPICard':
        case 'kpi-overview':
          return <KPICard key={moduleId} title="Sample KPI" value={100} icon={Activity} trend="+5%" />;

        default:
          console.warn(`Unknown module component: ${componentName}`);
          return (
            <div className="p-6">
              <div className="text-center text-red-500">
                <p>Error loading module: {moduleId}</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Please try refreshing the page</p>
              </div>
            </div>
          );
      }
    } catch (error) {
      console.error(`Error rendering module ${moduleId}:`, error);
      return (
        <div className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading module: {moduleId}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">Please try refreshing the page</p>
          </div>
        </div>
      );
    }
  };

  const renderDashboardSummary = () => (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 flex items-center justify-center">
          <Grid3X3 className="h-5 w-5 text-[var(--color-primary-teal)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h2>
      </div>

      <div className="flex items-center justify-center">
        <div className="toolbar">
          <select className="input w-40" value={summaryFilters.sector||''} onChange={(e)=>setSummaryFilters(prev=>({...prev, sector: e.target.value || undefined}))}>
            <option value="">All sectors</option>
            {filterOptions.sectors.map(s=> (<option key={s} value={s}>{s}</option>))}
          </select>
          <select className="input w-40" value={summaryFilters.country||''} onChange={(e)=>setSummaryFilters(prev=>({...prev, country: e.target.value || undefined}))}>
            <option value="">All countries</option>
            {filterOptions.countries.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <select className="input w-36" value={summaryFilters.stage||''} onChange={(e)=>setSummaryFilters(prev=>({...prev, stage: e.target.value || undefined}))}>
            <option value="">All stages</option>
            {filterOptions.stages.map(s=> (<option key={s} value={s}>{s}</option>))}
          </select>
          <select className="input w-32" value={summaryFilters.timeframe||'12m'} onChange={(e)=>setSummaryFilters(prev=>({...prev, timeframe: e.target.value || '12m'}))}>
            <option value="3m">3m</option>
            <option value="6m">6m</option>
            <option value="12m">12m</option>
            <option value="24m">24m</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Investment" value={summary.totalInvestment} icon={DollarSign} trend={summary.dealsCount>0?`from ${summary.dealsCount} deals`:undefined} tooltip="Sum of deal values" onClick={()=>{ setCurrentModule('public_markets'); setShowDashboardSummary(false); }} />
        <KPICard title="Deals (YTD)" value={summary.dealsCount} icon={TrendingUp} trend={`+${Math.max(2, Math.min(15, Math.round(summary.dealsCount*0.08)))}%`} tooltip="Total unique deals in the last period" onClick={()=>{ setCurrentModule('dealflow_tracker'); setShowDashboardSummary(false); }} />
        <KPICard title="Investors" value={summary.investorsCount} icon={Users} trend={`+${Math.max(1, Math.min(10, Math.round(summary.investorsCount*0.05)))}%`} tooltip="Active investors in dataset" onClick={()=>{ setCurrentModule('investors'); setShowDashboardSummary(false); }} />
        <KPICard title="Companies" value={summary.companiesCount} icon={Building2} trend={`+${Math.max(1, Math.min(8, Math.round(summary.companiesCount*0.04)))}%`} tooltip="Companies involved in deals" onClick={()=>{ setCurrentModule('companies'); setShowDashboardSummary(false); }} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
        {visibleCards.includes('grants') && (<KPICard title="Grants" value={summary.grantsCount} />)}
        {visibleCards.includes('avgDeal') && (<KPICard title="Avg Deal Size ($)" value={summary.avgDealSize} />)}
        {visibleCards.includes('topSector') && (<KPICard title="Top Sector" value={summary.topSector || '-'} />)}
        {visibleCards.includes('activeCountries') && (<KPICard title="Active Countries" value={summary.activeCountries} />)}
        {visibleCards.includes('pipeline') && (<KPICard title="Pipeline Health" value={summary.dealsCount>0? 'Stable':'—'} />)}
        {visibleCards.includes('dataFreshness') && (<KPICard title="Data Freshness" value={'Live'} />)}
      </div>

      {/* Map + Monthly dealflow row */}
      <div className="grid grid-cols-2 gap-6">
        <div className="tile">
          <div className="tile-header">
            <h3 className="text-[var(--color-text-primary)] font-semibold">African Healthcare Investment Map</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Investment activity across Africa</p>
          </div>
          <div className="tile-body">
            <InteractiveMap height={400} />
          </div>
        </div>
        <div className="tile">
          <div className="tile-header">
            <h3 className="text-[var(--color-text-primary)] font-semibold">Monthly Dealflow</h3>
          </div>
          <div className="tile-body">
            <MonthlyDealflowChart />
          </div>
        </div>
      </div>

      {/* Available Modules */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Available Modules</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardAvailableModules.map((module: any) => {
            const IconComponent = getModuleIcon(module.icon);
            return (
              <button
                key={module.id}
                onClick={() => {
                  setCurrentModule(module.id);
                  setShowDashboardSummary(false);
                }}
                className="p-4 text-left rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-surface)] transition-colors hover:bg-[var(--color-background-default)] hover:border-[var(--color-primary-light)]"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
                    <IconComponent className="w-5 h-5 text-[var(--color-primary-teal)]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)]">{module.name}</h4>
                    {module.description && (
                      <p className="text-sm text-[var(--color-text-secondary)]">{module.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customize Panel */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setIsCustomizeOpen(false)} />
          <div className="relative bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-lg p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Customize Summary Cards</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                {id:'grants', label:'Grants'},
                {id:'avgDeal', label:'Avg Deal Size'},
                {id:'topSector', label:'Top Sector'},
                {id:'activeCountries', label:'Active Countries'},
                {id:'pipeline', label:'Pipeline Health'},
                {id:'dataFreshness', label:'Data Freshness'}
              ].map(opt => (
                <label key={opt.id} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={visibleCards.includes(opt.id)} onChange={(e)=>{
                    const next = e.target.checked ? Array.from(new Set([...visibleCards, opt.id])) : visibleCards.filter(x=>x!==opt.id);
                    setVisibleCards(next);
                  }} />
                  <span className="text-[var(--color-text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Reorder Tiles</p>
              <ul className="border border-[var(--color-divider-gray)] rounded p-2 max-h-60 overflow-auto">
                {visibleCards.map((id, idx) => (
                  <li key={id} draggable onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', String(idx)); }} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); const to = idx; if (Number.isNaN(from)) return; const next = [...visibleCards]; const [moved] = next.splice(from,1); next.splice(to,0,moved); setVisibleCards(next); }} className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--color-background-default)] cursor-move select-none">
                    <span className="text-sm text-[var(--color-text-primary)]">{id}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">drag</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn-outline px-3 py-2 rounded" onClick={()=>setIsCustomizeOpen(false)}>Cancel</button>
              <button className="btn-primary px-3 py-2 rounded" onClick={()=>{ saveVisibleCards(visibleCards); setIsCustomizeOpen(false); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (showDashboardSummary) {
    return renderDashboardSummary();
  }

  if (currentModule) {
    return (currentModule === 'admin' && !canSuper) ? null : renderModule(currentModule);
  }

  // Safety check: ensure moduleOrder is defined and is an array
  if (!moduleOrder || !Array.isArray(moduleOrder) || moduleOrder.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg p-6">
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
      {moduleOrder
        .filter((moduleId) => moduleId !== 'admin_access' && (moduleId !== 'admin' || canSuper))
        .map((moduleId) => (
          <div key={moduleId}>
            {renderModule(moduleId)}
          </div>
        ))}
    </div>
  );
};

export default ModularDashboard;