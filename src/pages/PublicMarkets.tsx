import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Building2, DollarSign, Globe, Search, Filter, ArrowUp, ArrowDown, Sparkles, Bot, FileDown, Save, Info } from 'lucide-react';
import { askMedarion } from '../services/ai';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

type MarketsView = {
  name: string;
  q?: string;
  exchange?: string;
  currency?: string;
  tab?: string;
};

const MARKETS_VIEWS_KEY = 'medarionMarketsViews';

const PublicMarkets = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('All');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);

  const [views, setViews] = useState<MarketsView[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');

  // Currency exchange state
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [ratesSource, setRatesSource] = useState<'live' | 'db' | null>(null);
  const [ratesDate, setRatesDate] = useState<string | null>(null);
  const [convertAmount, setConvertAmount] = useState<number>(1);
  const [targetCurrency, setTargetCurrency] = useState<string>('ZAR');

  useEffect(() => {
    const fetchStocksData = async () => {
      try {
        // Use same endpoint as Data Management tab
        const response = await apiService.get('/admin/public-markets', { limit: '200' });
        if (response.success && response.data) {
          // Transform API data to match expected format
          const transformed = response.data.map((stock: any) => ({
            id: stock.id,
            name: stock.company_name,
            ticker: stock.ticker,
            exchange: stock.exchange,
            price: stock.price,
            market_cap: stock.market_cap,
            currency: stock.currency,
            sector: stock.sector,
            country: stock.country,
            last_updated: stock.last_updated,
          }));
          setStocks(transformed);
        } else {
          setStocks([]);
        }
      } catch (error) {
        console.error('Error fetching public markets data:', error);
        setStocks([]);
      }
    };
    fetchStocksData();
  }, []);

  // Load saved views
  useEffect(() => {
    try { const raw = localStorage.getItem(MARKETS_VIEWS_KEY); if (raw) setViews(JSON.parse(raw)); } catch {}
  }, []);

  // Initialize from query params
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') || '';
      const exchange = sp.get('exchange') || 'All';
      const currency = sp.get('currency') || 'USD';
      const tab = sp.get('tab') || 'overview';
      setSearchTerm(q);
      setSelectedExchange(exchange);
      setSelectedCurrency(['USD','EUR','GBP'].includes(currency) ? currency : 'USD');
      setSelectedTab(['overview','watchlist','financials','currency'].includes(tab) ? tab : 'overview');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync query params on filter/tab changes
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      searchTerm ? sp.set('q', searchTerm) : sp.delete('q');
      selectedExchange !== 'All' ? sp.set('exchange', selectedExchange) : sp.delete('exchange');
      selectedCurrency !== 'USD' ? sp.set('currency', selectedCurrency) : sp.delete('currency');
      selectedTab !== 'overview' ? sp.set('tab', selectedTab) : sp.delete('tab');
      const next = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', next);
    } catch {}
  }, [searchTerm, selectedExchange, selectedCurrency, selectedTab]);

  // Mock data for African healthcare sector indices
  const africanIndices = [
    { name: 'JSE Healthcare Index', ticker: 'JSEHC', value: '4,582.36', change: '+1.2%', changeValue: '+54.32', status: 'up' },
    { name: 'NGX Pharma Index', ticker: 'NGXPHRM', value: '1,876.45', change: '-0.8%', changeValue: '-15.21', status: 'down' },
    { name: 'EGX Healthcare', ticker: 'EGXHC', value: '3,245.78', change: '+0.5%', changeValue: '+16.12', status: 'up' },
    { name: 'BRVM Pharma', ticker: 'BRVMPH', value: '892.14', change: '-0.3%', changeValue: '-2.68', status: 'down' }
  ];
  const globalIndices = [
    { name: 'S&P 500 Healthcare', ticker: 'S5HLTH', value: '1,682.45', change: '+0.7%', changeValue: '+11.68', status: 'up' },
    { name: 'NASDAQ Biotech', ticker: 'NBI', value: '4,872.36', change: '+1.5%', changeValue: '+72.14', status: 'up' },
    { name: 'FTSE 350 Pharma', ticker: 'FTPHRM', value: '21,456.78', change: '-0.2%', changeValue: '-43.21', status: 'down' }
  ];
  const watchlistStocks = [
    { name: 'Life Healthcare Group', ticker: 'JSE:LHC', price: '22.50 ZAR', change: '+1.8%', status: 'up' },
    { name: 'Aspen Pharmacare', ticker: 'JSE:APN', price: '155.10 ZAR', change: '+0.5%', status: 'up' },
    { name: 'Netcare', ticker: 'JSE:NTC', price: '13.80 ZAR', change: '-1.2%', status: 'down' },
    { name: 'Cleopatra Hospital', ticker: 'EGX:CLHO', price: '5.30 EGP', change: '+2.1%', status: 'up' }
  ];
  const movers = {
    gainers: [
      { name: 'Cleopatra Hospital', ticker: 'EGX:CLHO', price: '5.30 EGP', change: '+2.1%' },
      { name: 'Life Healthcare', ticker: 'JSE:LHC', price: '22.50 ZAR', change: '+1.8%' },
      { name: 'Cipla Medpro SA', ticker: 'JSE:CMP', price: '11.20 ZAR', change: '+1.5%' }
    ],
    losers: [
      { name: 'GlaxoSmithKline Nigeria', ticker: 'NGX:GLAXOSMITH', price: '6.80 NGN', change: '-2.3%' },
      { name: 'Netcare', ticker: 'JSE:NTC', price: '13.80 ZAR', change: '-1.2%' },
      { name: 'Neimeth Int. Pharma', ticker: 'NGX:NEIMETH', price: '1.50 NGN', change: '-0.9%' }
    ],
    active: [
      { name: 'Aspen Pharmacare', ticker: 'JSE:APN', price: '155.10 ZAR', volume: '1.2M' },
      { name: 'Fidson Healthcare', ticker: 'NGX:FIDSON', price: '9.20 NGN', volume: '850K' },
      { name: 'Adcock Ingram', ticker: 'JSE:AIP', price: '52.40 ZAR', volume: '620K' }
    ]
  };

  const financialMetrics = useMemo(() => (stocks || []).map((stock: any) => {
    // Ensure stock has required fields and handle price format
    const priceStr = typeof stock.price === 'string' ? stock.price : String(stock.price || '0');
    const currency = stock.currency || (priceStr.includes(' ') ? priceStr.split(' ')[1] : 'USD');
    const priceNum = typeof stock.price === 'number' ? stock.price : parseFloat(priceStr.split(' ')[0] || '0');
    
    return {
      ...stock,
      companyName: stock.name || stock.company_name || 'Unknown',
      name: stock.name || stock.company_name || 'Unknown',
      price: priceStr,
      priceNum: priceNum,
      revenue: `${(Math.random() * 10 + 1).toFixed(1)}B ${currency}`,
      ebitda: `${(Math.random() * 2 + 0.5).toFixed(1)}B ${currency}`,
      pe_ratio: (Math.random() * 25 + 5).toFixed(1),
      dividend_yield: `${(Math.random() * 5 + 0.5).toFixed(2)}%`,
      debt_to_equity: (Math.random() * 1.5 + 0.2).toFixed(2),
      roe: `${(Math.random() * 20 + 5).toFixed(1)}%`
    };
  }), [stocks]);

  const filteredMetrics = financialMetrics.filter((stock: any) => {
    const companyName = stock.companyName || stock.name || stock.company_name || '';
    const ticker = stock.ticker || '';
    const matchesSearch = !searchTerm || 
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ticker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExchange = selectedExchange === 'All' || stock.exchange === selectedExchange;
    return matchesSearch && matchesExchange;
  });

  const exchanges: string[] = useMemo(() => ['All', ...Array.from(new Set((stocks as any[]).map((stock: any) => stock.exchange))) as string[]], [stocks]);

  // Build the symbols list we want rates for (defaults + currencies present in stocks)
  const requestedSymbols: string[] = useMemo(() => {
    // Prioritize African currencies
    const africanDefaults = [
      'ZAR','NGN','EGP','GHS','KES','TZS','UGX','MAD','DZD','TND','ZMW','XOF','XAF','NAD','AOA','LSL','SZL','MUR','MZN','SOS','SLL','CDF','RWF','BWP',
      'ETB','SDG','ERN','LYD','MRU','DJF','KMF','SCR','GMD','LRD','ZWL'
    ];
    // Include a few majors for reference
    const majors = ['USD','EUR','GBP'];
    const defaults = [...africanDefaults, ...majors];
    const fromStocks = Array.from(new Set(
      (stocks as any[]).map((s: any) => String(s.currency || '').toUpperCase()).filter(Boolean)
    ));
    const combined = Array.from(new Set([...defaults, ...fromStocks]));
    return combined.filter(sym => sym && sym !== selectedCurrency);
  }, [stocks, selectedCurrency]);

  // Fetch currency rates when tab/base currency changes
  useEffect(() => {
    if (selectedTab !== 'currency') return;
    setRatesLoading(true);
    setRatesError(null);
    setCurrencyRates({});
    dataService.getCurrencyRates({
      base: selectedCurrency,
      symbols: requestedSymbols.join(','),
      source: 'auto',
      max_age_hours: 24,
    }).then((res: any) => {
      const rates = (res && res.rates) ? res.rates : {};
      setCurrencyRates(rates);
      setRatesSource(res?.source ?? null);
      setRatesDate(res?.date ?? null);
      if (!rates || Object.keys(rates).length === 0) {
        setRatesError('No currency rates available.');
      }
    }).catch((e: any) => {
      setRatesError(e?.message || 'Failed to fetch currency rates.');
    }).finally(() => {
      setRatesLoading(false);
    });
  }, [selectedTab, selectedCurrency, requestedSymbols]);

  // Ensure targetCurrency is valid
  useEffect(() => {
    const keys = Object.keys(currencyRates);
    if (keys.length && !keys.includes(targetCurrency)) {
      setTargetCurrency(keys[0]);
    }
  }, [currencyRates, targetCurrency]);

  const refreshRatesLive = () => {
    setRatesLoading(true);
    setRatesError(null);
    dataService.getCurrencyRates({
      base: selectedCurrency,
      symbols: requestedSymbols.join(','),
      source: 'live',
      max_age_hours: 0,
    }).then((res: any) => {
      const rates = (res && res.rates) ? res.rates : {};
      setCurrencyRates(rates);
      setRatesSource(res?.source ?? null);
      setRatesDate(res?.date ?? null);
      if (!rates || Object.keys(rates).length === 0) {
        setRatesError('Live provider returned no rates. Try again later.');
      }
    }).catch((e: any) => {
      setRatesError(e?.message || 'Failed to refresh live rates.');
    }).finally(() => setRatesLoading(false));
  };

  const runAISummary = async () => {
    setAiLoading(true);
    const res = await askMedarion('Summarize today\'s African healthcare public markets performance with key movers and risks.');
    setAiSummary(res.answer);
    setAiLoading(false);
  };

  const exportFinancialsCSV = () => {
    try { const rows = [['Company','Ticker','MarketCap','Revenue','EBITDA','P/E','DividendYield','D/E','ROE']]; filteredMetrics.forEach((c:any)=> rows.push([c.companyName,c.ticker,c.market_cap,c.revenue,c.ebitda,c.pe_ratio,c.dividend_yield,c.debt_to_equity,c.roe])); const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='financial_metrics.csv'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };
  const exportFinancialsJSON = () => {
    try { const data = { filters: { searchTerm, selectedExchange, selectedCurrency, selectedTab }, financials: filteredMetrics, exportedAt: new Date().toISOString() }; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='financial_metrics.json'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };
  const copyFinancialsJSON = async () => {
    try { const data = { filters: { searchTerm, selectedExchange, selectedCurrency, selectedTab }, financials: filteredMetrics, exportedAt: new Date().toISOString() }; const text = JSON.stringify(data, null, 2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } alert('Copied financial metrics JSON to clipboard'); } catch {}
  };

  const saveCurrentView = () => {
    try {
      const name = prompt('Save current filters as view name:');
      if (!name) return;
      const nextViews: MarketsView[] = [
        { name, q: searchTerm || undefined, exchange: selectedExchange !== 'All' ? selectedExchange : undefined, currency: selectedCurrency !== 'USD' ? selectedCurrency : undefined, tab: selectedTab !== 'overview' ? selectedTab : undefined },
        ...views.filter(v => v.name !== name)
      ];
      setViews(nextViews);
      localStorage.setItem(MARKETS_VIEWS_KEY, JSON.stringify(nextViews));
      setSelectedView(name);
    } catch {}
  };

  const applyView = (name: string) => {
    setSelectedView(name);
    const v = views.find(v => v.name === name);
    if (!v) return;
    setSearchTerm(v.q || '');
    setSelectedExchange(v.exchange || 'All');
    setSelectedCurrency((v.currency as any) || 'USD');
    setSelectedTab(v.tab || 'overview');
  };

  const deleteView = () => {
    if (!selectedView) return;
    const next = views.filter(v => v.name !== selectedView);
    setViews(next);
    localStorage.setItem(MARKETS_VIEWS_KEY, JSON.stringify(next));
    setSelectedView('');
  };

  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier)));
  // Share disabled platform-wide for data protection

  return (
    <div className="page-container py-6 space-y-6 bg-[var(--color-background-default)] min-h-screen">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Public Markets</h1>
              <p className="text-[var(--color-text-secondary)]">Comprehensive financial data hub for African healthcare markets</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canAI && <button onClick={runAISummary} className="btn-primary-elevated btn-sm flex items-center gap-2 w-full sm:w-auto"><Bot className="h-4 w-4" /><span className="text-sm">AI Summary</span></button>}
            {canExport && (
              <>
                <button onClick={copyFinancialsJSON} className="btn-outline btn-sm w-full sm:w-auto">Copy</button>
                <button onClick={exportFinancialsJSON} className="btn-outline btn-sm w-full sm:w-auto"><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
                <button onClick={exportFinancialsCSV} className="btn-outline btn-sm w-full sm:w-auto"><FileDown className="h-4 w-4 inline mr-2"/>Export CSV</button>
              </>
            )}
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-text-primary)]">AI Summary</h3>
            {aiLoading && <span className="text-xs text-[var(--color-text-secondary)]">Updating…</span>}
          </div>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-[var(--color-text-primary)]">{aiSummary}</pre>
        </div>
      )}

      {/* Summary Stats with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Listed Companies</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stocks.length}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Healthcare Sector Indices</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{africanIndices.length}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">African markets</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Global Healthcare Indices</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{globalIndices.length}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">International benchmarks</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 icon-primary" />
            <div>
              <p className="text-[var(--color-text-secondary)] text-sm">Currency</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{selectedCurrency}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Base currency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with glassmorphism */}
      <div className="card-glass overflow-hidden shadow-soft">
        <div className="flex border-b border-[var(--color-divider-gray)] overflow-x-auto no-scrollbar">
          <button onClick={() => setSelectedTab('overview')} className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium ${selectedTab === 'overview' ? 'border-b-2 border-[var(--color-primary-teal)] text-[var(--color-primary-teal)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Market Overview</button>
          <button onClick={() => setSelectedTab('watchlist')} className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium ${selectedTab === 'watchlist' ? 'border-b-2 border-[var(--color-primary-teal)] text-[var(--color-primary-teal)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Watchlist & Movers</button>
          <button onClick={() => setSelectedTab('financials')} className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium ${selectedTab === 'financials' ? 'border-b-2 border-[var(--color-primary-teal)] text-[var(--color-primary-teal)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Financial Metrics</button>
          <button onClick={() => setSelectedTab('currency')} className={`flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-medium ${selectedTab === 'currency' ? 'border-b-2 border-[var(--color-primary-teal)] text-[var(--color-primary-teal)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>Currency Exchange</button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Market Overview */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* AI-Generated Market Summary with glassmorphism */}
              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 icon-primary" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Market Summary</h3>
                </div>
                <div className="prose dark:prose-invert max-w-none text-[var(--color-text-primary)]">
                  <p>
                    African healthcare markets showed mixed performance today, with the JSE Healthcare Index leading gains (+1.2%) 
                    driven by strong performance from Life Healthcare Group and Aspen Pharmacare. The NGX Pharma Index declined 
                    (-0.8%) amid concerns over currency volatility affecting import costs for pharmaceutical companies.
                  </p>
                  <p>
                    Key developments include Aspen Pharmacare's announcement of expanded manufacturing capacity in South Africa, 
                    and Cleopatra Hospital Group's strong Q3 results exceeding analyst expectations. Regulatory approvals for 
                    new generic medications in Nigeria and Kenya are expected to increase market competition in Q1 2025.
                  </p>
                  <p>
                    Investor sentiment remains cautiously optimistic, with particular interest in telemedicine, pharmaceutical 
                    manufacturing, and healthcare infrastructure companies across the continent.
                  </p>
                </div>
              </div>

              {/* African Healthcare Indices with glassmorphism */}
              <div className="card-glass overflow-hidden shadow-soft">
                <div className="p-6 border-b border-[var(--color-divider-gray)]">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">African Healthcare Sector Indices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-background-default)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Index</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Ticker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-divider-gray)]">
                      {africanIndices.map((index: any) => (
                        <tr key={String(index.ticker)} className="hover:bg-[var(--color-background-default)] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{index.name}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{index.ticker}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{index.value}</td>
                          <td className="px-6 py-4"><span className={`inline-flex items-center text-sm ${index.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>{index.status === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}{index.change} ({index.changeValue})</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Global Healthcare Indices with glassmorphism */}
              <div className="card-glass overflow-hidden shadow-soft">
                <div className="p-6 border-b border-[var(--color-divider-gray)]">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Global Healthcare Sector Indices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-background-default)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Index</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Ticker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-divider-gray)]">
                      {globalIndices.map((index: any) => (
                        <tr key={String(index.ticker)} className="hover:bg-[var(--color-background-default)] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{index.name}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{index.ticker}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{index.value}</td>
                          <td className="px-6 py-4"><span className={`inline-flex items-center text-sm ${index.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>{index.status === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}{index.change} ({index.changeValue})</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Watchlist & Movers */}
          {selectedTab === 'watchlist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Your Watchlist</h3>
                <button className="text-sm link hover:text-[var(--color-primary-light)]">Edit Watchlist</button>
              </div>
              <div className="card-glass overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-background-default)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Ticker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-divider-gray)]">
                      {watchlistStocks.map((stock: any) => (
                        <tr key={String(stock.ticker)} className="hover:bg-[var(--color-background-default)] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{stock.name}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">{stock.ticker}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{stock.price}</td>
                          <td className="px-6 py-4"><span className={`inline-flex items-center text-sm ${stock.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>{stock.status === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}{stock.change}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movers with glassmorphism */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gainers */}
                <div className="card-glass p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center"><ArrowUp className="h-4 w-4 text-green-500 mr-2" />Top Gainers</h4>
                  <div className="space-y-3">
                    {movers.gainers.map((stock: any, index: number) => (
                      <div key={String(stock.ticker)} className="flex justify-between items-center p-2 card-glass shadow-soft">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{stock.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[var(--color-text-primary)]">{stock.price}</p>
                          <p className="text-xs text-green-600">{stock.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                <div className="card-glass p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center"><ArrowDown className="h-4 w-4 text-red-500 mr-2" />Top Losers</h4>
                  <div className="space-y-3">
                    {movers.losers.map((stock: any, index: number) => (
                      <div key={String(stock.ticker)} className="flex justify-between items-center p-2 card-glass shadow-soft">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{stock.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[var(--color-text-primary)]">{stock.price}</p>
                          <p className="text-xs text-red-600">{stock.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Active */}
                <div className="card-glass p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center"><TrendingUp className="h-4 w-4 text-blue-500 mr-2" />Most Active</h4>
                  <div className="space-y-3">
                    {movers.active.map((stock: any, index: number) => (
                      <div key={String(stock.ticker)} className="flex justify-between items-center p-2 card-glass shadow-soft">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{stock.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[var(--color-text-primary)]">{stock.price}</p>
                          <p className="text-xs text-blue-600">Vol: {stock.volume}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Metrics */}
          {selectedTab === 'financials' && (
            <div className="space-y-6">
              {/* Filters with glassmorphism */}
              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center space-x-2 mb-4">
                  <Filter className="h-5 w-5 icon-primary" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <select
                    value={selectedExchange}
                    onChange={(e) => setSelectedExchange(e.target.value)}
                    className="input"
                  >
                    {exchanges.map((exchange: string, index: number) => (
                      <option key={String(exchange)} value={exchange}>{exchange}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Key Financial Metrics Table with glassmorphism */}
              <div className="card-glass overflow-hidden shadow-soft">
                <div className="p-6 border-b border-[var(--color-divider-gray)]">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Key Financial Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="bg-[var(--color-background-default)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Market Cap</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">EBITDA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">P/E Ratio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Dividend Yield</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Debt/Equity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">ROE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-divider-gray)]">
                      {filteredMetrics.map((company: any) => (
                        <tr key={String(company.ticker)} className="hover:bg-[var(--color-background-default)] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                                <Building2 className="h-4 w-4 text-white" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-[var(--color-text-primary)]">{company.companyName}</div>
                                <div className="text-xs text-[var(--color-text-secondary)]">{company.ticker}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.market_cap}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.revenue}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.ebitda}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.pe_ratio}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.dividend_yield}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.debt_to_equity}</td>
                          <td className="px-6 py-4 text-sm text-[var(--color-text-primary)]">{company.roe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Currency Exchange */}
          {selectedTab === 'currency' && (
            <div className="space-y-6">
              {/* Currency Exchange Header with glassmorphism */}
              <div className="card-glass p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 icon-primary" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">African Currency Exchange Tracker</h3>
                  </div>
                   <div className="flex items-center space-x-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Base Currency:</span>
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="input"
                    >
                       <option value="USD">USD</option>
                       <option value="EUR">EUR</option>
                       <option value="GBP">GBP</option>
                       {/* Common African bases */}
                       <option value="ZAR">ZAR</option>
                       <option value="NGN">NGN</option>
                       <option value="EGP">EGP</option>
                       <option value="KES">KES</option>
                       <option value="GHS">GHS</option>
                       <option value="MAD">MAD</option>
                    </select>
                     <button className="btn-outline btn-sm" onClick={refreshRatesLive} disabled={ratesLoading}>
                       {ratesLoading ? 'Refreshing…' : 'Refresh live'}
                     </button>
                  </div>
                </div>
              </div>
             
              {/* Currency Exchange Rates with glassmorphism */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Rates list */}
                <div className="card-glass p-4 shadow-soft lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 icon-primary" />
                      <h4 className="font-medium text-[var(--color-text-primary)]">Currency Exchange Rates</h4>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {ratesSource ? <span>Source: {ratesSource.toUpperCase()}</span> : null}
                      {ratesDate ? <span className="ml-2">Updated: {new Date(ratesDate).toLocaleString()}</span> : null}
                    </div>
                  </div>
                  {ratesLoading && (
                    <div className="text-sm text-[var(--color-text-secondary)]">Loading currency rates…</div>
                  )}
                  {!ratesLoading && ratesError && (
                    <div className="text-sm text-red-600">{ratesError}</div>
                  )}
                  {!ratesLoading && !ratesError && Object.keys(currencyRates).length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px]">
                        <thead className="bg-[var(--color-background-default)]">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Currency</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Rate (1 {selectedCurrency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-divider-gray)]">
                          {Object.entries(currencyRates).map(([sym, rate]) => (
                            <tr key={sym} className="hover:bg-[var(--color-background-default)] transition-colors">
                              <td className="px-4 py-2 text-sm text-[var(--color-text-primary)]">{sym}</td>
                              <td className="px-4 py-2 text-sm text-[var(--color-text-primary)]">{Number(rate).toFixed(6)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick converter */}
                <div className="card-glass p-4 shadow-soft">
                  <div className="flex items-center space-x-2 mb-3">
                    <DollarSign className="h-4 w-4 icon-primary" />
                    <h4 className="font-medium text-[var(--color-text-primary)]">Quick Converter</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Amount ({selectedCurrency})</label>
                        <input
                          type="number"
                          className="input mt-1"
                          value={convertAmount}
                          min={0}
                          step="0.01"
                          onChange={(e) => setConvertAmount(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">To Currency</label>
                        <select
                          className="input mt-1"
                          value={targetCurrency}
                          onChange={(e) => setTargetCurrency(e.target.value)}
                        >
                          {Object.keys(currencyRates).map(sym => (
                            <option key={sym} value={sym}>{sym}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-sm text-[var(--color-text-primary)]">
                      {Object.keys(currencyRates).length > 0 && currencyRates[targetCurrency]
                        ? `${convertAmount} ${selectedCurrency} ≈ ${(convertAmount * Number(currencyRates[targetCurrency])).toFixed(4)} ${targetCurrency}`
                        : 'Select a currency to convert'}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      Rates are indicative and refreshed periodically.
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency Exchange Note with glassmorphism */}
              <div className="card-glass p-4 shadow-soft">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 icon-primary" />
                  <h4 className="font-medium text-[var(--color-text-primary)]">Note</h4>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>Note:</strong> Currency exchange rates are updated daily. Historical data and detailed charts are available in the premium version.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicMarkets;