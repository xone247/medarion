import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

const VCInvestmentOverTimeChart: React.FC<{ deals?: any[] }> = ({ deals: dealsProp }) => {
  const [deals, setDeals] = useState<any[]>(dealsProp || []);

  useEffect(() => {
    if (!dealsProp) {
      apiService.get('/admin/deals', { limit: '200' })
        .then(res => {
          if (res.success && res.data && Array.isArray(res.data)) {
            const transformed = res.data.map((d: any) => ({
              id: d.id,
              value_usd: parseFloat(d.amount || d.value_usd || 0),
              date: d.deal_date || d.date || d.created_at,
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

  const series = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const d of deals) {
      const month = String(d.date || '').slice(0, 7); // YYYY-MM
      const v = Number(d.value_usd || 0);
      byMonth.set(month, (byMonth.get(month) || 0) + v);
    }
    const months = Array.from(byMonth.keys()).sort();
    let cumulative = 0;
    const data = months.map((m) => {
      const monthly = byMonth.get(m) || 0;
      cumulative += monthly;
      return { month: m, monthly: monthly / 1_000_000, cumulative: cumulative / 1_000_000 };
    });
    return data;
  }, [deals]);

  return (
    <div className="bg-[var(--color-background-surface)] p-4 md:p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)] mb-4">VC Investment Over Time</h3>
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} />
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ComposedChart = ({ data }: { data: Array<{ month: string; monthly: number; cumulative: number }> }) => (
  <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
    <XAxis dataKey="month" stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} />
    <YAxis stroke="#6b7280" className="dark:stroke-gray-400" fontSize={12} tickFormatter={(v) => `${v}M`} />
    <Tooltip formatter={(v) => `${Number(v).toFixed(1)}M`} />
    <Legend />
    <Line type="monotone" dataKey="monthly" stroke="#00665C" strokeWidth={2} dot={{ r: 2 }} name="Monthly ($M)" />
    <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} dot={{ r: 0 }} name="Cumulative ($M)" />
  </LineChart>
);

export default VCInvestmentOverTimeChart; 