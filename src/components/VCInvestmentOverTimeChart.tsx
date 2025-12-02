import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

const VCInvestmentOverTimeChart: React.FC<{ deals?: any[] }> = ({ deals: dealsProp }) => {
  const [deals, setDeals] = useState<any[]>(dealsProp || []);

  useEffect(() => {
    if (!dealsProp || dealsProp.length === 0) {
      apiService.get('/admin/deals', { all: 'true' })
        .then(res => {
          if (res.success && res.data && Array.isArray(res.data)) {
            const transformed = res.data.map((d: any) => ({
              id: d.id,
              value_usd: parseFloat(d.amount || d.value_usd || 0),
              date: d.deal_date || d.date || d.created_at,
            }));
            console.log('[VCInvestmentOverTimeChart] Loaded deals:', transformed.length);
            setDeals(transformed);
          } else {
            console.warn('[VCInvestmentOverTimeChart] No data in response');
            setDeals([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching deals for VCInvestmentOverTimeChart:', error);
          setDeals([]);
        });
    } else {
      console.log('[VCInvestmentOverTimeChart] Using provided deals:', dealsProp.length);
      setDeals(dealsProp);
    }
  }, [dealsProp]);

  const series = useMemo(() => {
    if (!deals || deals.length === 0) return [];
    
    const byMonth = new Map<string, number>();
    for (const d of deals) {
      if (!d.date || !d.value_usd) continue;
      try {
        const date = new Date(d.date);
        if (isNaN(date.getTime())) continue;
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        const v = Number(d.value_usd || 0);
        if (isNaN(v) || v <= 0) continue;
        byMonth.set(month, (byMonth.get(month) || 0) + v);
      } catch (e) {
        continue;
      }
    }
    
    if (byMonth.size === 0) return [];
    
    const months = Array.from(byMonth.keys()).sort();
    let cumulative = 0;
    const data = months.map((m) => {
      const monthly = byMonth.get(m) || 0;
      cumulative += monthly;
      return { 
        month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
        monthly: monthly / 1_000_000, 
        cumulative: cumulative / 1_000_000 
      };
    });
    return data;
  }, [deals]);

  if (series.length === 0) {
    return (
      <div className="card-glass overflow-hidden shadow-soft rounded-lg">
        <div className="p-3 sm:p-4 md:p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">VC Investment Over Time</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Monthly and cumulative investment trends</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass overflow-hidden shadow-soft rounded-lg">
      <div className="p-3 sm:p-4 md:p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">VC Investment Over Time</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Monthly and cumulative investment trends</p>
      </div>
      <div className="p-3 sm:p-4">
        <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} />
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ComposedChart = ({ data }: { data: Array<{ month: string; monthly: number; cumulative: number }> }) => {
  const [isSmall, setIsSmall] = useState(false);
  
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  return (
    <LineChart data={data} margin={{ top: 10, right: 20, bottom: isSmall ? 20 : 40, left: isSmall ? -10 : 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
      <XAxis 
        dataKey="month" 
        stroke="#6b7280" 
        className="dark:stroke-gray-400" 
        fontSize={isSmall ? 10 : 12}
        angle={isSmall ? -45 : 0}
        textAnchor={isSmall ? 'end' : 'middle'}
        height={isSmall ? 60 : 40}
      />
      <YAxis 
        stroke="#6b7280" 
        className="dark:stroke-gray-400" 
        fontSize={isSmall ? 10 : 12} 
        tickFormatter={(v) => `${v}M`}
        width={isSmall ? 50 : 60}
      />
      <Tooltip 
        formatter={(v: any, name: string) => {
          const label = name === 'monthly' ? 'Monthly' : 'Cumulative';
          return [`$${Number(v).toFixed(1)}M`, label];
        }}
        labelFormatter={(label) => `Month: ${label}`}
        contentStyle={{ 
          backgroundColor: 'white', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        labelStyle={{ color: '#1e293b', fontWeight: 500 }}
      />
      <Legend 
        wrapperStyle={{ fontSize: isSmall ? '11px' : '12px', paddingTop: '10px' }}
        iconType="line"
      />
      <Line 
        type="monotone" 
        dataKey="monthly" 
        stroke="#14b8a6" 
        strokeWidth={2.5} 
        dot={{ r: isSmall ? 3 : 4, fill: '#14b8a6', strokeWidth: 2, stroke: '#fff' }} 
        activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2 }}
        name="Monthly ($M)" 
      />
      <Line 
        type="monotone" 
        dataKey="cumulative" 
        stroke="#06b6d4" 
        strokeWidth={2.5} 
        dot={{ r: 0 }} 
        strokeDasharray="5 5" 
        name="Cumulative ($M)" 
      />
    </LineChart>
  );
};

export default VCInvestmentOverTimeChart; 