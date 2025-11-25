import React from 'react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
  className?: string;
  onClick?: () => void;
  tooltip?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, trend, className = '', onClick, tooltip }) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number' && val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    if (typeof val === 'number' && val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    if (typeof val === 'number' && title.includes('$')) {
      return `$${val.toLocaleString()}`;
    }
    return val;
  };

  return (
    <div
      title={tooltip}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 dark:from-cyan-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">{formatValue(value)}</p>
          {trend && (
            <p className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
            <Icon className="h-5 w-5 text-white !text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;