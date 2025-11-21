export interface DemoAd {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  targetUrl: string;
  advertiser: string;
  advertiserLogo: string;
  category: 'blog_general' | 'blog_healthcare' | 'blog_investment' | 'blog_technology' | 'blog_startup' | 'sidebar' | 'dashboard';
  placements: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'scheduled';
  impressions: number;
  clicks: number;
  ctr: number;
  budget: number;
  spent: number;
  targetAudience: string[];
  tags: string[];
}

export const defaultDemoAds: DemoAd[] = [
  {
    id: 'ad-001',
    title: 'Transform Your Healthcare Startup',
    description: 'Join 500+ African health tech companies already using our platform to connect with investors and scale their operations.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Get Started Today',
    targetUrl: '/auth/signup',
    advertiser: 'Medarion Platform',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_general',
    placements: ['blog_top', 'blog_sidebar'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    impressions: 15420,
    clicks: 342,
    ctr: 2.22,
    budget: 5000,
    spent: 1234,
    targetAudience: ['startup', 'healthcare_entrepreneurs'],
    tags: ['startup', 'healthcare', 'investment', 'platform']
  },
  {
    id: 'ad-002',
    title: 'AI-Powered Healthcare Analytics',
    description: 'Leverage machine learning to gain insights into healthcare trends, investment patterns, and market opportunities across Africa.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Learn More',
    targetUrl: '/ai-tools',
    advertiser: 'Medarion AI',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_technology',
    placements: ['blog_sidebar', 'dashboard'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    impressions: 8920,
    clicks: 156,
    ctr: 1.75,
    budget: 3000,
    spent: 567,
    targetAudience: ['investors_finance', 'industry_executives', 'health_science_experts'],
    tags: ['AI', 'analytics', 'healthcare', 'machine_learning']
  },
  {
    id: 'ad-003',
    title: 'Investment Opportunities in African Healthcare',
    description: 'Discover high-growth healthcare startups and investment opportunities across the African continent. Join our network of 200+ investors.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Explore Deals',
    targetUrl: '/deals',
    advertiser: 'Medarion Investment Network',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_investment',
    placements: ['blog_top', 'sidebar'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    impressions: 12340,
    clicks: 289,
    ctr: 2.34,
    budget: 4000,
    spent: 890,
    targetAudience: ['investors_finance', 'venture_capital', 'private_equity'],
    tags: ['investment', 'healthcare', 'startups', 'africa', 'deals']
  },
  {
    id: 'ad-004',
    title: 'Regulatory Compliance Made Simple',
    description: 'Navigate complex healthcare regulations across African markets with our comprehensive compliance tools and expert guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Get Compliant',
    targetUrl: '/regulatory',
    advertiser: 'Medarion Compliance',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_healthcare',
    placements: ['blog_sidebar', 'dashboard'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    impressions: 6780,
    clicks: 134,
    ctr: 1.98,
    budget: 2500,
    spent: 445,
    targetAudience: ['startup', 'industry_executives', 'healthcare_providers'],
    tags: ['compliance', 'regulatory', 'healthcare', 'africa']
  },
  {
    id: 'ad-005',
    title: 'Premium Healthcare Market Intelligence',
    description: 'Access exclusive healthcare market reports, investment trends, and competitive analysis across African markets.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Upgrade Now',
    targetUrl: '/pricing',
    advertiser: 'Medarion Premium',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_general',
    placements: ['sidebar', 'dashboard'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    impressions: 4560,
    clicks: 98,
    ctr: 2.15,
    budget: 2000,
    spent: 234,
    targetAudience: ['enterprise', 'paid_users', 'academic'],
    tags: ['premium', 'market_intelligence', 'reports', 'analytics']
  },
  {
    id: 'ad-006',
    title: 'Healthcare Innovation Summit 2025',
    description: 'Join industry leaders, investors, and innovators at Africa\'s premier healthcare technology conference. Early bird registration now open.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Register Now',
    targetUrl: '/events/summit-2025',
    advertiser: 'Medarion Events',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_general',
    placements: ['blog_top', 'sidebar'],
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    status: 'active',
    impressions: 7890,
    clicks: 167,
    ctr: 2.12,
    budget: 3500,
    spent: 678,
    targetAudience: ['all_users'],
    tags: ['conference', 'networking', 'innovation', 'healthcare', 'africa']
  },
  {
    id: 'ad-007',
    title: 'Digital Health Accelerator Program',
    description: 'Accelerate your healthcare startup with mentorship, funding, and market access. Applications open for Q2 2025 cohort.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Apply Today',
    targetUrl: '/accelerator',
    advertiser: 'Medarion Accelerator',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_startup',
    placements: ['blog_sidebar', 'dashboard'],
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    status: 'active',
    impressions: 5670,
    clicks: 123,
    ctr: 2.17,
    budget: 2800,
    spent: 456,
    targetAudience: ['startup', 'early_stage_companies'],
    tags: ['accelerator', 'startup', 'mentorship', 'funding', 'healthcare']
  },
  {
    id: 'ad-008',
    title: 'Healthcare Investment Fund',
    description: 'Invest in the future of African healthcare. Our fund focuses on high-growth digital health, medical devices, and pharmaceutical companies.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop&crop=center',
    ctaText: 'Invest Now',
    targetUrl: '/fund',
    advertiser: 'Medarion Capital',
    advertiserLogo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center',
    category: 'blog_investment',
    placements: ['sidebar', 'dashboard'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
    impressions: 3450,
    clicks: 67,
    ctr: 1.94,
    budget: 1500,
    spent: 234,
    targetAudience: ['accredited_investors', 'institutional_investors'],
    tags: ['investment_fund', 'healthcare', 'africa', 'venture_capital']
  }
];

export const adCategories = [
  'blog_general',
  'blog_healthcare', 
  'blog_investment',
  'blog_technology',
  'blog_startup',
  'sidebar',
  'dashboard'
];

export const adPlacements = [
  'blog_top',
  'blog_sidebar',
  'sidebar',
  'dashboard',
  'social_media'
];

export const adStatuses = [
  'active',
  'paused', 
  'scheduled',
  'completed',
  'draft'
];

export const targetAudiences = [
  'all_users',
  'startup',
  'investors_finance',
  'industry_executives',
  'health_science_experts',
  'media_advisors',
  'healthcare_entrepreneurs',
  'venture_capital',
  'private_equity',
  'enterprise',
  'paid_users',
  'academic',
  'early_stage_companies',
  'accredited_investors',
  'institutional_investors'
]; 