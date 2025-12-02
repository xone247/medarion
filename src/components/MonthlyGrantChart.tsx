import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Grant = {
  id: number;
  organizationName: string;
  funders: string[];
  value: number;
  type: string;
  country: string;
  date: string;
  sector: string;
  duration?: string | null;
};

const MonthlyGrantChart: React.FC<{ grants?: Grant[] }> = ({ grants = [] }) => {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const monthlyData = (grants || []).reduce((acc: any, grant: Grant) => {
    const date = new Date(grant.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = { month: monthYear, value: 0, count: 0 };
    }
    acc[monthYear].value += grant.value;
    acc[monthYear].count += 1;
    
    return acc;
  }, {} as Record<string, { month: string; value: number; count: number }>);

  const chartData = Object.values(monthlyData as Record<string, { month: string; value: number; count: number }>).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  
  // Calculate interval for x-axis to show fewer dates
  const getXAxisInterval = () => {
    if (chartData.length <= 6) return 0; // Show all if 6 or fewer
    if (chartData.length <= 12) return 1; // Show every other if 12 or fewer
    if (chartData.length <= 24) return 2; // Show every 3rd if 24 or fewer
    return Math.floor(chartData.length / 8); // Show approximately 8 dates max
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-slate-900 dark:text-white font-medium text-sm mb-2">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Value: ${(payload[0].value / 1000000).toFixed(1)}M
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Grants: {payload[0].payload.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-glass overflow-hidden shadow-soft rounded-lg h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">Monthly Grant & Funding</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Funding activity overview</p>
      </div>
      <div className="flex-1 p-3 sm:p-4 min-h-0">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: isSmall ? 40 : 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={isSmall ? 9 : 11}
                angle={isSmall ? 0 : -45}
                textAnchor={isSmall ? 'middle' : 'end'}
                height={isSmall ? 40 : 60}
                interval={getXAxisInterval()}
                minTickGap={isSmall ? 8 : 5}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={isSmall ? 9 : 11}
                tickFormatter={(value: number) => `$${(value / 1000000).toFixed(0)}M`}
                tick={{ fill: '#6b7280' }}
                width={isSmall ? 50 : 60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MonthlyGrantChart;