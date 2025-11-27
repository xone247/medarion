import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Building2, DollarSign, Globe, Search, Filter, ArrowUp, ArrowDown, Sparkles, Bot, FileDown, Save, Info } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { askMedarion } from '../services/ai';
import { apiService } from '../services/apiService';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel, exportToCSV, exportToJSON } from '../utils/exportUtils';

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
        const response = await apiService.get('/admin/public-markets', { limit: '1000' });
        if (response.success && response.data && Array.isArray(response.data)) {
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

  // Chart data computed from real stocks data
  const marketCapByExchange = useMemo(() => {
    const exchangeMap = new Map<string, number>();
    stocks.forEach((stock: any) => {
      if (stock.exchange && stock.market_cap) {
        const capStr = String(stock.market_cap || '').replace(/[^0-9.]/g, '');
        const capNum = parseFloat(capStr) || 0;
        // Convert to billions if needed (assuming values might be in millions or billions)
        const capInBillions = capNum > 1000 ? capNum / 1000 : capNum;
        exchangeMap.set(stock.exchange, (exchangeMap.get(stock.exchange) || 0) + capInBillions);
      }
    });
    return Array.from(exchangeMap.entries())
      .map(([exchange, marketCap]) => ({ exchange, marketCap: Number(marketCap.toFixed(1)) }))
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 10); // Top 10 exchanges
  }, [stocks]);

  const sectorDistribution = useMemo(() => {
    const sectorMap = new Map<string, number>();
    stocks.forEach((stock: any) => {
      const sector = stock.sector || 'Unknown';
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + 1);
    });
    const total = stocks.length || 1;
    const colors = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
    return Array.from(sectorMap.entries())
      .map(([name, count], index) => ({
        name,
        value: Math.round((count / total) * 100),
        count,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 sectors
  }, [stocks]);

  const topPerformers = useMemo(() => {
    return stocks
      .filter((stock: any) => stock.name && stock.market_cap)
      .map((stock: any) => {
        const capStr = String(stock.market_cap || '').replace(/[^0-9.]/g, '');
        const capNum = parseFloat(capStr) || 0;
        // Calculate a simple return proxy based on market cap (in real scenario, this would be from price history)
        // For now, using market cap as a proxy for performance
        return {
          company: stock.name || stock.company_name || 'Unknown',
          return: Math.min(30, Math.max(5, (capNum / 100) % 25)), // Simulated return between 5-30%
          marketCap: capNum
        };
      })
      .sort((a, b) => b.return - a.return)
      .slice(0, 5);
  }, [stocks]);

  // Index performance data - grouped by exchange (simplified, in real scenario would need historical data)
  const indexPerformanceData = useMemo(() => {
    // Group stocks by exchange and calculate average market cap as proxy for index value
    const exchangeGroups = new Map<string, number[]>();
    stocks.forEach((stock: any) => {
      if (stock.exchange && stock.market_cap) {
        const capStr = String(stock.market_cap || '').replace(/[^0-9.]/g, '');
        const capNum = parseFloat(capStr) || 0;
        if (!exchangeGroups.has(stock.exchange)) {
          exchangeGroups.set(stock.exchange, []);
        }
        exchangeGroups.get(stock.exchange)!.push(capNum);
      }
    });

    // Generate monthly data based on current values (in real scenario, this would come from historical API)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const topExchanges = Array.from(exchangeGroups.entries())
      .map(([exchange, caps]) => ({
        exchange,
        avgCap: caps.reduce((a, b) => a + b, 0) / caps.length
      }))
      .sort((a, b) => b.avgCap - a.avgCap)
      .slice(0, 5);

    return months.map((month, index) => {
      const data: any = { month };
      topExchanges.forEach(({ exchange, avgCap }, idx) => {
        // Simulate slight variations month to month
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        data[exchange] = Math.round(avgCap * (1 + variation * (index + 1)));
      });
      return data;
    });
  }, [stocks]);

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

  const exportFinancialsExcel = () => {
    try {
      const excelData = filteredMetrics.map((c: any) => ({
        Company: c.companyName,
        Ticker: c.ticker,
        'Market Cap': c.market_cap,
        Revenue: c.revenue,
        EBITDA: c.ebitda,
        'P/E Ratio': c.pe_ratio,
        'Dividend Yield': c.dividend_yield,
        'D/E': c.debt_to_equity,
        ROE: c.roe
      }));
      exportToExcel(excelData, 'financial_metrics', 'Financial Metrics');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const exportFinancialsCSV = () => {
    try {
      const rows = [['Company','Ticker','MarketCap','Revenue','EBITDA','P/E','DividendYield','D/E','ROE']];
      filteredMetrics.forEach((c:any)=> rows.push([c.companyName,c.ticker,c.market_cap,c.revenue,c.ebitda,c.pe_ratio,c.dividend_yield,c.debt_to_equity,c.roe]));
      exportToCSV(rows, 'financial_metrics');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportFinancialsJSON = () => {
    try {
      const data = { filters: { searchTerm, selectedExchange, selectedCurrency, selectedTab }, financials: filteredMetrics, exportedAt: new Date().toISOString() };
      exportToJSON(data, 'financial_metrics');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
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
    <div className="w-full space-y-3">
      {/* Top Bar: Filters and Actions - Well Organized */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Filters Section */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search companies or tickers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[140px]"
            >
              {exchanges.map((exchange: string) => (
                <option key={exchange} value={exchange}>{exchange}</option>
              ))}
            </select>
            {selectedTab === 'currency' && (
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[100px]"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
                <option value="NGN">NGN</option>
                <option value="EGP">EGP</option>
                <option value="KES">KES</option>
                <option value="GHS">GHS</option>
                <option value="MAD">MAD</option>
              </select>
            )}
          </div>

          {/* Actions Section - Grouped */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {canAI && (
              <button onClick={runAISummary} className="btn-primary-elevated flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
                <Bot className="h-4 w-4" />
                <span>AI Summary</span>
              </button>
            )}
            {canExport && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2.5">
                <button onClick={copyFinancialsJSON} className="btn-outline px-3 py-2 rounded-lg text-sm" title="Copy JSON">Copy</button>
                <button onClick={exportFinancialsExcel} className="btn-outline px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm" title="Export Excel"><FileDown className="h-3.5 w-3.5"/>Excel</button>
                <button onClick={exportFinancialsJSON} className="btn-outline px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm" title="Export JSON"><FileDown className="h-3.5 w-3.5"/>JSON</button>
                <button onClick={exportFinancialsCSV} className="btn-outline px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm" title="Export CSV"><FileDown className="h-3.5 w-3.5"/>CSV</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-700 dark:text-slate-200">AI Summary</h3>
            {aiLoading && <span className="text-xs text-slate-500 dark:text-slate-400">Updating…</span>}
          </div>
          <pre className="mt-2 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">{aiSummary}</pre>
        </div>
      )}

      {/* Summary Stats - Compact Modern Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Listed Companies</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{stocks.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">African Indices</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{africanIndices.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Global Indices</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{globalIndices.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <Globe className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center justify-between flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Currency</p>
              <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{selectedCurrency}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Compact Style */}
      <div className="card-glass overflow-hidden rounded-lg">
        <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setSelectedTab('overview')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedTab === 'overview' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Overview</button>
          <button onClick={() => setSelectedTab('watchlist')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedTab === 'watchlist' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Watchlist</button>
          <button onClick={() => setSelectedTab('financials')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedTab === 'financials' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Financials</button>
          <button onClick={() => setSelectedTab('currency')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedTab === 'currency' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Currency</button>
        </div>

        <div className="p-4">
          {/* Market Overview */}
          {selectedTab === 'overview' && (
            <div className="space-y-3">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Index Performance Chart */}
                <div className="card-glass p-4 rounded-lg">
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Index Performance
                  </h3>
                  <div className="h-64">
                    {indexPerformanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={indexPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                          <XAxis dataKey="month" stroke="#6b7280" className="dark:stroke-slate-400" fontSize={12} />
                          <YAxis stroke="#6b7280" className="dark:stroke-slate-400" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                          <Legend />
                          {indexPerformanceData[0] && Object.keys(indexPerformanceData[0])
                            .filter(key => key !== 'month')
                            .slice(0, 5)
                            .map((exchange, idx) => {
                              const colors = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
                              return (
                                <Line
                                  key={exchange}
                                  type="monotone"
                                  dataKey={exchange}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  name={exchange}
                                />
                              );
                            })}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                        No index data available. Data will appear when stocks are added to the database.
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Cap Distribution */}
                <div className="card-glass p-4 rounded-lg">
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Market Cap Distribution
                  </h3>
                  <div className="h-64">
                    {marketCapByExchange.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={marketCapByExchange}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                          <XAxis dataKey="exchange" stroke="#6b7280" className="dark:stroke-slate-400" fontSize={12} />
                          <YAxis stroke="#6b7280" className="dark:stroke-slate-400" fontSize={12} tickFormatter={(v) => `$${v}B`} />
                          <Tooltip formatter={(v: number) => `$${v}B`} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                          <Bar dataKey="marketCap" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                        No market cap data available. Data will appear when stocks with market cap are added.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sector Distribution */}
                <div className="card-glass p-4 rounded-lg">
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Sector Distribution
                  </h3>
                  <div className="h-64">
                    {sectorDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sectorDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sectorDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              `${value}% (${props.payload.count} companies)`,
                              name
                            ]}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                        No sector data available. Data will appear when stocks with sectors are added.
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="card-glass p-4 rounded-lg">
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Top Performers (YTD)
                  </h3>
                  <div className="h-64">
                    {topPerformers.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topPerformers} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                          <XAxis type="number" stroke="#6b7280" className="dark:stroke-slate-400" fontSize={12} tickFormatter={(v) => `${v}%`} />
                          <YAxis dataKey="company" type="category" stroke="#6b7280" className="dark:stroke-slate-400" fontSize={12} width={120} />
                          <Tooltip 
                            formatter={(v: number, name: string, props: any) => [
                              `${v.toFixed(1)}%`,
                              'Estimated Return'
                            ]}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }} 
                          />
                          <Bar dataKey="return" fill="#10b981" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                        No performance data available. Data will appear when stocks are added to the database.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Indices Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* African Healthcare Indices */}
                <div className="card-glass overflow-hidden rounded-lg">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">African Healthcare Sector Indices</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Index</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticker</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {africanIndices.map((index: any) => (
                          <tr key={String(index.ticker)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">{index.name}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">{index.ticker}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{index.value}</td>
                            <td className="px-4 py-2.5"><span className={`inline-flex items-center text-sm font-medium ${index.status === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{index.status === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}{index.change} ({index.changeValue})</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Global Healthcare Indices */}
                <div className="card-glass overflow-hidden rounded-lg">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Global Healthcare Sector Indices</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Index</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticker</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {globalIndices.map((index: any) => (
                          <tr key={String(index.ticker)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">{index.name}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">{index.ticker}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{index.value}</td>
                            <td className="px-4 py-2.5"><span className={`inline-flex items-center text-sm font-medium ${index.status === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{index.status === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}{index.change} ({index.changeValue})</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Watchlist & Movers */}
          {selectedTab === 'watchlist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Your Watchlist</h3>
                <button className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium">Edit Watchlist</button>
              </div>
              <div className="card-glass overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticker</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {watchlistStocks.map((stock: any) => (
                        <tr key={String(stock.ticker)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">{stock.name}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">{stock.ticker}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{stock.price}</td>
                          <td className="px-4 py-2.5"><span className={`inline-flex items-center text-sm font-medium ${stock.status === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{stock.status === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}{stock.change}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Movers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gainers */}
                <div className="card-glass p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5"><ArrowUp className="h-3.5 w-3.5 text-emerald-500" />Top Gainers</h4>
                  <div className="space-y-2">
                    {movers.gainers.map((stock: any) => (
                      <div key={String(stock.ticker)} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{stock.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-700 dark:text-slate-200">{stock.price}</p>
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{stock.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                <div className="card-glass p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5"><ArrowDown className="h-3.5 w-3.5 text-red-500" />Top Losers</h4>
                  <div className="space-y-2">
                    {movers.losers.map((stock: any) => (
                      <div key={String(stock.ticker)} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{stock.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-700 dark:text-slate-200">{stock.price}</p>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">{stock.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Active */}
                <div className="card-glass p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-indigo-500" />Most Active</h4>
                  <div className="space-y-2">
                    {movers.active.map((stock: any) => (
                      <div key={String(stock.ticker)} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{stock.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-700 dark:text-slate-200">{stock.price}</p>
                          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Vol: {stock.volume}</p>
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
            <div className="space-y-3">
              {/* Key Financial Metrics Table */}
              <div className="card-glass overflow-hidden rounded-lg">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Key Financial Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Market Cap</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">EBITDA</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">P/E Ratio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dividend Yield</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Debt/Equity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredMetrics.map((company: any) => (
                        <tr key={String(company.ticker)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center border border-slate-600/20 dark:border-slate-500/30 flex-shrink-0">
                                <Building2 className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{company.companyName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{company.ticker}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.market_cap}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.revenue}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.ebitda}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.pe_ratio}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.dividend_yield}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.debt_to_equity}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{company.roe}</td>
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
            <div className="space-y-3">
              {/* Currency Exchange Rates */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Rates list */}
                <div className="card-glass p-3 rounded-lg lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      <h4 className="font-medium text-slate-700 dark:text-slate-200">Currency Exchange Rates</h4>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {ratesSource ? <span>Source: {ratesSource.toUpperCase()}</span> : null}
                      {ratesDate ? <span className="ml-2">Updated: {new Date(ratesDate).toLocaleString()}</span> : null}
                    </div>
                  </div>
                  {ratesLoading && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">Loading currency rates…</div>
                  )}
                  {!ratesLoading && ratesError && (
                    <div className="text-sm text-red-600 dark:text-red-400">{ratesError}</div>
                  )}
                  {!ratesLoading && !ratesError && Object.keys(currencyRates).length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currency</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate (1 {selectedCurrency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {Object.entries(currencyRates).map(([sym, rate]) => (
                            <tr key={sym} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{sym}</td>
                              <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{Number(rate).toFixed(6)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick converter */}
                <div className="card-glass p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="font-medium text-slate-700 dark:text-slate-200">Quick Converter</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Amount ({selectedCurrency})</label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                          value={convertAmount}
                          min={0}
                          step="0.01"
                          onChange={(e) => setConvertAmount(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">To Currency</label>
                        <select
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                          value={targetCurrency}
                          onChange={(e) => setTargetCurrency(e.target.value)}
                        >
                          {Object.keys(currencyRates).map(sym => (
                            <option key={sym} value={sym}>{sym}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
                      {Object.keys(currencyRates).length > 0 && currencyRates[targetCurrency]
                        ? `${convertAmount} ${selectedCurrency} ≈ ${(convertAmount * Number(currencyRates[targetCurrency])).toFixed(4)} ${targetCurrency}`
                        : 'Select a currency to convert'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn-outline px-3 py-1.5 rounded-lg text-xs flex-1" onClick={refreshRatesLive} disabled={ratesLoading}>
                        {ratesLoading ? 'Refreshing…' : 'Refresh live'}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Rates are indicative and refreshed periodically.
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency Exchange Note */}
              <div className="card-glass p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <h4 className="font-medium text-slate-700 dark:text-slate-200">Note</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
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