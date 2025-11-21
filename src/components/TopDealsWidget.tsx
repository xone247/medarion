import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { dataService } from '../services/dataService';

const TopDealsWidget: React.FC = () => {
  const [deals, setDeals] = useState<any[]>([]);

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
            company_logo: null,
          }));
          setDeals(transformed);
        } else {
          setDeals([]);
        }
      })
      .catch(() => setDeals([]));
  }, []);

  const topDeals = useMemo(() => deals.slice().sort((a, b) => b.value_usd - a.value_usd).slice(0, 8), [deals]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary-400" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Top Deals</h3>
      </div>
      <div className="space-y-3">
        {topDeals.map((deal) => (
          <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer shadow-sm border border-gray-200 dark:border-gray-600">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{deal.company_name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{deal.sector} • {deal.country}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm md:text-base font-bold text-accent-600 dark:text-accent-500">${(deal.value_usd / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{deal.stage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopDealsWidget;