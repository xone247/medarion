export type UserRole = 'investors_finance' | 'industry_executives' | 'health_science_experts' | 'media_advisors' | 'startup';

export type AccountTier = 'free' | 'paid' | 'enterprise' | 'academic';

export type AppRole = 'super_admin' | 'blog_admin' | 'ads_admin' | 'content_editor';

export interface UserProfile {
  id: string;
  email: string;
  user_type: UserRole;
  full_name?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
  dashboard_modules?: string[];
  module_order?: string[];
  account_tier?: AccountTier;
  is_admin?: boolean;
  app_roles?: AppRole[];
}

export interface DashboardModule {
  id: string;
  name: string;
  component: string;
  icon: string;
  description: string;
  category: 'core' | 'analytics' | 'tools' | 'data';
  required_roles?: AppRole[];
  required_tier?: AccountTier;
}

// Database-backed modules only - these modules fetch data from the database via API endpoints
// ONLY modules that have data management in Admin Dashboard should be here
export const AVAILABLE_MODULES: DashboardModule[] = [
  // Core modules
  { id: 'dashboard', name: 'Dashboard', component: 'Dashboard', icon: 'BarChart3', description: 'Main overview and KPIs', category: 'core' },
  { id: 'my_profile', name: 'My Profile', component: 'MyProfile', icon: 'User', description: 'Manage your profile and company info', category: 'core' },
  
  // Data modules (database-backed - managed in Admin Dashboard Data Management tab)
  { id: 'companies', name: 'Companies', component: 'Companies', icon: 'Building2', description: 'Healthcare company profiles and data', category: 'data' },
  { id: 'deals', name: 'Deals', component: 'Deals', icon: 'TrendingUp', description: 'Track M&A, licensing, and deal activity', category: 'data' },
  { id: 'grants', name: 'Grants', component: 'Grants', icon: 'DollarSign', description: 'Monitor grants and funding opportunities', category: 'data' },
  { id: 'investors', name: 'Investors', component: 'Investors', icon: 'Users', description: 'Investor profiles and activity', category: 'data' },
  { id: 'clinical_trials', name: 'Clinical Trials', component: 'ClinicalTrials', icon: 'Microscope', description: 'Clinical research and trials data', category: 'data' },
  { id: 'regulatory', name: 'Regulatory', component: 'Regulatory', icon: 'FileCheck', description: 'Regulatory approvals and compliance', category: 'data' },
  { id: 'regulatory_ecosystem', name: 'Regulatory Ecosystem', component: 'RegulatoryEcosystem', icon: 'FileCheck', description: 'Regulatory bodies across Africa', category: 'data' },
  { id: 'public_markets', name: 'Public Markets', component: 'PublicMarkets', icon: 'LineChart', description: 'Comprehensive financial data hub', category: 'data' },
  { id: 'clinical_centers', name: 'Clinical Centers', component: 'ClinicalCenters', icon: 'Microscope', description: 'Centers conducting clinical trials', category: 'data' },
  { id: 'investigators', name: 'Investigators', component: 'Investigators', icon: 'Users', description: 'Clinical trial investigators and physicians', category: 'data' },
  
  // Analytics modules (database-backed - managed in Admin Dashboard Data Management tab)
  { id: 'nation_pulse', name: 'Nation Pulse', component: 'NationPulse', icon: 'Activity', description: 'Health and economic indicators', category: 'analytics' },
  
  // Tools modules (database-backed - managed in Admin Dashboard Data Management tab)
  { id: 'fundraising_crm', name: 'Fundraising CRM', component: 'FundraisingCRM', icon: 'MessageSquare', description: 'Manage investor relationships', category: 'tools' },
  { id: 'ai_tools', name: 'AI Tools', component: 'AITools', icon: 'Bot', description: 'AI-assisted analysis and copilots', category: 'tools', required_tier: 'paid' },
];

export const DEFAULT_MODULES_BY_ROLE: Record<UserRole, string[]> = {
  investors_finance: [
    'dashboard', 'companies', 'deals', 'grants', 'public_markets', 
    'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse',
    'ai_tools', 'regulatory_ecosystem', 'clinical_centers', 'investigators'
  ],
  industry_executives: [
    'dashboard', 'companies', 'deals', 'grants', 'public_markets', 
    'investors', 'regulatory', 'clinical_trials', 'nation_pulse',
    'regulatory_ecosystem', 'clinical_centers', 'investigators'
  ],
  health_science_experts: [
    'dashboard', 'grants', 'regulatory', 'clinical_trials', 'nation_pulse',
    'regulatory_ecosystem', 'clinical_centers', 'investigators'
  ],
  media_advisors: [
    'dashboard', 'companies', 'deals', 'grants', 'public_markets', 
    'investors', 'regulatory', 'clinical_trials', 'nation_pulse',
    'regulatory_ecosystem'
  ],
  startup: [
    'dashboard', 'companies', 'deals', 'grants', 'public_markets', 
    'investors', 'fundraising_crm', 'regulatory', 'clinical_trials', 'nation_pulse',
    'ai_tools', 'regulatory_ecosystem'
  ]
};

export const ROLE_LABELS: Record<UserRole | 'admin', string> = {
  investors_finance: 'Investors & Finance',
  industry_executives: 'Industry Executives',
  health_science_experts: 'Health & Science Experts',
  media_advisors: 'Media & Advisors',
  startup: 'Startup',
  admin: 'Admin'
};