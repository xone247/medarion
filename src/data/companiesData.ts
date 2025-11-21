export interface CompanyData {
  id: string;
  name: string;
  logo: string;
  description: string;
  sector: string;
  country: string;
  founded: string;
  employees: string;
  website: string;
  stage: string;
  totalFunding: number;
  lastFunding: string;
  investors: string[];
  products: string[];
  markets: string[];
  achievements: string[];
  clinical_trials: Array<{
    trial_id: string;
    indication: string;
    phase: string;
    status: string;
    start_date: string;
    completion_date?: string;
  }>;
  regulatory: Array<{
    body: string;
    product: string;
    status: string;
    date: string;
    region: string;
  }>;
  partnerships: string[];
  awards: string[];
}

export const companiesData: Record<string, CompanyData> = {
  "mPharma": {
    id: "mPharma",
    name: "mPharma",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Leading digital pharmacy platform connecting patients to medicines and healthcare services across Africa.",
    sector: "Pharma Supply Chain",
    country: "Ghana",
    founded: "2013",
    employees: "500-1000",
    website: "https://mpharma.com",
    stage: "Series D",
    totalFunding: 35000000,
    lastFunding: "2025-01-10",
    investors: ["Novartis", "CDC Group", "JAM Fund", "Social Capital"],
    products: ["Mutti", "CarePay", "Vitality", "mPharma Connect"],
    markets: ["Ghana", "Nigeria", "Kenya", "Zambia", "Rwanda"],
    achievements: ["Served 2M+ patients", "Partnered with 200+ hospitals", "Reduced medicine costs by 30%"],
    clinical_trials: [
      {
        trial_id: "MPH-CARD-03",
        indication: "Community Cardiovascular Health",
        phase: "IV",
        status: "Completed",
        start_date: "2023-01-15",
        completion_date: "2024-06-30"
      }
    ],
    regulatory: [
      {
        body: "GHA-FDA (Ghana)",
        product: "Mutti",
        status: "Approved",
        date: "2021-05-10",
        region: "Ghana"
      },
      {
        body: "NAFDAC (Nigeria)",
        product: "Mutti",
        status: "Approved",
        date: "2022-03-15",
        region: "Nigeria"
      }
    ],
    partnerships: ["Novartis", "Pfizer", "GSK", "Ministry of Health Ghana"],
    awards: ["Africa Tech Awards 2023", "Ghana Innovation Award 2022"]
  },
  "54gene": {
    id: "54gene",
    name: "54gene",
    logo: "https://images.unsplash.com/photo-1576086213369-97a63d3cd3f5?w=100&h=100&fit=crop&crop=center",
    description: "African genomics company advancing precision medicine through research and diagnostics.",
    sector: "Genomics",
    country: "Nigeria",
    founded: "2019",
    employees: "100-250",
    website: "https://54gene.com",
    stage: "Series B",
    totalFunding: 25000000,
    lastFunding: "2024-08-30",
    investors: ["Adjuvant Capital", "Y Combinator", "KdT Ventures", "Adjuvant Capital"],
    products: ["GenePool", "54gene Test", "Research Platform"],
    markets: ["Nigeria", "Ghana", "Kenya", "South Africa"],
    achievements: ["Sequenced 100K+ African genomes", "Published 15+ research papers", "Partnerships with 20+ institutions"],
    clinical_trials: [
      {
        trial_id: "GEN-AFR-01",
        indication: "Sickle Cell Anemia Genetic Markers",
        phase: "Research",
        status: "Active",
        start_date: "2023-03-01"
      }
    ],
    regulatory: [],
    partnerships: ["NIH", "Wellcome Trust", "African Institute of Genomic Medicine"],
    awards: ["MIT Technology Review Innovator 2022", "African Innovation Foundation Award"]
  },
  "HearX Group": {
    id: "HearX Group",
    name: "HearX Group",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Digital health company specializing in hearing healthcare solutions and mobile diagnostics.",
    sector: "Medical Devices",
    country: "South Africa",
    founded: "2016",
    employees: "50-100",
    website: "https://hearxgroup.com",
    stage: "Series A",
    totalFunding: 8300000,
    lastFunding: "2025-03-05",
    investors: ["Bose Ventures", "Launch Africa", "SA SME Fund"],
    products: ["hearScope", "hearTest", "hearScreen", "hearZA"],
    markets: ["South Africa", "Kenya", "Nigeria", "Ghana"],
    achievements: ["Screened 500K+ patients", "FDA 510(k) clearance", "WHO recognized"],
    clinical_trials: [],
    regulatory: [
      {
        body: "SAHPRA (South Africa)",
        product: "hearScope Otoscope",
        status: "Approved",
        date: "2023-01-20",
        region: "South Africa"
      },
      {
        body: "FDA (USA)",
        product: "hearScope Otoscope",
        status: "510(k) Cleared",
        date: "2023-08-15",
        region: "United States"
      }
    ],
    partnerships: ["WHO", "University of Pretoria", "Ministry of Health SA"],
    awards: ["SA Innovation Award 2023", "Global Health Innovation Prize"]
  },
  "AfyaConnect": {
    id: "AfyaConnect",
    name: "AfyaConnect",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Telemedicine platform connecting patients with healthcare providers across East Africa.",
    sector: "Telemedicine",
    country: "Kenya",
    founded: "2020",
    employees: "25-50",
    website: "https://afyaconnect.co.ke",
    stage: "Series A",
    totalFunding: 13200000,
    lastFunding: "2024-11-18",
    investors: ["Savannah Capital", "Bio-Advance Fund", "Nile Ventures"],
    products: ["Afya Tele-consult", "Patient Portal", "Provider Dashboard"],
    markets: ["Kenya", "Uganda", "Tanzania", "Rwanda"],
    achievements: ["50K+ consultations", "200+ healthcare providers", "95% patient satisfaction"],
    clinical_trials: [
      {
        trial_id: "NCT012345",
        indication: "Diabetes Management",
        phase: "II",
        status: "Recruiting",
        start_date: "2024-01-15"
      },
      {
        trial_id: "NCT067890",
        indication: "Hypertension",
        phase: "I",
        status: "Completed",
        start_date: "2023-06-01",
        completion_date: "2024-02-28"
      }
    ],
    regulatory: [
      {
        body: "KPPB (Kenya)",
        product: "Afya Tele-consult",
        status: "Approved",
        date: "2023-11-10",
        region: "Kenya"
      }
    ],
    partnerships: ["Ministry of Health Kenya", "Kenyatta National Hospital", "Aga Khan Hospital"],
    awards: ["Kenya Digital Health Award 2023", "East Africa Innovation Prize"]
  },
  "RxChain": {
    id: "RxChain",
    name: "RxChain",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Blockchain-based pharmaceutical supply chain platform ensuring drug authenticity and traceability.",
    sector: "Pharma Supply Chain",
    country: "Nigeria",
    founded: "2021",
    employees: "15-30",
    website: "https://rxchain.ng",
    stage: "Series A",
    totalFunding: 5500000,
    lastFunding: "2024-08-20",
    investors: ["Pan-African Health Ventures", "Launch Africa"],
    products: ["DrugTrace™", "RxVerify", "Supply Chain Dashboard"],
    markets: ["Nigeria", "Ghana", "Kenya"],
    achievements: ["Tracked 1M+ drug packages", "Prevented 500+ counterfeit incidents", "Partnered with 50+ pharmacies"],
    clinical_trials: [],
    regulatory: [
      {
        body: "NAFDAC (Nigeria)",
        product: "DrugTrace™",
        status: "Approved",
        date: "2024-05-15",
        region: "Nigeria"
      },
      {
        body: "KPPB (Kenya)",
        product: "DrugTrace™",
        status: "Submitted",
        date: "2024-06-20",
        region: "Kenya"
      }
    ],
    partnerships: ["NAFDAC", "Pharmaceutical Society of Nigeria", "Major pharmacy chains"],
    awards: ["Nigeria Tech Innovation Award 2024", "Blockchain Healthcare Prize"]
  }
}; 