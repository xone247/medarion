import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Import all page components
import CompaniesPage from '../pages/CompaniesPage';
import DealsPage from '../pages/DealsPage';
import GrantsPage from '../pages/GrantsPage';
import ClinicalTrialsPage from '../pages/ClinicalTrialsPage';
import NationPulsePage from '../pages/NationPulsePage';
import GlossaryPage from '../pages/GlossaryPage';
import InvestorsPage from '../pages/InvestorsPage';
import PublicMarkets from '../pages/PublicMarkets';
import RegulatoryPage from '../pages/RegulatoryPage';
import RegulatoryEcosystemPage from '../pages/RegulatoryEcosystemPage';
import ClinicalCentersPage from '../pages/ClinicalCentersPage';
import InvestigatorsPage from '../pages/InvestigatorsPage';
import FundraisingCRMPage from '../pages/FundraisingCRMPage';
import StartupAnalyticsPage from '../pages/StartupAnalyticsPage';
import StartupDashboard from '../pages/StartupDashboard';
import InvestorDashboard from '../pages/InvestorDashboard';
import ResearcherDashboard from '../pages/ResearcherDashboard';
import ExecutiveDashboard from '../pages/ExecutiveDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import UsersManagerDashboard from '../pages/UsersManagerDashboard';
import AIToolsPage from '../pages/AIToolsPage';
import ExecutiveProfile from '../pages/ExecutiveProfile';
import ResearcherProfile from '../pages/ResearcherProfile';
import InvestorProfile from '../pages/InvestorProfile';
import StartupProfile from '../pages/StartupProfile';
import AdminProfile from '../pages/AdminProfile';
import RegulatorProfile from '../pages/RegulatorProfile';
import RegulatorDashboard from '../pages/RegulatorDashboard';

// Module configuration by profile type with paid/free separation
const MODULE_CONFIG = {
  admin: {
    defaultModule: 'admin-dashboard',
    modules: [
      { id: 'my-profile', component: AdminProfile, name: 'My Profile', icon: 'user', tier: 'free' },
      { id: 'admin-dashboard', component: AdminDashboard, name: 'Admin Dashboard', icon: 'grid-3x3', tier: 'admin' },
      { id: 'users-manager-dashboard', component: UsersManagerDashboard, name: 'Users Manager', icon: 'users', tier: 'admin' },
      { id: 'companies', component: CompaniesPage, name: 'Companies', icon: 'building-2', tier: 'free' },
      { id: 'deals', component: DealsPage, name: 'Deals', icon: 'trending-up', tier: 'paid' },
      { id: 'grants', component: GrantsPage, name: 'Grants', icon: 'award', tier: 'free' },
      { id: 'clinical-trials', component: ClinicalTrialsPage, name: 'Clinical Trials', icon: 'flask-conical', tier: 'free' },
      { id: 'nationpulse', component: NationPulsePage, name: 'Nation Pulse', icon: 'activity', tier: 'free' },
      { id: 'investors', component: InvestorsPage, name: 'Investors', icon: 'users', tier: 'paid' },
      { id: 'public-markets', component: PublicMarkets, name: 'Public Markets', icon: 'chart-line', tier: 'paid' },
      { id: 'regulatory', component: RegulatoryPage, name: 'Regulatory', icon: 'shield', tier: 'paid' },
      { id: 'regulatory-ecosystem', component: RegulatoryEcosystemPage, name: 'Regulatory Ecosystem', icon: 'network', tier: 'paid' },
      { id: 'clinical-centers', component: ClinicalCentersPage, name: 'Clinical Centers', icon: 'hospital', tier: 'paid' },
      { id: 'investigators', component: InvestigatorsPage, name: 'Investigators', icon: 'user-check', tier: 'paid' },
      { id: 'fundraising-crm', component: FundraisingCRMPage, name: 'Fundraising CRM', icon: 'phone', tier: 'paid' },
      { id: 'startup-analytics', component: StartupAnalyticsPage, name: 'Startup Analytics', icon: 'bar-chart', tier: 'paid' },
      { id: 'ai-tools', component: AIToolsPage, name: 'AI Tools', icon: 'bot', tier: 'paid' },
    ]
  },
  investor: {
    defaultModule: 'investor-dashboard',
    modules: [
      { id: 'my-profile', component: InvestorProfile, name: 'My Profile', icon: 'user', tier: 'free' },
      { id: 'investor-dashboard', component: InvestorDashboard, name: 'Dashboard', icon: 'grid-3x3', tier: 'free' },
      { id: 'investors', component: InvestorsPage, name: 'Investors', icon: 'users', tier: 'paid' },
      { id: 'companies', component: CompaniesPage, name: 'Companies', icon: 'building-2', tier: 'free' },
      { id: 'deals', component: DealsPage, name: 'Deals', icon: 'trending-up', tier: 'paid' },
      { id: 'grants', component: GrantsPage, name: 'Grants', icon: 'award', tier: 'free' },
      { id: 'clinical-trials', component: ClinicalTrialsPage, name: 'Clinical Trials', icon: 'flask-conical', tier: 'free' },
      { id: 'nationpulse', component: NationPulsePage, name: 'Nation Pulse', icon: 'activity', tier: 'free' },
      { id: 'public-markets', component: PublicMarkets, name: 'Public Markets', icon: 'chart-line', tier: 'paid' },
      { id: 'regulatory', component: RegulatoryPage, name: 'Regulatory', icon: 'shield', tier: 'paid' },
      { id: 'fundraising-crm', component: FundraisingCRMPage, name: 'Fundraising CRM', icon: 'phone', tier: 'paid' },
      // Startup Analytics removed - only for startup accounts
      { id: 'ai-tools', component: AIToolsPage, name: 'AI Tools', icon: 'bot', tier: 'paid' },
    ]
  },
  startup: {
    defaultModule: 'startup-dashboard',
    modules: [
      { id: 'my-profile', component: StartupProfile, name: 'My Profile', icon: 'user', tier: 'free' },
      { id: 'startup-dashboard', component: StartupDashboard, name: 'Dashboard', icon: 'grid-3x3', tier: 'free' },
      { id: 'companies', component: CompaniesPage, name: 'Companies', icon: 'building-2', tier: 'free' },
      { id: 'deals', component: DealsPage, name: 'Deals', icon: 'trending-up', tier: 'paid' },
      { id: 'grants', component: GrantsPage, name: 'Grants', icon: 'award', tier: 'free' },
      { id: 'clinical-trials', component: ClinicalTrialsPage, name: 'Clinical Trials', icon: 'flask-conical', tier: 'free' },
      { id: 'nationpulse', component: NationPulsePage, name: 'Nation Pulse', icon: 'activity', tier: 'free' },
      { id: 'investors', component: InvestorsPage, name: 'Investors', icon: 'users', tier: 'paid' },
      { id: 'fundraising-crm', component: FundraisingCRMPage, name: 'Fundraising CRM', icon: 'phone', tier: 'paid' },
      { id: 'startup-analytics', component: StartupAnalyticsPage, name: 'Startup Analytics', icon: 'bar-chart', tier: 'paid' },
      { id: 'ai-tools', component: AIToolsPage, name: 'AI Tools', icon: 'bot', tier: 'paid' },
    ]
  },
  researcher: {
    defaultModule: 'researcher-dashboard',
    modules: [
      { id: 'my-profile', component: ResearcherProfile, name: 'My Profile', icon: 'user', tier: 'free' },
      { id: 'researcher-dashboard', component: ResearcherDashboard, name: 'Dashboard', icon: 'grid-3x3', tier: 'free' },
      { id: 'clinical-trials', component: ClinicalTrialsPage, name: 'Clinical Trials', icon: 'flask-conical', tier: 'free' },
      { id: 'clinical-centers', component: ClinicalCentersPage, name: 'Clinical Centers', icon: 'hospital', tier: 'paid' },
      { id: 'investigators', component: InvestigatorsPage, name: 'Investigators', icon: 'user-check', tier: 'paid' },
      { id: 'companies', component: CompaniesPage, name: 'Companies', icon: 'building-2', tier: 'free' },
      { id: 'grants', component: GrantsPage, name: 'Grants', icon: 'award', tier: 'free' },
      { id: 'nationpulse', component: NationPulsePage, name: 'Nation Pulse', icon: 'activity', tier: 'free' },
      { id: 'regulatory', component: RegulatoryPage, name: 'Regulatory', icon: 'shield', tier: 'paid' },
      { id: 'regulatory-ecosystem', component: RegulatoryEcosystemPage, name: 'Regulatory Ecosystem', icon: 'network', tier: 'paid' },
      { id: 'ai-tools', component: AIToolsPage, name: 'AI Tools', icon: 'bot', tier: 'paid' },
    ]
  },
  executive: {
    defaultModule: 'executive-dashboard',
    modules: [
      { id: 'my-profile', component: ExecutiveProfile, name: 'My Profile', icon: 'user', tier: 'free' },
      { id: 'executive-dashboard', component: ExecutiveDashboard, name: 'Dashboard', icon: 'grid-3x3', tier: 'free' },
      { id: 'companies', component: CompaniesPage, name: 'Companies', icon: 'building-2', tier: 'free' },
      { id: 'deals', component: DealsPage, name: 'Deals', icon: 'trending-up', tier: 'paid' },
      { id: 'grants', component: GrantsPage, name: 'Grants', icon: 'award', tier: 'free' },
      { id: 'clinical-trials', component: ClinicalTrialsPage, name: 'Clinical Trials', icon: 'flask-conical', tier: 'free' },
      { id: 'nationpulse', component: NationPulsePage, name: 'Nation Pulse', icon: 'activity', tier: 'free' },
      { id: 'investors', component: InvestorsPage, name: 'Investors', icon: 'users', tier: 'paid' },
      { id: 'public-markets', component: PublicMarkets, name: 'Public Markets', icon: 'chart-line', tier: 'paid' },
      { id: 'regulatory', component: RegulatoryPage, name: 'Regulatory', icon: 'shield', tier: 'paid' },
      { id: 'regulatory-ecosystem', component: RegulatoryEcosystemPage, name: 'Regulatory Ecosystem', icon: 'network', tier: 'paid' },
      // Startup Analytics removed - only for startup accounts
      { id: 'ai-tools', component: AIToolsPage, name: 'AI Tools', icon: 'bot', tier: 'paid' },
    ]
  },
  regulator: {
    defaultModule: 'regulator-dashboard',
    modules: [
      { id: 'my-profile', component: RegulatorProfile, name: 'My Profile', icon: 'user', tier: 'free' },
      { id: 'regulator-dashboard', component: RegulatorDashboard, name: 'Dashboard', icon: 'grid-3x3', tier: 'free' },
      { id: 'companies', component: CompaniesPage, name: 'Companies', icon: 'building-2', tier: 'free' },
      { id: 'grants', component: GrantsPage, name: 'Grants', icon: 'award', tier: 'free' },
      { id: 'clinical-trials', component: ClinicalTrialsPage, name: 'Clinical Trials', icon: 'flask-conical', tier: 'free' },
      { id: 'nationpulse', component: NationPulsePage, name: 'Nation Pulse', icon: 'activity', tier: 'free' },
      { id: 'regulatory', component: RegulatoryPage, name: 'Regulatory', icon: 'shield', tier: 'free' },
      { id: 'regulatory-ecosystem', component: RegulatoryEcosystemPage, name: 'Regulatory Ecosystem', icon: 'network', tier: 'free' },
      { id: 'clinical-centers', component: ClinicalCentersPage, name: 'Clinical Centers', icon: 'hospital', tier: 'free' },
      { id: 'investigators', component: InvestigatorsPage, name: 'Investigators', icon: 'user-check', tier: 'free' },
      { id: 'ai-tools', component: AIToolsPage, name: 'AI Tools', icon: 'bot', tier: 'paid' }
    ]
  }
};

interface NavigationContextType {
  currentModule: string;
  setCurrentModule: (module: string) => void;
  availableModules: Array<{ id: string; component: React.ComponentType<any>; name: string; icon: string; tier: string }>;
  defaultModule: string;
  navigateToModule: (moduleId: string) => void;
  isModuleLoaded: (moduleId: string) => boolean;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentModule, setCurrentModule] = useState<string>('');

  // Get user profile type
  const getUserProfileType = () => {
    if (!profile) return 'startup';
    
    const role = (profile as any)?.role || (profile as any)?.user_type || 'startup';
    
    // Map roles to profile types
    const roleMap: Record<string, string> = {
      'admin': 'admin',
      'investors_finance': 'investor',
      'investor': 'investor',
      'startup': 'startup',
      'health_science_experts': 'researcher',
      'researcher': 'researcher',
      'industry_executives': 'executive',
      'regulator': 'regulator'
    };
    
    return roleMap[role] || 'startup';
  };

  const profileType = getUserProfileType();
  const config = MODULE_CONFIG[profileType as keyof typeof MODULE_CONFIG] || MODULE_CONFIG.startup;
  
  // Filter modules based on user's account tier
  const getUserAccountTier = () => {
    if (!profile) return 'free';
    return (profile as any)?.account_tier || 'free';
  };
  
  const accountTier = getUserAccountTier();
  
  // Filter modules based on account tier and user type restrictions
  const availableModules = config.modules.filter(module => {
    // Check userTypeOnly restriction (e.g., startup-analytics only for startup accounts)
    if ((module as any).userTypeOnly && (module as any).userTypeOnly !== profileType) {
      return false;
    }
    
    // Admin users can access all modules (but still respect tier for non-admin modules)
    if (profileType === 'admin') {
      // Admin modules are always accessible to admins
      if (module.tier === 'admin') return true;
      // For other modules, check tier restrictions
      const userTier = accountTier;
      if (userTier === 'free') return module.tier === 'free';
      if (userTier === 'paid') return module.tier === 'free' || module.tier === 'paid';
      if (userTier === 'academic') return module.tier === 'free' || module.tier === 'paid' || module.tier === 'academic';
      if (userTier === 'enterprise') return true; // Enterprise can access all
      return module.tier === 'free';
    }
    
    // Non-admin users: filter by tier
    // Free users can only access free modules
    if (accountTier === 'free') {
      return module.tier === 'free';
    }
    
    // Paid users can access both free and paid modules
    if (accountTier === 'paid') {
      return module.tier === 'free' || module.tier === 'paid';
    }
    
    // Academic users can access free, paid, and academic modules
    if (accountTier === 'academic') {
      return module.tier === 'free' || module.tier === 'paid' || module.tier === 'academic';
    }
    
    // Enterprise users can access all modules
    if (accountTier === 'enterprise') {
      return true;
    }
    
    // Default: only free modules
    return module.tier === 'free';
  });
  
  // Use the first available module as default if the configured default is not available
  const defaultModule = availableModules.length > 0 && availableModules.some(m => m.id === config.defaultModule) 
    ? config.defaultModule 
    : availableModules[0]?.id || 'my-profile';

  // Navigate to a specific module
  const navigateToModule = (moduleId: string) => {
    if (availableModules.some(module => module.id === moduleId)) {
      setCurrentModule(moduleId);
    }
  };

  // Check if a module is loaded (simplified - always return true for now)
  const isModuleLoaded = (moduleId: string) => {
    return true;
  };

  // Initialize current module when user logs in
  useEffect(() => {
    if (user && profile && !currentModule) {
      setCurrentModule(defaultModule);
    }
  }, [user, profile, defaultModule, currentModule]);

  const value: NavigationContextType = {
    currentModule,
    setCurrentModule,
    availableModules,
    defaultModule,
    navigateToModule,
    isModuleLoaded
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;