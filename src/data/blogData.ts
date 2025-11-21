export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  author_avatar: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  image: string;
  featured: boolean;
  views: number;
  likes: number;
  comments: number;
  status: 'published' | 'draft' | 'archived';
}

export const defaultBlog: BlogPost[] = [
  {
    id: 1,
    title: "The Rise of Digital Health in Africa: Opportunities and Challenges",
    excerpt: "Exploring the rapid growth of digital health solutions across the African continent and the unique challenges faced by healthcare innovators.",
    content: `
      <h2>The Digital Health Revolution in Africa</h2>
      <p>Africa is experiencing a digital health revolution, with innovative solutions emerging across the continent to address critical healthcare challenges. From telemedicine platforms to AI-powered diagnostics, African health tech startups are leading the charge in transforming healthcare delivery.</p>
      
      <h3>Key Growth Drivers</h3>
      <ul>
        <li>High mobile phone penetration (over 80% in most countries)</li>
        <li>Growing internet connectivity and 4G/5G networks</li>
        <li>Young, tech-savvy population</li>
        <li>Significant healthcare gaps creating market opportunities</li>
        <li>Supportive government policies and regulatory frameworks</li>
      </ul>
      
      <h3>Major Challenges</h3>
      <p>Despite the opportunities, digital health innovators face several challenges:</p>
      <ul>
        <li>Regulatory complexity across different countries</li>
        <li>Limited healthcare infrastructure in rural areas</li>
        <li>Data privacy and security concerns</li>
        <li>Funding gaps for early-stage companies</li>
        <li>Digital literacy barriers among older populations</li>
      </ul>
      
      <h3>Success Stories</h3>
      <p>Companies like mPharma, 54gene, and AfyaConnect are demonstrating that African digital health solutions can scale successfully and attract significant investment. These success stories are inspiring a new generation of entrepreneurs and investors.</p>
      
      <h3>Future Outlook</h3>
      <p>The future of digital health in Africa looks promising, with increasing investment, improving infrastructure, and growing acceptance among healthcare providers and patients. The continent is well-positioned to become a global leader in innovative healthcare solutions.</p>
    `,
    author: "Dr. Sarah Okafor",
    author_avatar: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center",
    date: "2025-01-15",
    category: "Digital Health",
    tags: ["Digital Health", "Africa", "Healthcare Innovation", "Telemedicine", "Startups"],
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=center",
    featured: true,
    views: 2847,
    likes: 156,
    comments: 23,
    status: 'published'
  },
  {
    id: 2,
    title: "Investment Trends in African Healthcare: 2024 Analysis",
    excerpt: "A comprehensive analysis of healthcare investment trends across Africa, including deal flow, sector distribution, and investor sentiment.",
    content: `
      <h2>Healthcare Investment Landscape in Africa</h2>
      <p>2024 was a transformative year for healthcare investments in Africa, with record-breaking deal values and increasing interest from both local and international investors. The sector attracted over $2.5 billion in investments across various stages.</p>
      
      <h3>Deal Flow Analysis</h3>
      <p>Total deal count increased by 35% compared to 2023, with significant growth in Series A and B rounds. Early-stage investments (Seed and Pre-Seed) also saw strong activity, indicating a healthy pipeline of innovative companies.</p>
      
      <h3>Sector Distribution</h3>
      <ul>
        <li><strong>Telemedicine:</strong> 30% of total investments</li>
        <li><strong>Pharma Supply Chain:</strong> 25% of total investments</li>
        <li><strong>AI Diagnostics:</strong> 20% of total investments</li>
        <li><strong>Medical Devices:</strong> 15% of total investments</li>
        <li><strong>Other:</strong> 10% of total investments</li>
      </ul>
      
      <h3>Geographic Trends</h3>
      <p>Nigeria and Kenya continued to lead in healthcare investments, followed by South Africa and Ghana. Emerging markets like Rwanda and Ethiopia showed promising growth potential.</p>
      
      <h3>Investor Profile</h3>
      <p>Local African investors are increasingly active, while international investors are showing growing confidence in the region. Strategic investors from pharmaceutical and technology companies are also entering the market.</p>
    `,
    author: "James Mwangi",
    author_avatar: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center",
    date: "2025-01-10",
    category: "Investment",
    tags: ["Investment", "Healthcare", "Africa", "Venture Capital", "Market Analysis"],
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=center",
    featured: true,
    views: 2156,
    likes: 89,
    comments: 15,
    status: 'published'
  },
  {
    id: 3,
    title: "Regulatory Pathways for Medical Devices in Africa",
    excerpt: "Understanding the regulatory landscape for medical devices across different African countries and strategies for successful market entry.",
    content: `
      <h2>Medical Device Regulation in Africa</h2>
      <p>Regulatory pathways for medical devices vary significantly across African countries, presenting both challenges and opportunities for manufacturers and distributors. Understanding these differences is crucial for successful market entry.</p>
      
      <h3>Key Regulatory Bodies</h3>
      <ul>
        <li><strong>NAFDAC (Nigeria):</strong> Comprehensive device regulation</li>
        <li><strong>SAHPRA (South Africa):</strong> Advanced regulatory framework</li>
        <li><strong>KPPB (Kenya):</strong> Growing regulatory capacity</li>
        <li><strong>GHA-FDA (Ghana):</strong> Streamlined approval process</li>
      </ul>
      
      <h3>Common Requirements</h3>
      <p>Most African regulatory bodies require:</p>
      <ul>
        <li>Technical documentation and specifications</li>
        <li>Quality management system certification</li>
        <li>Clinical evidence and safety data</li>
        <li>Local representative or distributor</li>
        <li>Post-market surveillance plans</li>
      </ul>
      
      <h3>Harmonization Efforts</h3>
      <p>Regional economic communities are working towards regulatory harmonization, which could significantly reduce barriers to market entry and improve patient access to innovative medical devices.</p>
    `,
    author: "Dr. Kwame Asante",
    author_avatar: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center",
    date: "2025-01-05",
    category: "Regulatory",
    tags: ["Regulatory", "Medical Devices", "Africa", "Market Entry", "Compliance"],
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 1892,
    likes: 67,
    comments: 12,
    status: 'published'
  },
  {
    id: 4,
    title: "AI in African Healthcare: Current Applications and Future Potential",
    excerpt: "Exploring how artificial intelligence is transforming healthcare delivery in Africa and the opportunities for further innovation.",
    content: `
      <h2>AI Revolution in African Healthcare</h2>
      <p>Artificial intelligence is rapidly transforming healthcare delivery across Africa, offering solutions to some of the continent's most pressing health challenges. From diagnostic imaging to predictive analytics, AI applications are showing remarkable results.</p>
      
      <h3>Current Applications</h3>
      <ul>
        <li><strong>Diagnostic Imaging:</strong> AI-powered analysis of X-rays, CT scans, and MRIs</li>
        <li><strong>Predictive Analytics:</strong> Disease outbreak prediction and resource planning</li>
        <li><strong>Telemedicine:</strong> AI-assisted patient triage and consultation</li>
        <li><strong>Drug Discovery:</strong> Accelerated pharmaceutical research</li>
      </ul>
      
      <h3>Success Stories</h3>
      <p>Companies like 54gene and DiagnosTech are leveraging AI to improve diagnostic accuracy and reduce healthcare costs. These innovations are particularly valuable in resource-limited settings where specialist expertise is scarce.</p>
      
      <h3>Future Opportunities</h3>
      <p>The potential for AI in African healthcare is enormous, with opportunities in personalized medicine, population health management, and healthcare infrastructure optimization. Local AI talent development will be crucial for sustainable growth.</p>
    `,
    author: "Fatima Al-Rashid",
    author_avatar: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center",
    date: "2024-12-28",
    category: "Technology",
    tags: ["AI", "Healthcare", "Technology", "Innovation", "Diagnostics"],
    readTime: "9 min read",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=center",
    featured: true,
    views: 3245,
    likes: 178,
    comments: 31,
    status: 'published'
  },
  {
    id: 5,
    title: "Building Sustainable Healthcare Ecosystems in Africa",
    excerpt: "Strategies for creating sustainable healthcare ecosystems that can support long-term growth and innovation across the continent.",
    content: `
      <h2>Sustainable Healthcare Ecosystems</h2>
      <p>Building sustainable healthcare ecosystems in Africa requires a comprehensive approach that addresses infrastructure, talent, funding, and regulatory challenges. Success depends on collaboration between multiple stakeholders.</p>
      
      <h3>Key Components</h3>
      <ul>
        <li><strong>Infrastructure Development:</strong> Digital and physical healthcare infrastructure</li>
        <li><strong>Talent Development:</strong> Training and retaining healthcare professionals</li>
        <li><strong>Funding Mechanisms:</strong> Sustainable financing models</li>
        <li><strong>Regulatory Framework:</strong> Clear and supportive policies</li>
        <li><strong>Partnerships:</strong> Public-private collaborations</li>
      </ul>
      
      <h3>Role of Technology</h3>
      <p>Technology plays a crucial role in creating sustainable healthcare ecosystems, enabling efficient resource allocation, improved patient outcomes, and better data-driven decision making.</p>
      
      <h3>Success Factors</h3>
      <p>Successful healthcare ecosystems require strong leadership, community engagement, and a long-term vision. Countries like Rwanda and Ghana are leading the way with innovative approaches.</p>
    `,
    author: "Dr. Amina Hassan",
    author_avatar: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=50&h=50&fit=crop&crop=center",
    date: "2024-12-20",
    category: "Healthcare Systems",
    tags: ["Healthcare Systems", "Sustainability", "Ecosystems", "Innovation", "Policy"],
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 1567,
    likes: 45,
    comments: 8,
    status: 'published'
  },
  // Additional posts for a fuller blog experience
  {
    id: 6,
    title: "Telemedicine Scaling Playbook for West Africa",
    excerpt: "Operational best practices for scaling telemedicine across multilingual and multi-country contexts in West Africa.",
    content: `<p>From provider onboarding to billing rails and regulatory clearances, this playbook covers practical steps to scale.</p>`,
    author: "Kofi Mensah",
    author_avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=50&h=50&fit=crop&crop=center",
    date: "2024-12-12",
    category: "Telemedicine",
    tags: ["Telemedicine","Operations","Playbook"],
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1584987336928-9d3c0774d5bd?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 987,
    likes: 21,
    comments: 4,
    status: 'published'
  },
  {
    id: 7,
    title: "Funding the Maternal Health Innovation Gap",
    excerpt: "Where capital is most needed to bend the maternal mortality curve in Africa.",
    content: `<p>Targeting antenatal care innovations and last-mile logistics unlocks outsized impact.</p>`,
    author: "Adaeze Nwosu",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=center",
    date: "2024-12-08",
    category: "Maternal Health",
    tags: ["Maternal Health","Funding","Impact"],
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1576765608619-0aa3c90b6b07?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 764,
    likes: 18,
    comments: 3,
    status: 'published'
  },
  {
    id: 8,
    title: "Data Interoperability: The Next Frontier",
    excerpt: "Why FHIR and open standards matter for African health systems.",
    content: `<p>Interoperability reduces duplication, improves continuity of care, and enables population health management.</p>`,
    author: "Samuel Njoroge",
    author_avatar: "https://images.unsplash.com/photo-1544725121-2826b2d4edb4?w=50&h=50&fit=crop&crop=center",
    date: "2024-12-02",
    category: "Technology",
    tags: ["Interoperability","FHIR","Data"],
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 1342,
    likes: 32,
    comments: 6,
    status: 'published'
  },
  {
    id: 9,
    title: "Public-Private Partnerships in Health: Case Studies",
    excerpt: "What successful PPPs in East and Southern Africa teach about execution.",
    content: `<p>From diagnostics networks to primary care franchises, we analyze structure and outcomes.</p>`,
    author: "Zanele Dlamini",
    author_avatar: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=50&h=50&fit=crop&crop=center",
    date: "2024-11-29",
    category: "Healthcare Systems",
    tags: ["PPP","Case Study","Systems"],
    readTime: "9 min read",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 1104,
    likes: 25,
    comments: 5,
    status: 'published'
  },
  {
    id: 10,
    title: "HealthTech Valuations: A Practical Guide",
    excerpt: "Frameworks investors use to value African healthtech startups.",
    content: `<p>We cover revenue multiples, cohort retention, and regulatory risk adjustments.</p>`,
    author: "Lebo Mokoena",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=center",
    date: "2024-11-24",
    category: "Investment",
    tags: ["Valuation","Investment","Startups"],
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 1765,
    likes: 41,
    comments: 7,
    status: 'published'
  },
  {
    id: 11,
    title: "Cold Chain Logistics for Vaccines",
    excerpt: "Designing resilient, low-cost cold chain for the last mile.",
    content: `<p>Solar direct-drive fridges and IoT monitoring transform reliability and cost.</p>`,
    author: "Yared Bekele",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=center",
    date: "2024-11-18",
    category: "Supply Chain",
    tags: ["Vaccines","Cold Chain","Logistics"],
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1576678927484-cc9079570883?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 902,
    likes: 17,
    comments: 2,
    status: 'published'
  },
  {
    id: 12,
    title: "Designing for Low-Bandwidth Healthcare Apps",
    excerpt: "Product tips for reliability under constrained networks.",
    content: `<p>Offline-first, efficient sync, and lightweight assets are key patterns.</p>`,
    author: "Ngozi Umeh",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=center",
    date: "2024-11-12",
    category: "Technology",
    tags: ["Product","Low Bandwidth","UX"],
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop&crop=center",
    featured: false,
    views: 1432,
    likes: 29,
    comments: 3,
    status: 'published'
  }
];

export const blogCategories = [
  "Digital Health",
  "Investment", 
  "Regulatory",
  "Technology",
  "Healthcare Systems",
  "Innovation",
  "Market Analysis",
  "Startups",
  "Maternal Health",
  "Telemedicine",
  "Supply Chain"
];

export const blogTags = [
  "Digital Health",
  "Africa",
  "Healthcare Innovation",
  "Telemedicine",
  "Startups",
  "Investment",
  "Venture Capital",
  "Market Analysis",
  "Regulatory",
  "Medical Devices",
  "Market Entry",
  "Compliance",
  "AI",
  "Technology",
  "Diagnostics",
  "Healthcare Systems",
  "Sustainability",
  "Ecosystems",
  "Policy",
  "Maternal Health",
  "Interoperability",
  "Data",
  "PPP",
  "Valuation",
  "Vaccines",
  "Cold Chain",
  "Logistics",
  "Product",
  "Low Bandwidth",
  "UX"
]; 