import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchNationPulse } from '../services/ai';

const RegionalTrendsChart = () => {
  const [np, setNp] = useState<any | null>(null);

  useEffect(() => {
    fetchNationPulse().then(setNp).catch(() => setNp(null));
  }, []);
  
  // Create trend data (simulated historical data for demonstration)
  const trendData = [
    { year: '2019', nigeria: 52.5, kenya: 64.2, ghana: 62.1, south_africa: 62.8, egypt: 70.1, rwanda: 67.2 },
    { year: '2020', nigeria: 53.1, kenya: 64.8, ghana: 62.7, south_africa: 63.2, egypt: 70.5, rwanda: 67.8 },
    { year: '2021', nigeria: 53.7, kenya: 65.4, ghana: 63.3, south_africa: 63.6, egypt: 71.0, rwanda: 68.4 },
    { year: '2022', nigeria: 54.2, kenya: 66.0, ghana: 63.8, south_africa: 64.0, egypt: 71.4, rwanda: 68.8 },
    { year: '2023', nigeria: 54.7, kenya: 66.7, ghana: 64.1, south_africa: 64.1, egypt: 71.9, rwanda: 69.0 }
  ];

  const colors: Record<string, string> = {
    nigeria: '#ef4444',
    kenya: '#00665C',
    ghana: '#f59e0b',
    south_africa: '#3b82f6',
    egypt: '#8b5cf6',
    rwanda: '#f97316'
  };

  const countryNames: Record<string, string> = useMemo(() => ({
    nigeria: np?.population?.nigeria?.country || 'Nigeria',
    kenya: np?.population?.kenya?.country || 'Kenya',
    ghana: np?.population?.ghana?.country || 'Ghana',
    south_africa: np?.population?.south_africa?.country || 'South Africa',
    egypt: np?.population?.egypt?.country || 'Egypt',
    rwanda: np?.population?.rwanda?.country || 'Rwanda',
  }), [np]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)} years
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Life Expectancy Trends (2019-2023)</h3>
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={12}
              domain={['dataMin - 2', 'dataMax + 2']}
              label={{ value: 'Life Expectancy (years)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            {Object.keys(colors).map(key => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={countryNames[key]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RegionalTrendsChart;