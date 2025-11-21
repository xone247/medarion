import React from 'react';
import { Globe } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useTheme } from '../contexts/ThemeContext';

const Logo = () => {
  const { theme } = useTheme();
  let dashboardContext;
  try {
    dashboardContext = useDashboard();
  } catch (error) {
    // Context not available, render without functionality
    return (
      <button 
        className="flex items-center gap-2 hover:bg-[var(--color-background-default)] transition-colors rounded-lg flex-1"
      >
        <img 
          src="/images/logo-light.png" 
          alt="Medarion" 
          className="h-10 md:h-12"
          style={{
            filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
          }}
        />
      </button>
    );
  }

  const { setCurrentModule, setShowDashboardSummary } = dashboardContext;

  const handleLogoClick = () => {
    setCurrentModule(null);
    setShowDashboardSummary(true);
  };

  return (
    <button 
      onClick={handleLogoClick}
      className="flex items-center gap-2 hover:bg-[var(--color-background-default)] transition-colors rounded-lg flex-1"
    >
      <img 
        src="/images/logo-light.png" 
        alt="Medarion" 
        className="h-10 md:h-12"
        style={{
          filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
        }}
      />
    </button>
  );
};

export default Logo;