import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut,
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
  Grid3X3
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
  const { signOut, profile } = useAuth();
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

  // Get profile route based on user type
  const getProfileRoute = (userProfile: any): string => {
    if (!userProfile) return '/startup-profile';
    const userType = userProfile.user_type || userProfile.role || '';
    const isAdmin = userProfile.is_admin === true || 
                    userProfile.role === 'admin' || 
                    (userProfile.app_roles && (
                      typeof userProfile.app_roles === 'string' 
                        ? JSON.parse(userProfile.app_roles) 
                        : userProfile.app_roles
                    )?.includes('super_admin'));
    
    if (isAdmin) return '/admin-profile';
    if (userType === 'startup') return '/startup-profile';
    if (userType === 'investor' || userType === 'investors_finance') return '/investor-profile';
    if (userType === 'researcher' || userType === 'health_science_experts') return '/researcher-profile';
    if (userType === 'executive' || userType === 'industry_executives') return '/executive-profile';
    if (userType === 'regulator') return '/regulator-profile';
    return '/startup-profile'; // default
  };

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
 
  const handleSignOut = async () => {
    try {
      await signOut();
      // The auth context will handle redirecting to sign-in page
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    };
    return iconMap[iconName] || Square;
  };

  const selectedClasses = 'bg-[var(--color-primary-teal)] text-white shadow-md';
  const selectedIconClasses = 'text-white';
  

  return (
    <>
      {/* Mobile menu is now toggled from GlobalHeader via custom events */}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Responsive: Always visible on desktop, hidden on mobile unless menu is open */}
      <div className={`w-64 h-screen fixed lg:static z-50 transition-all duration-300 bg-[var(--color-background-surface)] border-r border-[var(--color-divider-gray)] shadow-xl ${
        isMobileMenuOpen 
          ? 'translate-x-0' 
          : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header - fixed size */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]">
            <Logo />
            <button 
              onClick={toggleMobileMenu} 
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-background-default)] transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-[var(--color-text-secondary)]" /> : <Menu className="h-5 w-5 text-[var(--color-text-secondary)]" />}
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              <button
                onClick={handleDashboardClick}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                  (location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                  (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                  (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile'))
                    ? selectedClasses
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)] hover:text-[var(--color-text-primary)] hover:shadow-sm'
                }`}
              >
                <Grid3X3 className={`h-5 w-5 ${
                  ((location.pathname.includes('-dashboard') && !location.pathname.includes('manager')) ||
                   (location.pathname === getModuleRoute(defaultModule) && !location.pathname.includes('-profile')) ||
                   (currentModule === defaultModule && currentModule !== 'my_profile' && !location.pathname.includes('-profile')))
                    ? selectedIconClasses 
                    : 'text-[var(--color-primary-teal)]'
                }`} />
                <span>Dashboard</span>
              </button>

              <div className="border-t border-[var(--color-divider-gray)] pt-4 space-y-3">
                <div className="flex items-center justify-between px-3">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">MODULES</p>
                  <button
                    onClick={() => setShowCustomizer(true)}
                    className="p-1 rounded-md bg-[var(--color-primary-teal)] hover:opacity-90 text-[var(--color-background-surface)] transition-colors border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]"
                    title="Add Modules"
                  >
                    <Plus className="h-3 w-3 text-[var(--color-background-surface)]" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const profileRoute = getProfileRoute(profile);
                    navigate(profileRoute);
                    navigateToModule('my_profile');
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    location.pathname.includes('-profile')
                      ? selectedClasses
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)] hover:text-[var(--color-text-primary)] hover:shadow-sm'
                  }`}
                >
                  <User className={`h-5 w-5 ${location.pathname.includes('-profile') ? selectedIconClasses : 'text-[var(--color-primary-teal)]'}`} />
                  <span className="text-sm">My Profile</span>
                </button>
              </div>
            </div>

            <nav className="px-4 pb-4">
              <ul className="space-y-2">
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
                  
                  return orderedModules.map((module) => {
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
                    
                    return (
                      <li key={module.id}>
                        <button
                          onClick={() => handleModuleClick(module.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                            active
                              ? selectedClasses
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-default)] hover:text-[var(--color-text-primary)] hover:shadow-sm'
                          }`}
                        >
                          <IconComponent className={`h-5 w-5 ${active ? selectedIconClasses : 'text-[var(--color-primary-teal)]'}`} />
                          <span className="text-sm">{module.name}</span>
                        </button>
                      </li>
                    );
                  });
                })()}
              </ul>
            </nav>
          </div>

          {/* Footer - fixed at bottom */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-[var(--color-divider-gray)] space-y-3 bg-[var(--color-background-surface)] z-10">
            <AdSlot placement="dashboard_sidebar" category="dashboard_personalized" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-200 border border-[var(--color-error)]/20 hover:shadow-sm font-medium"
            >
              <LogOut className="h-4 w-4 text-[var(--color-error)]" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Customizer Modal */}
      {showCustomizer && (
        <DashboardCustomizer onClose={() => setShowCustomizer(false)} />
      )}

      {/* No extra spacer needed; header is unified */}
      <div className="md:hidden h-0"></div>
    </>
  );
};

export default Sidebar;