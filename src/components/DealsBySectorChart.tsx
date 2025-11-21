import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dataService } from '../services/dataService';

type Deal = {
  id: number;
  value_usd: number;
  sector: string;
};

const DealsBySectorChart: React.FC<{ deals?: Deal[] }> = ({ deals: dealsProp }) => {
  const [deals, setDeals] = useState<Deal[]>(dealsProp || []);
  const [isSmall, setIsSmall] = useState(false);

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

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const chartData = useMemo(() => {
    const acc: Record<string, { name: string; value: number; count: number }> = {};
    for (const d of deals) {
      const key = (d as any).sector as any;
      if (!acc[key]) acc[key] = { name: key as any, value: 0, count: 0 };
      acc[key].value += (d as any).value_usd as any;
      acc[key].count += 1;
    }
    return Object.values(acc);
  }, [deals]);
  
  const COLORS = [
    '#00665C', '#ffc107', '#4caf50', '#2196f3', 
    '#ff9800', '#e91e63', '#9c27b0', '#795548'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] p-3 rounded-lg shadow-lg">
          <p className="text-[var(--color-text-primary)] font-medium">{data.name}</p>
          <p className="text-[var(--color-primary-teal)]">Value: ${(data.value / 1000000).toFixed(1)}M</p>
          <p className="text-[var(--color-text-secondary)]">Deals: {data.count}</p>
          <p className="text-[var(--color-text-secondary)]">Avg: {(data.count > 0 ? (data.value / data.count / 1000000) : 0).toFixed(1)}M</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">Deal Value by Sector</h3>
      <div className="h-56 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={isSmall ? 70 : 80}
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {!isSmall && <Legend layout="vertical" verticalAlign="middle" align="right" />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DealsBySectorChart;