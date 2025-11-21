export interface Deal {
  id: number;
  companyName: string;
  investors: string[];
  value: number;
  type: string;
  country: string;
  date: string;
  sector: string;
}

export interface Company {
  clinical_trials: Array<{
    trial_id: string;
    indication: string;
    phase: string;
    status: string;
  }>;
  regulatory: Array<{
    body: string;
    product: string;
    status: string;
    date: string;
  }>;
}

export interface PublicStock {
  companyName: string;
  ticker: string;
  exchange: string;
  price: string;
  market_cap: string;
}

export interface KPI {
  deals_and_grants: number;
  companies: number;
  investors: number;
  total_value_usd: number;
}

export interface StartupDashboardData {
  profile_views: number;
  pitch_deck_downloads: number;
  notifications: Array<{
    message: string;
    time: string;
  }>;
}

export interface MockData {
  kpis: KPI;
  startup_dashboard_data: StartupDashboardData;
  deals: Deal[];
  public_stocks: PublicStock[];
  companies: Record<string, Company>;
}

export const mockData: MockData = {
  "kpis": {
    "deals_and_grants": 35,
    "companies": 20,
    "investors": 15,
    "total_value_usd": 258250000
  },
  "startup_dashboard_data": {
    "profile_views": 472,
    "pitch_deck_downloads": 89,
    "notifications": [
      { "message": "Pan-African Health Ventures viewed your profile", "time": "2h ago" },
      { "message": "Your AI Investor Match list has been updated", "time": "1d ago" },
      { "message": "Welcome to Medarion! Complete your profile to attract investors.", "time": "3d ago" }
    ]
  },
  "deals": [
    { "id": 1, "companyName": "AfyaConnect", "investors": ["Savannah Capital", "Nile Ventures"], "value": 3200000, "type": "Seed", "country": "Kenya", "date": "2024-07-15", "sector": "Telemedicine" },
    { "id": 2, "companyName": "RxChain", "investors": ["Pan-African Health Ventures"], "value": 5500000, "type": "Series A", "country": "Nigeria", "date": "2024-08-20", "sector": "Pharma Supply Chain" },
    { "id": 3, "companyName": "KaziHealth", "investors": ["Lagos Angels Network"], "value": 1800000, "type": "Pre-Seed", "country": "Ghana", "date": "2024-09-05", "sector": "Health Insurance" },
    { "id": 4, "companyName": "Well-U", "investors": ["Gates Foundation"], "value": 500000, "type": "Grant", "country": "Rwanda", "date": "2024-09-12", "sector": "Maternal Health" },
    { "id": 5, "companyName": "DiagnosTech", "investors": ["Bio-Advance Fund", "Quantum Capital"], "value": 8000000, "type": "Series A", "country": "South Africa", "date": "2024-09-28", "sector": "AI Diagnostics" },
    { "id": 6, "companyName": "MobiDoc", "investors": ["Nile Ventures"], "value": 2500000, "type": "Seed", "country": "Nigeria", "date": "2024-10-10", "sector": "Telemedicine" },
    { "id": 7, "companyName": "BioGenix Labs", "investors": ["Pan-African Health Ventures", "Life Science Partners"], "value": 12000000, "type": "Series B", "country": "South Africa", "date": "2024-11-01", "sector": "Biotechnology" },
    { "id": 8, "companyName": "AfyaConnect", "investors": ["Bio-Advance Fund"], "value": 10000000, "type": "Series A", "country": "Kenya", "date": "2024-11-18", "sector": "Telemedicine" },
    { "id": 9, "companyName": "Redbird Health", "investors": ["Lagos Angels Network", "Johnson & Johnson Foundation"], "value": 1500000, "type": "Seed", "country": "Ghana", "date": "2024-12-05", "sector": "AI Diagnostics" },
    { "id": 10, "companyName": "Chekkit", "investors": ["Launch Africa"], "value": 500000, "type": "Seed", "country": "Nigeria", "date": "2025-01-20", "sector": "Pharma Supply Chain" },
    { "id": 11, "companyName": "Zuri Health", "investors": ["Savannah Capital"], "value": 1300000, "type": "Seed", "country": "Kenya", "date": "2025-02-10", "sector": "Telemedicine" },
    { "id": 12, "companyName": "Africure", "investors": ["Quantum Capital"], "value": 15000000, "type": "Private Equity", "country": "Cameroon", "date": "2025-03-15", "sector": "Pharmaceuticals" },
    { "id": 13, "companyName": "MyDawa", "investors": ["Life Science Partners"], "value": 20000000, "type": "Series B", "country": "Kenya", "date": "2025-04-02", "sector": "Pharma Supply Chain" },
    { "id": 14, "companyName": "Helium Health", "investors": ["Pan-African Health Ventures", "Global Ventures"], "value": 30000000, "type": "Series B", "country": "Nigeria", "date": "2025-05-21", "sector": "Health Tech" },
    { "id": 15, "companyName": "Global Health Initiative", "investors": ["Gates Foundation"], "value": 5000000, "type": "Grant", "country": "Ethiopia", "date": "2025-06-01", "sector": "Public Health" },
    { "id": 16, "companyName": "Vezeeta", "investors": ["Global Ventures", "STV"], "value": 40000000, "type": "Series D", "country": "Egypt", "date": "2024-06-18", "sector": "Health Tech" },
    { "id": 17, "companyName": "Yodawy", "investors": ["MEA VCC", "Global Ventures"], "value": 7500000, "type": "Series B", "country": "Egypt", "date": "2024-07-22", "sector": "Pharma Supply Chain" },
    { "id": 18, "companyName": "54gene", "investors": ["Adjuvant Capital", "Y Combinator"], "value": 25000000, "type": "Series B", "country": "Nigeria", "date": "2024-08-30", "sector": "Genomics" },
    { "id": 19, "companyName": "Waspito", "investors": ["Launch Africa"], "value": 2700000, "type": "Seed", "country": "Cameroon", "date": "2024-09-15", "sector": "Telemedicine" },
    { "id": 20, "companyName": "Shezlong", "investors": ["Asia Africa Investment"], "value": 350000, "type": "Seed", "country": "Egypt", "date": "2024-10-01", "sector": "Mental Health Tech" },
    { "id": 21, "companyName": "mPharma", "investors": ["Novartis", "CDC Group"], "value": 35000000, "type": "Series D", "country": "Ghana", "date": "2025-01-10", "sector": "Pharma Supply Chain" },
    { "id": 22, "companyName": "RelianceHMO", "investors": ["Partech", "Y Combinator"], "value": 6400000, "type": "Series A", "country": "Nigeria", "date": "2025-02-14", "sector": "Health Insurance" },
    { "id": 23, "companyName": "HearX Group", "investors": ["Bose Ventures"], "value": 8300000, "type": "Series A", "country": "South Africa", "date": "2025-03-05", "sector": "Medical Devices" },
    { "id": 24, "companyName": "Ilara Health", "investors": ["TLcom Capital"], "value": 3800000, "type": "Series A", "country": "Kenya", "date": "2025-04-11", "sector": "AI Diagnostics" },
    { "id": 25, "companyName": "Ubenwa", "investors": ["Radical Ventures"], "value": 2500000, "type": "Pre-Seed", "country": "Nigeria", "date": "2025-05-09", "sector": "AI Diagnostics" },
    { "id": 26, "companyName": "TIBU Health", "investors": ["Kepple Africa Ventures"], "value": 1000000, "type": "Seed", "country": "Kenya", "date": "2024-06-25", "sector": "Health Tech" },
    { "id": 27, "companyName": "Bio-Analytics Uganda", "investors": ["Uganda Development Fund"], "value": 750000, "type": "Grant", "country": "Uganda", "date": "2024-07-30", "sector": "Biotechnology" },
    { "id": 28, "companyName": "Sante+ Corp", "investors": ["Afri-Tech Ventures"], "value": 2200000, "type": "Seed", "country": "Senegal", "date": "2024-08-15", "sector": "Telemedicine" },
    { "id": 29, "companyName": "Cure Bionics", "investors": ["Flat6Labs"], "value": 100000, "type": "Pre-Seed", "country": "Tunisia", "date": "2024-09-20", "sector": "Medical Devices" },
    { "id": 30, "companyName": "OMNI", "investors": ["Sawari Ventures"], "value": 450000, "type": "Pre-Seed", "country": "Egypt", "date": "2024-10-18", "sector": "Health Tech" },
    { "id": 31, "companyName": "LifeBank", "investors": ["Google for Startups"], "value": 200000, "type": "Grant", "country": "Nigeria", "date": "2024-11-22", "sector": "Logistics" },
    { "id": 32, "companyName": "Meditect", "investors": ["Afri-Tech Ventures"], "value": 1100000, "type": "Seed", "country": "Ivory Coast", "date": "2024-12-10", "sector": "Pharma Supply Chain" },
    { "id": 33, "companyName": "Insightiv", "investors": ["Y Combinator"], "value": 150000, "type": "Pre-Seed", "country": "Rwanda", "date": "2025-01-28", "sector": "AI Diagnostics" },
    { "id": 34, "companyName": "South African Genomics Inst.", "investors": ["SA Gov Health Fund"], "value": 10000000, "type": "Grant", "country": "South Africa", "date": "2025-02-20", "sector": "Genomics" },
    { "id": 35, "companyName": "Cardio-Care", "investors": ["Nile Ventures", "MEA VCC"], "value": 3000000, "type": "Series A", "country": "Egypt", "date": "2025-03-30", "sector": "Medical Devices" }
  ],
  "public_stocks": [
    { "companyName": "Life Healthcare Group", "ticker": "JSE:LHC", "exchange": "JSE", "price": "22.50 ZAR", "market_cap": "32.4B ZAR" },
    { "companyName": "Aspen Pharmacare", "ticker": "JSE:APN", "exchange": "JSE", "price": "155.10 ZAR", "market_cap": "69.8B ZAR" },
    { "companyName": "Neimeth Int. Pharma", "ticker": "NGX:NEIMETH", "exchange": "NGX", "price": "1.50 NGN", "market_cap": "2.8B NGN" },
    { "companyName": "Netcare", "ticker": "JSE:NTC", "exchange": "JSE", "price": "13.80 ZAR", "market_cap": "19.7B ZAR" },
    { "companyName": "Fidson Healthcare", "ticker": "NGX:FIDSON", "exchange": "NGX", "price": "9.20 NGN", "market_cap": "20.1B NGN" },
    { "companyName": "Cipla Medpro SA", "ticker": "JSE:CMP", "exchange": "JSE", "price": "11.20 ZAR", "market_cap": "15.3B ZAR" },
    { "companyName": "GlaxoSmithKline Nigeria", "ticker": "NGX:GLAXOSMITH", "exchange": "NGX", "price": "6.80 NGN", "market_cap": "8.1B NGN" },
    { "companyName": "Adcock Ingram", "ticker": "JSE:AIP", "exchange": "JSE", "price": "52.40 ZAR", "market_cap": "8.9B ZAR" },
    { "companyName": "Cleopatra Hospital Group", "ticker": "EGX:CLHO", "exchange": "EGX", "price": "5.30 EGP", "market_cap": "8.5B EGP" },
    { "companyName": "CIRA Education", "ticker": "EGX:CIRA", "exchange": "EGX", "price": "12.70 EGP", "market_cap": "7.1B EGP" },
    { "companyName": "Nairobi Hospital", "ticker": "NSE:NHIF", "exchange": "NSE", "price": "150.00 KES", "market_cap": "12.5B KES" }
  ],
  "companies": {
    "AfyaConnect": { 
      "clinical_trials": [
        { "trial_id": "NCT012345", "indication": "Diabetes Management", "phase": "II", "status": "Recruiting" }, 
        { "trial_id": "NCT067890", "indication": "Hypertension", "phase": "I", "status": "Completed" }
      ], 
      "regulatory": [
        { "body": "KPPB (Kenya)", "product": "Afya Tele-consult", "status": "Approved", "date": "2023-11-10" }
      ] 
    },
    "RxChain": { 
      "clinical_trials": [], 
      "regulatory": [
        { "body": "NAFDAC (Nigeria)", "product": "DrugTrace™", "status": "Approved", "date": "2024-05-15" }, 
        { "body": "KPPB (Kenya)", "product": "DrugTrace™", "status": "Submitted", "date": "2024-06-20" }
      ] 
    },
    "54gene": { 
      "clinical_trials": [
        { "trial_id": "GEN-AFR-01", "indication": "Sickle Cell Anemia Genetic Markers", "phase": "Research", "status": "Active" }
      ], 
      "regulatory": [] 
    },
    "HearX Group": { 
      "clinical_trials": [], 
      "regulatory": [
        { "body": "SAHPRA (South Africa)", "product": "hearScope Otoscope", "status": "Approved", "date": "2023-01-20" }, 
        { "body": "FDA (USA)", "product": "hearScope Otoscope", "status": "510(k) Cleared", "date": "2023-08-15" }
      ] 
    },
    "mPharma": { 
      "clinical_trials": [
        { "trial_id": "MPH-CARD-03", "indication": "Community Cardiovascular Health", "phase": "IV", "status": "Completed" }
      ], 
      "regulatory": [
        { "body": "GHA-FDA (Ghana)", "product": "Mutti", "status": "Approved", "date": "2021-05-10" }
      ] 
    },
    "DiagnosTech": {
      "clinical_trials": [
        { "trial_id": "DT-AI-001", "indication": "AI-Powered Cancer Detection", "phase": "II", "status": "Recruiting" }
      ],
      "regulatory": [
        { "body": "SAHPRA (South Africa)", "product": "AI-Diagnose Pro", "status": "Approved", "date": "2024-08-15" }
      ]
    },
    "BioGenix Labs": {
      "clinical_trials": [
        { "trial_id": "BGL-BIO-01", "indication": "Novel Biologic Therapy", "phase": "I", "status": "Active" }
      ],
      "regulatory": [
        { "body": "SAHPRA (South Africa)", "product": "BioGenix Therapy", "status": "Phase I Approval", "date": "2024-10-01" }
      ]
    },
    "Ilara Health": {
      "clinical_trials": [
        { "trial_id": "IH-DIAG-01", "indication": "Point-of-Care Diagnostics", "phase": "III", "status": "Recruiting" }
      ],
      "regulatory": [
        { "body": "KPPB (Kenya)", "product": "Ilara Diagnostics Kit", "status": "Approved", "date": "2024-09-20" }
      ]
    },
    "Ubenwa": {
      "clinical_trials": [
        { "trial_id": "UB-AI-01", "indication": "AI Neonatal Screening", "phase": "II", "status": "Active" }
      ],
      "regulatory": [
        { "body": "NAFDAC (Nigeria)", "product": "Ubenwa AI Screener", "status": "Approved", "date": "2024-11-15" }
      ]
    },
    "Cardio-Care": {
      "clinical_trials": [
        { "trial_id": "CC-CARD-01", "indication": "Cardiovascular Monitoring", "phase": "II", "status": "Recruiting" }
      ],
      "regulatory": [
        { "body": "EGY-FDA (Egypt)", "product": "CardioCare Monitor", "status": "Approved", "date": "2024-12-01" }
      ]
    }
  }
}; 