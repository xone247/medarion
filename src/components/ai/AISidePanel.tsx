import React, { useState } from 'react';
import { X, Gauge, LineChart, FileText, Lightbulb } from 'lucide-react';
import { assessMarketRisk, benchmarkValuation, generateDueDiligenceSummary, detectTrends } from '../../services/ai';

interface AISidePanelProps {
  open: boolean;
  onClose: () => void;
  context: {
    country?: string;
    sector?: string;
    stage?: string;
    companyId?: string;
  };
}

const AISidePanel: React.FC<AISidePanelProps> = ({ open, onClose, context }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const run = async (task: 'risk' | 'valuation' | 'dd' | 'trends') => {
    try {
      setLoading(task);
      if (task === 'risk') setResult(await assessMarketRisk({ country: context.country || 'Kenya', companyId: context.companyId }));
      if (task === 'valuation') setResult(await benchmarkValuation({ sector: context.sector || 'Health Tech', stage: context.stage || 'Seed' }));
      if (task === 'dd') setResult(await generateDueDiligenceSummary({ companyId: context.companyId || 'COMPANY' }));
      if (task === 'trends') setResult(await detectTrends({ timeframe: '12m' }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-[22rem] sm:w-[26rem] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="font-semibold text-gray-900 dark:text-white">AI Assistant</div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <button onClick={() => run('risk')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="flex items-center space-x-2 text-gray-900 dark:text-white"><Gauge className="h-4 w-4 text-[var(--color-primary-teal)]" /> <span>Assess market risk</span></span>
          {loading === 'risk' && <span className="text-xs text-gray-500">Running…</span>}
        </button>
        <button onClick={() => run('valuation')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="flex items-center space-x-2 text-gray-900 dark:text-white"><LineChart className="h-4 w-4 text-[var(--color-primary-teal)]" /> <span>Benchmark valuation</span></span>
          {loading === 'valuation' && <span className="text-xs text-gray-500">Running…</span>}
        </button>
        <button onClick={() => run('dd')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="flex items-center space-x-2 text-gray-900 dark:text-white"><FileText className="h-4 w-4 text-[var(--color-primary-teal)]" /> <span>Due diligence summary</span></span>
          {loading === 'dd' && <span className="text-xs text-gray-500">Running…</span>}
        </button>
        <button onClick={() => run('trends')} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="flex items-center space-x-2 text-gray-900 dark:text-white"><Lightbulb className="h-4 w-4 text-[var(--color-primary-teal)]" /> <span>Detect trends</span></span>
          {loading === 'trends' && <span className="text-xs text-gray-500">Running…</span>}
        </button>
      </div>
      <div className="px-4 pb-4">
        {result && (
          <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto text-gray-800 dark:text-gray-200">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

export default AISidePanel; 