import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { dataService } from '../services/dataService';

const MostActiveInvestorsWidget: React.FC = () => {
  const [investors, setInvestors] = useState<any[]>([]);

  useEffect(() => {
    dataService.getInvestors({ limit: 200 })
      .then(res => {
        if (res.success && res.data) {
          const transformed = res.data.map((inv: any) => ({
            id: inv.id,
            name: inv.name,
            totalInvested: parseFloat(inv.recent_investments?.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount) || 0), 0) || inv.assets_under_management || 0),
            dealCount: inv.recent_investments?.length || inv.total_investments || 0,
            companies: inv.portfolio_companies || [],
            sectors: inv.focus_sectors || [],
            countries: inv.countries || [],
            stages: inv.investment_stages || [],
            lastInvestment: inv.recent_investments?.[0]?.date || null,
          }));
          setInvestors(transformed);
        } else {
          setInvestors([]);
        }
      })
      .catch(() => setInvestors([]));
  }, []);

  const topInvestors = useMemo(() => investors.slice().sort((a, b) => b.dealCount - a.dealCount).slice(0, 8), [investors]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-5 w-5 text-primary-400" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Most Active Investors</h3>
      </div>
      <div className="space-y-3">
        {topInvestors.map((investor, index) => (
          <div key={investor.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer shadow-sm border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm border border-primary-700 flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{investor.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{investor.dealCount} deals</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm md:text-base font-bold text-accent-600 dark:text-accent-500">${(investor.totalInvested / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MostActiveInvestorsWidget;