import React, { useEffect, useMemo, useState } from 'react';
import { 
  Activity, 
  Users, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  Globe, 
  Shield, 
  Baby,
  Stethoscope,
  Building,
  BarChart3,
  Search,
  Layers,
  MapPin,
  Target,
  Zap,
  ChevronDown,
  FileDown,
  Filter,
  Bot,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';
import { askMedarion } from '../services/ai';

const NationPulsePage = () => {
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedElement, setSelectedElement] = useState('population');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedOpportunities, setExpandedOpportunities] = useState<Set<string>>(new Set());
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const { profile } = useAuth();
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));

  useEffect(() => {
    const fetchNationPulseData = async () => {
      setLoading(true);
      try {
        console.log('[NationPulsePage] Fetching nation pulse data...');
        const response = await apiService.get('/admin/nation-pulse', { all: 'true' });
        console.log('[NationPulsePage] Response:', response);
        if (response.success && response.data) {
          const grouped: any = {
            population: {},
            healthcare_infrastructure: {},
            economic_indicators: {},
            disease_immunization: {},
            electrification: {},
          };
          
          response.data.forEach((row: any) => {
            if (!row.country) return;
            
            const countryKey = String(row.country).toLowerCase().replace(/\s+/g, '_');
            const dataType = row.data_type || row.indicator_type || 'population';
            
            if (!grouped[dataType]) grouped[dataType] = {};
            if (!grouped[dataType][countryKey]) {
              grouped[dataType][countryKey] = { country: row.country };
            }
            
            const metricNameField = row.metric_name || row.indicator_name;
            if (!metricNameField) return;
            
            const metricName = String(metricNameField).toLowerCase();
            const metricValue = parseFloat(row.metric_value || row.indicator_value || row.value || 0) || 0;
            
            if (dataType === 'population') {
              if (metricName.includes('life_expectancy') || metricName.includes('life expectancy')) {
                grouped[dataType][countryKey].life_expectancy = metricValue;
              }
              if (metricName.includes('population_size') || (metricName.includes('population') && !metricName.includes('growth'))) {
                grouped[dataType][countryKey].population_size = metricValue;
              }
              if (metricName.includes('population_growth_rate') || (metricName.includes('growth') && metricName.includes('population'))) {
                grouped[dataType][countryKey].population_growth_rate = metricValue;
              }
              if (metricName.includes('under_five_mortality') || metricName.includes('under five') || metricName.includes('under-5')) {
                if (!grouped[dataType][countryKey].mortality) grouped[dataType][countryKey].mortality = {};
                grouped[dataType][countryKey].mortality.under_five_rate = metricValue;
              }
              if (metricName.includes('maternal_mortality') || metricName.includes('maternal')) {
                if (!grouped[dataType][countryKey].mortality) grouped[dataType][countryKey].mortality = {};
                grouped[dataType][countryKey].mortality.maternal_ratio = metricValue;
              }
              if (metricName.includes('neonatal_mortality') || metricName.includes('neonatal')) {
                if (!grouped[dataType][countryKey].mortality) grouped[dataType][countryKey].mortality = {};
                grouped[dataType][countryKey].mortality.neonatal_rate = metricValue;
              }
              if (metricName.includes('annual_births') || metricName.includes('births')) {
                if (!grouped[dataType][countryKey].birth) grouped[dataType][countryKey].birth = {};
                grouped[dataType][countryKey].birth.annual_births = metricValue;
              }
              if (metricName.includes('birth_rate')) {
                if (!grouped[dataType][countryKey].birth) grouped[dataType][countryKey].birth = {};
                grouped[dataType][countryKey].birth.birth_rate = metricValue;
              }
            } else if (dataType === 'healthcare_infrastructure') {
              if (!grouped[dataType][countryKey].health_expenditure) {
                grouped[dataType][countryKey].health_expenditure = {};
              }
              if (metricName.includes('expenditure') && (metricName.includes('gdp') || metricName.includes('percentage'))) {
                grouped[dataType][countryKey].health_expenditure.percentage_of_gdp = metricValue;
              }
              if (metricName.includes('expenditure') && (metricName.includes('capita') || metricName.includes('per_capita'))) {
                grouped[dataType][countryKey].health_expenditure.per_capita_usd = metricValue;
              }
              if (metricName.includes('government_health_share') || (metricName.includes('government') && metricName.includes('share'))) {
                grouped[dataType][countryKey].health_expenditure.government_share = metricValue;
              }
              if (metricName.includes('private_health_share') || (metricName.includes('private') && metricName.includes('share'))) {
                grouped[dataType][countryKey].health_expenditure.private_share = metricValue;
              }
              if (!grouped[dataType][countryKey].health_workforce) {
                grouped[dataType][countryKey].health_workforce = {};
              }
              if (metricName.includes('physicians_per_10k') || metricName.includes('physician')) {
                grouped[dataType][countryKey].health_workforce.physicians_per_10k = metricValue;
              }
              if (metricName.includes('nurses_per_10k') || metricName.includes('nurse')) {
                grouped[dataType][countryKey].health_workforce.nurses_per_10k = metricValue;
              }
              if (metricName.includes('midwives_per_10k') || metricName.includes('midwife')) {
                grouped[dataType][countryKey].health_workforce.midwives_per_10k = metricValue;
              }
              if (!grouped[dataType][countryKey].water_sanitation) {
                grouped[dataType][countryKey].water_sanitation = {};
              }
              if (metricName.includes('drinking_water_access') || metricName.includes('drinking water')) {
                grouped[dataType][countryKey].water_sanitation.drinking_water_access = metricValue;
              }
              if (metricName.includes('basic_sanitation_access') || metricName.includes('sanitation')) {
                grouped[dataType][countryKey].water_sanitation.basic_sanitation_access = metricValue;
              }
              if (metricName.includes('handwashing_facilities') || metricName.includes('handwashing')) {
                grouped[dataType][countryKey].water_sanitation.handwashing_facilities = metricValue;
              }
            } else if (dataType === 'economic_indicators') {
              if (!grouped[dataType][countryKey].gdp) {
                grouped[dataType][countryKey].gdp = {};
              }
              if (metricName.includes('gdp_per_capita') || (metricName.includes('gdp') && metricName.includes('capita'))) {
                grouped[dataType][countryKey].gdp.per_capita_usd = metricValue;
              }
              if (metricName.includes('gdp_total_billions') || (metricName.includes('gdp') && metricName.includes('total'))) {
                grouped[dataType][countryKey].gdp.total_usd_billions = metricValue;
              }
              if (metricName.includes('gdp_growth_rate') || (metricName.includes('gdp') && metricName.includes('growth'))) {
                grouped[dataType][countryKey].gdp.growth_rate = metricValue;
              }
              if (metricName.includes('inflation_rate') || metricName.includes('inflation')) {
                grouped[dataType][countryKey].inflation_rate = metricValue;
              }
              if (!grouped[dataType][countryKey].foreign_investment) {
                grouped[dataType][countryKey].foreign_investment = {};
              }
              if (metricName.includes('fdi_inflow_millions') || metricName.includes('fdi')) {
                grouped[dataType][countryKey].foreign_investment.fdi_inflow_millions = metricValue;
              }
              if (metricName.includes('healthcare_fdi_share') || (metricName.includes('healthcare') && metricName.includes('fdi'))) {
                grouped[dataType][countryKey].foreign_investment.healthcare_fdi_share = metricValue;
              }
              if (!grouped[dataType][countryKey].employment) {
                grouped[dataType][countryKey].employment = {};
              }
              if (metricName.includes('unemployment_rate') || metricName.includes('unemployment')) {
                grouped[dataType][countryKey].employment.unemployment_rate = metricValue;
              }
              if (metricName.includes('informal_sector_size') || metricName.includes('informal')) {
                grouped[dataType][countryKey].employment.informal_sector_size = metricValue;
              }
              if (!grouped[dataType][countryKey].poverty_inequality) {
                grouped[dataType][countryKey].poverty_inequality = {};
              }
              if (metricName.includes('poverty_rate') || metricName.includes('poverty')) {
                grouped[dataType][countryKey].poverty_inequality.poverty_rate = metricValue;
              }
              if (metricName.includes('gini_coefficient') || metricName.includes('gini')) {
                grouped[dataType][countryKey].poverty_inequality.gini_coefficient = metricValue;
              }
              if (!grouped[dataType][countryKey].government_finance) {
                grouped[dataType][countryKey].government_finance = {};
              }
              if (metricName.includes('debt_to_gdp') || metricName.includes('debt')) {
                grouped[dataType][countryKey].government_finance.debt_to_gdp = metricValue;
              }
              if (metricName.includes('fiscal_deficit_to_gdp') || metricName.includes('fiscal')) {
                grouped[dataType][countryKey].government_finance.fiscal_deficit_to_gdp = metricValue;
              }
              if (metricName.includes('health_budget_share') || (metricName.includes('health') && metricName.includes('budget'))) {
                grouped[dataType][countryKey].government_finance.health_budget_share = metricValue;
              }
              if (!grouped[dataType][countryKey].currency) {
                grouped[dataType][countryKey].currency = {};
              }
              if (metricName.includes('currency_code') || (metricName.includes('currency') && metricName.includes('code'))) {
                grouped[dataType][countryKey].currency.code = String(row.metric_value);
              }
              if (metricName.includes('exchange_rate_to_usd') || metricName.includes('exchange')) {
                grouped[dataType][countryKey].currency.exchange_rate_to_usd = metricValue;
              }
            } else if (dataType === 'disease_immunization') {
              if (!grouped[dataType][countryKey].disease_prevalence) {
                grouped[dataType][countryKey].disease_prevalence = {};
              }
              if (metricName.includes('hiv_prevalence') || metricName.includes('hiv')) {
                grouped[dataType][countryKey].disease_prevalence.hiv_prevalence = metricValue;
              }
              if (metricName.includes('art_coverage') || metricName.includes('art')) {
                grouped[dataType][countryKey].disease_prevalence.art_coverage = metricValue;
              }
              if (metricName.includes('malaria_incidence') || metricName.includes('malaria')) {
                grouped[dataType][countryKey].disease_prevalence.malaria_incidence = metricValue;
              }
              if (metricName.includes('tuberculosis_incidence') || metricName.includes('tuberculosis') || metricName.includes('tb')) {
                grouped[dataType][countryKey].disease_prevalence.tuberculosis_incidence = metricValue;
              }
              if (metricName.includes('ncd_burden') || metricName.includes('ncd')) {
                grouped[dataType][countryKey].disease_prevalence.ncd_burden = metricValue;
              }
              
              if (!grouped[dataType][countryKey].immunization_coverage) {
                grouped[dataType][countryKey].immunization_coverage = {};
              }
              if (metricName.includes('dtp3_coverage') || metricName.includes('dtp')) {
                grouped[dataType][countryKey].immunization_coverage.dtp3 = metricValue;
              }
              if (metricName.includes('bcg_coverage') || metricName.includes('bcg')) {
                grouped[dataType][countryKey].immunization_coverage.bcg = metricValue;
              }
              if (metricName.includes('measles_coverage') || metricName.includes('measles')) {
                grouped[dataType][countryKey].immunization_coverage.measles = metricValue;
              }
              if (metricName.includes('polio_coverage') || metricName.includes('polio')) {
                grouped[dataType][countryKey].immunization_coverage.polio = metricValue;
              }
            } else if (dataType === 'electrification') {
              if (metricName.includes('national_electrification_rate') || metricName.includes('electrification_rate') || (metricName.includes('access') && metricName.includes('electricity'))) {
                grouped[dataType][countryKey].access_rate = metricValue;
              }
              if (metricName.includes('hours_per_day') || metricName.includes('reliability') || metricName.includes('hours_of_electricity')) {
                grouped[dataType][countryKey].reliability_hours_per_day = metricValue;
              }
              if (metricName.includes('household_tariff') || metricName.includes('tariff') || (metricName.includes('cost') && metricName.includes('kwh'))) {
                grouped[dataType][countryKey].household_tariff_usd_per_kwh = metricValue;
              }
              if (metricName.includes('renewables_share') || metricName.includes('renewable')) {
                grouped[dataType][countryKey].renewables_share_percent = metricValue;
              }
              if (metricName.includes('transmission_losses') || metricName.includes('distribution_losses') || metricName.includes('losses')) {
                grouped[dataType][countryKey].transmission_distribution_losses_percent = metricValue;
              }
              if (metricName.includes('new_connections') || metricName.includes('connections_per_year')) {
                grouped[dataType][countryKey].new_connections_per_year = metricValue;
              }
              if (metricName.includes('power_sector_investment') || metricName.includes('annual_investment') || (metricName.includes('investment') && metricName.includes('power'))) {
                grouped[dataType][countryKey].annual_power_sector_investment_usd = metricValue;
              }
            }
          });
          
          setData(grouped);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching nation pulse data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchNationPulseData();
  }, []);

  const countries = useMemo(() => data ? Object.keys(data.population || {}) : [], [data]);

  // Calculate investment opportunities for ALL countries from database
  const investmentOpportunities = useMemo(() => {
    if (!data || !countries.length) return [];
    
    return countries.map((countryKey: string) => {
      const countryName = data.population[countryKey]?.country || countryKey;
      const population = data.population[countryKey];
      const economic = data.economic_indicators[countryKey];
      const healthcare = data.healthcare_infrastructure[countryKey];
      const disease = data.disease_immunization[countryKey];
      
      const gdpGrowth = economic?.gdp?.growth_rate || 0;
      const healthSpend = healthcare?.health_expenditure?.percentage_of_gdp || 0;
      const populationSize = population?.population_size || 0;
      const gdpPerCapita = economic?.gdp?.per_capita_usd || 0;
      const physicians = healthcare?.health_workforce?.physicians_per_10k || 0;
      const immunizationGap = 100 - (disease?.immunization_coverage?.dtp3 || 0);
      const electrification = data.electrification?.[countryKey]?.access_rate || 0;
      
      const opportunityScore = Math.round(
        Math.min(100, Math.max(0,
          (gdpGrowth * 3) +
          (healthSpend * 2) +
          (Math.min(populationSize / 10000000, 5)) +
          (Math.min(gdpPerCapita / 1000, 3)) +
          (immunizationGap * 0.5) +
          (Math.max(0, 10 - physicians) * 2)
        ))
      );
      
      let category = 'Moderate';
      let categoryColor = 'yellow';
      if (opportunityScore >= 75) {
        category = 'High';
        categoryColor = 'green';
      } else if (opportunityScore >= 50) {
        category = 'Moderate';
        categoryColor = 'yellow';
      } else {
        category = 'Emerging';
        categoryColor = 'blue';
      }
      
      const opportunities: string[] = [];
      if (physicians < 5) opportunities.push('Healthcare Workforce Development');
      if (immunizationGap > 20) opportunities.push('Vaccination Programs');
      if (electrification < 50) opportunities.push('Healthcare Infrastructure (Power)');
      if (healthSpend < 5) opportunities.push('Healthcare Financing');
      if (gdpGrowth > 5) opportunities.push('Economic Growth Alignment');
      if (populationSize > 50000000) opportunities.push('Large Market Size');
      
      return {
        country: countryName,
        countryKey,
        opportunityScore,
        category,
        categoryColor,
        metrics: {
          gdpGrowth: gdpGrowth.toFixed(1),
          healthSpend: healthSpend.toFixed(1),
          population: (populationSize / 1000000).toFixed(1),
          gdpPerCapita: gdpPerCapita.toLocaleString(),
          physicians: physicians.toFixed(1),
          immunizationCoverage: disease?.immunization_coverage?.dtp3 || 0,
          electrification: electrification.toFixed(1),
          lifeExpectancy: population?.life_expectancy || 0,
          under5Mortality: population?.mortality?.under_five_rate || 0
        },
        opportunities: opportunities.length > 0 ? opportunities : ['General Healthcare Investment']
      };
    }).sort((a: any, b: any) => b.opportunityScore - a.opportunityScore);
  }, [data, countries]);

  const analytics = useMemo(() => {
    if (!data) return { regional_averages: { life_expectancy: 0, gdp_per_capita: 0, health_expenditure: 0, hiv_prevalence: 0 } };
    const keys = Object.keys(data.population || {});
    const average = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const regional_averages = {
      life_expectancy: average(keys.map(k => data.population[k]?.life_expectancy || 0)),
      gdp_per_capita: average(keys.map(k => data.economic_indicators[k]?.gdp?.per_capita_usd || 0)),
      health_expenditure: average(keys.map(k => data.healthcare_infrastructure[k]?.health_expenditure?.percentage_of_gdp || 0)),
      hiv_prevalence: average(keys.map(k => data.disease_immunization[k]?.disease_prevalence?.hiv_prevalence || 0)),
    };
    return { regional_averages };
  }, [data]);

  const filteredCountries = useMemo(() => {
    if (selectedCountry === 'All') {
      return countries.filter(country =>
    (data?.population?.[country]?.country || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
    }
    return [selectedCountry];
  }, [countries, selectedCountry, searchTerm, data]);

  const filteredOpportunities = useMemo(() => {
    if (selectedCountry === 'All') {
      return investmentOpportunities.filter(opp =>
        opp.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return investmentOpportunities.filter(opp => opp.countryKey === selectedCountry);
  }, [investmentOpportunities, selectedCountry, searchTerm]);

  const toggleOpportunity = (countryKey: string) => {
    const newExpanded = new Set(expandedOpportunities);
    if (newExpanded.has(countryKey)) {
      newExpanded.delete(countryKey);
    } else {
      newExpanded.add(countryKey);
    }
    setExpandedOpportunities(newExpanded);
  };

  const toggleCountryDetails = (countryKey: string) => {
    setExpandedCountry(expandedCountry === countryKey ? null : countryKey);
  };
    
  // Regional comparison chart data
  const regionalChartData = useMemo(() => {
    if (!data || !countries.length) return [];
    return countries.slice(0, 10).map((countryKey: string) => {
      const countryName = data.population[countryKey]?.country || countryKey;
      return {
        country: countryName.length > 12 ? countryName.substring(0, 12) + '...' : countryName,
        fullCountry: countryName,
        lifeExpectancy: data.population[countryKey]?.life_expectancy || 0,
        gdpPerCapita: (data.economic_indicators[countryKey]?.gdp?.per_capita_usd || 0) / 1000,
        healthSpend: data.healthcare_infrastructure[countryKey]?.health_expenditure?.percentage_of_gdp || 0,
      };
    }).sort((a: any, b: any) => b.lifeExpectancy - a.lifeExpectancy);
  }, [data, countries]);

  const exportExcel = () => {
    try {
      const excelData = investmentOpportunities.map((opp: any) => ({
        Country: opp.country,
        'Opportunity Score': opp.opportunityScore,
        Category: opp.category,
        'GDP Growth (%)': opp.metrics.gdpGrowth,
        'Health Spend (% GDP)': opp.metrics.healthSpend,
        'Population (M)': opp.metrics.population,
        'GDP per Capita (USD)': opp.metrics.gdpPerCapita,
        'Physicians per 10k': opp.metrics.physicians,
        'Immunization Coverage (%)': opp.metrics.immunizationCoverage,
        'Electrification (%)': opp.metrics.electrification,
        'Life Expectancy': opp.metrics.lifeExpectancy,
        'Under-5 Mortality': opp.metrics.under5Mortality,
        'Key Opportunities': opp.opportunities.join('; ')
      }));
      exportToExcel(excelData, 'nation_pulse_investment_opportunities', 'Investment Opportunities');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportCSV = () => {
    try {
      const rows = [['Country', 'Opportunity Score', 'Category', 'GDP Growth (%)', 'Health Spend (% GDP)', 'Population (M)', 'GDP per Capita (USD)', 'Key Opportunities']];
      investmentOpportunities.forEach((opp: any) => rows.push([
        opp.country,
        String(opp.opportunityScore),
        opp.category,
        opp.metrics.gdpGrowth,
        opp.metrics.healthSpend,
        opp.metrics.population,
        opp.metrics.gdpPerCapita,
        opp.opportunities.join('; ')
      ]));
      exportToCSV(rows, 'nation_pulse_investment_opportunities');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportJSON = () => {
    try {
      const data = { 
        filters: { searchTerm, selectedCountry }, 
        investmentOpportunities: investmentOpportunities, 
        exportedAt: new Date().toISOString() 
      };
      exportToJSON(data, 'nation_pulse_investment_opportunities');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const runAI = async () => {
    setAiSummaryLoading(true);
    setShowAISummary(true);
    try {
      const countryFilter = selectedCountry !== 'All' ? ` for ${data?.population?.[selectedCountry]?.country || selectedCountry}` : '';
      const prompt = `Summarize healthcare investment opportunities and key metrics in African nations${countryFilter}. Highlight top opportunities, key health indicators, economic factors, and investment trends.`;
      const res = await askMedarion(prompt);
      setAiSummaryText(res.answer || 'Unable to generate summary at this time.');
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummaryText('Unable to generate summary at this time. Please try again later.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 dark:border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading nation pulse data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">No data available. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:space-y-3 md:space-y-4 p-2 sm:p-3 md:p-4">
      {/* Top Bar: Filters and Actions - Compact Mobile Optimized */}
      <div className="card-glass p-2.5 sm:p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
              />
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 sm:py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="All">All Countries</option>
              {countries.map((country: string) => {
                const countryName = data?.population?.[country]?.country || country;
                return <option key={country} value={country}>{countryName}</option>;
              })}
            </select>
          </div>
          
          {/* Actions Section - Balanced Mobile Optimized */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 lg:border-l lg:border-slate-200 dark:lg:border-slate-700 lg:pl-2.5">
            {canAI && (
              <button 
                onClick={runAI} 
                className="btn-primary-elevated flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm flex-shrink-0 min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto"
                title="AI Summary"
              >
                <Bot className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI Summary</span>
              </button>
            )}
            {canExport && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end sm:justify-start">
                <button onClick={exportExcel} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export Excel">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">Excel</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button onClick={exportJSON} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export JSON">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">JSON</span>
                  <span className="sm:hidden">JSON</span>
                </button>
                <button onClick={exportCSV} className="btn-outline px-3 sm:px-3 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[60px] sm:min-w-0 h-[40px] sm:h-auto" title="Export CSV">
                  <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"/>
                  <span className="hidden sm:inline">CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats - Compact Modern Style (Mobile Optimized) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg Life Expectancy</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{analytics.regional_averages.life_expectancy.toFixed(1)}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">years</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg GDP per Capita</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">${analytics.regional_averages.gdp_per_capita.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">USD</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Avg Health Spend</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{analytics.regional_averages.health_expenditure.toFixed(1)}%</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Of GDP</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1 uppercase tracking-wide">Investment Opportunities</p>
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{investmentOpportunities.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Countries Analyzed</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Countries by Key Metrics - Compact Card Grid (Mobile Optimized) */}
      {regionalChartData.length > 0 && (
        <div className="card-glass p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">Top Countries by Key Metrics</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Top 10</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
            {regionalChartData.slice(0, 10).map((item: any, index: number) => (
              <div key={index} className="card-glass p-2.5 sm:p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium text-white flex-shrink-0 ${
                    index === 0 ? 'bg-amber-500' :
                    index === 1 ? 'bg-slate-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-cyan-500'
                  }`}>
                    {index + 1}
                  </div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1">{item.country}</h4>
                </div>
                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Life Expectancy</span>
                    <span className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400">{item.lifeExpectancy.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Health Spend</span>
                    <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">{item.healthSpend.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">GDP/Capita</span>
                    <span className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400">${item.gdpPerCapita.toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Healthcare Investment Opportunities - All Countries from Database (Mobile Optimized) */}
      <div className="card-glass p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">Healthcare Investment Opportunities</h3>
            <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-medium">
              {filteredOpportunities.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 dark:border-cyan-400"></div>
            <span className="ml-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading investment opportunities...</span>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center p-6 sm:p-8">
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No investment opportunity data available.</p>
          </div>
        ) : (
          <>
            {/* Desktop Grid View */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredOpportunities.map((opp: any) => {
                const isExpanded = expandedOpportunities.has(opp.countryKey);
                return (
                  <div 
                    key={opp.countryKey} 
                    className={`card-glass p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${
                      opp.categoryColor === 'green' ? 'border-green-200/50 dark:border-green-700/50 bg-green-50/30 dark:bg-green-950/20' :
                      opp.categoryColor === 'yellow' ? 'border-yellow-200/50 dark:border-yellow-700/50 bg-yellow-50/30 dark:bg-yellow-950/20' :
                      'border-blue-200/50 dark:border-blue-700/50 bg-blue-50/30 dark:bg-blue-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2 truncate">
                          <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                          <span className="truncate">{opp.country}</span>
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          opp.categoryColor === 'green' ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 bg-green-50/30 dark:bg-green-900/20' :
                          opp.categoryColor === 'yellow' ? 'border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 bg-yellow-50/30 dark:bg-yellow-900/20' :
                          'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-900/20'
                        }`}>
                          {opp.category} Opportunity
                        </span>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 ml-2">
                        <div className={`text-xl sm:text-2xl font-medium ${
                          opp.categoryColor === 'green' ? 'text-green-800 dark:text-green-200' :
                          opp.categoryColor === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                          'text-blue-800 dark:text-blue-200'
                        }`}>
                          {opp.opportunityScore}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">GDP Growth</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{opp.metrics.gdpGrowth}%</p>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Health Spend</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{opp.metrics.healthSpend}%</p>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Population</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{opp.metrics.population}M</p>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">GDP/Capita</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">${opp.metrics.gdpPerCapita}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleOpportunity(opp.countryKey)}
                      className="w-full flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      <span>View Details</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Key Investment Areas</p>
                        <div className="space-y-1.5 mb-3">
                          {opp.opportunities.map((oppItem: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-slate-700 dark:text-slate-200">{oppItem}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Life Expectancy</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{opp.metrics.lifeExpectancy.toFixed(1)} yrs</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Under-5 Mortality</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{opp.metrics.under5Mortality}/1k</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Physicians/10k</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{opp.metrics.physicians}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Immunization</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{opp.metrics.immunizationCoverage}%</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Electrification</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{opp.metrics.electrification}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredOpportunities.map((opp: any) => {
                  const isExpanded = expandedOpportunities.has(opp.countryKey);
                  return (
                    <div
                      key={opp.countryKey}
                      className={`p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        opp.categoryColor === 'green' ? 'bg-green-50/20 dark:bg-green-950/10' :
                        opp.categoryColor === 'yellow' ? 'bg-yellow-50/20 dark:bg-yellow-950/10' :
                        'bg-blue-50/20 dark:bg-blue-950/10'
                      }`}
                    >
                      {/* Country name and score - consistent alignment */}
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 leading-tight">{opp.country}</div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            opp.categoryColor === 'green' ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 bg-green-50/30 dark:bg-green-900/20' :
                            opp.categoryColor === 'yellow' ? 'border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 bg-yellow-50/30 dark:bg-yellow-900/20' :
                            'border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-900/20'
                          }`}>
                            {opp.category} Opportunity
                          </span>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-3">
                          <div className={`text-xl font-medium ${
                            opp.categoryColor === 'green' ? 'text-green-800 dark:text-green-200' :
                            opp.categoryColor === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                            'text-blue-800 dark:text-blue-200'
                          }`}>
                            {opp.opportunityScore}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Score</div>
                        </div>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 leading-tight">GDP Growth</p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.gdpGrowth}%</p>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 leading-tight">Health Spend</p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.healthSpend}%</p>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 leading-tight">Population</p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.population}M</p>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 leading-tight">GDP/Capita</p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">${opp.metrics.gdpPerCapita}</p>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => toggleOpportunity(opp.countryKey)}
                        className="w-full flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <span>View Details</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Key Investment Areas</p>
                          <div className="space-y-1.5 mb-2.5">
                            {opp.opportunities.map((oppItem: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 p-1.5 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                <Zap className="h-3 w-3 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-tight">{oppItem}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight">Life Expectancy</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.lifeExpectancy.toFixed(1)} yrs</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight">Under-5 Mortality</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.under5Mortality}/1k</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight">Physicians/10k</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.physicians}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight">Immunization</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.immunizationCoverage}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight">Electrification</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{opp.metrics.electrification}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Country Details Section - Compact and Detailed (Mobile Optimized) */}
      {selectedCountry !== 'All' && data?.population?.[selectedCountry] && (
        <div className="card-glass p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                {data.population[selectedCountry].country} - Detailed Metrics
              </h3>
            </div>
            <button
              onClick={() => toggleCountryDetails(selectedCountry)}
              className="text-xs sm:text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1"
            >
              {expandedCountry === selectedCountry ? 'Hide' : 'Show'} Details
              <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${expandedCountry === selectedCountry ? 'transform rotate-180' : ''}`} />
            </button>
          </div>

          {expandedCountry === selectedCountry && (
            <div className="space-y-3 sm:space-y-4">
              {/* Population Metrics */}
              {data.population[selectedCountry] && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Population Metrics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Life Expectancy</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.population[selectedCountry].life_expectancy || 0} yrs</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Population</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{((data.population[selectedCountry].population_size || 0) / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg bg-red-50/50 dark:bg-red-950/30">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Under-5 Mortality</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.population[selectedCountry].mortality?.under_five_rate || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/30">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Maternal Mortality</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.population[selectedCountry].mortality?.maternal_ratio || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg bg-green-50/50 dark:bg-green-950/30">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Annual Births</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{((data.population[selectedCountry].birth?.annual_births || 0) / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg bg-orange-50/50 dark:bg-orange-950/30">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Growth Rate</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.population[selectedCountry].population_growth_rate || 0}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Healthcare Infrastructure */}
              {data.healthcare_infrastructure[selectedCountry] && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Healthcare Infrastructure</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Physicians/10k</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.healthcare_infrastructure[selectedCountry].health_workforce?.physicians_per_10k || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Nurses/10k</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.healthcare_infrastructure[selectedCountry].health_workforce?.nurses_per_10k || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Health Spend %</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.healthcare_infrastructure[selectedCountry].health_expenditure?.percentage_of_gdp || 0}%</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Per Capita (USD)</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">${data.healthcare_infrastructure[selectedCountry].health_expenditure?.per_capita_usd || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Water Access</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.healthcare_infrastructure[selectedCountry].water_sanitation?.drinking_water_access || 0}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Economic Indicators */}
              {data.economic_indicators[selectedCountry] && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Economic Indicators</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">GDP Total</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">${data.economic_indicators[selectedCountry].gdp?.total_usd_billions || 0}B</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">GDP/Capita</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">${data.economic_indicators[selectedCountry].gdp?.per_capita_usd || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">GDP Growth</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.economic_indicators[selectedCountry].gdp?.growth_rate || 0}%</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Inflation</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.economic_indicators[selectedCountry].inflation_rate || 0}%</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">FDI Inflow</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">${data.economic_indicators[selectedCountry].foreign_investment?.fdi_inflow_millions || 0}M</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Disease & Immunization */}
              {data.disease_immunization[selectedCountry] && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Disease & Immunization</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">HIV Prevalence</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.disease_immunization[selectedCountry].disease_prevalence?.hiv_prevalence || 0}%</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Malaria Incidence</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.disease_immunization[selectedCountry].disease_prevalence?.malaria_incidence || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">TB Incidence</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.disease_immunization[selectedCountry].disease_prevalence?.tuberculosis_incidence || 0}</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">DTP3 Coverage</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.disease_immunization[selectedCountry].immunization_coverage?.dtp3 || 0}%</p>
                    </div>
                    <div className="card-glass p-2 sm:p-2.5 rounded-lg">
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5">Measles Coverage</p>
                      <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">{data.disease_immunization[selectedCountry].immunization_coverage?.measles || 0}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Summary Modal */}
      {showAISummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="card-glass w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">AI Summary</h3>
              </div>
              <button
                onClick={() => { setShowAISummary(false); setAiSummaryText(''); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {aiSummaryLoading ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600 dark:border-cyan-400 mb-4"></div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Generating AI summary...</p>
                </div>
              ) : aiSummaryText ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {aiSummaryText}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No summary available.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
              <button
                onClick={() => { setShowAISummary(false); setAiSummaryText(''); }}
                className="flex-1 sm:flex-initial bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NationPulsePage;
