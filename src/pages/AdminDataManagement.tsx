import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Save, 
  X, 
  Eye,
  BarChart3,
  Users,
  Building2,
  DollarSign,
  Microscope,
  Globe,
  Shield,
  Activity,
  Bot,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Types for admin data management
interface AdminTable {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  columns: AdminColumn[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
}

interface AdminColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'json' | 'boolean';
  required?: boolean;
  options?: string[];
  editable?: boolean;
}

interface AdminRecord {
  id: number;
  [key: string]: any;
}

const AdminDataManagement: React.FC = () => {
  const { profile } = useAuth();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; recordId: number | null; onConfirm: () => void }>({ isOpen: false, recordId: null, onConfirm: () => {} });
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Check if user has admin permissions
  const isAdmin = profile?.is_admin || (profile as any)?.app_roles?.includes('super_admin');
  
  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="card-glass shadow-soft p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-[var(--color-error)]" />
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Access Denied</h2>
          <p className="text-[var(--color-text-secondary)]">You need admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

  // Define all admin tables with their configurations
  const adminTables: AdminTable[] = [
    {
      name: 'companies',
      displayName: 'Companies',
      icon: <Building2 className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'name', label: 'Company Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'website', label: 'Website', type: 'text' },
        { key: 'sector', label: 'Sector', type: 'select', options: ['AI Diagnostics', 'Telemedicine', 'Health Insurance', 'Pharma Supply Chain', 'Biotechnology', 'Medical Devices', 'Mental Health Tech', 'Genomics', 'Public Health', 'Logistics'] },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'stage', label: 'Stage', type: 'select', options: ['idea', 'mvp', 'early', 'growth', 'mature'] },
        { key: 'total_funding', label: 'Total Funding', type: 'number' },
        { key: 'employees_count', label: 'Employees', type: 'number' },
        { key: 'is_active', label: 'Active', type: 'boolean' }
      ]
    },
    {
      name: 'deals',
      displayName: 'Deals',
      icon: <DollarSign className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'company_name', label: 'Company', type: 'text', required: true },
        { key: 'deal_type', label: 'Type', type: 'select', options: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Private Equity', 'Grant', 'Acquisition'] },
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'sector', label: 'Sector', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'deal_date', label: 'Date', type: 'date', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['announced', 'closed', 'pending', 'cancelled'] },
        { key: 'lead_investor', label: 'Lead Investor', type: 'text' }
      ]
    },
    {
      name: 'grants',
      displayName: 'Grants',
      icon: <FileText className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'funding_agency', label: 'Funding Agency', type: 'text', required: true },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'grant_type', label: 'Type', type: 'select', options: ['Research', 'Innovation', 'Development', 'Capacity Building', 'Pilot', 'Scale-up'] },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'sector', label: 'Sector', type: 'text' },
        { key: 'application_deadline', label: 'Deadline', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed', 'awarded', 'completed'] }
      ]
    },
    {
      name: 'investors',
      displayName: 'Investors',
      icon: <Users className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['VC', 'PE', 'Angel', 'Corporate', 'Government', 'Foundation', 'Accelerator'] },
        { key: 'headquarters', label: 'Headquarters', type: 'text' },
        { key: 'website', label: 'Website', type: 'text' },
        { key: 'assets_under_management', label: 'AUM', type: 'number' },
        { key: 'team_size', label: 'Team Size', type: 'number' },
        { key: 'contact_email', label: 'Email', type: 'text' },
        { key: 'is_active', label: 'Active', type: 'boolean' }
      ]
    },
    {
      name: 'clinical_trials',
      displayName: 'Clinical Trials',
      icon: <Microscope className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'phase', label: 'Phase', type: 'select', options: ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Preclinical', 'Research'] },
        { key: 'indication', label: 'Indication', type: 'text' },
        { key: 'sponsor', label: 'Sponsor', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['Recruiting', 'Active', 'Completed', 'Suspended', 'Terminated', 'Not Yet Recruiting'] },
        { key: 'start_date', label: 'Start Date', type: 'date' },
        { key: 'end_date', label: 'End Date', type: 'date' }
      ]
    },
    {
      name: 'regulatory_bodies',
      displayName: 'Regulatory Bodies',
      icon: <Shield className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'country', label: 'Country', type: 'text', required: true },
        { key: 'abbreviation', label: 'Abbreviation', type: 'text' },
        { key: 'website', label: 'Website', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'is_active', label: 'Active', type: 'boolean' }
      ]
    },
    {
      name: 'clinical_centers',
      displayName: 'Clinical Centers',
      icon: <Building2 className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'country', label: 'Country', type: 'text', required: true },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'website', label: 'Website', type: 'text' },
        { key: 'capacity_patients', label: 'Capacity', type: 'number' },
        { key: 'is_active', label: 'Active', type: 'boolean' }
      ]
    },
    {
      name: 'investigators',
      displayName: 'Investigators',
      icon: <Users className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'institution', label: 'Institution', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'trial_count', label: 'Trial Count', type: 'number' },
        { key: 'is_active', label: 'Active', type: 'boolean' }
      ]
    },
    {
      name: 'public_stocks',
      displayName: 'Public Stocks',
      icon: <BarChart3 className="w-5 h-5" />,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'company_name', label: 'Company', type: 'text', required: true },
        { key: 'ticker', label: 'Ticker', type: 'text', required: true },
        { key: 'exchange', label: 'Exchange', type: 'text', required: true },
        { key: 'price', label: 'Price', type: 'text' },
        { key: 'market_cap', label: 'Market Cap', type: 'text' },
        { key: 'country', label: 'Country', type: 'text' }
      ]
    },
    {
      name: 'ai_usage_log',
      displayName: 'AI Usage Log',
      icon: <Bot className="w-5 h-5" />,
      canCreate: false,
      canEdit: false,
      canDelete: true,
      canImport: false,
      canExport: true,
      columns: [
        { key: 'id', label: 'ID', type: 'number', editable: false },
        { key: 'user_id', label: 'User ID', type: 'number', editable: false },
        { key: 'tool_name', label: 'Tool', type: 'text', editable: false },
        { key: 'tokens_used', label: 'Tokens', type: 'number', editable: false },
        { key: 'cost_usd', label: 'Cost (USD)', type: 'number', editable: false },
        { key: 'success', label: 'Success', type: 'boolean', editable: false },
        { key: 'created_at', label: 'Created', type: 'date', editable: false }
      ]
    }
  ];

  // Load records for selected table
  useEffect(() => {
    if (selectedTable) {
      loadRecords();
    }
  }, [selectedTable, filters]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      // Mock data loading - replace with actual API calls
      const mockData = getMockDataForTable(selectedTable);
      setRecords(mockData);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockDataForTable = (tableName: string): AdminRecord[] => {
    // Return mock data based on table name
    switch (tableName) {
      case 'companies':
        return [
          { id: 1, name: 'AfyaConnect', sector: 'Telemedicine', country: 'Kenya', stage: 'growth', total_funding: 3200000, employees_count: 25, is_active: true },
          { id: 2, name: 'RxChain', sector: 'Pharma Supply Chain', country: 'Nigeria', stage: 'growth', total_funding: 5500000, employees_count: 45, is_active: true },
          { id: 3, name: 'DiagnosTech', sector: 'AI Diagnostics', country: 'South Africa', stage: 'growth', total_funding: 8000000, employees_count: 60, is_active: true }
        ];
      case 'deals':
        return [
          { id: 1, company_name: 'AfyaConnect', deal_type: 'Seed', amount: 3200000, sector: 'Telemedicine', country: 'Kenya', deal_date: '2024-07-15', status: 'closed', lead_investor: 'Savannah Capital' },
          { id: 2, company_name: 'RxChain', deal_type: 'Series A', amount: 5500000, sector: 'Pharma Supply Chain', country: 'Nigeria', deal_date: '2024-08-20', status: 'closed', lead_investor: 'Pan-African Health Ventures' }
        ];
      case 'investors':
        return [
          { id: 1, name: 'Savannah Capital', type: 'VC', headquarters: 'Nairobi, Kenya', website: 'https://savannahcapital.com', assets_under_management: 50000000, team_size: 12, is_active: true },
          { id: 2, name: 'Pan-African Health Ventures', type: 'VC', headquarters: 'Lagos, Nigeria', website: 'https://pahv.com', assets_under_management: 75000000, team_size: 15, is_active: true }
        ];
      default:
        return [];
    }
  };

  const handleCreate = async (data: any) => {
    try {
      // Mock creation - replace with actual API call
      const newRecord = { id: Date.now(), ...data };
      setRecords([...records, newRecord]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      // Mock update - replace with actual API call
      setRecords(records.map(record => record.id === id ? { ...record, ...data } : record));
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      recordId: id,
      onConfirm: async () => {
        try {
          // Mock deletion - replace with actual API call
          setRecords(records.filter(record => record.id !== id));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting record:', error);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      // Mock export - replace with actual API call
      const dataStr = JSON.stringify(records, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTable}_export.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImport = async (file: File) => {
    try {
      // Mock import - replace with actual API call
      const text = await file.text();
      const importedData = JSON.parse(text);
      setRecords([...records, ...importedData]);
      setShowImportModal(false);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    return Object.values(record).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentTable = adminTables.find(table => table.name === selectedTable);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="card-glass shadow-soft p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-[var(--color-primary-teal)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Admin Data Management</h1>
              <p className="text-[var(--color-text-secondary)]">Manage all platform data and AI integrations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline">
              <Activity className="w-4 h-4" />
              Analytics
            </button>
            <button className="btn-primary">
              <Bot className="w-4 h-4" />
              AI Settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Table Selection Sidebar */}
        <div className="card-glass shadow-soft p-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Data Tables</h3>
          <div className="space-y-2">
            {adminTables.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedTable === table.name
                    ? 'bg-[var(--color-primary-teal)] text-white'
                    : 'hover:bg-[var(--color-background-default)] text-[var(--color-text-primary)]'
                }`}
              >
                {table.icon}
                <span className="font-medium">{table.displayName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedTable ? (
            <div className="card-glass shadow-soft">
              {/* Table Header */}
              <div className="p-6 border-b border-[var(--color-divider-gray)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {currentTable?.icon}
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      {currentTable?.displayName}
                    </h2>
                    <span className="px-2 py-1 bg-[var(--color-background-default)] rounded text-sm text-[var(--color-text-secondary)]">
                      {filteredRecords.length} records
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTable?.canExport && (
                      <div className="relative">
                        <button className="btn-outline">
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]">
                          <button onClick={() => handleExport('csv')} className="block w-full text-left px-3 py-2 hover:bg-gray-50">CSV</button>
                          <button onClick={() => handleExport('json')} className="block w-full text-left px-3 py-2 hover:bg-gray-50">JSON</button>
                          <button onClick={() => handleExport('xlsx')} className="block w-full text-left px-3 py-2 hover:bg-gray-50">Excel</button>
                        </div>
                      </div>
                    )}
                    {currentTable?.canImport && (
                      <button onClick={() => setShowImportModal(true)} className="btn-outline">
                        <Upload className="w-4 h-4" />
                        Import
                      </button>
                    )}
                    {currentTable?.canCreate && (
                      <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Add New
                      </button>
                    )}
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <button className="btn-outline">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-teal)] mx-auto"></div>
                    <p className="text-[var(--color-text-secondary)] mt-2">Loading records...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[var(--color-background-default)]">
                      <tr>
                        {currentTable?.columns.map((column) => (
                          <th key={column.key} className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)]">
                            {column.label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-primary)]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b border-[var(--color-divider-gray)] hover:bg-[var(--color-background-default)]">
                          {currentTable?.columns.map((column) => (
                            <td key={column.key} className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                              {column.type === 'boolean' ? (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  record[column.key] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {record[column.key] ? 'Yes' : 'No'}
                                </span>
                              ) : (
                                String(record[column.key] || '-')
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingRecord(record)}
                                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-teal)]"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="card-glass shadow-soft p-8 text-center">
              <Database className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-secondary)]" />
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Select a Data Table</h3>
              <p className="text-[var(--color-text-secondary)]">Choose a table from the sidebar to start managing data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRecord) && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-glass shadow-elevated p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {editingRecord ? 'Edit Record' : 'Create New Record'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRecord(null);
                }}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = Object.fromEntries(formData.entries());
              
              if (editingRecord) {
                handleUpdate(editingRecord.id, data);
              } else {
                handleCreate(data);
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                {currentTable.columns
                  .filter(col => col.editable !== false)
                  .map((column) => (
                    <div key={column.key}>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                        {column.label}
                        {column.required && <span className="text-[var(--color-error)] ml-1">*</span>}
                      </label>
                      {column.type === 'textarea' ? (
                        <textarea
                          name={column.key}
                          defaultValue={editingRecord?.[column.key] || ''}
                          required={column.required}
                          className="input h-20 resize-none"
                        />
                      ) : column.type === 'select' ? (
                        <select
                          name={column.key}
                          defaultValue={editingRecord?.[column.key] || ''}
                          required={column.required}
                          className="input"
                        >
                          <option value="">Select {column.label}</option>
                          {column.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : column.type === 'boolean' ? (
                        <select
                          name={column.key}
                          defaultValue={editingRecord?.[column.key] ? '1' : '0'}
                          className="input"
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      ) : (
                        <input
                          type={column.type === 'date' ? 'date' : column.type === 'number' ? 'number' : 'text'}
                          name={column.key}
                          defaultValue={editingRecord?.[column.key] || ''}
                          required={column.required}
                          className="input"
                        />
                      )}
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRecord(null);
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4" />
                  {editingRecord ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-glass shadow-elevated p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Import Data</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImport(file);
                    }
                  }}
                  className="input"
                />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Supported formats: CSV, JSON, Excel (.xlsx)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      onConfirm={confirmModal.onConfirm}
      title="Delete Record"
      message="Are you sure you want to delete this record? This action cannot be undone."
      variant="danger"
    />
  </>
  );
};

export default AdminDataManagement;


