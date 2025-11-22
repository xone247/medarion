import React, { useState } from 'react';
import { Users, DollarSign, TrendingUp, Globe, Link2, Building2, FileText, Plus, X, Edit, Save, Lock } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';

const InvestorProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [profile, setProfile] = useState({
    firmName: 'Pan-Africa Ventures',
    website: 'https://panafricaventures.example',
    aum: '120000000',
    hq: 'Nairobi, Kenya',
    thesis: 'Backing transformative African healthtech founders at Seed–Series A',
    focusSectors: ['Health Tech', 'AI Diagnostics', 'Telemedicine'],
    focusStages: ['Seed', 'Series A'],
    focusGeos: ['Kenya', 'Nigeria', 'Ghana', 'Egypt'],
  });

  const [recentDeals, setRecentDeals] = useState<Array<{ company: string; amount: string; stage: string; date: string }>>([
    { company: 'HealthTech Solutions', amount: '$2.5M', stage: 'Seed', date: '2025-02-14' },
    { company: 'CareLink Africa', amount: '$1.2M', stage: 'Pre-Seed', date: '2024-11-02' },
  ]);

  const [newDeal, setNewDeal] = useState({ company: '', amount: '', stage: 'Seed', date: '' });

  const handleSave = () => setIsEditing(false);

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medarionAuthToken') || 'test-token'}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  };

  return (
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Edit Button */}
        <div className="flex justify-end">
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="btn-primary-elevated px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
        </div>

      {/* Firm Overview */}
      <div className="grid grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Firm Overview</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Firm Name</label>
              {isEditing ? (
                <input className="input" value={profile.firmName} onChange={(e)=>setProfile(p=>({...p, firmName: e.target.value}))} />
              ) : (
                <p className="text-[var(--color-text-primary)] font-medium">{profile.firmName}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Website</label>
                {isEditing ? (
                  <input className="input" value={profile.website} onChange={(e)=>setProfile(p=>({...p, website: e.target.value}))} />
                ) : (
                  <a className="text-[var(--color-primary-teal)] underline text-sm" href={profile.website} target="_blank" rel="noreferrer">
                    {profile.website}
                  </a>
                )}
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">AUM (USD)</label>
                {isEditing ? (
                  <input className="input" value={profile.aum} onChange={(e)=>setProfile(p=>({...p, aum: e.target.value}))} />
                ) : (
                  <p className="text-[var(--color-text-primary)]">${parseInt(profile.aum).toLocaleString()}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Headquarters</label>
                {isEditing ? (
                  <input className="input" value={profile.hq} onChange={(e)=>setProfile(p=>({...p, hq: e.target.value}))} />
                ) : (
                  <p className="text-[var(--color-text-primary)]">{profile.hq}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Investment Thesis</label>
              {isEditing ? (
                <textarea className="input" rows={3} value={profile.thesis} onChange={(e)=>setProfile(p=>({...p, thesis: e.target.value}))} />
              ) : (
                <p className="text-[var(--color-text-secondary)]">{profile.thesis}</p>
              )}
            </div>
          </div>
        </div>

        {/* Snapshot */}
        <div className="space-y-4">
          <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Investment Focus</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[var(--color-primary-teal)]" />Stages: <span className="text-[var(--color-text-secondary)]">{profile.focusStages.join(', ')}</span></div>
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[var(--color-primary-teal)]" />Sectors: <span className="text-[var(--color-text-secondary)]">{profile.focusSectors.join(', ')}</span></div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-[var(--color-primary-teal)]" />Geographies: <span className="text-[var(--color-text-secondary)]">{profile.focusGeos.join(', ')}</span></div>
            </div>
          </div>
          <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <a className="flex items-center gap-2 text-[var(--color-primary-teal)]" href="#"><Link2 className="h-4 w-4" />Firm Deck</a>
              <a className="flex items-center gap-2 text-[var(--color-primary-teal)]" href="#"><FileText className="h-4 w-4" />LP One-Pager</a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Deals</h3>
          <button className="btn-outline px-3 py-2 rounded" onClick={()=>setShowAddDeal(true)}><Plus className="h-4 w-4 inline mr-2"/>Add Deal</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {recentDeals.map((d, i)=> (
            <div key={i} className="p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--color-text-primary)]">{d.company}</span>
                <span className="text-[var(--color-primary-teal)] font-semibold">{d.amount}</span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">{d.stage} • {new Date(d.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {showAddDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-background-surface)] rounded-lg p-6 w-full max-w-md border border-[var(--color-divider-gray)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-[var(--color-text-primary)]">Add Recent Deal</h4>
              <button onClick={()=>setShowAddDeal(false)} className="text-[var(--color-text-secondary)]"><X className="h-4 w-4"/></button>
            </div>
            <div className="space-y-2">
              <input className="input" placeholder="Company" value={newDeal.company} onChange={(e)=>setNewDeal(p=>({...p, company: e.target.value}))} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Amount (e.g. $2.0M)" value={newDeal.amount} onChange={(e)=>setNewDeal(p=>({...p, amount: e.target.value}))} />
                <input className="input" placeholder="Stage" value={newDeal.stage} onChange={(e)=>setNewDeal(p=>({...p, stage: e.target.value}))} />
              </div>
              <input className="input" type="date" value={newDeal.date} onChange={(e)=>setNewDeal(p=>({...p, date: e.target.value}))} />
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-outline px-3 py-2 rounded" onClick={()=>setShowAddDeal(false)}>Cancel</button>
                <button className="btn-primary px-3 py-2 rounded" onClick={()=>{ if(!newDeal.company||!newDeal.amount||!newDeal.date) return; setRecentDeals(prev=>[{...newDeal}, ...prev]); setShowAddDeal(false); setNewDeal({ company:'', amount:'', stage:'Seed', date:''}); }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <DollarSign className="h-5 w-5 mx-auto text-[var(--color-primary-teal)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Total AUM</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">${parseInt(profile.aum).toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-[var(--color-primary-teal)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Deals (12m)</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{recentDeals.length}</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Globe className="h-5 w-5 mx-auto text-[var(--color-primary-teal)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Regions</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{profile.focusGeos.length}</p>
        </div>
      </div>
      </div>

      {/* Account Security Section */}
      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center space-x-2">
          <Lock className="h-5 w-5 text-[var(--color-primary-teal)]" />
          <span>Account Security</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Password</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Last changed: Never</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary-teal)] text-white hover:opacity-90 transition-colors flex items-center space-x-2 border border-[color-mix(in_srgb,var(--color-primary-teal),black_10%)]"
            >
              <Lock className="h-4 w-4" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
};

export default InvestorProfile; 