import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, Users, Calendar, DollarSign, Mail, Phone, FileText, Search, X, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink, MapPin, Activity, Target, BarChart3, Paperclip, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

type Investor = {
  id: number;
  investor_id?: number;
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
  logo?: string;
  probability?: number;
  activities?: Activity[];
  documents?: Document[];
  tasks?: Task[];
};

type Activity = {
  id: string;
  type: 'email' | 'meeting' | 'call' | 'note' | 'document';
  title: string;
  date: string;
  description?: string;
  participants?: string[];
};

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
};

type Task = {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
};

type Pipeline = Record<string, Investor[]>;

const DEFAULT_PIPELINE: Pipeline = {
  'Leads': [],
  'Qualified': [],
  'Meeting Set': [],
  'Due Diligence': [],
  'Term Sheet': [],
  'Closed Won': [],
  'Closed Lost': [],
};

const FundraisingCRMPage = () => {
  const [pipeline, setPipeline] = useState<Pipeline>({ ...DEFAULT_PIPELINE });
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analytics' | 'tasks'>('pipeline');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectInvestorModal, setShowSelectInvestorModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [databaseInvestors, setDatabaseInvestors] = useState<any[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [investorSearchTerm, setInvestorSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [newActivity, setNewActivity] = useState<Omit<Activity, 'id'>>({ type: 'note', title: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({ title: '', dueDate: '', status: 'pending', priority: 'medium' });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  const pipelineScrollRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  
  const isAdmin = profile?.is_admin === true || profile?.is_admin === 1 || 
                  profile?.role === 'admin' || profile?.role === 'superadmin' ||
                  (Array.isArray(profile?.app_roles) && (profile.app_roles.includes('super_admin') || profile.app_roles.includes('admin'))) ||
                  (typeof profile?.app_roles === 'string' && (profile.app_roles.includes('super_admin') || profile.app_roles.includes('admin')));

  // Check scroll position on mount and resize
  useEffect(() => {
    const checkScroll = () => {
      if (pipelineScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = pipelineScrollRef.current;
        setShowLeftScroll(scrollLeft > 10);
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [pipeline, activeTab]);

  // Fetch investors from database
  useEffect(() => {
    const fetchDatabaseInvestors = async () => {
      setLoadingInvestors(true);
      try {
        const response = await apiService.get('/admin/investors', { limit: '500' });
        console.log('[FundraisingCRM] Investors API Response:', response);
        if (response.success && response.data && Array.isArray(response.data)) {
          setDatabaseInvestors(response.data);
        } else {
          console.warn('[FundraisingCRM] Invalid response format:', response);
          setDatabaseInvestors([]);
        }
      } catch (error) {
        console.error('[FundraisingCRM] Error fetching investors:', error);
        setDatabaseInvestors([]);
      } finally {
        setLoadingInvestors(false);
      }
    };
    fetchDatabaseInvestors();
  }, []);

  // Load pipeline from database
  useEffect(() => {
    const loadPipelineFromDatabase = async () => {
      try {
        const params: any = { limit: '500' };
        if (selectedUserId) {
          params.user_id = selectedUserId.toString();
        }
        const response = await apiService.get('/admin/crm-investors', params);
        console.log('[FundraisingCRM] Loaded from database:', response);
        if (response.success && response.data && Array.isArray(response.data)) {
          // Group investors by pipeline_stage
          const grouped: Pipeline = { ...DEFAULT_PIPELINE };
          response.data.forEach((dbInvestor: any) => {
            // Map database stages to our stages
            let stage = dbInvestor.pipeline_stage || 'Leads';
            // Database stages now match frontend stages, but handle legacy values
            const stageMap: Record<string, string> = {
              'Lead': 'Leads',
              'Qualified': 'Qualified',
              'Meeting Set': 'Meeting Set',
              'Due Diligence': 'Due Diligence',
              'Term Sheet': 'Term Sheet',
              'Closed Won': 'Closed Won',
              'Closed Lost': 'Closed Lost',
              // Legacy mappings
              'Proposal': 'Meeting Set',
              'Negotiation': 'Due Diligence',
            };
            stage = stageMap[stage] || stage;
            if (!grouped[stage]) grouped[stage] = [];

            // Parse activities and tasks from notes JSON if stored there
            let activities: Activity[] = [];
            let tasks: Task[] = [];
            try {
              const notesData = dbInvestor.notes ? JSON.parse(dbInvestor.notes) : null;
              if (notesData && notesData.activities) activities = notesData.activities;
              if (notesData && notesData.tasks) tasks = notesData.tasks;
            } catch {
              // If notes is not JSON, treat as plain text
            }

            const investor: Investor = {
              id: dbInvestor.id,
              investor_id: dbInvestor.investor_id || null,
              name: dbInvestor.name,
              type: dbInvestor.type || '',
              focus: dbInvestor.focus || '',
              email: dbInvestor.email || '',
              phone: dbInvestor.phone || '',
              lastContact: dbInvestor.last_contact || null,
              notes: typeof dbInvestor.notes === 'string' && !dbInvestor.notes.startsWith('{') ? dbInvestor.notes : '',
              dealSize: dbInvestor.deal_size || '1-3M',
              timeline: dbInvestor.timeline || 'Q2 2025',
              website: dbInvestor.website || null,
              headquarters: dbInvestor.headquarters || null,
              logo: dbInvestor.logo || null,
              probability: dbInvestor.probability_percent || 0,
              activities,
              documents: [],
              tasks,
            };
            grouped[stage].push(investor);
          });
          setPipeline(grouped);
        }
      } catch (error) {
        console.error('[FundraisingCRM] Error loading from database:', error);
        // Don't fallback to localStorage - all data must be in database
        setPipeline({ ...DEFAULT_PIPELINE });
      }
    };
    loadPipelineFromDatabase();
  }, [selectedUserId, profile?.id]);
  
  // Fetch users list for admin selector
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;
      try {
        const response = await apiService.get('/admin/users', { limit: '1000', is_active: '1' });
        if (response.success && response.data && Array.isArray(response.data)) {
          setUsers(response.data);
          // Set default to current user if not already set
          if (!selectedUserId && profile?.id) {
            setSelectedUserId(profile.id);
          }
        }
      } catch (error) {
        console.error('[FundraisingCRM] Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [isAdmin, profile?.id]);
  
  // Set default user on mount
  useEffect(() => {
    if (!selectedUserId && profile?.id) {
      setSelectedUserId(profile.id);
    }
  }, [profile?.id]);

  // Save investor changes to database
  const saveInvestorToDatabase = async (investor: Investor, stage: string) => {
    try {
      // Map our stages to database enum values (now they match)
      const stageMap: Record<string, string> = {
        'Leads': 'Lead',
        'Qualified': 'Qualified',
        'Meeting Set': 'Meeting Set',
        'Due Diligence': 'Due Diligence',
        'Term Sheet': 'Term Sheet',
        'Closed Won': 'Closed Won',
        'Closed Lost': 'Closed Lost',
      };
      const dbStage = stageMap[stage] || 'Lead';

      // Store activities and tasks in notes as JSON
      const notesData = {
        text: investor.notes || '',
        activities: investor.activities || [],
        tasks: investor.tasks || [],
      };

      const updateData: any = {
        name: investor.name,
        type: investor.type,
        focus: investor.focus,
        email: investor.email,
        phone: investor.phone,
        website: investor.website || null,
        headquarters: investor.headquarters || null,
        last_contact: investor.lastContact || null,
        notes: JSON.stringify(notesData),
        deal_size: investor.dealSize,
        timeline: investor.timeline,
        pipeline_stage: dbStage,
        probability_percent: investor.probability || 0,
      };

      if (investor.id && investor.id > 0 && !investor.id.toString().startsWith('temp')) {
        // Update existing
        await apiService.put(`/admin/crm-investors/${investor.id}`, updateData);
      } else {
        // Create new - allow admin to create for selected user
        const createData = { ...updateData };
        if (isAdmin && selectedUserId && selectedUserId !== profile?.id) {
          createData.user_id = selectedUserId;
        }
        const response = await apiService.post('/admin/crm-investors', createData);
        if (response.success && response.data?.id) {
          investor.id = response.data.id;
        }
      }
    } catch (error) {
      console.error('[FundraisingCRM] Error saving to database:', error);
    }
  };

  const allInvestors = useMemo(() => Object.values(pipeline).flat(), [pipeline]);
  const totalInvestors = allInvestors.length;
  const activeDeals = (pipeline['Due Diligence']?.length || 0) + (pipeline['Term Sheet']?.length || 0);
  const closedWon = pipeline['Closed Won']?.length || 0;
  const totalDealValue = useMemo(() => {
    return pipeline['Closed Won']?.reduce((sum, inv) => {
      const match = inv.dealSize.match(/[\d.]+/);
      return sum + (match ? parseFloat(match[0]) : 0);
    }, 0) || 0;
  }, [pipeline]);

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

  const conversionRate = totalInvestors > 0 ? ((closedWon / totalInvestors) * 100).toFixed(1) : '0.0';

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

  const allTasks = useMemo(() => {
    return allInvestors.flatMap(inv => (inv.tasks || []).map(t => ({ ...t, investorName: inv.name, investorId: inv.id })));
  }, [allInvestors]);

  const pendingTasks = useMemo(() => allTasks.filter(t => t.status === 'pending'), [allTasks]);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Leads': 'bg-slate-100 dark:bg-slate-800',
      'Qualified': 'bg-blue-100 dark:bg-blue-900/30',
      'Meeting Set': 'bg-cyan-100 dark:bg-cyan-900/30',
      'Due Diligence': 'bg-indigo-100 dark:bg-indigo-900/30',
      'Term Sheet': 'bg-purple-100 dark:bg-purple-900/30',
      'Closed Won': 'bg-emerald-100 dark:bg-emerald-900/30',
      'Closed Lost': 'bg-red-100 dark:bg-red-900/30',
    };
    return colors[stage] || 'bg-slate-100 dark:bg-slate-800';
  };

  const getStageAccent = (stage: string) => {
    const colors: Record<string, string> = {
      'Leads': 'bg-slate-500',
      'Qualified': 'bg-blue-500',
      'Meeting Set': 'bg-cyan-500',
      'Due Diligence': 'bg-indigo-500',
      'Term Sheet': 'bg-purple-500',
      'Closed Won': 'bg-emerald-500',
      'Closed Lost': 'bg-red-500',
    };
    return colors[stage] || 'bg-slate-500';
  };

  const changeStage = async (investor: Investor, fromStage: string, toStage: string) => {
    if (fromStage === toStage) return;
    setPipeline((prev) => {
      const next: Pipeline = {
        ...prev,
        [fromStage]: prev[fromStage].filter((i) => i.id !== investor.id),
        [toStage]: [...prev[toStage], investor],
      };
      return next;
    });
    // Save to database
    await saveInvestorToDatabase(investor, toStage);
  };

  const addInvestor = async (inv: Omit<Investor, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const newInvestor: Investor = { id: tempId as any, ...inv, activities: [], documents: [], tasks: [] };
    setPipeline((prev) => ({
      ...prev,
      'Leads': [newInvestor, ...prev['Leads']],
    }));
    // Save to database
    await saveInvestorToDatabase(newInvestor, 'Leads');
    // Reload from database to get the real ID
    const params: any = { limit: '500' };
    if (selectedUserId) {
      params.user_id = selectedUserId.toString();
    }
    const response = await apiService.get('/admin/crm-investors', params);
    if (response.success && response.data) {
      const latest = response.data.find((i: any) => i.name === inv.name && i.email === inv.email);
      if (latest) {
        setPipeline((prev) => {
          const next = { ...prev };
          const stage = 'Leads';
          next[stage] = next[stage].map(inv => inv.id === tempId ? { ...inv, id: latest.id } : inv);
          return next;
        });
      }
    }
  };

  const addInvestorFromDatabase = async (dbInvestor: any) => {
    const allCurrentIds = Object.values(pipeline).flat().map(i => i.investor_id).filter(Boolean);
    if (allCurrentIds.includes(dbInvestor.id)) {
      alert('This investor is already in your pipeline');
      return;
    }

    const focusSectors = Array.isArray(dbInvestor.focus_sectors)
      ? dbInvestor.focus_sectors.join(', ')
      : (typeof dbInvestor.focus_sectors === 'string' ? dbInvestor.focus_sectors : 'Healthcare');

    const investmentStages = Array.isArray(dbInvestor.investment_stages) ? dbInvestor.investment_stages : [];
    const stageType = investmentStages.length > 0 ? investmentStages[0] : (dbInvestor.type === 'VC' ? 'Series A' : 'Seed');

    const avgInvestment = dbInvestor.average_investment
      ? `$${(dbInvestor.average_investment / 1000000).toFixed(1)}M`
      : (dbInvestor.assets_under_management
          ? `$${(parseFloat(dbInvestor.assets_under_management) / 1000000).toFixed(0)}M+`
          : '1-5M');

    const investor: Investor = {
      id: `temp-${Date.now()}` as any,
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
      logo: dbInvestor.logo || dbInvestor.logo_url,
      activities: [],
      documents: [],
      tasks: [],
    };

    setPipeline((prev) => ({
      ...prev,
      'Leads': [investor, ...prev['Leads']],
    }));
    
    // Save to database
    await saveInvestorToDatabase(investor, 'Leads');
    
    // Reload to get real ID
    const params: any = { limit: '500' };
    if (selectedUserId) {
      params.user_id = selectedUserId.toString();
    }
    const response = await apiService.get('/admin/crm-investors', params);
    if (response.success && response.data) {
      const latest = response.data.find((i: any) => i.name === investor.name && (i.email === investor.email || !investor.email));
      if (latest) {
        setPipeline((prev) => {
          const next = { ...prev };
          const stage = 'Leads';
          next[stage] = next[stage].map(inv => inv.id === investor.id ? { ...inv, id: latest.id } : inv);
          return next;
        });
      }
    }
    
    setShowSelectInvestorModal(false);
    setInvestorSearchTerm('');
  };

  const addActivity = async (investorId: number, activity: Activity) => {
    let updatedInvestor: Investor | null = null;
    let investorStage = '';
    
    setPipeline((prev) => {
      const next = { ...prev };
      for (const [stage, investors] of Object.entries(next)) {
        const investor = investors.find(inv => inv.id === investorId);
        if (investor) {
          updatedInvestor = {
            ...investor,
            activities: [...(investor.activities || []), { ...activity, id: Date.now().toString() }],
            lastContact: activity.date,
          };
          investorStage = stage;
          next[stage] = investors.map(inv => inv.id === investorId ? updatedInvestor! : inv);
          break;
        }
      }
      return next;
    });
    
    // Save to database
    if (updatedInvestor && investorStage) {
      await saveInvestorToDatabase(updatedInvestor, investorStage);
    }
    
    setNewActivity({ type: 'note', title: '', date: new Date().toISOString().split('T')[0], description: '' });
    setShowActivityModal(false);
  };

  const addTask = async (investorId: number, task: Task) => {
    let updatedInvestor: Investor | null = null;
    let investorStage = '';
    
    setPipeline((prev) => {
      const next = { ...prev };
      for (const [stage, investors] of Object.entries(next)) {
        const investor = investors.find(inv => inv.id === investorId);
        if (investor) {
          updatedInvestor = {
            ...investor,
            tasks: [...(investor.tasks || []), { ...task, id: Date.now().toString() }],
          };
          investorStage = stage;
          next[stage] = investors.map(inv => inv.id === investorId ? updatedInvestor! : inv);
          break;
        }
      }
      return next;
    });
    
    // Save to database
    if (updatedInvestor && investorStage) {
      await saveInvestorToDatabase(updatedInvestor, investorStage);
    }
    
    setNewTask({ title: '', dueDate: '', status: 'pending', priority: 'medium' });
  };

  const deleteInvestor = async (investor: Investor, stage: string) => {
    if (!window.confirm(`Are you sure you want to delete "${investor.name}"? This action cannot be undone.`)) {
      return;
    }

    // Remove from UI immediately
    setPipeline((prev) => {
      const next = { ...prev };
      next[stage] = next[stage].filter((i) => i.id !== investor.id);
      return next;
    });

    // Delete from database if it has a real ID
    if (investor.id && investor.id > 0 && !investor.id.toString().startsWith('temp')) {
      try {
        await apiService.delete(`/admin/crm-investors/${investor.id}`);
        console.log('[FundraisingCRM] Investor deleted successfully');
      } catch (error) {
        console.error('[FundraisingCRM] Error deleting investor:', error);
        alert('Failed to delete investor. Please try again.');
        // Reload pipeline on error
        const params: any = { limit: '500' };
        if (selectedUserId) {
          params.user_id = selectedUserId.toString();
        }
        const response = await apiService.get('/admin/crm-investors', params);
        if (response.success && response.data) {
          const fetchedPipeline = transformInvestorsToPipeline(response.data);
          setPipeline(fetchedPipeline);
        }
      }
    }
  };


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

  const [newInv, setNewInv] = useState<Omit<Investor, 'id' | 'activities' | 'documents' | 'tasks'>>({
    name: '',
    type: 'Seed',
    focus: '',
    email: '',
    phone: '',
    lastContact: null,
    notes: '',
    dealSize: '1-3M',
    timeline: 'Q2 2025',
  });

  return (
    <div className="w-full space-y-3">
      {/* Top Bar: Tabs, Filters and Actions - Compact and Clean */}
      <div className="card-glass p-3 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Tabs */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'pipeline' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'tasks' ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Tasks {pendingTasks.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingTasks.length}</span>}
            </button>
          </div>

          {/* Filters - Only show on Pipeline tab */}
          {activeTab === 'pipeline' && (
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search investors..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[140px]"
              >
                <option value="">All stages</option>
                {Object.keys(pipeline).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[140px]"
              >
                <option value="">All types</option>
                {Array.from(new Set(allInvestors.map(i => i.type))).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* User Selector for Admins */}
          {isAdmin && users.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">View User:</label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 min-w-[200px]"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name} (${user.email})`
                      : user.email || `User ${user.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Add Investor Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowSelectInvestorModal(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Investor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between flex-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Investors</p>
                <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{totalInvestors}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between flex-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Active Deals</p>
                <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{activeDeals}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-indigo-50/50 dark:bg-indigo-950/30">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between flex-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Closed Won</p>
                <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">{closedWon}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div className="card-glass p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-between flex-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Value</p>
                <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-1">${totalDealValue.toFixed(1)}M</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'pipeline' && (
        <div className="relative w-full">
          {/* Left scroll indicator */}
          {showLeftScroll && (
            <div className="absolute left-0 top-0 bottom-16 sm:bottom-4 w-10 sm:w-12 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 z-10 pointer-events-none flex items-center justify-start pl-1 sm:pl-2">
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 dark:text-cyan-400 drop-shadow-lg animate-pulse" />
            </div>
          )}
          
          {/* Right scroll indicator */}
          {showRightScroll && (
            <div className="absolute right-0 top-0 bottom-16 sm:bottom-4 w-10 sm:w-12 bg-gradient-to-l from-slate-50 via-slate-50/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 z-10 pointer-events-none flex items-center justify-end pr-1 sm:pr-2">
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 dark:text-cyan-400 drop-shadow-lg animate-pulse" />
            </div>
          )}
          
          {/* Scrollable pipeline container */}
          <div 
            ref={pipelineScrollRef}
            className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-slate-200 dark:scrollbar-track-slate-700"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#06b6d4 #e2e8f0',
              WebkitOverflowScrolling: 'touch'
            }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const { scrollLeft, scrollWidth, clientWidth } = target;
              setShowLeftScroll(scrollLeft > 10);
              setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
            }}
          >
            <div className="flex gap-3 min-w-max px-1" style={{ minWidth: 'max-content' }}>
            {Object.entries(filteredPipeline).map(([stage, investors]) => (
              <div key={stage} className="card-glass rounded-lg flex flex-col w-[260px] sm:w-[280px] md:w-[300px] flex-shrink-0 h-[calc(100vh-250px)] sm:h-[calc(100vh-280px)] md:h-[calc(100vh-300px)] max-h-[800px] shadow-soft">
              <div className={`h-1 w-full rounded-t ${getStageAccent(stage)}`}></div>
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex-shrink-0">
                <h3 className="font-medium text-slate-700 dark:text-slate-200 text-sm text-center">{stage}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">{investors.length} investor{investors.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                {investors.length === 0 ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 border-dashed rounded-lg p-4 text-center">
                    <div className="mb-2 opacity-50">📋</div>
                    <div>No investors</div>
                  </div>
                ) : (
                  investors.map((investor) => (
                    <div
                      key={investor.id}
                      className="card-glass p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border border-slate-200/50 dark:border-slate-700/50"
                      onClick={() => setSelectedInvestor(investor)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {investor.logo ? (
                          <img src={investor.logo} alt={investor.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">{investor.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1">{investor.name}</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteInvestor(investor, stage);
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                              title="Delete investor"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                          <span className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium mt-1">
                            {investor.type}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-2">
                        {investor.focus && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{investor.focus}</p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Deal Size</span>
                          <span className="font-medium text-cyan-600 dark:text-cyan-400">{investor.dealSize}</span>
                        </div>
                        {investor.lastContact && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Last: {new Date(investor.lastContact).toLocaleDateString()}
                          </p>
                        )}
                        {investor.activities && investor.activities.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Activity className="h-3 w-3" />
                            <span>{investor.activities.length} activities</span>
                          </div>
                        )}
                        {investor.tasks && investor.tasks.filter(t => t.status === 'pending').length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>{investor.tasks.filter(t => t.status === 'pending').length} pending tasks</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <select
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => changeStage(investor, stage, e.target.value)}
                          value={stage}
                        >
                          {Object.keys(pipeline).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
            </div>
          </div>
          
          {/* Scroll hint text - only show if there's content to scroll */}
          {(showLeftScroll || showRightScroll) && (
            <div className="mt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 animate-pulse">
                <ChevronLeft className="h-3 w-3" />
                <span className="hidden sm:inline">Scroll horizontally to view all pipeline stages</span>
                <span className="sm:hidden">Swipe to see more</span>
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="card-glass p-4 rounded-lg">
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Pipeline Distribution
            </h3>
            <div className="space-y-2">
              {Object.entries(pipeline).map(([stage, investors]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getStageAccent(stage)}`}></div>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStageAccent(stage)}`}
                        style={{ width: `${totalInvestors > 0 ? (investors.length / totalInvestors) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-8 text-right">{investors.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-glass p-4 rounded-lg">
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Key Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</span>
                <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400">{conversionRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Average Deal Size</span>
                <span className="text-lg font-medium text-cyan-600 dark:text-cyan-400">${avgDealSize.toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Pipeline Value</span>
                <span className="text-lg font-medium text-indigo-600 dark:text-indigo-400">${(avgDealSize * totalInvestors).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Win Rate</span>
                <span className="text-lg font-medium text-purple-600 dark:text-purple-400">
                  {activeDeals > 0 ? ((closedWon / (closedWon + (pipeline['Closed Lost']?.length || 0))) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {pendingTasks.length === 0 ? (
            <div className="card-glass p-8 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No pending tasks</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="card-glass p-4 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      task.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">For: {task.investorName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Investor Detail Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedInvestor(null)}>
          <div className="card-glass p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {selectedInvestor.logo ? (
                  <img src={selectedInvestor.logo} alt={selectedInvestor.name} className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-lg" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl items-center justify-center border-2 border-cyan-600/20 flex-shrink-0 shadow-lg flex">
                    <span className="text-white font-medium text-2xl mx-auto">{selectedInvestor.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-medium text-slate-700 dark:text-slate-200 mb-2">{selectedInvestor.name}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                      {selectedInvestor.type}
                    </span>
                    {selectedInvestor.headquarters && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedInvestor.headquarters}</span>
                      </div>
                    )}
                    {selectedInvestor.website && (
                      <a href={selectedInvestor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium">
                        <ExternalLink className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedInvestor(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
              {['Overview', 'Activities', 'Tasks', 'Documents'].map((tab) => (
                <button key={tab} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 border-b-2 border-transparent hover:border-cyan-500">
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab Content */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <div className="card-glass p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Deal Size</p>
                <p className="text-xl font-medium text-cyan-600 dark:text-cyan-400">{selectedInvestor.dealSize}</p>
              </div>
              <div className="card-glass p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Timeline</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedInvestor.timeline}</p>
              </div>
              <div className="card-glass p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Focus</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{selectedInvestor.focus}</p>
              </div>
              <div className="card-glass p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Last Contact</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {selectedInvestor.lastContact ? new Date(selectedInvestor.lastContact).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-6">
              <h4 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">Contact Information</h4>
              <div className="card-glass p-4 rounded-lg space-y-2">
                {selectedInvestor.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <a href={`mailto:${selectedInvestor.email}`} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm">
                      {selectedInvestor.email}
                    </a>
                  </div>
                )}
                {selectedInvestor.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200 text-sm">{selectedInvestor.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedInvestor.notes && (
              <div className="mb-6">
                <h4 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">Notes</h4>
                <div className="card-glass p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedInvestor.notes}</p>
                </div>
              </div>
            )}

            {/* Activities */}
            {selectedInvestor.activities && selectedInvestor.activities.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-medium text-slate-700 dark:text-slate-200">Activities</h4>
                  <button onClick={() => setShowActivityModal(true)} className="btn-primary-elevated px-3 py-1.5 text-sm flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Activity</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedInvestor.activities.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((activity) => (
                    <div key={activity.id} className="card-glass p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {activity.type === 'email' && <Mail className="h-4 w-4 text-cyan-500" />}
                            {activity.type === 'meeting' && <Calendar className="h-4 w-4 text-indigo-500" />}
                            {activity.type === 'call' && <Phone className="h-4 w-4 text-emerald-500" />}
                            {activity.type === 'note' && <FileText className="h-4 w-4 text-amber-500" />}
                            {activity.type === 'document' && <Paperclip className="h-4 w-4 text-purple-500" />}
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{activity.title}</span>
                          </div>
                          {activity.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(activity.date).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => { setShowActivityModal(true); }} className="btn-primary-elevated px-4 py-2.5 rounded-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Activity</span>
              </button>
              <button onClick={() => { addTask(selectedInvestor.id, { ...newTask, id: Date.now().toString() }); }} className="btn-outline px-4 py-2.5 rounded-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </button>
              <button onClick={() => setSelectedInvestor(null)} className="btn-outline px-4 py-2.5 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showActivityModal && selectedInvestor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowActivityModal(false)}>
          <div className="card-glass p-6 max-w-xl w-full shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">Add Activity</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Type</label>
                <select value={newActivity.type} onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as any })} className="input w-full">
                  <option value="note">Note</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title</label>
                <input type="text" value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date</label>
                <input type="date" value={newActivity.date} onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <textarea value={newActivity.description || ''} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} rows={3} className="input w-full" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { addActivity(selectedInvestor.id, { ...newActivity, id: Date.now().toString() }); }} className="btn-primary-elevated flex-1 px-4 py-2.5 rounded-lg">
                  Add Activity
                </button>
                <button onClick={() => setShowActivityModal(false)} className="btn-outline px-4 py-2.5 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Investor Modal - Keep existing implementation but with modern design */}
      {showSelectInvestorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowSelectInvestorModal(false); setInvestorSearchTerm(''); }}>
          <div className="card-glass p-6 max-w-4xl w-full max-h-[600px] overflow-hidden flex flex-col shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">Select Investor from Platform</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose an investor from the database to add to your CRM pipeline</p>
              </div>
              <button onClick={() => { setShowSelectInvestorModal(false); setInvestorSearchTerm(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  className="input pl-10 w-full"
                  placeholder="Search investors by name, sector, or location..."
                  value={investorSearchTerm}
                  onChange={(e) => setInvestorSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-700 rounded-lg">
              {loadingInvestors ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading investors...</div>
              ) : filteredDatabaseInvestors.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  {investorSearchTerm ? 'No investors found matching your search' : 'No investors available in the database'}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredDatabaseInvestors.map((inv) => {
                    const focusSectors = Array.isArray(inv.focus_sectors)
                      ? inv.focus_sectors.slice(0, 3).join(', ')
                      : (typeof inv.focus_sectors === 'string' ? inv.focus_sectors : 'Healthcare');
                    const allCurrentIds = Object.values(pipeline).flat().map(i => i.investor_id).filter(Boolean);
                    const isInPipeline = allCurrentIds.includes(inv.id);

                    return (
                      <div
                        key={inv.id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isInPipeline ? 'opacity-50' : ''}`}
                        onClick={() => !isInPipeline && addInvestorFromDatabase(inv)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-700 dark:text-slate-200">{inv.name}</h4>
                              {isInPipeline && (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">Already in pipeline</span>
                              )}
                            </div>
                            {inv.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">{inv.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {focusSectors && <span className="chip">{focusSectors}</span>}
                              {inv.headquarters && <span className="chip">{inv.headquarters}</span>}
                              {inv.type && <span className="chip">{inv.type}</span>}
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
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredDatabaseInvestors.length} of {databaseInvestors.length} investors
              </p>
              <button
                className="btn-outline px-4 py-2 rounded-lg"
                onClick={() => { setShowSelectInvestorModal(false); setInvestorSearchTerm(''); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundraisingCRMPage;
