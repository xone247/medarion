import React, { useEffect, useMemo, useState } from 'react';
import { 
  Activity, 
  Users, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  Globe, 
  Shield, 
  Droplets,
  Baby,
  Stethoscope,
  Building,
  PieChart,
  BarChart3,
  Filter,
  Search,
  Layers
} from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import { apiService } from '../services/apiService';

const NationPulsePage = () => {
  const [selectedCountry, setSelectedCountry] = useState('nigeria');
  const [selectedElement, setSelectedElement] = useState('population');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMapLayer, setSelectedMapLayer] = useState('health_expenditure');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNationPulseData = async () => {
      setLoading(true);
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/nation-pulse', { limit: '1000' });
        if (response.success && response.data) {
          // Transform API data to match expected format (grouped by country and data_type)
          const grouped: any = {
            population: {},
            healthcare_infrastructure: {},
            economic_indicators: {},
            disease_immunization: {},
          };
          
          response.data.forEach((row: any) => {
            // Skip rows without country
            if (!row.country) {
              console.warn('Skipping row without country:', row);
              return;
            }
            
            const countryKey = String(row.country).toLowerCase().replace(/\s+/g, '_');
            // Map database fields: indicator_type -> data_type, indicator_name -> metric_name
            const dataType = row.data_type || row.indicator_type || 'population';
            
            if (!grouped[dataType]) grouped[dataType] = {};
            if (!grouped[dataType][countryKey]) {
              grouped[dataType][countryKey] = {
                country: row.country,
              };
            }
            
            // Map metric names to expected structure
            // Database uses indicator_name, but code expects metric_name
            const metricNameField = row.metric_name || row.indicator_name;
            if (!metricNameField) {
              console.warn('Skipping row without metric_name/indicator_name:', row);
              return;
            }
            
            const metricName = String(metricNameField).toLowerCase();
            // Database might use indicator_value or metric_value
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
              if (metricName.includes('government_health_share') || metricName.includes('government') && metricName.includes('share')) {
                grouped[dataType][countryKey].health_expenditure.government_share = metricValue;
              }
              if (metricName.includes('private_health_share') || metricName.includes('private') && metricName.includes('share')) {
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
              if (metricName.includes('currency_code') || metricName.includes('currency') && metricName.includes('code')) {
                grouped[dataType][countryKey].currency.code = String(row.metric_value);
              }
              if (metricName.includes('exchange_rate_to_usd') || metricName.includes('exchange')) {
                grouped[dataType][countryKey].currency.exchange_rate_to_usd = metricValue;
              }
            } else if (dataType === 'disease_immunization') {
              // Disease Prevalence metrics
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
              
              // Immunization Coverage metrics
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

  const analytics = useMemo(() => {
    if (!data) return { regional_averages: { life_expectancy: 0, gdp_per_capita: 0, health_expenditure: 0, hiv_prevalence: 0 }, investment_insights: { market_opportunities: [] } };
    const keys = Object.keys(data.population || {});
    const average = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const regional_averages = {
      life_expectancy: average(keys.map(k => data.population[k]?.life_expectancy || 0)),
      gdp_per_capita: average(keys.map(k => data.economic_indicators[k]?.gdp?.per_capita_usd || 0)),
      health_expenditure: average(keys.map(k => data.healthcare_infrastructure[k]?.health_expenditure?.percentage_of_gdp || 0)),
      hiv_prevalence: average(keys.map(k => data.disease_immunization[k]?.disease_prevalence?.hiv_prevalence || 0)),
    };
    const market_opportunities = keys.map(k => ({
      country: data.population[k].country,
      opportunity_score: Math.round(((data.economic_indicators[k]?.gdp?.growth_rate || 0) * 10 + (data.healthcare_infrastructure[k]?.health_expenditure?.percentage_of_gdp || 0) * 5 + (100 - (data.disease_immunization[k]?.immunization_coverage?.dtp3 || 0))) / 3),
      key_factors: [
        `GDP Growth: ${data.economic_indicators[k]?.gdp?.growth_rate}%`,
        `Health Spend: ${data.healthcare_infrastructure[k]?.health_expenditure?.percentage_of_gdp}% of GDP`,
        `Population: ${(data.population[k]?.population_size / 1000000).toFixed(1)}M`
      ]
    })).sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);
    return { regional_averages, investment_insights: { market_opportunities } };
  }, [data]);

  const elements = [
    { id: 'population', label: 'Population', icon: Users, color: 'bg-blue-500' },
    { id: 'disease_immunization', label: 'Disease Prevalence', icon: Shield, color: 'bg-green-500' },
    { id: 'immunization_coverage', label: 'Immunization Coverage', icon: Stethoscope, color: 'bg-purple-500' },
    { id: 'healthcare_infrastructure', label: 'Healthcare Infrastructure', icon: Building, color: 'bg-purple-500' },
    { id: 'economic_indicators', label: 'Economic Indicators', icon: DollarSign, color: 'bg-orange-500' }
  ];

  const mapLayers = [
    { id: 'health_expenditure', label: 'Health Expenditure (% of GDP)' },
    { id: 'life_expectancy_gdp', label: 'Life Expectancy vs. GDP per Capita' },
    { id: 'health_insurance', label: 'Health Insurance Coverage (%)' }
  ];

  const filteredCountries = countries.filter(country =>
    (data?.population?.[country]?.country || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCountryData = (country: string, element: string) => {
    if (!data) return null;
    
    // Handle immunization_coverage - it's nested in disease_immunization
    if (element === 'immunization_coverage') {
      const countryData = data.disease_immunization?.[country];
      const populationData = data.population?.[country];
      if (!countryData || !populationData) return null;
      return {
        country: populationData.country || country,
        immunization_coverage: countryData.immunization_coverage || {}
      };
    }
    
    // Handle disease_immunization
    if (element === 'disease_immunization') {
      const countryData = data.disease_immunization?.[country];
      if (!countryData) return null;
      return countryData;
    }
    
    // Handle other elements (population, healthcare_infrastructure, economic_indicators)
    const countryData = data[element]?.[country];
    if (!countryData) return null;
    return countryData;
  };

  // Mock health insurance coverage data
  const healthInsuranceData: Record<string, number> = {
    nigeria: 5.2,
    kenya: 12.8,
    ghana: 38.5,
    south_africa: 17.2,
    egypt: 58.6,
    rwanda: 87.3
  };

  // Helper function to convert country name to data key format
  const getCountryKey = (countryName: string) => {
    return countryName.toLowerCase().replace(/\s+/g, '_');
  };

  const renderElementContent = () => {
    const dataObj = getCountryData(selectedCountry, selectedElement);
    if (!dataObj) return null;
    
    // Ensure all nested objects exist with default values
    const safeDataObj = {
      ...dataObj,
      mortality: dataObj.mortality || {
        under_five_rate: 0,
        maternal_ratio: 0,
        neonatal_rate: 0
      },
      birth: dataObj.birth || {
        annual_births: 0,
        birth_rate: 0
      },
      disease_prevalence: dataObj.disease_prevalence || {
        hiv_prevalence: 0,
        art_coverage: 0
      },
      immunization_coverage: dataObj.immunization_coverage || {},
      health_expenditure: dataObj.health_expenditure || {
        percentage_of_gdp: 0
      },
      gdp: dataObj.gdp || {
        per_capita_usd: 0,
        growth_rate: 0
      },
      life_expectancy: dataObj.life_expectancy || 0,
      population_size: dataObj.population_size || 0,
      population_growth_rate: dataObj.population_growth_rate || 0,
      health_insurance_coverage: dataObj.health_insurance_coverage || 0
    };
    
    switch (selectedElement) {
      case 'population':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-glass p-6 shadow-soft">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-6 w-6 icon-primary" />
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Life Expectancy</h4>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{safeDataObj.life_expectancy || 0} years</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">Average lifespan at birth</p>
            </div>

            <div className="card-glass p-6 shadow-soft">
              <div className="flex items-center space-x-3 mb-4">
                <Baby className="h-6 w-6 icon-primary" />
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Under-5 Mortality</h4>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{safeDataObj.mortality.under_five_rate}</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 1,000 live births</p>
            </div>

            <div className="card-glass p-6 shadow-soft">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-6 w-6 icon-primary" />
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Population Size</h4>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{((safeDataObj.population_size || 0) / 1000000).toFixed(1)}M</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">Growth rate: {safeDataObj.population_growth_rate}%</p>
            </div>

            <div className="card-glass p-6 shadow-soft">
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="h-6 w-6 icon-primary" />
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Maternal Mortality</h4>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{safeDataObj.mortality.maternal_ratio}</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 100,000 live births</p>
            </div>

            <div className="card-glass p-6 shadow-soft">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-6 w-6 icon-primary" />
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Annual Births</h4>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{((safeDataObj.birth.annual_births || 0) / 1000000).toFixed(1)}M</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">Birth rate: {safeDataObj.birth.birth_rate}/1,000</p>
            </div>

            <div className="card-glass p-6 shadow-soft">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-6 w-6 icon-primary" />
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Neonatal Mortality</h4>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">{safeDataObj.mortality.neonatal_rate}</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 1,000 live births</p>
            </div>
          </div>
        );

      case 'disease_immunization':
        if (!dataObj || !dataObj.disease_prevalence || Object.keys(dataObj.disease_prevalence).length === 0) {
          return (
            <div className="card-glass p-6 shadow-soft">
              <p className="text-[var(--color-text-secondary)]">No disease prevalence data available for this country.</p>
            </div>
          );
        }
        const diseasePrevalence = dataObj.disease_prevalence || { 
          hiv_prevalence: 0, 
          art_coverage: 0, 
          malaria_incidence: 0, 
          tuberculosis_incidence: 0, 
          ncd_burden: 0 
        };
        return (
          <div className="space-y-6">
            <div className="card-glass p-6 shadow-soft mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Disease Prevalence</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">Health indicators showing the burden of diseases in the population</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">HIV Prevalence</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{diseasePrevalence.hiv_prevalence || 0}%</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">ART Coverage: {diseasePrevalence.art_coverage || 0}%</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Malaria Incidence</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{diseasePrevalence.malaria_incidence || 0}</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 1,000 at risk</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Stethoscope className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">TB Incidence</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{diseasePrevalence.tuberculosis_incidence || 0}</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 100,000 population</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Heart className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">NCD Burden</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{diseasePrevalence.ncd_burden || 0}%</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Of total deaths</p>
              </div>
            </div>
          </div>
        );

      case 'immunization_coverage':
        if (!dataObj || !dataObj.immunization_coverage || Object.keys(dataObj.immunization_coverage).length === 0) {
          return (
            <div className="card-glass p-6 shadow-soft">
              <p className="text-[var(--color-text-secondary)]">No immunization coverage data available for this country.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="card-glass p-6 shadow-soft mb-6">
              <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Immunization Coverage</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">Percentage of children receiving routine vaccinations</p>
            </div>
            <div className="card-glass p-6 shadow-soft">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(dataObj.immunization_coverage).map(([vaccine, coverage]: any) => (
                <div key={vaccine} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--color-divider-gray)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--color-primary-teal)"
                        strokeWidth="3"
                        strokeDasharray={`${coverage}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">{coverage}%</span>
                    </div>
                  </div>
                  <p className="text-base font-medium text-[var(--color-text-primary)] uppercase">{vaccine}</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {vaccine === 'dtp3' ? 'Diphtheria-Tetanus-Pertussis' : 
                     vaccine === 'bcg' ? 'Tuberculosis' :
                     vaccine === 'measles' ? 'Measles' : 'Polio'}
                  </p>
                </div>
              ))}
              </div>
            </div>
          </div>
        );

      case 'healthcare_infrastructure':
        if (!dataObj) {
          return (
            <div className="card-glass p-6 shadow-soft">
              <p className="text-[var(--color-text-secondary)]">No healthcare infrastructure data available for this country.</p>
            </div>
          );
        }
        const healthWorkforce = dataObj.health_workforce || { physicians_per_10k: 0, nurses_per_10k: 0, midwives_per_10k: 0 };
        const healthExpenditure = dataObj.health_expenditure || { per_capita_usd: 0, percentage_of_gdp: 0, government_share: 0, private_share: 0 };
        const waterSanitation = dataObj.water_sanitation || { drinking_water_access: 0, basic_sanitation_access: 0 };
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Stethoscope className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Physicians</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{healthWorkforce.physicians_per_10k || 0}</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 10,000 population</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Heart className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Nurses</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{healthWorkforce.nurses_per_10k || 0}</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 10,000 population</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Baby className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Midwives</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{healthWorkforce.midwives_per_10k || 0}</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per 10,000 population</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card-glass p-6 shadow-soft">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Health Expenditure</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Per Capita (USD)</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">${healthExpenditure.per_capita_usd || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">% of GDP</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{healthExpenditure.percentage_of_gdp || 0}%</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--color-text-secondary)]">Government vs Private</span>
                    </div>
                    <div className="w-full bg-[var(--color-background-default)] rounded-full h-3">
                      <div 
                        className="bg-[var(--color-primary-teal)] h-3 rounded-full" 
                        style={{ width: `${healthExpenditure.government_share || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[var(--color-primary-teal)]">Gov: {healthExpenditure.government_share || 0}%</span>
                      <span className="text-[var(--color-text-secondary)]">Private: {healthExpenditure.private_share || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Water & Sanitation Access</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--color-text-secondary)]">Drinking Water</span>
                      <span className="text-[var(--color-text-primary)]">{waterSanitation.drinking_water_access || 0}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-background-default)] rounded-full h-2">
                      <div 
                        className="bg-[var(--color-primary-teal)] h-2 rounded-full" 
                        style={{ width: `${waterSanitation.drinking_water_access || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--color-text-secondary)]">Basic Sanitation</span>
                      <span className="text-[var(--color-text-primary)]">{waterSanitation.basic_sanitation_access || 0}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-background-default)] rounded-full h-2">
                      <div 
                        className="bg-[var(--color-primary-teal)] h-2 rounded-full" 
                        style={{ width: `${waterSanitation.basic_sanitation_access || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--color-text-secondary)]">Handwashing Facilities</span>
                      <span className="text-[var(--color-text-primary)]">{waterSanitation.handwashing_facilities || 0}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-background-default)] rounded-full h-2">
                      <div 
                        className="bg-[var(--color-primary-teal)] h-2 rounded-full" 
                        style={{ width: `${waterSanitation.handwashing_facilities || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'economic_indicators':
        if (!dataObj) {
          return (
            <div className="card-glass p-6 shadow-soft">
              <p className="text-[var(--color-text-secondary)]">No economic indicators data available for this country.</p>
            </div>
          );
        }
        const gdp = dataObj.gdp || { total_usd_billions: 0, per_capita_usd: 0, growth_rate: 0 };
        const foreignInvestment = dataObj.foreign_investment || { fdi_inflow_millions: 0, healthcare_fdi_share: 0 };
        const employment = dataObj.employment || { unemployment_rate: 0, informal_sector_size: 0 };
        const povertyInequality = dataObj.poverty_inequality || { poverty_rate: 0, gini_coefficient: 0 };
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">GDP</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">${gdp.total_usd_billions || 0}B</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Per capita: ${gdp.per_capita_usd || 0}</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">GDP Growth</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{gdp.growth_rate || 0}%</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Annual growth rate</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Inflation Rate</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{dataObj.inflation_rate || 0}%</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Annual inflation</p>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="h-6 w-6 icon-primary" />
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">FDI Inflow</h4>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">${foreignInvestment.fdi_inflow_millions || 0}M</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2">Healthcare: {foreignInvestment.healthcare_fdi_share || 0}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card-glass p-6 shadow-soft">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Employment & Poverty</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Unemployment Rate</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{employment.unemployment_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Informal Sector</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{employment.informal_sector_size || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Poverty Rate</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{povertyInequality.poverty_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Gini Coefficient</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{povertyInequality.gini_coefficient || 0}</span>
                  </div>
                </div>
              </div>

              <div className="card-glass p-6 shadow-soft">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Government Finance</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Debt-to-GDP</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{(dataObj.government_finance?.debt_to_gdp || 0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Fiscal Deficit</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{(dataObj.government_finance?.fiscal_deficit_to_gdp || 0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Health Budget Share</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{(dataObj.government_finance?.health_budget_share || 0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Currency ({dataObj.currency?.code || 'N/A'})</span>
                    <span className="text-xl font-bold text-[var(--color-text-primary)]">{dataObj.currency?.exchange_rate_to_usd || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Analytics Overview with glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 icon-primary" />
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Avg Life Expectancy</h4>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{analytics.regional_averages.life_expectancy.toFixed(1)} years</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">Regional average</p>
        </div>

        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="h-6 w-6 icon-primary" />
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Avg GDP per Capita</h4>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">${analytics.regional_averages.gdp_per_capita.toFixed(0)}</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">Regional average</p>
        </div>

        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3 mb-4">
            <Building className="h-6 w-6 icon-primary" />
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Avg Health Spend</h4>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{analytics.regional_averages.health_expenditure.toFixed(1)}%</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">Of GDP</p>
        </div>

        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 icon-primary" />
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Avg Annual Growth</h4>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">
            {(countries.reduce((sum: number, country: string) => {
              const economicData = data?.economic_indicators?.[country];
              return sum + (economicData ? economicData.gdp.growth_rate : 0);
            }, 0) / (countries.length || 1)).toFixed(1)}%
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-2">GDP growth rate</p>
        </div>
      </div>

      {/* Interactive Map Section with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 icon-primary" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Interactive African Health Map</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <select
              value={selectedMapLayer}
              onChange={(e) => setSelectedMapLayer(e.target.value)}
              className="input text-sm"
            >
              {mapLayers.map(layer => (
                <option key={layer.id} value={layer.id}>{layer.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-96 border border-[var(--color-divider-gray)] rounded-lg overflow-hidden">
          <InteractiveMap 
            title="" 
            dataType="value" 
            height={384}
          />
        </div>
        <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
          <p>This map visualizes {
            selectedMapLayer === 'health_expenditure' ? 'healthcare expenditure as a percentage of GDP' :
            selectedMapLayer === 'life_expectancy_gdp' ? 'the relationship between life expectancy and GDP per capita' :
            'health insurance coverage rates'
          } across African countries.</p>
        </div>
      </div>

      {/* Controls with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 icon-primary" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters & Controls</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Country Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Country Selection */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="input"
          >
            {filteredCountries.map(country => (
              <option key={country} value={country}>
                {data?.population?.[country]?.country || country}
              </option>
            ))}
          </select>

          {/* Element Selection */}
          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="input"
          >
            {elements.map(element => (
              <option key={element.id} value={element.id}>
                {element.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Element Tabs with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-wrap gap-2 mb-6">
          {elements.map(element => {
            const Icon = element.icon;
            return (
              <button
                key={element.id}
                onClick={() => setSelectedElement(element.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedElement === element.id
                    ? 'btn-primary-elevated'
                    : 'btn-outline'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{element.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Country Header */}
        <div className="mb-6 p-4 card-glass shadow-soft">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            {(data?.population?.[selectedCountry]?.country || selectedCountry)} - {elements.find(e => e.id === selectedElement)?.label}
          </h3>
        </div>

        {/* Element Content */}
        {renderElementContent()}
      </div>

      {/* Investment Opportunities with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Healthcare Investment Opportunities</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.investment_insights.market_opportunities.map((opportunity: any, index: number) => {
            const countryKey = getCountryKey(opportunity.country);
            const economicData = data?.economic_indicators?.[countryKey];
            const insuranceData = (healthInsuranceData as any)[countryKey];
            
            return (
              <div key={opportunity.country} className="p-4 card-glass shadow-soft hover:shadow-elevated transition-all duration-300 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-[var(--color-text-primary)]">{opportunity.country}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${
                    opportunity.opportunity_score >= 80 ? 'bg-[var(--color-success)] text-white border-[color-mix(in_srgb,var(--color-success),black_10%)]' :
                    opportunity.opportunity_score >= 60 ? 'bg-[var(--color-warning)] text-white border-[color-mix(in_srgb,var(--color-warning),black_10%)]' :
                    'bg-[var(--color-error)] text-white border-[color-mix(in_srgb,var(--color-error),black_10%)]'
                  }`}>
                    Score: {opportunity.opportunity_score}
                  </span>
                </div>
                <div className="space-y-2">
                  {opportunity.key_factors.map((factor: string, factorIndex: number) => (
                    <p key={factorIndex} className="text-xs text-[var(--color-text-secondary)]">{factor}</p>
                  ))}
                  <div className="pt-2 border-t border-[var(--color-divider-gray)] mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--color-text-secondary)]">GDP per Capita:</span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        ${economicData ? economicData.gdp.per_capita_usd.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-[var(--color-text-secondary)]">Health Insurance:</span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {insuranceData ? insuranceData : Math.floor(Math.random() * 50) + 5}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NationPulsePage;