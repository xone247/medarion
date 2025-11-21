import React from 'react';

export interface LogoItem {
  name: string;
  logoUrl?: string;
}

interface LogoWallProps {
  title?: string;
  items: LogoItem[];
  columns?: 3 | 4 | 5 | 6;
}

const LogoWall: React.FC<LogoWallProps> = ({ title, items, columns = 6 }) => {
  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }[columns];

  return (
    <div className="card">
      {title && (
        <div className="tile-header">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
        </div>
      )}
      <div className={`p-4 grid ${gridCols} gap-3 md:gap-4`}>
        {items.map((item) => (
          <div key={item.name} className="aspect-square rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-default)] flex items-center justify-center overflow-hidden">
            {item.logoUrl ? (
              <img src={item.logoUrl} alt={item.name} className="w-3/4 h-3/4 object-contain" />
            ) : (
              <span className="text-xs text-[var(--color-text-secondary)] text-center px-2">{item.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoWall; 