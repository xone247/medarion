import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, 
  Settings, 
  Bell, 
  HelpCircle, 
  Crown, 
  Star, 
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Lightbulb,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';

interface ProfileHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  onNavigateToModule?: (moduleId: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title,
  subtitle,
  icon,
  showBackButton = false,
  onBack,
  actions,
  onNavigateToModule
}) => {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Get account tier information
  const getAccountTierInfo = () => {
    if (!profile) return { tier: 'free', label: 'Free', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: null };
    const tier = (profile as any)?.account_tier || 'free';
    const tierMap = {
      'free': { label: 'Free', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: null },
      'paid': { label: 'Pro', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Star className="w-3 h-3" /> },
      'enterprise': { label: 'Enterprise', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: <Crown className="w-3 h-3" /> },
      'admin': { label: 'Admin', color: 'text-red-600', bgColor: 'bg-red-100', icon: <Crown className="w-3 h-3" /> }
    } as const;
    return { tier, ...(tierMap as any)[tier] || tierMap.free } as any;
  };

  const accountTierInfo = getAccountTierInfo();

  // Get role-specific quick actions
  const getQuickActions = () => {
    if (!profile) return [] as any[];
    
    const role = (profile as any)?.user_type || (profile as any)?.role || 'startup';
    const tier = (profile as any)?.account_tier || 'free';
    
    const actionsList: any[] = [];
    actionsList.push({ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => onNavigateToModule?.('settings') });
    if (role === 'admin') {
      actionsList.push({ id: 'admin-dashboard', label: 'Admin Dashboard', icon: <Building2 className="w-4 h-4" />, onClick: () => onNavigateToModule?.('admin-dashboard') });
    }
    return actionsList;
  };

  const quickActions = getQuickActions();

  return (
    <div className="md:sticky md:top-0 z-30 bg-[var(--color-background-surface)] border-b border-[var(--color-divider-gray)] backdrop-blur-sm">
      <div className="px-4 py-2 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and back button */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-[var(--color-background-default)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="p-2 rounded-lg bg-gradient-to-r from-[var(--color-primary-teal)] to-[var(--color-accent-sky)] text-white">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
                {subtitle && (
                  <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Minimal actions */}
          <div className="flex items-center space-x-2">
            <span className={`hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${accountTierInfo.bgColor} ${accountTierInfo.color}`}>
              {accountTierInfo.icon}
              {accountTierInfo.label}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--color-background-default)] transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" />
              ) : (
                <Sun className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)] transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
