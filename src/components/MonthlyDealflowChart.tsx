import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { TrendingUp, TrendingDown, DollarSign, FileText, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

const MonthlyDealflowChart: React.FC<{ deals?: Deal[] }> = ({ deals: dealsProp }) => {
  const [deals, setDeals] = useState<Deal[]>(dealsProp || []);
  const [isSmall, setIsSmall] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  useEffect(() => {
    if (!dealsProp || dealsProp.length === 0) {
      apiService.get('/admin/deals', { all: 'true' })
        .then(res => {
          if (res.success && res.data && Array.isArray(res.data)) {
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
            console.log('[MonthlyDealflowChart] Loaded deals:', transformed.length);
            setDeals(transformed);
          } else {
            console.warn('[MonthlyDealflowChart] No data in response');
            setDeals([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching deals for MonthlyDealflowChart:', error);
          setDeals([]);
        });
    } else {
      console.log('[MonthlyDealflowChart] Using provided deals:', dealsProp.length);
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
    if (!deals || deals.length === 0) return [];
    
    const acc: Record<string, { month: string; value: number; count: number }> = {};
    for (const d of deals) {
      if (!d.date || !d.value_usd) continue;
      try {
        const date = new Date(d.date);
        if (isNaN(date.getTime())) continue;
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = { month: monthYear, value: 0, count: 0 };
        const value = Number(d.value_usd || 0);
        if (!isNaN(value) && value > 0) {
          acc[monthYear].value += value;
          acc[monthYear].count += 1;
        }
      } catch (e) {
        continue;
      }
    }
    const result = Object.values(acc).sort((a, b) => {
      try {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
      } catch {
        return 0;
      }
    });
    return result;
  }, [deals]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        totalValue: 0,
        totalDeals: 0,
        avgValue: 0,
        peakMonth: null as { month: string; value: number; count: number } | null,
        recentTrend: 'stable' as 'up' | 'down' | 'stable'
      };
    }

    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
    const totalDeals = chartData.reduce((sum, item) => sum + item.count, 0);
    const avgValue = totalValue / chartData.length;
    const peakMonth = chartData.reduce((max, item) => item.value > max.value ? item : max, chartData[0]);
    
    // Calculate trend (compare last 3 months to previous 3 months)
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (chartData.length >= 6) {
      const recent = chartData.slice(-3).reduce((sum, item) => sum + item.value, 0);
      const previous = chartData.slice(-6, -3).reduce((sum, item) => sum + item.value, 0);
      if (recent > previous * 1.1) recentTrend = 'up';
      else if (recent < previous * 0.9) recentTrend = 'down';
    }

    return { totalValue, totalDeals, avgValue, peakMonth, recentTrend };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="card-glass overflow-hidden shadow-soft rounded-lg">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">Monthly Dealflow</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Investment value over time</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No data available</p>
        </div>
      </div>
    );
  }

  const recentMonths = chartData.slice().reverse().slice(0, 6);
  const displayMonths = showAllMonths ? chartData.slice().reverse() : recentMonths;

  return (
    <div className="card-glass overflow-hidden shadow-soft rounded-lg">
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">Monthly Dealflow</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Investment activity overview</p>
      </div>
      <div className="p-3 sm:p-4">
        {/* Compact Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2.5 sm:p-3 border border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              {stats.recentTrend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
              {stats.recentTrend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-0.5">Total</p>
            <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">${(stats.totalValue / 1000000).toFixed(1)}M</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2.5 sm:p-3 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-0.5">Deals</p>
            <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">{stats.totalDeals}</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-2.5 sm:p-3 border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-0.5">Avg/Month</p>
            <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">${(stats.avgValue / 1000000).toFixed(1)}M</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5 sm:p-3 border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-0.5">Peak</p>
            <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 truncate">{stats.peakMonth?.month || 'N/A'}</p>
          </div>
        </div>

        {/* Compact Monthly Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Activity</h4>
            {chartData.length > 6 && (
              <button
                onClick={() => setShowAllMonths(!showAllMonths)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              >
                {showAllMonths ? 'Show Less' : `Show All (${chartData.length})`}
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-1">
            {displayMonths.map((item, index) => {
              const prevItem = chartData[chartData.length - (showAllMonths ? index + 2 : index + 2)];
              const change = prevItem ? ((item.value - prevItem.value) / prevItem.value * 100) : 0;
              const isPositive = change > 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.month}</p>
                    <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">${(item.value / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{item.count}</p>
                      </div>
                    </div>
                  </div>
                  {prevItem && Math.abs(change) > 0.1 && (
                    <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-medium ml-2 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      <span>{Math.abs(change).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyDealflowChart;