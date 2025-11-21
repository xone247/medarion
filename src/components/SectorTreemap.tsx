import React, { useEffect, useMemo, useState } from 'react';
import { dataService } from '../services/dataService';
import { Treemap, ResponsiveContainer } from 'recharts';

const SectorTreemap: React.FC<{ deals?: any[] }> = ({ deals: dealsProp }) => {
  const [deals, setDeals] = useState<any[]>(dealsProp || []);
  useEffect(() => {
    if (!dealsProp) {
      dataService.getDeals({ limit: 200 })
        .then(res => {
          if (res.success && res.data) {
            const transformed = res.data.map((d: any) => ({
              id: d.id,
              value_usd: parseFloat(d.amount || 0),
              sector: d.sector || d.industry || 'Unknown',
            }));
            setDeals(transformed);
          } else {
            setDeals([]);
          }
        })
        .catch(() => setDeals([]));
    } else {
      setDeals(dealsProp);
    }
  }, [dealsProp]);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of deals) {
      const key = d.sector || 'Unknown';
      map.set(key, (map.get(key) || 0) + (d.value_usd || 0));
    }
    const children = Array.from(map.entries()).map(([name, value]) => ({ name, size: Math.round(value / 1_000_000) }));
    return { name: 'sectors', children } as any;
  }, [deals]);

  return (
    <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">Investment by Sector (Treemap)</h3>
      <div className="h-64 md:h-72">
        <ResponsiveContainer>
          <Treemap data={data.children} dataKey="size" stroke="#fff" fill="#00665C" content={<CustomizedContent />} />
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, size } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: '#00665C', stroke: '#fff' }} />
      {width > 80 && height > 24 && (
        <text x={x + 8} y={y + 18} fill="#fff" fontSize={12}>{name} • {size}M</text>
      )}
    </g>
  );
};

export default SectorTreemap; 