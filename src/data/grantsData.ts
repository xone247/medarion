export interface Grant {
  organizationName: string;
  funders: string[];
  value: number;
  type: string;
  country: string;
  date: string;
  sector: string;
  duration: string;
}

export interface GrantsData {
  grants: Grant[];
}

export const grantsData: GrantsData = {
  "grants": [
    { "organizationName": "African Health Research Institute", "funders": ["Gates Foundation", "Wellcome Trust"], "value": 5000000, "type": "Research Grant", "country": "South Africa", "date": "2024-06-15", "sector": "Biotechnology", "duration": "3 years" },
    { "organizationName": "Kenya Medical Research Institute", "funders": ["NIH", "African Development Bank"], "value": 3200000, "type": "Infrastructure Grant", "country": "Kenya", "date": "2024-07-20", "sector": "Public Health", "duration": "2 years" },
    { "organizationName": "Nigerian Health Innovation Hub", "funders": ["World Bank", "African Union"], "value": 1800000, "type": "Innovation Grant", "country": "Nigeria", "date": "2024-08-10", "sector": "Health Tech", "duration": "18 months" },
    { "organizationName": "Ghana Health Systems", "funders": ["USAID", "GIZ"], "value": 2500000, "type": "Capacity Building", "country": "Ghana", "date": "2024-09-05", "sector": "Health Systems", "duration": "2 years" },
    { "organizationName": "Rwanda Digital Health", "funders": ["Mastercard Foundation"], "value": 1200000, "type": "Digital Health", "country": "Rwanda", "date": "2024-10-01", "sector": "Health Tech", "duration": "1 year" }
  ]
}; 