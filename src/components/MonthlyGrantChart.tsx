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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          <p className="text-primary-600 dark:text-primary-400">
            Value: ${(payload[0].value / 1000000).toFixed(1)}M
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Grants: {payload[0].payload.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Grant & Funding</h3>
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
              interval={isSmall ? 'preserveStartEnd' : 0}
              minTickGap={isSmall ? 12 : 0}
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={isSmall ? 10 : 12}
              tickFormatter={(value: number) => `$${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#4caf50" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyGrantChart;