import React, { useMemo, useState } from 'react';

interface MIndexPageProps {
  onBack: () => void;
}

type GlossaryItem = { term: string; def: string; category: string };

const MIndexPage: React.FC<MIndexPageProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');

  const items: GlossaryItem[] = [
    // Funding & Investment
    { term: 'Seed Round', def: 'Initial equity funding to validate product-market fit.', category: 'Funding & Investment' },
    { term: 'Series A', def: 'Institutional round to scale go-to-market and operations.', category: 'Funding & Investment' },
    { term: 'Grant', def: 'Non-dilutive capital often from public or philanthropic sources.', category: 'Funding & Investment' },
    { term: 'DFI', def: 'Development Finance Institution investing with impact mandates.', category: 'Funding & Investment' },
    { term: 'Ticket Size', def: 'Amount an investor typically deploys per deal.', category: 'Funding & Investment' },
    { term: 'RFA/RFP', def: 'Request for Applications/Proposals for grants or contracts.', category: 'Funding & Investment' },

    // Regulation
    { term: 'Market Authorization', def: 'Regulatory approval to commercialize a medical product.', category: 'Regulation' },
    { term: 'NMRA', def: 'National Medicines Regulatory Authority (e.g., NAFDAC, SAHPRA).', category: 'Regulation' },
    { term: 'Import Permit', def: 'Authorization to import medicines/medical devices.', category: 'Regulation' },
    { term: 'Pharmacovigilance', def: 'Monitoring safety of medicines and reporting adverse events.', category: 'Regulation' },

    // Clinical
    { term: 'Principal Investigator (PI)', def: 'Lead researcher responsible for a clinical trial site.', category: 'Clinical' },
    { term: 'IRB/Ethics', def: 'Boards that review and approve research protocols for ethics.', category: 'Clinical' },
    { term: 'Phase III Trial', def: 'Large-scale efficacy study prior to market approval.', category: 'Clinical' },

    // Market & Health System
    { term: 'Task-Shifting', def: 'Delegating clinical tasks to less specialized workers.', category: 'Market & Health System' },
    { term: 'Last-Mile Distribution', def: 'Logistics covering remote or underserved areas.', category: 'Market & Health System' },
    { term: 'Reimbursement', def: 'How providers are paid—cash, insurance, or public schemes.', category: 'Market & Health System' },

    // Public Markets & FX
    { term: 'FX Exposure', def: 'Risk from currency fluctuations across multi-currency ops.', category: 'Public Markets & FX' },
    { term: 'Cross-Rate', def: 'Exchange rate between two currencies via a third (e.g., USD).', category: 'Public Markets & FX' },
  ];

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map(i => i.category)))], [items]);

  const filtered = items.filter(i => {
    const matchCategory = category === 'All' || i.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || i.term.toLowerCase().includes(q) || i.def.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] text-[var(--color-text-primary)]">
      {/* Hero (blog-style) */}
      <section className="relative overflow-hidden" style={{ 
        minHeight: 'min(100vh, 44vh)',
        marginTop: '-100px',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        left: '50%',
        right: '50%',
        width: '100vw',
        paddingTop: '120px',
        position: 'relative',
      }}>
        <div aria-hidden className="absolute inset-0 z-0">
          <img
            src={(import.meta as any).env?.VITE_MARION_HERO_URL || (import.meta as any).env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
            className="w-full h-full object-cover blur-[2px] md:blur-[1px] scale-105 opacity-95 saturate-125 contrast-110"
            style={{ filter: 'brightness(1.1) saturate(1.06)' }}
          />
          <div className="absolute inset-0 bg-black/5 md:bg-black/0" />
          <div className="absolute inset-0 opacity-15 mix-blend-multiply" style={{ background: 'linear-gradient(90deg, var(--color-primary-teal) 0%, var(--color-accent-sky) 100%)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.00) 70%, var(--color-background-default) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:pt-20 pb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">m‑index</h1>
          <p className="text-lg md:text-xl text-[var(--color-text-primary)] opacity-90 dark:text-white/85">
            Key terms to help you navigate the African healthcare ecosystem.
          </p>
          <div className="mt-6 max-w-2xl mx-auto">
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="Search terms..."
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-divider-gray)] bg-white/90 text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-transparent"
            />
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {categories.map(c => (
                <button key={c}
                  onClick={()=>setCategory(c)}
                  className={`px-3 py-1.5 rounded-full border ${category===c ? 'bg-[var(--color-primary-teal)] text-white border-[var(--color-primary-teal)]' : 'border-[var(--color-divider-gray)] text-[var(--color-text-primary)] hover:bg-black/5'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Glossary content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i, idx) => (
            <div key={`${i.term}-${idx}`} className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl p-4 shadow-sm">
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">{i.category}</div>
              <div className="font-semibold">{i.term}</div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1">{i.def}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-sm text-[var(--color-text-secondary)]">
          Can’t find a term? <a className="text-[var(--color-primary-teal)] hover:underline" href="/contact">Contact us</a> to suggest additions.
        </div>
      </div>
    </div>
  );
}

export default MIndexPage;

