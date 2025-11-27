import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import NotificationDropdown from './NotificationDropdown';
import {
  Crown,
  Star,
  Sun,
  Moon,
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import Logo from './Logo';

const GlobalHeader: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  
  let navigationContext;
  try {
    navigationContext = useNavigation();
  } catch {
    return null;
  }
  
  const { currentModule } = navigationContext;

  // Reset profile image error when profile changes
  useEffect(() => {
    setProfileImageError(false);
  }, [(profile as any)?.profileImage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAccountTierInfo = () => {
    if (!profile) return { label: 'Free', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: null as any };
    const isAdmin = (profile as any)?.is_admin === true;
    if (isAdmin) return { label: 'Admin', color: 'text-red-600', bgColor: 'bg-red-100', icon: <Crown className="w-3 h-3" /> };
    const tier = (profile as any)?.account_tier || 'free';
    const map: any = {
      free: { label: 'Free', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: null },
      paid: { label: 'Pro', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Star className="w-3 h-3" /> },
      academic: { label: 'Academic', color: 'text-green-600', bgColor: 'bg-green-100', icon: <Star className="w-3 h-3" /> },
      enterprise: { label: 'Enterprise', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: <Crown className="w-3 h-3" /> }
    };
    return map[tier] || map.free;
  };

  const getCurrentModuleTitle = () => {
    const pathname = window.location.pathname;
    
    // Admin pages
    if (pathname.includes('/admin-dashboard')) {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'overview') return 'Overview';
      if (tab === 'users') return 'Users';
      if (tab === 'modules') return 'Modules';
      if (tab === 'blog') return 'Blog';
      if (tab === 'ads') return 'Ads';
      if (tab === 'data-management') {
        const module = urlParams.get('module');
        if (module) {
          return module.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
        }
        return 'Data Management';
      }
      if (tab === 'newsletter') return 'Newsletter';
      return 'Admin Dashboard';
    }
    if (pathname.includes('/admin-profile')) return 'Account';
    
    // Main data pages
    if (pathname.includes('/companies')) return 'Companies';
    if (pathname.includes('/deals')) return 'Deals';
    if (pathname.includes('/grants')) return 'Grants';
    if (pathname.includes('/investors')) return 'Investors';
    if (pathname.includes('/clinical-trials')) return 'Clinical Trials';
    if (pathname.includes('/nationpulse') || pathname.includes('/nation-pulse')) return 'Nation Pulse';
    if (pathname.includes('/public-markets')) return 'Public Markets';
    if (pathname.includes('/regulatory-ecosystem')) return 'Regulatory Ecosystem';
    if (pathname.includes('/regulatory') && !pathname.includes('/regulatory-ecosystem')) return 'Regulatory';
    if (pathname.includes('/clinical-centers')) return 'Clinical Centers';
    if (pathname.includes('/investigators')) return 'Investigators';
    if (pathname.includes('/fundraising-crm')) return 'Fundraising CRM';
    if (pathname.includes('/startup-analytics')) return 'Startup Analytics';
    if (pathname.includes('/ai-tools')) return 'AI Tools';
    
    // Dashboard pages
    if (pathname.includes('/startup-dashboard')) return 'Dashboard';
    if (pathname.includes('/investor-dashboard')) return 'Dashboard';
    if (pathname.includes('/researcher-dashboard')) return 'Dashboard';
    if (pathname.includes('/executive-dashboard')) return 'Dashboard';
    if (pathname.includes('/regulator-dashboard')) return 'Dashboard';
    
    // Profile pages
    if (pathname.includes('/startup-profile')) return 'Account';
    if (pathname.includes('/investor-profile')) return 'Account';
    if (pathname.includes('/researcher-profile')) return 'Account';
    if (pathname.includes('/executive-profile')) return 'Account';
    if (pathname.includes('/regulator-profile')) return 'Account';
    
    // Manager dashboards
    if (pathname.includes('/users-manager-dashboard')) return 'Users Manager';
    if (pathname.includes('/ads-manager-dashboard')) return 'Ads Manager';
    if (pathname.includes('/blog-manager-dashboard')) return 'Blog Manager';
    
    return currentModule ? currentModule.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Dashboard';
  };

  const accountTierInfo = getAccountTierInfo();
  const moduleTitle = getCurrentModuleTitle();

  const dispatchSidebarToggle = () => {
    try {
      const evt = new CustomEvent('medarion:sidebar:toggle');
      window.dispatchEvent(evt);
    } catch {}
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm relative">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-teal-500/5 pointer-events-none" />
      
      <div className="relative px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Mobile menu button + Module Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            className="lg:hidden p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 transition-all duration-200 group"
            aria-label="Open menu"
            onClick={dispatchSidebarToggle}
          >
            <Menu className="h-5 w-5 text-slate-900 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
          </button>
          
          {/* Module Title - Always shown */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium text-slate-900 dark:text-slate-100">
              {moduleTitle}
            </h1>
          </div>
        </div>

        {/* Right: Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 transition-all duration-200 relative group">
              <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 transition-all duration-200 group"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
            ) : (
              <Sun className="h-5 w-5 text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative user-dropdown-container">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 dark:hover:from-slate-700/50 dark:hover:to-slate-700/50 transition-all duration-200 group"
            >
              <div className="relative">
                {(profile as any)?.profileImage && !profileImageError ? (
                  <img 
                    src={(profile as any).profileImage} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-xl object-cover border-2 border-cyan-200 dark:border-cyan-800 shadow-md group-hover:border-cyan-400 dark:group-hover:border-cyan-600 transition-colors"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-600 flex items-center justify-center border-2 border-slate-200 dark:border-cyan-800 shadow-md group-hover:border-cyan-400 dark:group-hover:border-cyan-600 transition-colors">
                    <span className="text-slate-900 dark:text-white font-medium text-sm">
                      {profile?.firstName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-slate-700/30 dark:to-slate-700/30">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {profile?.firstName && profile?.lastName 
                      ? `${profile.firstName} ${profile.lastName}`
                      : profile?.username || profile?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {profile?.email || 'user@example.com'}
                  </p>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => {
                      const profileRoute = getProfileRoute(profile);
                      navigate(profileRoute);
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-all duration-200"
                  >
                    <div className="p-1 rounded-lg bg-cyan-100 dark:bg-slate-700">
                      <User className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-slate-900 dark:text-slate-200">My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  >
                    <div className="p-1 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
