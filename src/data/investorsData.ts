export interface InvestorData {
  id: string;
  name: string;
  logo: string;
  description: string;
  type: string;
  headquarters: string;
  founded: string;
  assets_under_management: string;
  website: string;
  focus_sectors: string[];
  investment_stages: string[];
  portfolio_companies: number;
  total_investments: number;
  average_investment: number;
  countries: string[];
  team_size: string;
  contact_email: string;
  social_media: {
    linkedin?: string;
    twitter?: string;
  };
  recent_investments: Array<{
    company: string;
    amount: number;
    date: string;
    stage: string;
  }>;
  investment_criteria: string[];
  portfolio_exits: number;
}

export const investorsData: Record<string, InvestorData> = {
  "Savannah Capital": {
    id: "Savannah Capital",
    name: "Savannah Capital",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Leading African private equity firm focused on healthcare, technology, and financial services investments.",
    type: "Private Equity",
    headquarters: "Lagos, Nigeria",
    founded: "2010",
    assets_under_management: "$500M+",
    website: "https://savannah-capital.com",
    focus_sectors: ["Healthcare", "Technology", "Financial Services", "Agriculture"],
    investment_stages: ["Series A", "Series B", "Growth Equity"],
    portfolio_companies: 25,
    total_investments: 45,
    average_investment: 15000000,
    countries: ["Nigeria", "Kenya", "Ghana", "South Africa", "Egypt"],
    team_size: "15-25",
    contact_email: "info@savannah-capital.com",
    social_media: {
      linkedin: "https://linkedin.com/company/savannah-capital",
      twitter: "https://twitter.com/savannahcap"
    },
    recent_investments: [
      { company: "AfyaConnect", amount: 3200000, date: "2024-07-15", stage: "Series A" },
      { company: "Zuri Health", amount: 1300000, date: "2025-02-10", stage: "Seed" }
    ],
    investment_criteria: ["Proven business model", "Strong management team", "Scalable technology", "Market opportunity >$100M"],
    portfolio_exits: 8
  },
  "Pan-African Health Ventures": {
    id: "Pan-African Health Ventures",
    name: "Pan-African Health Ventures",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Specialized healthcare investment firm supporting innovative health solutions across Africa.",
    type: "Venture Capital",
    headquarters: "Nairobi, Kenya",
    founded: "2018",
    assets_under_management: "$200M+",
    website: "https://pahv.africa",
    focus_sectors: ["Healthcare", "Digital Health", "Medical Devices", "Biotechnology"],
    investment_stages: ["Seed", "Series A", "Series B"],
    portfolio_companies: 18,
    total_investments: 32,
    average_investment: 8000000,
    countries: ["Kenya", "Nigeria", "South Africa", "Ghana", "Rwanda"],
    team_size: "8-15",
    contact_email: "invest@pahv.africa",
    social_media: {
      linkedin: "https://linkedin.com/company/pan-african-health-ventures"
    },
    recent_investments: [
      { company: "RxChain", amount: 5500000, date: "2024-08-20", stage: "Series A" },
      { company: "BioGenix Labs", amount: 12000000, date: "2024-11-01", stage: "Series B" },
      { company: "Helium Health", amount: 30000000, date: "2025-05-21", stage: "Series B" }
    ],
    investment_criteria: ["Healthcare innovation", "Clinical validation", "Regulatory pathway", "African market focus"],
    portfolio_exits: 3
  },
  "Launch Africa": {
    id: "Launch Africa",
    name: "Launch Africa",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Early-stage venture capital firm investing in African startups with global potential.",
    type: "Venture Capital",
    headquarters: "Cape Town, South Africa",
    founded: "2017",
    assets_under_management: "$100M+",
    website: "https://launchafrica.com",
    focus_sectors: ["Technology", "Healthcare", "Fintech", "E-commerce"],
    investment_stages: ["Pre-Seed", "Seed", "Series A"],
    portfolio_companies: 35,
    total_investments: 60,
    average_investment: 2000000,
    countries: ["South Africa", "Nigeria", "Kenya", "Ghana", "Egypt"],
    team_size: "10-20",
    contact_email: "hello@launchafrica.com",
    social_media: {
      linkedin: "https://linkedin.com/company/launch-africa-ventures",
      twitter: "https://twitter.com/launchafrica"
    },
    recent_investments: [
      { company: "Chekkit", amount: 500000, date: "2025-01-20", stage: "Seed" },
      { company: "Waspito", amount: 2700000, date: "2024-09-15", stage: "Seed" }
    ],
    investment_criteria: ["Innovative solution", "Strong founding team", "Market validation", "Scalability potential"],
    portfolio_exits: 5
  },
  "Quantum Capital": {
    id: "Quantum Capital",
    name: "Quantum Capital",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Growth-stage investment firm supporting African companies in healthcare and technology sectors.",
    type: "Growth Equity",
    headquarters: "Lagos, Nigeria",
    founded: "2015",
    assets_under_management: "$300M+",
    website: "https://quantum-capital.ng",
    focus_sectors: ["Healthcare", "Technology", "Financial Services"],
    investment_stages: ["Series B", "Series C", "Growth Equity"],
    portfolio_companies: 20,
    total_investments: 28,
    average_investment: 20000000,
    countries: ["Nigeria", "Ghana", "Kenya", "South Africa"],
    team_size: "12-18",
    contact_email: "info@quantum-capital.ng",
    social_media: {
      linkedin: "https://linkedin.com/company/quantum-capital-nigeria"
    },
    recent_investments: [
      { company: "DiagnosTech", amount: 8000000, date: "2024-09-28", stage: "Series A" },
      { company: "Africure", amount: 15000000, date: "2025-03-15", stage: "Private Equity" }
    ],
    investment_criteria: ["Proven revenue model", "Market leadership", "Strong unit economics", "Expansion potential"],
    portfolio_exits: 6
  },
  "Life Science Partners": {
    id: "Life Science Partners",
    name: "Life Science Partners",
    logo: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center",
    description: "Specialized healthcare investment firm focused on life sciences and medical innovations.",
    type: "Venture Capital",
    headquarters: "Johannesburg, South Africa",
    founded: "2016",
    assets_under_management: "$150M+",
    website: "https://lifesciencepartners.co.za",
    focus_sectors: ["Biotechnology", "Medical Devices", "Pharmaceuticals", "Digital Health"],
    investment_stages: ["Series A", "Series B", "Series C"],
    portfolio_companies: 15,
    total_investments: 22,
    average_investment: 12000000,
    countries: ["South Africa", "Kenya", "Nigeria", "Ghana"],
    team_size: "8-12",
    contact_email: "contact@lifesciencepartners.co.za",
    social_media: {
      linkedin: "https://linkedin.com/company/life-science-partners-sa"
    },
    recent_investments: [
      { company: "BioGenix Labs", amount: 12000000, date: "2024-11-01", stage: "Series B" },
      { company: "MyDawa", amount: 20000000, date: "2025-04-02", stage: "Series B" }
    ],
    investment_criteria: ["Scientific innovation", "Clinical potential", "IP protection", "Regulatory pathway"],
    portfolio_exits: 4
  }
}; 