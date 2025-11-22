import React, { useMemo, useState } from 'react';
import AfricaMap from '../components/AfricaMap';

interface MIndexPageProps {
  onBack: () => void;
}

type GlossaryItem = { term: string; def: string; category: string };

// Static key terms data - directly embedded in the page
const STATIC_KEY_TERMS: GlossaryItem[] = [
  // Funding & Investment Terms
  { term: 'Seed Round', def: 'Initial equity funding to validate product-market fit and develop a minimum viable product (MVP).', category: 'Funding & Investment' },
  { term: 'Series A', def: 'Institutional round to scale go-to-market and operations, typically after product-market fit is established.', category: 'Funding & Investment' },
  { term: 'Grant', def: 'Non-dilutive capital often from public or philanthropic sources, typically for research, development, or social impact initiatives.', category: 'Funding & Investment' },
  { term: 'DFI', def: 'Development Finance Institution investing with impact mandates, focusing on sustainable development in emerging markets.', category: 'Funding & Investment' },
  { term: 'Ticket Size', def: 'Amount an investor typically deploys per deal, varying by investor type and stage of company.', category: 'Funding & Investment' },
  { term: 'RFA/RFP', def: 'Request for Applications/Proposals for grants or contracts, outlining requirements and evaluation criteria.', category: 'Funding & Investment' },
  { term: 'Venture Capital', def: 'Private equity financing provided to early-stage, high-potential companies with growth potential.', category: 'Funding & Investment' },
  { term: 'Angel Investor', def: 'Individual who provides capital for startups, often in exchange for convertible debt or ownership equity.', category: 'Funding & Investment' },
  { term: 'Equity Financing', def: 'Raising capital through the sale of shares in the company, diluting ownership but providing growth capital.', category: 'Funding & Investment' },
  { term: 'Debt Financing', def: 'Raising capital through loans that must be repaid with interest, without diluting ownership.', category: 'Funding & Investment' },

  // Regulation Terms
  { term: 'Market Authorization', def: 'Regulatory approval to commercialize a medical product, device, or pharmaceutical in a specific market.', category: 'Regulation' },
  { term: 'NMRA', def: 'National Medicines Regulatory Authority (e.g., NAFDAC in Nigeria, SAHPRA in South Africa) responsible for drug approval and oversight.', category: 'Regulation' },
  { term: 'Import Permit', def: 'Authorization to import medicines, medical devices, or healthcare products into a country.', category: 'Regulation' },
  { term: 'Pharmacovigilance', def: 'Monitoring safety of medicines and reporting adverse events to ensure patient safety post-market approval.', category: 'Regulation' },
  { term: 'Good Manufacturing Practice (GMP)', def: 'Quality standards ensuring pharmaceutical products are consistently produced and controlled according to quality standards.', category: 'Regulation' },
  { term: 'Clinical Trial Authorization', def: 'Regulatory approval required to conduct clinical trials involving human subjects.', category: 'Regulation' },
  { term: 'Medical Device Registration', def: 'Process of registering medical devices with regulatory authorities before market entry.', category: 'Regulation' },
  { term: 'Regulatory Compliance', def: 'Adherence to laws, regulations, guidelines, and specifications relevant to healthcare products and services.', category: 'Regulation' },

  // Clinical Terms
  { term: 'Principal Investigator (PI)', def: 'Lead researcher responsible for a clinical trial site, overseeing study conduct and participant safety.', category: 'Clinical' },
  { term: 'IRB/Ethics', def: 'Institutional Review Board or Ethics Committee that reviews and approves research protocols for ethical compliance.', category: 'Clinical' },
  { term: 'Phase III Trial', def: 'Large-scale efficacy study prior to market approval, typically involving hundreds to thousands of participants.', category: 'Clinical' },
  { term: 'Informed Consent', def: 'Process ensuring participants understand the risks and benefits of a clinical trial before participation.', category: 'Clinical' },
  { term: 'Protocol', def: 'Detailed plan for conducting a clinical trial, including objectives, methodology, and statistical considerations.', category: 'Clinical' },
  { term: 'Adverse Event', def: 'Any untoward medical occurrence in a patient or clinical trial subject, whether related to treatment or not.', category: 'Clinical' },
  { term: 'Randomized Controlled Trial (RCT)', def: 'Study design where participants are randomly assigned to treatment or control groups.', category: 'Clinical' },
  { term: 'Endpoints', def: 'Measurable outcomes used to evaluate the effectiveness of a treatment in a clinical trial.', category: 'Clinical' },

  // Market & Health System Terms
  { term: 'Task-Shifting', def: 'Delegating clinical tasks to less specialized healthcare workers to address workforce shortages.', category: 'Market & Health System' },
  { term: 'Last-Mile Distribution', def: 'Logistics covering remote or underserved areas, ensuring healthcare products reach end users.', category: 'Market & Health System' },
  { term: 'Reimbursement', def: 'How healthcare providers are paid—through cash, insurance, or public health schemes.', category: 'Market & Health System' },
  { term: 'Universal Health Coverage (UHC)', def: 'System ensuring all people have access to quality health services without financial hardship.', category: 'Market & Health System' },
  { term: 'Health Insurance', def: 'Financial protection mechanism covering medical expenses, reducing out-of-pocket payments.', category: 'Market & Health System' },
  { term: 'Telemedicine', def: 'Remote delivery of healthcare services using telecommunications technology.', category: 'Market & Health System' },
  { term: 'Supply Chain', def: 'Network of organizations, people, activities, and resources involved in delivering healthcare products.', category: 'Market & Health System' },
  { term: 'Health Information System', def: 'Integrated system for collecting, storing, and managing health data and information.', category: 'Market & Health System' },

  // Technical Terms
  { term: 'Electronic Health Record (EHR)', def: 'Digital version of a patient\'s paper chart, containing medical history and treatment information.', category: 'Technical' },
  { term: 'mHealth', def: 'Mobile health technologies using mobile devices for healthcare delivery and health information.', category: 'Technical' },
  { term: 'AI Diagnostics', def: 'Artificial intelligence systems used for medical diagnosis, image analysis, and decision support.', category: 'Technical' },
  { term: 'Blockchain', def: 'Distributed ledger technology for secure, transparent health data management and supply chain tracking.', category: 'Technical' },
  { term: 'Interoperability', def: 'Ability of different health information systems to exchange and use data seamlessly.', category: 'Technical' },
  { term: 'API', def: 'Application Programming Interface enabling different software systems to communicate and share data.', category: 'Technical' },
  { term: 'Cloud Computing', def: 'Delivery of computing services over the internet, enabling scalable healthcare IT infrastructure.', category: 'Technical' },
  { term: 'Data Analytics', def: 'Process of examining large datasets to uncover patterns, trends, and insights for healthcare decision-making.', category: 'Technical' }
];

const MIndexPage: React.FC<MIndexPageProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const items = STATIC_KEY_TERMS;

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category)))], [items]);

  const filtered = items.filter(i => {
    const matchCategory = category === 'All' || i.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || i.term.toLowerCase().includes(q) || i.def.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] text-[var(--color-text-primary)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]" style={{ 
        marginTop: '-100px',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        left: '50%',
        right: '50%',
        width: '100vw',
        paddingTop: '120px',
        paddingBottom: '48px',
        position: 'relative',
      }}>
        <div aria-hidden className="absolute inset-0 z-0">
          <img
            src={(import.meta as any).env?.VITE_MARION_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
            className="w-full h-full object-cover blur-[2px] scale-105 opacity-90"
            style={{ filter: 'brightness(0.4) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ background: 'linear-gradient(90deg, var(--color-primary-teal) 0%, var(--color-accent-sky) 100%)' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mx-auto w-16 h-1 rounded-full bg-[var(--color-primary-teal)] mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              M-Index
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              Master the Terms. Maximize the Impact
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Africa Map */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">Interactive Africa Map</h2>
          <p className="text-[var(--color-text-secondary)]">Click on any country to view detailed information</p>
        </div>
        <AfricaMap height={600} heightSm={400} />
      </div>

      {/* Key Terms Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-3">Key Terms</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
            Browse and search key terms to help you navigate the Africa Healthcare ecosystem
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search key terms..."
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-divider-gray)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    category === c
                      ? 'bg-[var(--color-primary-teal)] text-white border-[var(--color-primary-teal)] shadow-md'
                      : 'border-[var(--color-divider-gray)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-surface)] hover:border-[var(--color-primary-teal)]/50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {filtered.length > 0 && (
            <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
              Showing {filtered.length} of {items.length} key terms
            </div>
          )}
        </div>

        {/* Key Terms Grid */}
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((i, idx) => (
                <div
                  key={`${i.term}-${idx}`}
                  className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[var(--color-primary-teal)]/50 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-xs font-semibold text-[var(--color-primary-teal)] uppercase tracking-wide px-2 py-1 bg-[var(--color-primary-teal)]/10 rounded">
                      {i.category}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-primary-teal)] transition-colors">
                    {i.term}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-4">
                    {i.def}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Can't find a term?{' '}
                  <a className="text-[var(--color-primary-teal)] hover:underline font-medium" href="/contact">
                    Contact us
                  </a>{' '}
                  to suggest additions.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No key terms found
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              {query ? `No results for "${query}"` : 'Try adjusting your search or filter'}
            </p>
            {(query || category !== 'All') && (
              <button
                onClick={() => {
                  setQuery('');
                  setCategory('All');
                }}
                className="px-4 py-2 bg-[var(--color-primary-teal)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MIndexPage;

