import React, { useEffect, useMemo, useState } from 'react';
import { Heart, DollarSign, Building, Shield, TrendingUp, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchNationPulse } from '../services/ai';

const NationPulseWidget = ({ type = 'overview' }) => {
  const [np, setNp] = useState<any | null>(null);

  useEffect(() => {
    fetchNationPulse().then(setNp).catch(() => setNp(null));
  }, []);

  const countries: string[] = useMemo(() => Object.keys(np?.population || {}), [np]);

  const healthMetricsData = useMemo(() => countries.map(country => ({
    country: np?.population?.[country]?.country || country,
    life_expectancy: np?.population?.[country]?.life_expectancy ?? 0,
    health_spend: np?.healthcare_infrastructure?.[country]?.health_expenditure?.percentage_of_gdp ?? 0,
    gdp_per_capita: np?.economic_indicators?.[country]?.gdp?.per_capita_usd ?? 0,
  })), [countries, np]);

  const investmentOpportunityData = useMemo(() => {
    // Build a simple opportunity score based on GDP growth and health spend
    const list = countries.map(country => {
      const growth = np?.economic_indicators?.[country]?.gdp?.growth_rate ?? 0;
      const display = np?.population?.[country]?.country || country;
      const opportunity_score = Math.max(0, Math.min(100, 40 + growth * 6));
      return {
        country: (display || '').substring(0, 3).toUpperCase(),
        score: opportunity_score,
        gdp_growth: Number(growth) || 0,
      };
    });
    return list.slice(0, 6);
  }, [countries, np]);

  const regionalAverages = useMemo(() => {
    if (!countries.length) return { life_expectancy: 0, gdp_per_capita: 0, health_expenditure: 0 };
    const len = countries.length;
    const life = countries.reduce((sum, c) => sum + (np?.population?.[c]?.life_expectancy ?? 0), 0) / len;
    const gdpCap = countries.reduce((sum, c) => sum + (np?.economic_indicators?.[c]?.gdp?.per_capita_usd ?? 0), 0) / len;
    const spend = countries.reduce((sum, c) => sum + (np?.healthcare_infrastructure?.[c]?.health_expenditure?.percentage_of_gdp ?? 0), 0) / len;
    return { life_expectancy: life, gdp_per_capita: gdpCap, health_expenditure: spend };
  }, [countries, np]);

  const CustomTooltip = ({ active, payload, label }: { active?: any; payload?: any; label?: any }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-surface border border-divider p-3 rounded-lg shadow-lg">
          <p className="text-text-primary font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-primary-600">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'health-metrics') {
    return (
      <div className="bg-background-surface p-4 md:p-6 rounded-lg border border-divider shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="h-5 w-5 text-red-500" />
          <h3 className="text-base md:text-lg font-semibold text-text-primary">Regional Health Metrics</h3>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthMetricsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="country" 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
                label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="life_expectancy" fill="#ef4444" name="Life Expectancy (years)" />
              <Bar dataKey="health_spend" fill="#3b82f6" name="Health Spend (% GDP)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'investment-opportunities') {
    return (
      <div className="bg-background-surface p-4 md:p-6 rounded-lg border border-divider shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="text-base md:text-lg font-semibold text-text-primary">Investment Opportunity Scores</h3>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={investmentOpportunityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="country" 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
                domain={[0, 100]}
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#00665C" 
                strokeWidth={3}
                dot={{ fill: '#00665C', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Opportunity Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'economic-overview') {
    return (
      <div className="bg-background-surface p-4 md:p-6 rounded-lg border border-divider shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-500" />
          <h3 className="text-base md:text-lg font-semibold text-text-primary">Economic Indicators</h3>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthMetricsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
              <XAxis 
                dataKey="country" 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                className="dark:stroke-gray-400"
                fontSize={12}
                label={{ value: 'GDP per Capita ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gdp_per_capita" fill="#f59e0b" name="GDP per Capita ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Default overview widget
  return (
    <div className="bg-background-surface p-4 md:p-6 rounded-lg border border-divider shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="h-5 w-5 text-primary-400" />
        <h3 className="text-base md:text-lg font-semibold text-text-primary">Nation Pulse Overview</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 md:space-x-2 mb-1 md:mb-2">
            <Heart className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
            <span className="text-xs md:text-sm text-text-secondary">Avg Life Expectancy</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-text-primary">
            {regionalAverages.life_expectancy.toFixed(1)} years
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 md:space-x-2 mb-1 md:mb-2">
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
            <span className="text-xs md:text-sm text-text-secondary">Avg GDP per Capita</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-text-primary">
            ${regionalAverages.gdp_per_capita.toFixed(0)}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 md:space-x-2 mb-1 md:mb-2">
            <Building className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
            <span className="text-xs md:text-sm text-text-secondary">Avg Health Spend</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-text-primary">
            {regionalAverages.health_expenditure.toFixed(1)}% GDP
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 md:space-x-2 mb-1 md:mb-2">
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
            <span className="text-xs md:text-sm text-text-secondary">Avg Annual Growth</span>
          </div>
          <p className="text-lg md:text-2xl font-bold text-text-primary">
            {(countries.reduce((sum, country) => {
              const economicData = np?.economic_indicators?.[country];
              return sum + (economicData ? (economicData.gdp?.growth_rate || 0) : 0);
            }, 0) / (countries.length || 1)).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="border-t border-divider pt-4">
        <h4 className="text-xs md:text-sm font-semibold text-text-primary mb-3">Top Investment Opportunities</h4>
        <div className="space-y-2">
          {investmentOpportunityData.slice(0, 3).map((opportunity: any, index: number) => (
            <div key={`${opportunity.country}-${index}`} className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-text-secondary">{opportunity.country}</span>
              <span className={`${
                opportunity.score >= 80 ? 'bg-green-100 text-green-800' :
                opportunity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              } px-2 py-1 rounded text-xs font-bold`}>
                {opportunity.score.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NationPulseWidget;