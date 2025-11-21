export interface CountryData {
  id: string;
  name: string;
  code: string;
  coordinates: [number, number]; // [latitude, longitude]
  color: string;
  investmentLevel: 'high' | 'medium' | 'low';
  totalInvestment: number;
  dealCount: number;
  companies: number;
  sectors: string[];
  topCompanies: string[];
  regulatoryBodies: string[];
  healthcareIndicators: {
    lifeExpectancy: number;
    healthcareSpending: number;
    doctorDensity: number;
    hospitalBeds: number;
  };
  investmentTrends: {
    growth: number; // percentage
    focus: string[];
    challenges: string[];
  };
}

export const africanCountriesMapData: CountryData[] = [
  {
    id: 'nigeria',
    name: 'Nigeria',
    code: 'NG',
    coordinates: [9.0820, 8.6753],
    color: '#00665C', // Lead green for high investment
    investmentLevel: 'high',
    totalInvestment: 125000000,
    dealCount: 12,
    companies: 8,
    sectors: ['Telemedicine', 'Pharma Supply Chain', 'AI Diagnostics', 'Health Insurance'],
    topCompanies: ['Helium Health', 'mPharma', '54gene', 'RelianceHMO'],
    regulatoryBodies: ['NAFDAC', 'Nigerian Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 54.7,
      healthcareSpending: 3.2,
      doctorDensity: 0.4,
      hospitalBeds: 0.5
    },
    investmentTrends: {
      growth: 35,
      focus: ['Digital Health', 'Pharma Supply Chain', 'AI Diagnostics'],
      challenges: ['Regulatory complexity', 'Infrastructure gaps', 'Talent shortage']
    }
  },
  {
    id: 'kenya',
    name: 'Kenya',
    code: 'KE',
    coordinates: [-0.0236, 37.9062],
    color: '#00665C', // Lead green for high investment
    investmentLevel: 'high',
    totalInvestment: 98000000,
    dealCount: 10,
    companies: 7,
    sectors: ['Telemedicine', 'Health Tech', 'Biotechnology', 'Pharma Supply Chain'],
    topCompanies: ['AfyaConnect', 'MyDawa', 'TIBU Health', 'Ilara Health'],
    regulatoryBodies: ['KPPB', 'Kenya Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 67.2,
      healthcareSpending: 2.8,
      doctorDensity: 0.2,
      hospitalBeds: 1.4
    },
    investmentTrends: {
      growth: 28,
      focus: ['Telemedicine', 'Health Tech', 'Biotechnology'],
      challenges: ['Regulatory delays', 'Funding gaps', 'Market fragmentation']
    }
  },
  {
    id: 'south-africa',
    name: 'South Africa',
    code: 'ZA',
    coordinates: [-30.5595, 22.9375],
    color: '#00665C', // Lead green for high investment
    investmentLevel: 'high',
    totalInvestment: 156000000,
    dealCount: 8,
    companies: 6,
    sectors: ['Biotechnology', 'Medical Devices', 'AI Diagnostics', 'Healthcare IT'],
    topCompanies: ['BioGenix Labs', 'HearX Group', 'DiagnosTech', 'South African Genomics Inst.'],
    regulatoryBodies: ['SAHPRA', 'Health Professions Council'],
    healthcareIndicators: {
      lifeExpectancy: 64.1,
      healthcareSpending: 8.5,
      doctorDensity: 0.9,
      hospitalBeds: 2.3
    },
    investmentTrends: {
      growth: 42,
      focus: ['Biotechnology', 'Medical Devices', 'AI Diagnostics'],
      challenges: ['Economic volatility', 'Regulatory complexity', 'Talent competition']
    }
  },
  {
    id: 'ghana',
    name: 'Ghana',
    code: 'GH',
    coordinates: [7.9465, -1.0232],
    color: '#F59E0B', // Yellow for medium investment
    investmentLevel: 'medium',
    totalInvestment: 72000000,
    dealCount: 6,
    companies: 4,
    sectors: ['Pharma Supply Chain', 'Telemedicine', 'Health Insurance'],
    topCompanies: ['mPharma', 'RelianceHMO', 'Well-U'],
    regulatoryBodies: ['GHA-FDA', 'Ghana Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 64.1,
      healthcareSpending: 3.8,
      doctorDensity: 0.1,
      hospitalBeds: 0.9
    },
    investmentTrends: {
      growth: 22,
      focus: ['Pharma Supply Chain', 'Digital Health', 'Health Insurance'],
      challenges: ['Limited local manufacturing', 'Import dependency', 'Distribution complexity']
    }
  },
  {
    id: 'egypt',
    name: 'Egypt',
    code: 'EG',
    coordinates: [26.8206, 30.8025],
    color: '#F59E0B', // Yellow for medium investment
    investmentLevel: 'medium',
    totalInvestment: 68000000,
    dealCount: 5,
    companies: 4,
    sectors: ['Health Tech', 'Pharma Supply Chain', 'Medical Devices'],
    topCompanies: ['Vezeeta', 'Yodawy', 'Cardio-Care', 'Shezlong'],
    regulatoryBodies: ['EGY-FDA', 'Egyptian Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 72.0,
      healthcareSpending: 4.9,
      doctorDensity: 0.8,
      hospitalBeds: 1.6
    },
    investmentTrends: {
      growth: 31,
      focus: ['Health Tech', 'Pharma Supply Chain', 'Medical Devices'],
      challenges: ['Regulatory complexity', 'Currency volatility', 'Competition from established players']
    }
  },
  {
    id: 'cameroon',
    name: 'Cameroon',
    code: 'CM',
    coordinates: [7.3697, 12.3547],
    color: '#EF4444', // Red for low investment
    investmentLevel: 'low',
    totalInvestment: 18000000,
    dealCount: 2,
    companies: 2,
    sectors: ['Telemedicine', 'Pharmaceuticals'],
    topCompanies: ['Africure', 'Waspito'],
    regulatoryBodies: ['CMR-FDA', 'Cameroon Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 59.3,
      healthcareSpending: 1.8,
      doctorDensity: 0.1,
      hospitalBeds: 0.7
    },
    investmentTrends: {
      growth: 15,
      focus: ['Telemedicine', 'Pharmaceuticals', 'Basic Healthcare'],
      challenges: ['Limited infrastructure', 'Regulatory gaps', 'Funding constraints']
    }
  },
  {
    id: 'rwanda',
    name: 'Rwanda',
    code: 'RW',
    coordinates: [-1.9403, 29.8739],
    color: '#F59E0B', // Yellow for medium investment
    investmentLevel: 'medium',
    totalInvestment: 25000000,
    dealCount: 3,
    companies: 2,
    sectors: ['Maternal Health', 'Digital Health'],
    topCompanies: ['Well-U', 'Insightiv'],
    regulatoryBodies: ['Rwanda FDA', 'Rwanda Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 69.1,
      healthcareSpending: 2.1,
      doctorDensity: 0.1,
      hospitalBeds: 1.6
    },
    investmentTrends: {
      growth: 38,
      focus: ['Digital Health', 'Maternal Health', 'Primary Care'],
      challenges: ['Small market size', 'Limited local talent', 'Infrastructure gaps']
    }
  },
  {
    id: 'uganda',
    name: 'Uganda',
    code: 'UG',
    coordinates: [1.3733, 32.2903],
    color: '#EF4444', // Red for low investment
    investmentLevel: 'low',
    totalInvestment: 750000,
    dealCount: 1,
    companies: 1,
    sectors: ['Biotechnology'],
    topCompanies: ['Bio-Analytics Uganda'],
    regulatoryBodies: ['Uganda FDA', 'Uganda Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 63.4,
      healthcareSpending: 1.9,
      doctorDensity: 0.1,
      hospitalBeds: 0.5
    },
    investmentTrends: {
      growth: 8,
      focus: ['Biotechnology', 'Basic Healthcare', 'Research'],
      challenges: ['Limited funding', 'Regulatory gaps', 'Infrastructure constraints']
    }
  },
  {
    id: 'senegal',
    name: 'Senegal',
    code: 'SN',
    coordinates: [14.4974, -14.4524],
    color: '#EF4444', // Red for low investment
    investmentLevel: 'low',
    totalInvestment: 2200000,
    dealCount: 1,
    companies: 1,
    sectors: ['Telemedicine'],
    topCompanies: ['Sante+ Corp'],
    regulatoryBodies: ['Senegal FDA', 'Senegal Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 67.9,
      healthcareSpending: 2.3,
      doctorDensity: 0.1,
      hospitalBeds: 0.7
    },
    investmentTrends: {
      growth: 12,
      focus: ['Telemedicine', 'Basic Healthcare', 'Digital Health'],
      challenges: ['Limited digital infrastructure', 'Regulatory complexity', 'Funding gaps']
    }
  },
  {
    id: 'tunisia',
    name: 'Tunisia',
    code: 'TN',
    coordinates: [33.8869, 9.5375],
    color: '#EF4444', // Red for low investment
    investmentLevel: 'low',
    totalInvestment: 100000,
    dealCount: 1,
    companies: 1,
    sectors: ['Medical Devices'],
    topCompanies: ['Cure Bionics'],
    regulatoryBodies: ['Tunisia FDA', 'Tunisia Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 76.7,
      healthcareSpending: 3.8,
      doctorDensity: 1.3,
      hospitalBeds: 2.2
    },
    investmentTrends: {
      growth: 18,
      focus: ['Medical Devices', 'Healthcare IT', 'Research'],
      challenges: ['Economic instability', 'Regulatory delays', 'Limited venture capital']
    }
  },
  {
    id: 'ethiopia',
    name: 'Ethiopia',
    code: 'ET',
    coordinates: [9.1450, 40.4897],
    color: '#EF4444', // Red for low investment
    investmentLevel: 'low',
    totalInvestment: 5000000,
    dealCount: 1,
    companies: 1,
    sectors: ['Public Health'],
    topCompanies: ['Global Health Initiative'],
    regulatoryBodies: ['Ethiopia FDA', 'Ethiopia Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 66.6,
      healthcareSpending: 1.9,
      doctorDensity: 0.1,
      hospitalBeds: 0.3
    },
    investmentTrends: {
      growth: 25,
      focus: ['Public Health', 'Basic Healthcare', 'Research'],
      challenges: ['Political instability', 'Infrastructure gaps', 'Limited private sector']
    }
  },
  {
    id: 'ivory-coast',
    name: 'Ivory Coast',
    code: 'CI',
    coordinates: [7.5400, -5.5471],
    color: '#EF4444', // Red for low investment
    investmentLevel: 'low',
    totalInvestment: 1100000,
    dealCount: 1,
    companies: 1,
    sectors: ['Pharma Supply Chain'],
    topCompanies: ['Meditect'],
    regulatoryBodies: ['CI-FDA', 'Ivory Coast Medical Council'],
    healthcareIndicators: {
      lifeExpectancy: 57.8,
      healthcareSpending: 2.1,
      doctorDensity: 0.2,
      hospitalBeds: 0.4
    },
    investmentTrends: {
      growth: 16,
      focus: ['Pharma Supply Chain', 'Basic Healthcare', 'Digital Health'],
      challenges: ['Infrastructure gaps', 'Regulatory complexity', 'Limited funding']
    }
  }
];

export const mapColorScheme = {
  high: '#00665C', // Lead green
  medium: '#F59E0B', // Yellow
  low: '#EF4444' // Red
};

export const mapLegend = [
  { level: 'high', label: 'High Investment (>$50M)', color: '#00665C' },
  { level: 'medium', label: 'Medium Investment ($10M-$50M)', color: '#F59E0B' },
  { level: 'low', label: 'Low Investment (<$10M)', color: '#EF4444' }
];

export const getCountryColor = (investmentLevel: string) => {
  return mapColorScheme[investmentLevel as keyof typeof mapColorScheme] || '#6B7280';
};

export const getCountryData = (countryCode: string) => {
  return africanCountriesMapData.find(country => country.code === countryCode);
}; 