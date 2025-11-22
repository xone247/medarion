import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import NotificationDropdown from './NotificationDropdown';
import {
  Crown,
  Star,
  Sun,
  Moon,
  Menu
} from 'lucide-react';

const GlobalHeader: React.FC = () => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  let navigationContext;
  try {
    navigationContext = useNavigation();
  } catch {
    return null;
  }
  
  const { currentModule } = navigationContext;

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
    if (pathname.includes('/admin-dashboard')) return 'Admin Dashboard';
    if (pathname.includes('/nationpulse')) return 'Nation Pulse';
    return currentModule ? currentModule.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Dashboard';
  };

  const accountTierInfo = getAccountTierInfo();

  const dispatchSidebarToggle = () => {
    try {
      const evt = new CustomEvent('medarion:sidebar:toggle');
      window.dispatchEvent(evt);
    } catch {}
  };

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="px-4 py-3 flex items-center justify-between gap-3 shadow-lg rounded-b-2xl" style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Left: mobile hamburger + (desktop) title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            className="lg:hidden p-2 rounded-lg bg-[var(--color-background-surface)] shadow border border-[var(--color-divider-gray)] hover:bg-[var(--color-background-default)] transition-colors"
            aria-label="Open menu"
            onClick={dispatchSidebarToggle}
          >
            <Menu className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
          <div className="block min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{getCurrentModuleTitle()}</h1>
            <p className="text-sm text-gray-700 dark:text-white/80 truncate">{(profile as any)?.email || 'User'} • {accountTierInfo.label}</p>
          </div>
        </div>
        {/* Right: controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${accountTierInfo.bgColor} ${accountTierInfo.color}`}>
            {accountTierInfo.icon}
            {accountTierInfo.label}
          </span>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="card-glass p-2 rounded-md hover:shadow-soft transition-all duration-200 hover:bg-opacity-90 flex-shrink-0"
          >
            {theme === 'light' ? <Moon className="h-5 w-5 text-[var(--color-primary-teal)]" /> : <Sun className="h-5 w-5 text-[var(--color-primary-teal)]" />}
          </button>
          <NotificationDropdown />
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
