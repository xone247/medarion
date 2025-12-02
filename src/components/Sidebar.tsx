import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu,
  X,
  Plus,
  BarChart3,
  TrendingUp,
  DollarSign,
  LineChart,
  Building2,
  Users,
  MessageSquare,
  FileCheck,
  Microscope,
  User,
  PieChart,
  Search,
  Square,
  Grid3X3,
  Settings,
  Star,
  Award,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useDashboard } from '../contexts/DashboardContext';
import { ROLE_LABELS } from '../types/userTypes';
import DashboardCustomizer from './DashboardCustomizer';
import AdSlot from './AdSlot';

interface SidebarProps {
  userType: string;
}

const Sidebar = ({ userType }: SidebarProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentModule, 
    availableModules: navModules, 
    navigateToModule, 
    defaultModule 
  } = useNavigation();
  const { 
    userModules, 
    moduleOrder, 
    availableModules: dashboardModules,
    getModuleById 
  } = useDashboard();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMiniMode, setIsMiniMode] = useState(true); // Default to mini mode


  // Map module IDs to their route paths
  // Priority: Use explicit routes when available, fallback to catch-all /module/:id
  const getModuleRoute = (moduleId: string): string => {
    const routeMap: Record<string, string> = {
      // Dashboard routes
      'dashboard': '/startup-dashboard',
      'startup-dashboard': '/startup-dashboard',
      'investor-dashboard': '/investor-dashboard',
      'researcher-dashboard': '/researcher-dashboard',
      'executive-dashboard': '/executive-dashboard',
      'regulator-dashboard': '/regulator-dashboard',
      'admin-dashboard': '/admin-dashboard',
      
      // Core data modules - explicit routes
      'companies': '/companies',
      'grants': '/grants',  // Explicit route for 'grants'
      'grant_funding_tracker': '/grants',  // Also map legacy ID
      'deals': '/deals',
      'dealflow_tracker': '/deals',  // Legacy ID
      'investors': '/investors',
      'clinical-trials': '/clinical-trials',
      'clinical_trials': '/clinical-trials',  // Legacy ID
      'nationpulse': '/nationpulse',
      'nation_pulse': '/nationpulse',  // Legacy ID
      'nation-pulse': '/nationpulse',  // Alternative format
      
      // Advanced modules - explicit routes
      'public-markets': '/public-markets',
      'public_markets': '/public-markets',  // Legacy ID
      'regulatory': '/regulatory',
      'fundraising-crm': '/fundraising-crm',
      'fundraising_crm': '/fundraising-crm',  // Legacy ID
      'startup-analytics': '/startup-analytics',
      'analytics': '/startup-analytics',  // Legacy ID
      'ai-tools': '/ai-tools',
      'ai_tools': '/ai-tools',  // Legacy ID
      'clinical-centers': '/clinical-centers',
      'clinical_centers': '/clinical-centers',  // Legacy ID
      'investigators': '/investigators',
      'regulatory-ecosystem': '/regulatory-ecosystem',
      'regulatory_ecosystem': '/regulatory-ecosystem',  // Legacy ID
      // 'glossary': '/glossary', // not a module entry; accessible elsewhere
      'users-manager-dashboard': '/users-manager-dashboard',
      'ads_manager': '/ads-manager-dashboard',
      'ads-manager-dashboard': '/ads-manager-dashboard',
    };
    return routeMap[moduleId] || `/module/${moduleId}`;
  };
 

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Listen for global events from the header to open/close the mobile sidebar
  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen((v) => !v);
    const handleOpen = () => setIsMobileMenuOpen(true);
    const handleClose = () => setIsMobileMenuOpen(false);
    window.addEventListener('medarion:sidebar:toggle' as any, handleToggle as any);
    window.addEventListener('medarion:sidebar:open' as any, handleOpen as any);
    window.addEventListener('medarion:sidebar:close' as any, handleClose as any);
    return () => {
      window.removeEventListener('medarion:sidebar:toggle' as any, handleToggle as any);
      window.removeEventListener('medarion:sidebar:open' as any, handleOpen as any);
      window.removeEventListener('medarion:sidebar:close' as any, handleClose as any);
    };
  }, []);

  const handleModuleClick = (moduleId: string) => {
    // Update NavigationContext for sidebar highlighting
    navigateToModule(moduleId);
    // Navigate to the actual route
    const route = getModuleRoute(moduleId);
    navigate(route);
    setIsMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    // Update NavigationContext for sidebar highlighting
    navigateToModule(defaultModule);
    // Navigate to the actual route
    const route = getModuleRoute(defaultModule);
    navigate(route);
    setIsMobileMenuOpen(false);
  };

  // Determine active module based on current route
  const getActiveModuleFromRoute = (): string | null => {
    const path = location.pathname;
    
    // First check for profile routes - these should NOT return a module ID
    // to prevent module buttons from highlighting when on profile page
    if (path.includes('-profile') || path === '/startup-profile' || path === '/investor-profile' || 
        path === '/researcher-profile' || path === '/executive-profile' || 
        path === '/regulator-profile' || path === '/admin-profile') {
      return null; // Don't return module ID for profile routes
    }
    
    // Check for dashboard routes - return dashboard module ID, but ensure
    // it doesn't conflict with regular module buttons
    if (path.includes('-dashboard') || path === '/startup-dashboard' || 
        path === '/investor-dashboard' || path === '/researcher-dashboard' || 
        path === '/executive-dashboard' || path === '/regulator-dashboard' || 
        path === '/admin-dashboard') {
      // Return dashboard ID only if it matches the defaultModule
      // This ensures the Dashboard button highlights, but not module buttons
      return defaultModule;
    }
    
    // For other routes, map to module IDs
    const routeToModule: Record<string, string> = {
      '/deals': 'deals',
      '/grants': 'grants',
      '/public-markets': 'public-markets',
      '/companies': 'companies',
      '/investors': 'investors',
      '/fundraising-crm': 'fundraising-crm',
      '/regulatory': 'regulatory',
      '/clinical-trials': 'clinical-trials',
      '/nationpulse': 'nationpulse',
      '/startup-analytics': 'startup-analytics',
      '/ai-tools': 'ai-tools',
      '/clinical-centers': 'clinical-centers',
      '/investigators': 'investigators',
      // '/glossary': 'glossary', // do not map as a module
      '/regulatory-ecosystem': 'regulatory-ecosystem',
      // '/users-manager-dashboard': 'users-manager-dashboard', // not a sidebar module
      // '/ads-manager-dashboard': 'ads-manager-dashboard', // not a sidebar module
    };
    return routeToModule[path] || null;
  };

  // Sync current module with route on mount and route change
  useEffect(() => {
    const activeModule = getActiveModuleFromRoute();
    if (activeModule && activeModule !== currentModule) {
      navigateToModule(activeModule);
    }
  }, [location.pathname, currentModule, navigateToModule]);

  // Get icon component from string name
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'BarChart3': BarChart3,
      'TrendingUp': TrendingUp,
      'DollarSign': DollarSign,
      'LineChart': LineChart,
      'Building2': Building2,
      'Users': Users,
      'MessageSquare': MessageSquare,
      'FileCheck': FileCheck,
      'Microscope': Microscope,
      'User': User,
      'PieChart': PieChart,
      'Search': Search,
      'Award': Award,
      'award': Award,
      'trending-up': TrendingUp,
      'trending_up': TrendingUp,
    };
    return iconMap[iconName] || Square;
  };

  const selectedClasses = 'bg-black dark:bg-white text-white dark:text-black shadow-md';
  const selectedIconClasses = 'text-white';
  

  return (
    <>
      {/* Mobile menu is now toggled from GlobalHeader via custom events */}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Responsive: Always visible on desktop, hidden on mobile unless menu is open */}
      <div className={`${isMiniMode ? 'w-20 lg:w-20' : 'w-72 lg:w-72'} h-screen lg:static fixed lg:z-auto z-50 transition-all duration-300 bg-white/95 dark:bg-slate-900/95 border-r border-slate-100 dark:border-slate-800/50 shadow-xl backdrop-blur-xl ${
        isMobileMenuOpen 
          ? 'translate-x-0' 
          : 'lg:translate-x-0 -translate-x-full'
      }`}>
        <div className="flex h-full flex-col overflow-hidden relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 via-transparent to-teal-50/20 dark:from-cyan-950/20 dark:via-transparent dark:to-teal-950/10 pointer-events-none" />
          
          {/* Logo Section - More refined */}
          <div className={`flex-shrink-0 ${isMiniMode ? 'px-3' : 'px-5'} py-5 border-b border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl`}>
            {!isMiniMode && <Logo />}
            {isMiniMode && (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">M</span>
                </div>
              </div>
            )}
          </div>

          {/* Toggle button - Positioned between logo and content, fully visible */}
          <div className="flex-shrink-0 px-2 py-2 border-b border-slate-100 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
            <button
              onClick={() => setIsMiniMode(!isMiniMode)}
              className={`w-full ${isMiniMode ? 'px-2' : 'px-3'} py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex group`}
              aria-label={isMiniMode ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isMiniMode ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isMiniMode ? (
                <>
                  <ChevronRight className="h-4 w-4 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex-shrink-0" />
                  {!isMiniMode && <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">Expand</span>}
                </>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex-shrink-0" />
                  <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* Search Bar - Sleeker design - Hidden in mini mode */}
          {!isMiniMode && (
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400/40 focus:border-cyan-400/60 dark:focus:ring-cyan-500/40 dark:focus:border-cyan-500/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
                />
              </div>
            </div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300/50 dark:scrollbar-thumb-slate-600/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600">
            <div className={`${isMiniMode ? 'px-2' : 'px-5'} py-4 space-y-1`}>
              <button
                onClick={handleDashboardClick}
                className={`group w-full flex items-center ${isMiniMode ? 'justify-center' : 'space-x-3'} px-3.5 py-2.5 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${
                  (location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                  (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                  (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile'))
                    ? 'bg-black dark:from-cyan-500/20 dark:to-teal-500/20 text-white dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={isMiniMode ? 'Home' : undefined}
              >
                {((location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                  (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                  (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile'))) && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black dark:from-cyan-400 dark:to-teal-400 rounded-r-full" />
                )}
                <div className={`p-1.5 rounded-md transition-all duration-200 ${
                  (location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                  (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                  (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile'))
                    ? 'bg-white/20 dark:bg-white/10' 
                    : 'bg-slate-100/50 dark:bg-slate-800/50 group-hover:bg-slate-200/50 dark:group-hover:bg-slate-700/50'
                }`}>
                  <Grid3X3 className={`h-4 w-4 transition-colors ${
                    ((location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                     (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                     (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile')))
                      ? 'text-white dark:text-cyan-300' 
                      : 'text-slate-500 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                  }`} />
                </div>
                {!isMiniMode && (
                  <span className={`text-sm font-normal ${
                    (location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                    (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                    (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile'))
                      ? 'text-white dark:text-white'
                      : ''
                  }`}>Home</span>
                )}
              </button>

            </div>

            <nav className={`${isMiniMode ? 'px-2' : 'px-5'} pb-4`}>
              {!isMiniMode && (
                <div className="mb-3 px-3.5">
                  <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider">Modules</p>
                </div>
              )}
              <ul className="space-y-1">
                {/* Use DashboardContext modules in moduleOrder for sidebar - syncs with customizer */}
                {(() => {
                  // Get modules in the order specified by moduleOrder, filtered by userModules
                  const orderedModules = moduleOrder
                    .map(id => getModuleById(id))
                    .filter((module): module is NonNullable<typeof module> => {
                      if (!module) return false;
                      // Only show modules that are in userModules
                      if (!userModules.includes(module.id)) return false;
                      // Filter out excluded modules (dashboard, profile, and admin-only modules that are now tabs)
                      if (module.id === 'dashboard' || 
                          module.id === 'my-profile' || 
                          module.id === 'my_profile' ||
                          module.id === 'admin-dashboard' ||
                          module.id === 'investor-dashboard' ||
                          module.id === 'startup-dashboard' ||
                          module.id === 'researcher-dashboard' ||
                          module.id === 'executive-dashboard' ||
                          module.id === 'regulator-dashboard' ||
                          module.id === 'glossary' ||
                          module.id === 'users-manager-dashboard' ||
                          module.id === 'users_manager' ||
                          module.id === 'ads-manager-dashboard' ||
                          module.id === 'ads_manager') {
                        return false;
                      }
                      return true;
                    });
                  
                  // Get account tier for tier badges
                  const accountTier = (profile as any)?.account_tier || 'free';
                  const getTierBadge = (tier: string) => {
                    const tierMap: Record<string, { label: string; color: string; bgColor: string }> = {
                      'free': { label: 'Free', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800/50' },
                      'paid': { label: 'Pro', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
                      'academic': { label: 'Academic', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
                      'enterprise': { label: 'Enterprise', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' }
                    };
                    return tierMap[tier] || tierMap['free'];
                  };

                  // Always include Deals and Grants in the sidebar, even if not in orderedModules
                  const dealsModule = getModuleById('deals') || { id: 'deals', name: 'Deals', icon: 'trending-up', tier: 'paid' };
                  const grantsModule = getModuleById('grants') || { id: 'grants', name: 'Grants', icon: 'award', tier: 'free' };
                  
                  // Check if deals/grants are already in orderedModules
                  const hasDeals = orderedModules.some(m => m.id === 'deals');
                  const hasGrants = orderedModules.some(m => m.id === 'grants');
                  
                  // Add Deals and Grants if not already present - always show them
                  const modulesToShow = [...orderedModules];
                  if (!hasDeals) {
                    modulesToShow.push(dealsModule as any);
                  }
                  if (!hasGrants) {
                    modulesToShow.push(grantsModule as any);
                  }

                  return modulesToShow.map((module) => {
                    const IconComponent = getIconComponent(module.icon);
                    const moduleRoute = getModuleRoute(module.id);
                    // Module is active if:
                    // 1. We're on its route AND not on a profile/dashboard route
                    // 2. currentModule matches BUT we're not on profile/dashboard
                    const active = (
                      (location.pathname === moduleRoute || location.pathname.startsWith(moduleRoute + '/')) &&
                      !location.pathname.includes('-profile') &&
                      !(location.pathname.includes('-dashboard') && !location.pathname.includes('manager'))
                    ) || (
                      currentModule === module.id &&
                      !location.pathname.includes('-profile') &&
                      !(location.pathname.includes('-dashboard') && !location.pathname.includes('manager'))
                    );
                    
                    const moduleTier = (module as any).tier || 'free';
                    const tierBadge = getTierBadge(moduleTier);
                    const userCanAccess = accountTier === 'enterprise' || 
                                         (accountTier === 'academic' && (moduleTier === 'free' || moduleTier === 'paid' || moduleTier === 'academic')) ||
                                         (accountTier === 'paid' && (moduleTier === 'free' || moduleTier === 'paid')) ||
                                         (accountTier === 'free' && moduleTier === 'free');
                    
                    return (
                      <li key={module.id}>
                        <button
                          onClick={() => handleModuleClick(module.id)}
                          className={`group w-full flex items-center ${isMiniMode ? 'justify-center' : 'justify-between'} ${isMiniMode ? '' : 'px-3.5'} py-2.5 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${
                            active
                              ? 'bg-black dark:from-cyan-500/20 dark:to-teal-500/20 text-white dark:text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                          } ${!userCanAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!userCanAccess}
                          title={isMiniMode ? `${module.name} (${tierBadge.label})` : undefined}
                        >
                          <div className={`flex items-center ${isMiniMode ? '' : 'space-x-3 flex-1 min-w-0'}`}>
                            {active && (
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black dark:from-cyan-400 dark:to-teal-400 rounded-r-full" />
                            )}
                            <div className={`p-1.5 rounded-md transition-all duration-200 flex-shrink-0 ${
                              active
                                ? 'bg-white/20 dark:bg-white/10' 
                                : 'bg-slate-100/50 dark:bg-slate-800/50 group-hover:bg-slate-200/50 dark:group-hover:bg-slate-700/50'
                            }`}>
                              <IconComponent className={`h-4 w-4 transition-colors ${
                                active 
                                  ? 'text-white dark:text-cyan-300' 
                                  : 'text-slate-500 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'
                              }`} />
                            </div>
                            {!isMiniMode && (
                              <>
                                <span className={`text-sm font-normal flex-1 min-w-0 truncate ${active ? 'text-white dark:text-white' : ''}`}>{module.name}</span>
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${tierBadge.bgColor} ${tierBadge.color}`}>
                                  {tierBadge.label}
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  });
                })()}
              </ul>
            </nav>
          </div>

          {/* Footer - fixed at bottom - Hidden in mini mode */}
          {!isMiniMode && (
            <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10">
              <AdSlot placement="dashboard_sidebar" category="dashboard_personalized" />
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Customizer Modal */}
      {showCustomizer && (
        <DashboardCustomizer onClose={() => setShowCustomizer(false)} />
      )}

      {/* No extra spacer needed; header is unified */}
      <div className="hidden h-0"></div>
    </>
  );
};

export default Sidebar;