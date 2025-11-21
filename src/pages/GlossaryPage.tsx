import React, { useState, useEffect } from 'react';

const GlossaryPage: React.FC = () => {
  const [tab, setTab] = useState<'funding' | 'regulation' | 'clinical' | 'business' | 'technical'>('funding');
  const [terms, setTerms] = useState<Array<{ term: string; def: string; category?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlossaryTerms = async () => {
      try {
        setLoading(true);
        setError(null);
        // Map tab to category
        const categoryMap: Record<string, string> = {
          'funding': 'funding',
          'regulation': 'regulation',
          'clinical': 'clinical',
          'business': 'business',
          'technical': 'technical'
        };
        const category = categoryMap[tab] || 'funding';
        
        const response = await fetch(`/api/admin/glossary?category=${category}&limit=100`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setTerms(data.data.map((item: any) => ({
            term: item.term,
            def: item.definition,
            category: item.category
          })));
        } else {
          setTerms([]);
        }
      } catch (err: any) {
        console.error('Error fetching glossary terms:', err);
        setError('Failed to load glossary terms');
        setTerms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGlossaryTerms();
  }, [tab]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary">Glossary</h1>
        <p className="text-text-secondary">Key terms to help you navigate funding, grants, and regulation.</p>
      </div>
      <div className="bg-background-surface p-4 rounded-lg border border-divider">
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setTab('funding')} className={`px-3 py-2 rounded-lg border ${tab==='funding'?'bg-primary-600 text-white border-primary-700':'bg-background text-text-primary border-divider'}`}>Funding & Grants</button>
          <button onClick={()=>setTab('regulation')} className={`px-3 py-2 rounded-lg border ${tab==='regulation'?'bg-primary-600 text-white border-primary-700':'bg-background text-text-primary border-divider'}`}>Regulation</button>
          <button onClick={()=>setTab('clinical')} className={`px-3 py-2 rounded-lg border ${tab==='clinical'?'bg-primary-600 text-white border-primary-700':'bg-background text-text-primary border-divider'}`}>Clinical</button>
          <button onClick={()=>setTab('business')} className={`px-3 py-2 rounded-lg border ${tab==='business'?'bg-primary-600 text-white border-primary-700':'bg-background text-text-primary border-divider'}`}>Business</button>
          <button onClick={()=>setTab('technical')} className={`px-3 py-2 rounded-lg border ${tab==='technical'?'bg-primary-600 text-white border-primary-700':'bg-background text-text-primary border-divider'}`}>Technical</button>
        </div>
      </div>
      <div className="bg-background-surface p-4 rounded-lg border border-divider">
        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading glossary terms...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
        ) : terms.length > 0 ? (
          <ul className="space-y-3">
            {terms.map((t, idx)=> (
              <li key={idx} className="p-3 border border-divider rounded-lg">
                <div className="font-semibold text-text-primary">{t.term}</div>
                <div className="text-sm text-text-secondary mt-1">{t.def}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-text-secondary">No glossary terms found for this category</div>
        )}
      </div>
    </div>
  );
};

export default GlossaryPage;
