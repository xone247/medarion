export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  component: string;
  icon: string;
  category: 'analytics' | 'monitoring' | 'insights' | 'actions' | 'overview';
  size: 'small' | 'medium' | 'large' | 'full';
  required_roles?: string[];
  required_tier?: 'free' | 'paid' | 'enterprise' | 'academic';
  configurable: boolean;
  refreshable: boolean;
  exportable: boolean;
  default_position: number;
}

export interface UserDashboardConfig {
  user_type: string;
  default_modules: string[];
  module_order: string[];
  customizations: Record<string, any>;
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  // Overview Modules
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Main dashboard with key metrics and navigation',
    component: 'DashboardOverview',
    icon: 'LayoutDashboard',
    category: 'overview',
    size: 'full',
    configurable: false,
    refreshable: false,
    exportable: false,
    default_position: 0
  },
  {
    id: 'kpi-overview',
    title: 'KPI Overview',
    description: 'Key performance indicators and metrics',
    component: 'KPICard',
    icon: 'BarChart3',
    category: 'analytics',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 1
  },
  {
    id: 'recent-deals',
    title: 'Recent Deals',
    description: 'Latest investment deals and funding rounds',
    component: 'TopDealsWidget',
    icon: 'TrendingUp',
    category: 'monitoring',
    size: 'large',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 2
  },
  {
    id: 'monthly-dealflow',
    title: 'Monthly Deal Flow',
    description: 'Investment trends over time',
    component: 'MonthlyDealflowChart',
    icon: 'Activity',
    category: 'analytics',
    size: 'large',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 3
  },
  {
    id: 'sector-treemap',
    title: 'Sector Investment Map',
    description: 'Investment distribution by healthcare sector',
    component: 'SectorTreemap',
    icon: 'Map',
    category: 'insights',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 4
  },
  {
    id: 'regional-trends',
    title: 'Regional Trends',
    description: 'Investment patterns by African regions',
    component: 'RegionalTrendsChart',
    icon: 'Globe',
    category: 'analytics',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 5
  },
  {
    id: 'deals-by-stage',
    title: 'Deals by Stage',
    description: 'Investment distribution by funding stage',
    component: 'DealsByStageChart',
    icon: 'PieChart',
    category: 'analytics',
    size: 'small',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 6
  },
  {
    id: 'deals-by-sector',
    title: 'Deals by Sector',
    description: 'Investment distribution by healthcare sector',
    component: 'DealsBySectorChart',
    icon: 'BarChart',
    category: 'analytics',
    size: 'small',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 7
  },
  {
    id: 'vc-investment-timeline',
    title: 'VC Investment Timeline',
    description: 'Venture capital investment trends over time',
    component: 'VCInvestmentOverTimeChart',
    icon: 'Timeline',
    category: 'analytics',
    size: 'large',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 8
  },
  {
    id: 'monthly-grants',
    title: 'Monthly Grants',
    description: 'Grant funding trends and distribution',
    component: 'MonthlyGrantChart',
    icon: 'Award',
    category: 'monitoring',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 9
  },
  {
    id: 'most-active-investors',
    title: 'Most Active Investors',
    description: 'Top investors by deal count and value',
    component: 'MostActiveInvestorsWidget',
    icon: 'Users',
    category: 'insights',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 10
  },
  {
    id: 'healthcare-market',
    title: 'Healthcare Market Insights',
    description: 'Market analysis and trends',
    component: 'HealthcareMarketWidget',
    icon: 'Heart',
    category: 'insights',
    size: 'large',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 11
  },
  {
    id: 'nation-pulse',
    title: 'Nation Pulse',
    description: 'Country-specific healthcare indicators and investment climate',
    component: 'NationPulseWidget',
    icon: 'Radio',
    category: 'insights',
    size: 'large',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 12
  },
  {
    id: 'interactive-map',
    title: 'Interactive Map',
    description: 'Geographic visualization of healthcare investments',
    component: 'InteractiveMap',
    icon: 'MapPin',
    category: 'insights',
    size: 'large',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 13
  },
  {
    id: 'startup-dashboard',
    title: 'Startup Dashboard',
    description: 'Startup-specific metrics and insights',
    component: 'StartupDashboard',
    icon: 'Rocket',
    category: 'overview',
    size: 'full',
    configurable: true,
    refreshable: true,
    exportable: true,
    default_position: 14,
    required_roles: ['startup']
  },
  {
    id: 'blog-ad-slots',
    title: 'Blog & Content',
    description: 'Blog posts and content management',
    component: 'BlogAdSlots',
    icon: 'FileText',
    category: 'actions',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: false,
    default_position: 15,
    required_roles: ['blog_admin', 'content_editor']
  },
  {
    id: 'consulting-scheduler',
    title: 'Consulting Scheduler',
    description: 'Schedule and manage consulting sessions',
    component: 'ConsultingScheduler',
    icon: 'Calendar',
    category: 'actions',
    size: 'medium',
    configurable: true,
    refreshable: true,
    exportable: false,
    default_position: 16,
    required_tier: 'paid'
  },
  {
    id: 'ai-chat',
    title: 'AI Assistant',
    description: 'AI-powered insights and analysis',
    component: 'AIChatWidget',
    icon: 'Bot',
    category: 'actions',
    size: 'small',
    configurable: true,
    refreshable: false,
    exportable: false,
    default_position: 17,
    required_tier: 'paid'
  }
];

export const DEFAULT_MODULES_BY_ROLE: Record<string, string[]> = {
  startup: [
    'dashboard', 'kpi-overview', 'startup-dashboard', 'recent-deals', 
    'monthly-dealflow', 'sector-treemap', 'most-active-investors'
  ],
  investors_finance: [
    'dashboard', 'kpi-overview', 'recent-deals', 'monthly-dealflow', 
    'sector-treemap', 'regional-trends', 'deals-by-stage', 'deals-by-sector',
    'vc-investment-timeline', 'most-active-investors', 'healthcare-market'
  ],
  industry_executives: [
    'dashboard', 'kpi-overview', 'recent-deals', 'monthly-dealflow', 
    'sector-treemap', 'regional-trends', 'healthcare-market', 'nation-pulse'
  ],
  health_science_experts: [
    'dashboard', 'kpi-overview', 'recent-deals', 'monthly-grants', 
    'sector-treemap', 'healthcare-market', 'nation-pulse', 'interactive-map'
  ],
  media_advisors: [
    'dashboard', 'kpi-overview', 'recent-deals', 'blog-ad-slots', 
    'monthly-dealflow', 'sector-treemap', 'healthcare-market'
  ]
};

export const MODULE_CATEGORIES = {
  analytics: 'Analytics & Charts',
  monitoring: 'Monitoring & Tracking',
  insights: 'Insights & Intelligence',
  actions: 'Actions & Tools',
  overview: 'Overview & Navigation'
};

export const MODULE_SIZES = {
  small: 'Small (1/4 width)',
  medium: 'Medium (1/2 width)',
  large: 'Large (3/4 width)',
  full: 'Full Width'
}; 