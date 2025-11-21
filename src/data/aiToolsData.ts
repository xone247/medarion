export interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'analysis' | 'prediction' | 'automation' | 'insights' | 'research';
  features: string[];
  useCases: string[];
  requiredTier: 'free' | 'paid' | 'enterprise' | 'academic';
  status: 'active' | 'beta' | 'coming_soon';
  apiEndpoint?: string;
  documentation: string;
  examples: Array<{
    title: string;
    description: string;
    input: string;
    output: string;
  }>;
}

export const aiToolsData: AITool[] = [
  {
    id: 'market-risk-assessment',
    name: 'Market Risk Assessment',
    description: 'AI-powered analysis of market risks for specific countries and healthcare sectors, providing risk scores and mitigation strategies.',
    icon: 'Shield',
    category: 'analysis',
    features: [
      'Country-specific risk scoring (0-100)',
      'Risk factor identification',
      'Mitigation strategy recommendations',
      'Historical risk trend analysis',
      'Comparative risk assessment'
    ],
    useCases: [
      'Market entry planning',
      'Investment due diligence',
      'Regulatory compliance assessment',
      'Geographic expansion strategy'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/market-risk-assessment',
    examples: [
      {
        title: 'Kenya Healthcare Market Risk',
        description: 'Assess market risks for entering the Kenyan healthcare market',
        input: 'Country: Kenya, Sector: Telemedicine',
        output: 'Risk Score: 62/100\nKey Factors: Regulatory environment, Infrastructure gaps, Competitive intensity'
      }
    ]
  },
  {
    id: 'competitor-analysis',
    name: 'Competitor Intelligence',
    description: 'AI-driven competitive analysis identifying key competitors, market positioning, and competitive advantages.',
    icon: 'Users',
    category: 'analysis',
    features: [
      'Competitor identification',
      'Market positioning analysis',
      'Competitive advantage assessment',
      'SWOT analysis generation',
      'Market share estimation'
    ],
    useCases: [
      'Strategic planning',
      'Market positioning',
      'Investment analysis',
      'Partnership identification'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/competitor-analysis',
    examples: [
      {
        title: 'Telemedicine Competitors',
        description: 'Identify top competitors in the African telemedicine space',
        input: 'Sector: Telemedicine, Region: East Africa',
        output: 'Top Competitors: AfyaConnect, Zuri Health, TIBU Health\nMarket Position: Mid-tier with strong local presence'
      }
    ]
  },
  {
    id: 'valuation-benchmarking',
    name: 'Valuation Benchmarking',
    description: 'AI-powered valuation analysis comparing companies across sectors, stages, and regions for accurate benchmarking.',
    icon: 'BarChart3',
    category: 'analysis',
    features: [
      'Multi-factor valuation models',
      'Sector-specific benchmarks',
      'Stage-appropriate comparisons',
      'Regional market adjustments',
      'Valuation range estimation'
    ],
    useCases: [
      'Investment decision making',
      'Fundraising strategy',
      'M&A valuation',
      'Portfolio company assessment'
    ],
    requiredTier: 'enterprise',
    status: 'active',
    documentation: '/docs/ai-tools/valuation-benchmarking',
    examples: [
      {
        title: 'Series A Health Tech Valuation',
        description: 'Benchmark valuation for Series A health tech startup',
        input: 'Sector: Health Tech, Stage: Series A, Region: Nigeria',
        output: 'Valuation Range: $5M - $12M USD\nKey Factors: Market size, Traction, Team experience'
      }
    ]
  },
  {
    id: 'due-diligence-summary',
    name: 'Due Diligence Assistant',
    description: 'AI-powered due diligence analysis providing comprehensive company assessments and key questions for investors.',
    icon: 'FileSearch',
    category: 'analysis',
    features: [
      'Company profile analysis',
      'SWOT analysis generation',
      'Key question identification',
      'Risk factor assessment',
      'Investment recommendation'
    ],
    useCases: [
      'Investment due diligence',
      'Portfolio company monitoring',
      'Risk assessment',
      'Strategic planning'
    ],
    requiredTier: 'enterprise',
    status: 'active',
    documentation: '/docs/ai-tools/due-diligence',
    examples: [
      {
        title: 'Company Due Diligence',
        description: 'Generate comprehensive due diligence report for a health tech company',
        input: 'Company: AfyaConnect, Focus: Telemedicine platform',
        output: 'SWOT Analysis:\nStrengths: Strong local partnerships, Proven technology\nWeaknesses: Limited geographic reach\nOpportunities: Regional expansion, AI integration\nThreats: Regulatory changes, Competition'
      }
    ]
  },
  {
    id: 'trend-detection',
    name: 'Trend Detection Engine',
    description: 'AI-powered trend analysis identifying emerging healthcare trends and market opportunities across Africa.',
    icon: 'TrendingUp',
    category: 'prediction',
    features: [
      'Emerging trend identification',
      'Market opportunity analysis',
      'Trend impact assessment',
      'Timeline prediction',
      'Regional trend variations'
    ],
    useCases: [
      'Investment thesis development',
      'Product strategy planning',
      'Market research',
      'Strategic positioning'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/trend-detection',
    examples: [
      {
        title: 'Healthcare Trends 2025',
        description: 'Identify emerging healthcare trends in Africa for 2025',
        input: 'Timeframe: 2025, Focus: Digital Health',
        output: 'Key Trends:\n1. AI-powered diagnostics (+22% growth)\n2. Telemedicine expansion (+18% growth)\n3. Last-mile logistics (+12% growth)'
      }
    ]
  },
  {
    id: 'pitch-deck-analyzer',
    name: 'Pitch Deck Analyzer',
    description: 'AI-powered analysis of pitch decks providing feedback on content, structure, and investor appeal.',
    icon: 'Presentation',
    category: 'analysis',
    features: [
      'Content quality assessment',
      'Structure optimization',
      'Investor appeal scoring',
      'Feedback generation',
      'Best practice recommendations'
    ],
    useCases: [
      'Pitch deck optimization',
      'Investor preparation',
      'Content improvement',
      'Presentation training'
    ],
    requiredTier: 'paid',
    status: 'beta',
    documentation: '/docs/ai-tools/pitch-deck-analyzer',
    examples: [
      {
        title: 'Pitch Deck Review',
        description: 'Analyze and provide feedback on a startup pitch deck',
        input: 'Upload pitch deck PDF',
        output: 'Feedback:\n- Strengthen go-to-market strategy\n- Add unit economics table\n- Improve competitive positioning\n- Enhance financial projections'
      }
    ]
  },
  {
    id: 'fundraising-strategy',
    name: 'Fundraising Strategy Generator',
    description: 'AI-powered fundraising strategy development tailored to company stage, sector, and funding requirements.',
    icon: 'Target',
    category: 'automation',
    features: [
      'Customized fundraising plans',
      'Investor targeting strategies',
      'Timeline optimization',
      'Milestone planning',
      'Risk mitigation strategies'
    ],
    useCases: [
      'Fundraising planning',
      'Investor outreach',
      'Milestone setting',
      'Strategic planning'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/fundraising-strategy',
    examples: [
      {
        title: 'Series A Fundraising Strategy',
        description: 'Generate fundraising strategy for Series A health tech startup',
        input: 'Sector: Health Tech, Stage: Series A, Amount: $5M',
        output: 'Strategy:\n1. Start with specialized health tech angels\n2. Target regional funds active at Series A\n3. Prepare international fund outreach\n4. Line up strategic partnerships\n5. Close in tranches around milestones'
      }
    ]
  },
  {
    id: 'medarion-assistant',
    name: 'Medarion AI Assistant',
    description: 'General-purpose AI assistant for healthcare industry questions, market analysis, and strategic insights.',
    icon: 'Bot',
    category: 'insights',
    features: [
      'Natural language queries',
      'Healthcare industry knowledge',
      'Market analysis insights',
      'Strategic recommendations',
      'Real-time data access'
    ],
    useCases: [
      'Market research',
      'Industry insights',
      'Strategic planning',
      'Knowledge discovery'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/medarion-assistant',
    examples: [
      {
        title: 'Market Analysis Query',
        description: 'Ask questions about African healthcare markets',
        input: 'What are the key challenges for telemedicine in Nigeria?',
        output: 'Key Challenges:\n1. Regulatory complexity (NAFDAC requirements)\n2. Infrastructure gaps (internet connectivity)\n3. Digital literacy barriers\n4. Payment system limitations\n5. Competition from established players'
      }
    ]
  },
  {
    id: 'market-entry-report',
    name: 'Market Entry Report Generator',
    description: 'AI-powered market entry analysis providing comprehensive reports on opportunities and challenges for specific markets.',
    icon: 'Map',
    category: 'research',
    features: [
      'Market opportunity analysis',
      'Challenge identification',
      'Entry strategy recommendations',
      'Timeline planning',
      'Resource requirements'
    ],
    useCases: [
      'Market expansion planning',
      'Geographic strategy',
      'Investment planning',
      'Strategic decision making'
    ],
    requiredTier: 'enterprise',
    status: 'active',
    documentation: '/docs/ai-tools/market-entry-report',
    examples: [
      {
        title: 'Ghana Market Entry',
        description: 'Generate market entry report for Ghana healthcare market',
        input: 'Country: Ghana, Sector: Medical Devices',
        output: 'Opportunities:\n- Growing demand for medical devices\n- Supportive regulatory environment\n- Under-served rural markets\n\nChallenges:\n- Limited local manufacturing\n- Import dependency\n- Distribution complexity'
      }
    ]
  },
  {
    id: 'impact-report-generator',
    name: 'Impact Report Generator',
    description: 'AI-powered impact assessment generating comprehensive reports on social and health impact metrics.',
    icon: 'Heart',
    category: 'research',
    features: [
      'Impact metric calculation',
      'Social value assessment',
      'Health outcome analysis',
      'Report generation',
      'Visualization creation'
    ],
    useCases: [
      'Impact measurement',
      'Stakeholder reporting',
      'Grant applications',
      'ESG reporting'
    ],
    requiredTier: 'paid',
    status: 'beta',
    documentation: '/docs/ai-tools/impact-report-generator',
    examples: [
      {
        title: 'Health Impact Assessment',
        description: 'Generate impact report for telemedicine platform',
        input: 'Users: 50,000, Condition: Primary care access',
        output: 'Impact Metrics:\n- Estimated 17,500 meaningful engagements\n- 8-12% adherence improvement\n- 25% reduction in travel time\n- 40% cost savings for patients'
      }
    ]
  },
  {
    id: 'deal-summarizer',
    name: 'Deal Summarizer',
    description: 'AI-powered analysis summarizing investment deals and market trends with actionable insights.',
    icon: 'FileText',
    category: 'insights',
    features: [
      'Deal summary generation',
      'Trend identification',
      'Market analysis',
      'Key takeaways',
      'Actionable insights'
    ],
    useCases: [
      'Investment research',
      'Market monitoring',
      'Deal analysis',
      'Strategic planning'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/deal-summarizer',
    examples: [
      {
        title: 'Sector Deal Summary',
        description: 'Summarize recent deals in AI diagnostics sector',
        input: 'Sector: AI Diagnostics, Timeframe: Last 6 months',
        output: 'Summary:\n- Notable seed rounds in AI diagnostics\n- Growth equity in telemedicine platforms\n- Strategic acquisitions in devices\n\nTakeaway: Investor appetite remains selective but strong for traction-rich teams'
      }
    ]
  },
  {
    id: 'grant-target-suggester',
    name: 'Grant Target Suggester',
    description: 'AI-powered grant identification and targeting recommendations for healthcare organizations and startups.',
    icon: 'Award',
    category: 'research',
    features: [
      'Grant opportunity identification',
      'Eligibility assessment',
      'Application strategy',
      'Success probability',
      'Timeline optimization'
    ],
    useCases: [
      'Grant research',
      'Funding strategy',
      'Application planning',
      'Resource allocation'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/grant-target-suggester',
    examples: [
      {
        title: 'Health Tech Grants',
        description: 'Suggest grant targets for health tech startup',
        input: 'Sector: Health Tech, Country: Kenya, Type: Innovation',
        output: 'Suggested Grants:\n1. Global Health Innovation Fund (Kenya)\n2. Digital Health Catalyst (Health Tech)\n3. Impact Acceleration (Innovation)\n4. Kenya Innovation Fund\n5. African Development Bank Health Grant'
      }
    ]
  },
  {
    id: 'investor-matcher',
    name: 'Investor Matching Engine',
    description: 'AI-powered investor matching based on company profile, sector, stage, and investment criteria.',
    icon: 'Handshake',
    category: 'automation',
    features: [
      'Investor profile matching',
      'Sector alignment analysis',
      'Stage appropriateness',
      'Geographic fit',
      'Investment history analysis'
    ],
    useCases: [
      'Investor targeting',
      'Fundraising strategy',
      'Partnership identification',
      'Network building'
    ],
    requiredTier: 'enterprise',
    status: 'active',
    documentation: '/docs/ai-tools/investor-matcher',
    examples: [
      {
        title: 'Investor Matching',
        description: 'Find investors that match company profile',
        input: 'Sector: Health Tech, Stage: Seed, Country: Nigeria',
        output: 'Top Matches:\n1. Launch Africa (Seed focus, Health Tech active)\n2. Pan-African Health Ventures (Healthcare specialist)\n3. Savannah Capital (Nigeria presence)\n4. TLcom Capital (Tech focus)\n5. Future Africa (Early stage)'
      }
    ]
  },
  {
    id: 'email-drafter',
    name: 'Email Drafter',
    description: 'AI-powered email drafting for investor outreach, partnership proposals, and business communications.',
    icon: 'Mail',
    category: 'automation',
    features: [
      'Customized email generation',
      'Tone and style adjustment',
      'Key message highlighting',
      'Call-to-action optimization',
      'Professional formatting'
    ],
    useCases: [
      'Investor outreach',
      'Partnership proposals',
      'Business development',
      'Professional communication'
    ],
    requiredTier: 'paid',
    status: 'active',
    documentation: '/docs/ai-tools/email-drafter',
    examples: [
      {
        title: 'Investor Introduction',
        description: 'Draft introduction email to potential investor',
        input: 'Investor: Savannah Capital, Company: HealthTech Solutions, Sector: Telemedicine, Stage: Seed',
        output: 'Subject: HealthTech Solutions - Seed Stage Telemedicine Platform\n\nHi [Name],\n\nWe are HealthTech Solutions, building a telemedicine platform for underserved African markets (Seed stage). We are seeing strong early traction and would value a short intro call to explore fit.\n\nBest regards,\n[Your Name]'
      }
    ]
  }
];

export const aiToolCategories = {
  analysis: 'Analysis & Assessment',
  prediction: 'Prediction & Forecasting',
  automation: 'Automation & Workflow',
  insights: 'Insights & Intelligence',
  research: 'Research & Discovery'
};

export const aiToolTiers = {
  free: 'Free',
  paid: 'Paid',
  enterprise: 'Enterprise',
  academic: 'Academic'
}; 