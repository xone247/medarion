import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Users, Stethoscope, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchNationPulse } from '../services/ai';

const HealthcareMarketWidget = () => {
  const [np, setNp] = useState<any | null>(null);

  useEffect(() => {
    fetchNationPulse().then(setNp).catch(() => setNp(null));
  }, []);

  const countries: string[] = useMemo(() => Object.keys(np?.population || {}), [np]);

  const healthChallenges = useMemo(() => countries.map(country => {
    const population = np?.population?.[country];
    const disease = np?.disease_immunization?.[country];
    const infrastructure = np?.healthcare_infrastructure?.[country];
    return {
      country: population?.country || country,
      mortality_score: (population?.mortality?.under_five_rate || 0) + (population?.mortality?.maternal_ratio || 0) / 10,
      disease_burden: (disease?.disease_prevalence?.hiv_prevalence || 0) + (disease?.disease_prevalence?.tuberculosis_incidence || 0) / 100,
      infrastructure_gap: 100 - (infrastructure?.health_workforce?.physicians_per_10k || 0) * 10,
      market_size: (population?.population_size || 0) / 1000000,
    };
  }).sort((a, b) => (b.mortality_score + b.disease_burden + b.infrastructure_gap) - (a.mortality_score + a.disease_burden + a.infrastructure_gap)), [countries, np]);

  const topChallenges = healthChallenges.slice(0, 4);

  const totals = useMemo(() => {
    const totalPop = countries.reduce((sum, c) => sum + (np?.population?.[c]?.population_size || 0), 0);
    const avgSpend = countries.reduce((sum, c) => sum + (np?.healthcare_infrastructure?.[c]?.health_expenditure?.per_capita_usd || 0), 0) / (countries.length || 1);
    const avgPhys = countries.reduce((sum, c) => sum + (np?.healthcare_infrastructure?.[c]?.health_workforce?.physicians_per_10k || 0), 0) / (countries.length || 1);
    return { totalPop, avgSpend, avgPhys };
  }, [countries, np]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-primary-400" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Healthcare Market Insights</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="text-center p-2 md:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-500 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-red-700 dark:text-red-300 font-medium">High Mortality Markets</p>
            <p className="text-xs text-red-600 dark:text-red-400">Maternal & child health focus</p>
          </div>
          
          <div className="text-center p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Stethoscope className="h-5 w-5 md:h-6 md:w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 font-medium">Physician Shortage</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Telemedicine opportunities</p>
          </div>
        </div>

        <div>
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-3">Priority Markets by Health Needs</h4>
          <div className="space-y-2">
            {topChallenges.map((challenge, index) => (
              <div key={`${challenge.country}-${index}`} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">{challenge.country}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Market: {challenge.market_size.toFixed(1)}M people
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex space-x-1">
                    {challenge.mortality_score > 150 && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" title="High mortality"></div>
                    )}
                    {challenge.disease_burden > 5 && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" title="High disease burden"></div>
                    )}
                    {challenge.infrastructure_gap > 80 && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" title="Infrastructure gap"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Multiple needs</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div>
              <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                {(totals.totalPop / 1_000_000_000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Population</p>
            </div>
            <div>
              <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                ${Math.round(totals.avgSpend)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Health Spend</p>
            </div>
            <div>
              <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                {totals.avgPhys.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Physicians/10K</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareMarketWidget;