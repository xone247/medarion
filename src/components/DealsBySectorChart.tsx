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
  
  // Modern, professional color palette with good contrast
  const COLORS = [
    '#14b8a6', // teal-500 - primary
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#f97316', // orange-500
    '#ef4444', // red-500
    '#84cc16', // lime-500
    '#06b6d4'  // cyan-500 (repeat for more sectors)
  ];

  // Sort data by value descending for better visualization
  const sortedData = useMemo(() => {
    return [...chartData].sort((a, b) => b.value - a.value);
  }, [chartData]);

  const totalValue = useMemo(() => {
    return sortedData.reduce((sum, d) => sum + d.value, 0);
  }, [sortedData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-slate-900 dark:text-white font-medium text-sm mb-2">{data.name}</p>
          <p className="text-cyan-600 dark:text-cyan-400 font-semibold">Value: ${(data.value / 1000000).toFixed(1)}M</p>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Percentage: {percent}%</p>
          <p className="text-slate-600 dark:text-slate-400 text-xs">Deals: {data.count}</p>
          <p className="text-slate-600 dark:text-slate-400 text-xs">Avg Deal: ${(data.count > 0 ? (data.value / data.count / 1000000) : 0).toFixed(1)}M</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-glass overflow-hidden shadow-soft rounded-lg">
      <div className="p-3 sm:p-4 md:p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">Deal Value by Sector</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Investment distribution across sectors</p>
      </div>
      <div className="p-2.5 sm:p-4 md:p-6 lg:p-8">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col lg:hidden space-y-3">
          {/* Total Investment Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">${(totalValue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sortedData.length} sectors</p>
          </div>
          
          {/* Pie Chart - Compact on mobile */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={false}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={2}
                >
                  {sortedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend List - Scrollable */}
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
            {sortedData.map((entry, index) => {
              const percent = totalValue > 0 ? ((entry.value / totalValue) * 100) : 0;
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{entry.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{entry.count} deals • {percent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">${(entry.value / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Layout - Side by side */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
          {/* Detailed Legend with Stats */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Total Investment</p>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">${(totalValue / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sortedData.length} sectors</p>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {sortedData.map((entry, index) => {
                const percent = totalValue > 0 ? ((entry.value / totalValue) * 100) : 0;
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{entry.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{entry.count} deals</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">${(entry.value / 1000000).toFixed(1)}M</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{percent.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Pie Chart */}
          <div className="lg:col-span-2 h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={false}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={2}
                >
                  {sortedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsBySectorChart;