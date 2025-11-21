export interface HealthcareIndicators {
  life_expectancy: number;
  infant_mortality: number;
  maternal_mortality: number;
  healthcare_coverage: number;
}

export interface InvestmentClimate {
  ease_of_business: number;
  healthcare_investment: number;
  startup_ecosystem: string;
  regulatory_environment: string;
}

export interface CountryData {
  healthcare_indicators: HealthcareIndicators;
  investment_climate: InvestmentClimate;
  market_opportunities: string[];
}

export interface NationPulseData {
  kenya: CountryData;
  nigeria: CountryData;
  south_africa: CountryData;
  ghana: CountryData;
  egypt: CountryData;
  rwanda: CountryData;
}

export const nationPulseData: NationPulseData = {
  "kenya": {
    "healthcare_indicators": {
      "life_expectancy": 67.2,
      "infant_mortality": 28.1,
      "maternal_mortality": 342,
      "healthcare_coverage": 78.5
    },
    "investment_climate": {
      "ease_of_business": 56,
      "healthcare_investment": 2.8,
      "startup_ecosystem": "Strong",
      "regulatory_environment": "Favorable"
    },
    "market_opportunities": [
      "Telemedicine expansion",
      "Pharmaceutical manufacturing",
      "Medical device innovation",
      "Health insurance growth"
    ]
  },
  "nigeria": {
    "healthcare_indicators": {
      "life_expectancy": 54.7,
      "infant_mortality": 74.2,
      "maternal_mortality": 917,
      "healthcare_coverage": 45.2
    },
    "investment_climate": {
      "ease_of_business": 45,
      "healthcare_investment": 3.2,
      "startup_ecosystem": "Emerging",
      "regulatory_environment": "Improving"
    },
    "market_opportunities": [
      "Pharma supply chain",
      "Diagnostic services",
      "Health insurance",
      "Medical logistics"
    ]
  },
  "south_africa": {
    "healthcare_indicators": {
      "life_expectancy": 64.1,
      "infant_mortality": 24.6,
      "maternal_mortality": 119,
      "healthcare_coverage": 85.3
    },
    "investment_climate": {
      "ease_of_business": 62,
      "healthcare_investment": 8.5,
      "startup_ecosystem": "Mature",
      "regulatory_environment": "Advanced"
    },
    "market_opportunities": [
      "Biotechnology research",
      "Medical device manufacturing",
      "Clinical trials",
      "Healthcare IT"
    ]
  },
  "ghana": {
    "healthcare_indicators": {
      "life_expectancy": 64.1,
      "infant_mortality": 35.0,
      "maternal_mortality": 308,
      "healthcare_coverage": 62.5
    },
    "investment_climate": {
      "ease_of_business": 58,
      "healthcare_investment": 3.8,
      "startup_ecosystem": "Growing",
      "regulatory_environment": "Stable"
    },
    "market_opportunities": [
      "Pharma supply chain",
      "Digital health platforms",
      "Insurance distribution",
      "Diagnostics networks"
    ]
  },
  "egypt": {
    "healthcare_indicators": {
      "life_expectancy": 72.0,
      "infant_mortality": 18.2,
      "maternal_mortality": 37,
      "healthcare_coverage": 89.0
    },
    "investment_climate": {
      "ease_of_business": 60,
      "healthcare_investment": 4.9,
      "startup_ecosystem": "Advancing",
      "regulatory_environment": "Structured"
    },
    "market_opportunities": [
      "Health tech marketplaces",
      "Pharmacy e-commerce",
      "Medical devices",
      "Hospital services"
    ]
  },
  "rwanda": {
    "healthcare_indicators": {
      "life_expectancy": 69.1,
      "infant_mortality": 26.6,
      "maternal_mortality": 248,
      "healthcare_coverage": 87.3
    },
    "investment_climate": {
      "ease_of_business": 76,
      "healthcare_investment": 2.1,
      "startup_ecosystem": "Supportive",
      "regulatory_environment": "Efficient"
    },
    "market_opportunities": [
      "Digital health",
      "Maternal health",
      "Primary care platforms",
      "Diagnostics"
    ]
  }
}; 