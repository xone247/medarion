import React, { useState } from 'react';
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
  Search,
  Bell
} from 'lucide-react';
import Logo from './Logo';

const GlobalHeader: React.FC = () => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  
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
    <div className="sticky top-0 z-30 w-full bg-white dark:bg-[var(--color-background-surface)] border-b border-gray-200 dark:border-[var(--color-divider-gray)] shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Mobile menu button + Search bar */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--color-background-default)] transition-colors"
            aria-label="Open menu"
            onClick={dispatchSidebarToggle}
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-[var(--color-text-secondary)]" />
          </button>
          
          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search something..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-[var(--color-background-default)] border border-gray-200 dark:border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-[var(--color-text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--color-background-default)] transition-colors relative">
              <Bell className="h-5 w-5 text-gray-600 dark:text-[var(--color-text-secondary)]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--color-background-default)] transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5 text-gray-600 dark:text-[var(--color-text-secondary)]" /> : <Sun className="h-5 w-5 text-gray-600 dark:text-[var(--color-text-secondary)]" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
