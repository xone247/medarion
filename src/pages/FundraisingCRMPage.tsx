import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MessageSquare, Plus, User, Users, Calendar, DollarSign, Mail, Phone, FileText, Bell, SlidersHorizontal, FileDown, ArrowRightLeft, Search, X, Bot } from 'lucide-react';
import { accentBgFromVar, dealStageToVar } from '../lib/badges';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';

type Investor = { 
  id: number; 
  investor_id?: number; // Reference to database investor
  name: string; 
  type: string; 
  focus: string; 
  email: string; 
  phone: string; 
  lastContact: string | null; 
  notes: string; 
  dealSize: string; 
  timeline: string;
  website?: string;
  headquarters?: string;
};

type Pipeline = Record<string, Investor[]>;

const DEFAULT_PIPELINE: Pipeline = {
  'Not Contacted': [],
  'Contacted': [],
  'Meeting Set': [],
  'Due Diligence': [],
  'Term Sheet': [],
};

const FundraisingCRMPage = () => {
  const [pipeline, setPipeline] = useState<Pipeline>({ ...DEFAULT_PIPELINE });
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectInvestorModal, setShowSelectInvestorModal] = useState(false);
  const [databaseInvestors, setDatabaseInvestors] = useState<any[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [investorSearchTerm, setInvestorSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Fetch investors from database
  useEffect(() => {
    const fetchDatabaseInvestors = async () => {
      setLoadingInvestors(true);
      try {
        const response = await dataService.getInvestors({ limit: 500 });
        if (response.success && response.data) {
          setDatabaseInvestors(response.data);
        }
      } catch (error) {
        console.error('Error fetching investors:', error);
      } finally {
        setLoadingInvestors(false);
      }
    };
    fetchDatabaseInvestors();
  }, []);

  // Load pipeline from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('medarionCRM');
      if (raw) {
        const saved = JSON.parse(raw);
        // Merge with default structure to ensure all stages exist
        setPipeline({ ...DEFAULT_PIPELINE, ...saved });
      }
    } catch {}
  }, []);

  // Save pipeline to localStorage
  useEffect(() => { 
    try { 
      localStorage.setItem('medarionCRM', JSON.stringify(pipeline)); 
    } catch {} 
  }, [pipeline]);

  const [meetingDetails, setMeetingDetails] = useState({ title: '', date: '', time: '', duration: '30', notes: '', sendTo: '', calendarType: 'google' });
  const [reminderDetails, setReminderDetails] = useState({ title: '', date: '', time: '', notes: '', email: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const canExport = !!(profile && (profile.is_admin || (profile as any).account_tier === 'enterprise'));
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const allInvestors = useMemo(() => Object.values(pipeline).flat(), [pipeline]);
  const totalInvestors = allInvestors.length;
  const activeDeals = (pipeline['Due Diligence']?.length || 0) + (pipeline['Term Sheet']?.length || 0);
  const avgDealSize = useMemo(() => {
    if (totalInvestors === 0) return 0;
    const sum = allInvestors.reduce((acc, inv) => {
      if (inv.dealSize.includes('-')) {
        const [a, b] = inv.dealSize.replace(/M/gi, '').split('-').map((n) => parseFloat(n));
        return acc + (a + b) / 2;
      }
      return acc + parseFloat(inv.dealSize.replace(/M/gi, '').replace(/K/gi, ''));
    }, 0);
    return sum / Math.max(1, totalInvestors);
  }, [allInvestors, totalInvestors]);

  const filteredPipeline = useMemo(() => {
    const q = query.trim().toLowerCase();
    const copy: Pipeline = {} as any;
    for (const [stage, list] of Object.entries(pipeline)) {
      if (stageFilter && stage !== stageFilter) continue;
      copy[stage] = list.filter((inv) => {
        const matchQ = !q || inv.name.toLowerCase().includes(q) || inv.focus.toLowerCase().includes(q) || inv.type.toLowerCase().includes(q);
        const matchType = !typeFilter || inv.type === typeFilter;
        return matchQ && matchType;
      });
    }
    return copy;
  }, [pipeline, query, stageFilter, typeFilter]);

  const getStageColor = (stage: string) => {
    const map: Record<string, string> = {
      'Not Contacted': 'bg-[var(--color-background-default)] border-[var(--color-divider-gray)]',
      'Contacted': 'bg-[var(--color-background-default)] border-[var(--color-divider-gray)]',
      'Meeting Set': 'bg-[var(--color-background-default)] border-[var(--color-divider-gray)]',
      'Due Diligence': 'bg-[var(--color-background-default)] border-[var(--color-divider-gray)]',
      'Term Sheet': 'bg-[var(--color-background-default)] border-[var(--color-divider-gray)]',
    };
    return map[stage] || 'bg-[var(--color-background-default)] border-[var(--color-divider-gray)]';
  };

  // Subtle accent color per stage used for the column top bar
  const getStageAccent = (stage: string) => {
    try {
      return accentBgFromVar(dealStageToVar(stage));
    } catch {
      return 'bg-[var(--color-divider-gray)]';
    }
  };

  // Actions
  const changeStage = (investor: Investor, fromStage: string, toStage: string) => {
    if (fromStage === toStage) return;
    setPipeline((prev) => {
      const next: Pipeline = { ...prev, [fromStage]: prev[fromStage].filter((i) => i.id !== investor.id), [toStage]: [...prev[toStage], investor] } as any;
      return next;
    });
  };

  const addInvestor = (inv: Omit<Investor, 'id'>) => {
    const id = Math.max(0, ...allInvestors.map((i) => i.id)) + 1;
    setPipeline((prev) => ({ ...prev, 'Not Contacted': [{ id, ...inv }, ...prev['Not Contacted']] }));
  };

  const addInvestorFromDatabase = (dbInvestor: any) => {
    // Check if already in pipeline
    const allCurrentIds = Object.values(pipeline).flat().map(i => i.investor_id).filter(Boolean);
    if (allCurrentIds.includes(dbInvestor.id)) {
      alert('This investor is already in your pipeline');
      return;
    }

    const focusSectors = Array.isArray(dbInvestor.focus_sectors) 
      ? dbInvestor.focus_sectors.join(', ') 
      : (typeof dbInvestor.focus_sectors === 'string' ? dbInvestor.focus_sectors : 'Healthcare');
    
    const investmentStages = Array.isArray(dbInvestor.investment_stages) 
      ? dbInvestor.investment_stages 
      : [];
    
    const stageType = investmentStages.length > 0 
      ? investmentStages[0] 
      : (dbInvestor.type === 'VC' ? 'Series A' : 'Seed');

    const avgInvestment = dbInvestor.average_investment 
      ? `$${(dbInvestor.average_investment / 1000000).toFixed(1)}M`
      : (dbInvestor.assets_under_management 
          ? `$${(parseFloat(dbInvestor.assets_under_management) / 1000000).toFixed(0)}M+`
          : '1-5M');

    const investor: Investor = {
      id: Math.max(0, ...allInvestors.map((i) => i.id)) + 1,
      investor_id: dbInvestor.id,
      name: dbInvestor.name,
      type: stageType,
      focus: focusSectors || 'Healthcare',
      email: dbInvestor.contact_email || '',
      phone: '',
      lastContact: null,
      notes: dbInvestor.description || '',
      dealSize: avgInvestment,
      timeline: 'Q1 2025',
      website: dbInvestor.website,
      headquarters: dbInvestor.headquarters,
    };

    setPipeline((prev) => ({ 
      ...prev, 
      'Not Contacted': [investor, ...prev['Not Contacted']] 
    }));
    setShowSelectInvestorModal(false);
    setInvestorSearchTerm('');
  };

  const exportCSV = () => {
    try {
      const rows = [['Stage','Name','Type','Focus','Email','Phone','LastContact','DealSize','Timeline']];
      for (const [stage, list] of Object.entries(pipeline)) {
        list.forEach((i) => rows.push([stage, i.name, i.type, i.focus, i.email, i.phone, i.lastContact || '', i.dealSize, i.timeline]));
      }
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crm_pipeline.csv'; a.click(); URL.revokeObjectURL(a.href);
    } catch {}
  };
  const exportJSON = () => {
    try { const data = { pipeline, exportedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='crm_pipeline.json'; a.click(); URL.revokeObjectURL(a.href);} catch {}
  };
  const copyJSON = async () => { try { const data = { pipeline, exportedAt: new Date().toISOString() }; const text = JSON.stringify(data, null, 2); if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); } else { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} alert('Copied CRM pipeline JSON to clipboard'); } catch {} };
  const runAISummary = () => { try { const total = totalInvestors; const active = activeDeals; setAiSummary(`Pipeline investors: ${total} • Active deals: ${active} • Avg deal size: $${avgDealSize.toFixed(1)}M`); } catch { setAiSummary('No data available'); } };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            currentValue += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentValue += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentValue);
          currentValue = '';
        } else if (ch === '\n') {
          currentRow.push(currentValue);
          rows.push(currentRow);
          currentRow = [];
          currentValue = '';
        } else if (ch === '\r') {
          // skip CR
        } else {
          currentValue += ch;
        }
      }
    }
    if (currentValue.length > 0 || currentRow.length > 0) {
      currentRow.push(currentValue);
      rows.push(currentRow);
    }
    return rows;
  };

  const importCSV = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) return;
      const header = rows[0].map(h => h.trim());
      const findIdx = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
      const colStage = findIdx('Stage');
      const colName = findIdx('Name');
      const colType = findIdx('Type');
      const colFocus = findIdx('Focus');
      const colEmail = findIdx('Email');
      const colPhone = findIdx('Phone');
      const colLast = findIdx('LastContact');
      const colDeal = findIdx('DealSize');
      const colTimeline = findIdx('Timeline');

      const dataRows = rows.slice(1).filter(r => {
        const maybeName = colName >= 0 ? r[colName] : r[0];
        return (maybeName || '').trim().length > 0;
      });
      if (!dataRows.length) return;

      setPipeline(prev => {
        const currentAll = Object.values(prev).flat();
        let nextId = Math.max(0, ...currentAll.map(i => i.id)) + 1;
        const next: Pipeline = { ...prev };
        for (const r of dataRows) {
          const rawStage = colStage >= 0 ? (r[colStage] || '').trim() : 'Not Contacted';
          const stage = Object.prototype.hasOwnProperty.call(next, rawStage) ? rawStage : 'Not Contacted';
          const investor: Investor = {
            id: nextId++,
            name: colName >= 0 ? (r[colName] || '').trim() : (r[0] || '').trim(),
            type: colType >= 0 ? (r[colType] || 'Seed').trim() : 'Seed',
            focus: colFocus >= 0 ? (r[colFocus] || '').trim() : '',
            email: colEmail >= 0 ? (r[colEmail] || '').trim() : '',
            phone: colPhone >= 0 ? (r[colPhone] || '').trim() : '',
            lastContact: colLast >= 0 ? (((r[colLast] || '').trim()) || null) : null,
            notes: '',
            dealSize: colDeal >= 0 ? (r[colDeal] || '1-3M').trim() : '1-3M',
            timeline: colTimeline >= 0 ? (r[colTimeline] || 'Q2 2025').trim() : 'Q2 2025',
          };
          next[stage] = [investor, ...next[stage]];
        }
        return next;
      });
      alert('CSV imported successfully.');
    } catch {}
  };

  // Modal states for create investor
  const [newInv, setNewInv] = useState<Omit<Investor,'id'>>({ name: '', type: 'Seed', focus: '', email: '', phone: '', lastContact: null, notes: '', dealSize: '1-3M', timeline: 'Q2 2025' });

  // Filter database investors for selection modal
  const filteredDatabaseInvestors = useMemo(() => {
    if (!investorSearchTerm) return databaseInvestors.slice(0, 20);
    const search = investorSearchTerm.toLowerCase();
    return databaseInvestors.filter(inv => 
      inv.name?.toLowerCase().includes(search) ||
      inv.description?.toLowerCase().includes(search) ||
      (Array.isArray(inv.focus_sectors) && inv.focus_sectors.some((s: string) => s.toLowerCase().includes(search))) ||
      inv.headquarters?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [databaseInvestors, investorSearchTerm]);

  return (
    <div className="page-container">
      {/* Header with glassmorphism */}
      <div className="card-glass p-6 shadow-soft mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8 icon-primary" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">Fundraising CRM</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">Manage your investor relationships and fundraising pipeline</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
          <div className="toolbar">
              <input className="input w-full sm:w-48" placeholder="Search..." value={query} onChange={(e)=>setQuery(e.target.value)} />
              <select className="input w-full sm:w-40" value={stageFilter} onChange={(e)=>setStageFilter(e.target.value)}>
                <option value="">All stages</option>
                {Object.keys(pipeline).map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select className="input w-full sm:w-36" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}>
                <option value="">All types</option>
                {Array.from(new Set(allInvestors.map(i=>i.type))).map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div className="toolbar">
              {(() => { try { const { useAuth } = require('../contexts/AuthContext'); const { profile } = useAuth(); const canAI = !!(profile && (profile.is_admin || ['paid','enterprise'].includes((profile as any).account_tier))); return canAI; } catch { return false; } })() && <button className="btn-primary-elevated px-3 py-2 rounded text-sm flex items-center gap-2" onClick={runAISummary}><Bot className="h-4 w-4"/> AI Summary</button>}
              {canExport && (
                <>
                  <button className="btn-outline px-3 py-2 rounded text-sm" onClick={copyJSON}>Copy</button>
                  <button className="btn-outline px-3 py-2 rounded text-sm" onClick={exportJSON}><FileDown className="h-4 w-4 inline mr-2"/>Export JSON</button>
                </>
              )}
              {canExport && (
                <>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) importCSV(f); if (fileInputRef.current) fileInputRef.current.value=''; }} />
                  <button className="btn-outline px-3 py-2 rounded text-sm" onClick={()=>fileInputRef.current?.click()}><FileDown className="h-4 w-4 inline mr-2"/>Import CSV</button>
                  <button className="btn-outline px-3 py-2 rounded text-sm" onClick={exportCSV}><FileDown className="h-4 w-4 inline mr-2"/>Export CSV</button>
                </>
              )}
            </div>
            <button className="btn-primary px-4 py-2 rounded flex items-center gap-2 justify-center" onClick={()=>setShowSelectInvestorModal(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Investor</span>
            </button>
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="card-glass p-4 shadow-soft mb-6">
          <div className="text-sm text-[var(--color-text-primary)]">{aiSummary}</div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-glass p-4 lg:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 lg:h-6 lg:w-6 icon-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs lg:text-sm text-[var(--color-text-secondary)]">Total Investors</p>
              <p className="text-lg lg:text-2xl font-bold text-[var(--color-text-primary)]">{totalInvestors}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4 lg:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 icon-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs lg:text-sm text-[var(--color-text-secondary)]">Active Deals</p>
              <p className="text-lg lg:text-2xl font-bold text-[var(--color-text-primary)]">{activeDeals}</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4 lg:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 lg:h-6 lg:w-6 icon-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs lg:text-sm text-[var(--color-text-secondary)]">Avg Deal Size</p>
              <p className="text-lg lg:text-2xl font-bold text-[var(--color-text-primary)]">${avgDealSize.toFixed(1)}M</p>
            </div>
          </div>
        </div>
        <div className="card-glass p-4 lg:p-6 shadow-soft">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 lg:h-6 lg:w-6 icon-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs lg:text-sm text-[var(--color-text-secondary)]">Conversion Rate</p>
              <p className="text-lg lg:text-2xl font-bold text-[var(--color-text-primary)]">{((activeDeals / Math.max(1,totalInvestors)) * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(filteredPipeline).map(([stage, investors]) => (
          <div key={stage} className="card-glass rounded-lg flex flex-col h-[28rem] md:h-[32rem] shadow-soft">
            <div className={`h-1 w-full rounded-t ${getStageAccent(stage)}`}></div>
            <div className="p-3 border-b border-[var(--color-divider-gray)] bg-[var(--color-background-default)] flex-shrink-0">
              <h3 className="font-semibold text-[var(--color-text-primary)] text-center text-sm">{stage}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] text-center">{investors.length} investor{investors.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {investors.length === 0 ? (
                <div className="text-xs text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] border-dashed rounded p-4 text-center">
                  <div className="mb-2 opacity-50">📋</div>
                  <div>No investors in this stage</div>
                  <div className="text-xs mt-1 opacity-75">Drag cards here or add new investors</div>
                </div>
              ) : (
                investors.map((investor) => (
                  <div
                    key={investor.id}
                    className="card-glass p-6 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md flex flex-col"
                    onClick={() => setSelectedInvestor(investor)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[var(--color-primary-teal)] rounded-lg flex items-center justify-center border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">{investor.name}</h4>
                          <span className="bg-[var(--color-neutral-taupe)] text-[var(--color-text-primary)] px-2 py-0.5 rounded text-xs font-medium border border-[var(--color-divider-gray)]">{investor.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {investor.focus && (<span className="chip text-xs">{investor.focus}</span>)}
                      {investor.dealSize && (<span className="chip text-xs">${investor.dealSize}</span>)}
                      {investor.timeline && (<span className="chip text-xs">{investor.timeline}</span>)}
                    </div>
                    {investor.lastContact && (
                      <p className="text-xs text-[var(--color-text-secondary)] mb-3">Last contact: {new Date(investor.lastContact).toLocaleDateString()}</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-[var(--color-divider-gray)]">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInvestor(investor); setShowMeetingModal(true); }}
                        className="btn-chip btn-chip-danger flex-shrink-0"
                      >
                        <Calendar className="h-3 w-3" /><span className="hidden sm:inline">Meeting</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInvestor(investor); setShowReminderModal(true); }}
                        className="btn-chip btn-chip-info flex-shrink-0"
                      >
                        <Bell className="h-3 w-3" /><span className="hidden sm:inline">Remind</span>
                      </button>
                      <div className="ml-auto flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3 text-[var(--color-text-secondary)]" />
                        <select
                          className="text-xs border border-[var(--color-divider-gray)] rounded px-1 py-0.5 bg-[var(--color-background-surface)] text-[var(--color-text-primary)] max-w-[80px]"
                          onClick={(e)=>e.stopPropagation()}
                          onChange={(e)=> changeStage(investor, stage, e.target.value)}
                          value={stage}
                        >
                          {Object.keys(pipeline).map(s => (<option key={s} value={s}>{s.length > 10 ? s.substring(0,10) + '...' : s}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Investor Detail Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-4 md:p-6 max-w-2xl w-full mx-auto max-h-[80vh] overflow-y-auto shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">{selectedInvestor.name}</h3>
              <button onClick={() => setSelectedInvestor(null)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><p className="text-sm text-[var(--color-text-secondary)]">Investment Type</p><p className="font-medium text-[var(--color-text-primary)]">{selectedInvestor.type}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Focus Area</p><p className="font-medium text-[var(--color-text-primary)]">{selectedInvestor.focus}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Deal Size</p><p className="font-medium text-[var(--color-text-primary)]">${selectedInvestor.dealSize}</p></div>
              <div><p className="text-sm text-[var(--color-text-secondary)]">Timeline</p><p className="font-medium text-[var(--color-text-primary)]">{selectedInvestor.timeline}</p></div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Contact Information</p>
              <div className="space-y-2 card-glass p-3 shadow-soft">
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4 text-[var(--color-text-secondary)]" /><span className="text-sm text-[var(--color-text-primary)]">{selectedInvestor.email}</span></div>
                <div className="flex items-center space-x-2"><Phone className="h-4 w-4 text-[var(--color-text-secondary)]" /><span className="text-sm text-[var(--color-text-primary)]">{selectedInvestor.phone}</span></div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Notes</p>
              <p className="text-sm text-[var(--color-text-primary)] card-glass p-3 shadow-soft">{selectedInvestor.notes}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setSelectedInvestor(null); setShowMeetingModal(true); setMeetingDetails((m)=>({ ...m, title:`Meeting with ${selectedInvestor.name}`, sendTo:selectedInvestor.email })); }} className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center space-x-2"><Calendar className="h-4 w-4" /><span>Schedule Meeting</span></button>
              <button onClick={() => { setSelectedInvestor(null); setShowReminderModal(true); setReminderDetails((r)=>({ ...r, title:`Follow up with ${selectedInvestor.name}` })); }} className="btn-primary px-3 py-2 rounded-lg text-sm flex items-center space-x-2"><Bell className="h-4 w-4" /><span>Set Reminder</span></button>
              <button className="btn-outline px-3 py-2 rounded-lg text-sm">Add Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Request Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-4 md:p-6 max-w-2xl w-full mx-auto shadow-soft">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">Schedule Meeting</h3>
              <button onClick={() => setShowMeetingModal(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Meeting Title</label>
                <input type="text" value={meetingDetails.title} onChange={(e) => setMeetingDetails({...meetingDetails, title: e.target.value})} className="input" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Date</label>
                  <input type="date" value={meetingDetails.date} onChange={(e) => setMeetingDetails({...meetingDetails, date: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Time</label>
                  <input type="time" value={meetingDetails.time} onChange={(e) => setMeetingDetails({...meetingDetails, time: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Duration (minutes)</label>
                <select value={meetingDetails.duration} onChange={(e) => setMeetingDetails({...meetingDetails, duration: e.target.value})} className="input">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Notes/Agenda</label>
                <textarea value={meetingDetails.notes} onChange={(e) => setMeetingDetails({...meetingDetails, notes: e.target.value})} rows={3} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Send To</label>
                <input type="email" value={meetingDetails.sendTo} onChange={(e) => setMeetingDetails({...meetingDetails, sendTo: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Calendar Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2"><input type="radio" checked={meetingDetails.calendarType === 'google'} onChange={() => setMeetingDetails({...meetingDetails, calendarType: 'google'})} /><span className="text-[var(--color-text-primary)]">Google Calendar</span></label>
                  <label className="flex items-center space-x-2"><input type="radio" checked={meetingDetails.calendarType === 'outlook'} onChange={() => setMeetingDetails({...meetingDetails, calendarType: 'outlook'})} /><span className="text-[var(--color-text-primary)]">Outlook</span></label>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { alert(`Meeting invitation sent to ${meetingDetails.sendTo}!`); setShowMeetingModal(false); }} disabled={!meetingDetails.title || !meetingDetails.date || !meetingDetails.time || !meetingDetails.sendTo} className="btn-primary px-4 py-2 rounded">Send Calendar Invitation</button>
              <button onClick={() => setShowMeetingModal(false)} className="btn-outline px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-4 md:p-6 max-w-2xl w-full mx-auto shadow-soft">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">Set Task Reminder</h3>
              <button onClick={() => setShowReminderModal(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Reminder Title</label>
                <input type="text" value={reminderDetails.title} onChange={(e) => setReminderDetails({...reminderDetails, title: e.target.value})} className="input" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Date</label><input type="date" value={reminderDetails.date} onChange={(e) => setReminderDetails({...reminderDetails, date: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Time</label><input type="time" value={reminderDetails.time} onChange={(e) => setReminderDetails({...reminderDetails, time: e.target.value})} className="input" /></div>
              </div>
              <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Notes</label><textarea value={reminderDetails.notes} onChange={(e) => setReminderDetails({...reminderDetails, notes: e.target.value})} rows={3} className="input" /></div>
              <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Send Notification To</label><input type="email" value={reminderDetails.email} onChange={(e) => setReminderDetails({...reminderDetails, email: e.target.value})} className="input" placeholder="Your email address" /></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { alert(`Reminder set! You'll receive an email notification at ${reminderDetails.email}.`); setShowReminderModal(false); }} disabled={!reminderDetails.title || !reminderDetails.date || !reminderDetails.time || !reminderDetails.email} className="btn-primary px-4 py-2 rounded">Set Email Reminder</button>
              <button onClick={() => setShowReminderModal(false)} className="btn-outline px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Select Investor from Database Modal */}
      {showSelectInvestorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-4 md:p-6 max-w-4xl w-full mx-auto shadow-soft max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">Select Investor from Platform</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Choose an investor from the database to add to your CRM pipeline</p>
              </div>
              <button onClick={()=>{setShowSelectInvestorModal(false); setInvestorSearchTerm('');}} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
                <input 
                  className="input pl-10 w-full" 
                  placeholder="Search investors by name, sector, or location..." 
                  value={investorSearchTerm} 
                  onChange={(e)=>setInvestorSearchTerm(e.target.value)} 
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border border-[var(--color-divider-gray)] rounded-lg">
              {loadingInvestors ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">Loading investors...</div>
              ) : filteredDatabaseInvestors.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">
                  {investorSearchTerm ? 'No investors found matching your search' : 'No investors available in the database'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-divider-gray)]">
                  {filteredDatabaseInvestors.map((inv) => {
                    const focusSectors = Array.isArray(inv.focus_sectors) 
                      ? inv.focus_sectors.slice(0, 3).join(', ') 
                      : (typeof inv.focus_sectors === 'string' ? inv.focus_sectors : 'Healthcare');
                    
                    const allCurrentIds = Object.values(pipeline).flat().map(i => i.investor_id).filter(Boolean);
                    const isInPipeline = allCurrentIds.includes(inv.id);

                    return (
                      <div 
                        key={inv.id} 
                        className={`p-4 hover:bg-[var(--color-background-surface)] transition-colors cursor-pointer ${isInPipeline ? 'opacity-50' : ''}`}
                        onClick={() => !isInPipeline && addInvestorFromDatabase(inv)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-[var(--color-text-primary)]">{inv.name}</h4>
                              {isInPipeline && (
                                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">Already in pipeline</span>
                              )}
                            </div>
                            {inv.description && (
                              <p className="text-sm text-[var(--color-text-secondary)] mb-2 line-clamp-2">{inv.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {focusSectors && <span className="chip">{focusSectors}</span>}
                              {inv.headquarters && <span className="chip">{inv.headquarters}</span>}
                              {inv.type && <span className="chip">{inv.type}</span>}
                              {inv.contact_email && (
                                <span className="chip flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {inv.contact_email}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isInPipeline && (
                            <button 
                              className="btn-primary px-3 py-1.5 text-sm ml-4 flex-shrink-0"
                              onClick={(e) => { e.stopPropagation(); addInvestorFromDatabase(inv); }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-divider-gray)] flex justify-between items-center flex-shrink-0">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Showing {filteredDatabaseInvestors.length} of {databaseInvestors.length} investors
              </p>
              <div className="flex gap-2">
                <button 
                  className="btn-outline px-4 py-2 rounded" 
                  onClick={() => {
                    setShowSelectInvestorModal(false);
                    setInvestorSearchTerm('');
                    setShowAddModal(true);
                  }}
                >
                  Add Custom Investor
                </button>
                <button 
                  className="btn-outline px-4 py-2 rounded" 
                  onClick={()=>{setShowSelectInvestorModal(false); setInvestorSearchTerm('');}}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Investor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-glass p-4 md:p-6 max-w-xl w-full mx-auto shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">Add Custom Investor</h3>
              <button onClick={()=>setShowAddModal(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Name" value={newInv.name} onChange={(e)=>setNewInv(prev=>({...prev, name:e.target.value}))} />
              <select className="input" value={newInv.type} onChange={(e)=>setNewInv(prev=>({...prev, type:e.target.value}))}>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B">Series B</option>
                <option value="Series C">Series C</option>
              </select>
              <input className="input" placeholder="Focus" value={newInv.focus} onChange={(e)=>setNewInv(prev=>({...prev, focus:e.target.value}))} />
              <input className="input" placeholder="Email" value={newInv.email} onChange={(e)=>setNewInv(prev=>({...prev, email:e.target.value}))} />
              <input className="input" placeholder="Phone" value={newInv.phone} onChange={(e)=>setNewInv(prev=>({...prev, phone:e.target.value}))} />
              <input className="input" placeholder="Deal Size (e.g., 1-3M)" value={newInv.dealSize} onChange={(e)=>setNewInv(prev=>({...prev, dealSize:e.target.value}))} />
              <input className="input" placeholder="Timeline (e.g., Q2 2025)" value={newInv.timeline} onChange={(e)=>setNewInv(prev=>({...prev, timeline:e.target.value}))} />
              <textarea className="input md:col-span-2" placeholder="Notes" rows={3} value={newInv.notes} onChange={(e)=>setNewInv(prev=>({...prev, notes:e.target.value}))} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-outline px-4 py-2 rounded" onClick={()=>setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary px-4 py-2 rounded" onClick={()=>{ if (!newInv.name) return; addInvestor(newInv); setShowAddModal(false); setNewInv({ name:'', type:'Seed', focus:'', email:'', phone:'', lastContact:null, notes:'', dealSize:'1-3M', timeline:'Q2 2025' }); }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundraisingCRMPage;