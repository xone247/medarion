import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dataService } from '../services/dataService';

type Deal = {
  id: number;
  value_usd: number;
  stage: string;
};

const DealsByStageChart: React.FC<{ deals?: Deal[] }> = ({ deals: dealsProp }) => {
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
              stage: d.deal_type || 'Unknown',
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
    const acc: Record<string, { stage: string; value: number; count: number }> = {};
    for (const d of deals) {
      const key = d.stage as any;
      if (!acc[key]) acc[key] = { stage: key as any, value: 0, count: 0 };
      acc[key].value += (d as any).value_usd as any;
      acc[key].count += 1;
    }
    return Object.values(acc);
  }, [deals]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] p-3 rounded-lg shadow-lg">
          <p className="text-[var(--color-text-primary)] font-medium">{label}</p>
          <p className="text-[var(--color-primary-teal)]">Value: ${(payload[0].value / 1000000).toFixed(1)}M</p>
          <p className="text-[var(--color-text-secondary)]">Deals: {payload[0].payload.count}</p>
          <p className="text-[var(--color-text-secondary)]">Avg: {(payload[0].payload.count > 0 ? (payload[0].value / payload[0].payload.count / 1000000) : 0).toFixed(1)}M</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">Deal Value by Stage</h3>
      <div className="h-56 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
            <XAxis 
              type="number"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={isSmall ? 10 : 12}
              tickFormatter={(value: number) => `$${(value / 1000000).toFixed(0)}M`}
              label={{ value: 'Deal Value (USD)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="category"
              dataKey="stage"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={isSmall ? 10 : 12}
              width={isSmall ? 64 : 80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#ffc107" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DealsByStageChart;