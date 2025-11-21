import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dataService } from '../services/dataService';

type Deal = {
  id: number;
  company_name: string;
  value_usd: number;
  stage: string;
  country: string;
  date: string;
  sector: string;
  investors: string[];
};

const MonthlyDealflowChart: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    dataService.getDeals({ limit: 200 })
      .then(res => {
        if (res.success && res.data) {
          const transformed = res.data.map((d: any) => ({
            id: d.id,
            company_name: d.company_name || 'Unknown',
            investors: d.participants ? (typeof d.participants === 'string' ? JSON.parse(d.participants) : d.participants) : (d.lead_investor ? [d.lead_investor] : []),
            value_usd: parseFloat(d.amount || 0),
            stage: d.deal_type || 'Unknown',
            country: d.country || 'Unknown',
            date: d.deal_date || d.created_at,
            sector: d.sector || d.industry || 'Unknown',
          }));
          setDeals(transformed);
        } else {
          setDeals([]);
        }
      })
      .catch(() => setDeals([]));
  }, []);

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const chartData = useMemo(() => {
    const acc: Record<string, { month: string; value: number; count: number }> = {};
    for (const d of deals) {
      const date = new Date(d.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[monthYear]) acc[monthYear] = { month: monthYear, value: 0, count: 0 };
      acc[monthYear].value += d.value_usd;
      acc[monthYear].count += 1;
    }
    return Object.values(acc).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [deals]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          <p className="text-primary-600 dark:text-primary-400">
            Value: ${(payload[0].value / 1000000).toFixed(1)}M
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Deals: {payload[0].payload.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tile">
      <div className="tile-header">
        <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-primary)]">Monthly Dealflow</h3>
      </div>
      <div className="h-56 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 16, left: 8, bottom: isSmall ? 10 : 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={isSmall ? 10 : 12}
              angle={isSmall ? 0 : -45}
              textAnchor={isSmall ? 'middle' : 'end'}
              height={isSmall ? 30 : 60}
              tickMargin={isSmall ? 4 : 10}
              interval={isSmall ? 'preserveStartEnd' : 0}
              minTickGap={isSmall ? 12 : 0}
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={isSmall ? 10 : 12}
              tickFormatter={(value: number) => `$${(value / 1000000).toFixed(0)}M`}
              label={{ value: 'Deal Value (USD)', angle: -90, position: 'insideLeft', offset: -5 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="var(--color-primary-teal)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyDealflowChart;