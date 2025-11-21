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
      className={`bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm ${onClick ? 'cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md' : 'transition-all duration-300'} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">{formatValue(value)}</p>
          {trend && (
            <p className="text-[var(--color-primary-teal)] text-sm mt-1">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg shadow-sm border border-[var(--color-divider-gray)] bg-[var(--color-background-default)]">
            <Icon className="h-6 w-6 text-[var(--color-primary-teal)]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;