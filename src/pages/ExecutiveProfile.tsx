import React, { useState } from 'react';
import { Briefcase, Building2, Globe, Target, Users, Plus, X, Edit, Save, Lock } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';

const ExecutiveProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [initiatives, setInitiatives] = useState<Array<{ title: string; owner: string; status: string }>>([
    { title: 'Hospital digitization program', owner: 'Innovation Team', status: 'Active' },
    { title: 'Telemedicine rollout', owner: 'Strategy', status: 'Planned' },
  ]);
  const [profile, setProfile] = useState({
    orgName: 'Continental Health Group',
    role: 'Head of Strategy',
    website: 'https://chgroup.example',
    hq: 'Johannesburg, South Africa',
    focus: ['Public Markets', 'M&A/Partnerships', 'Supply Chain'],
  });
  const [newItem, setNewItem] = useState({ title: '', owner: '', status: 'Planned' });
  const [showNew, setShowNew] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Edit Button */}
        <div className="flex justify-end">
          <button
            onClick={()=>setIsEditing(!isEditing)}
            className="btn-primary-elevated px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing?'Save Changes':'Edit Profile'}</span>
          </button>
        </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Organization</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Organization Name</label>
              {isEditing ? (
                <input className="input" value={profile.orgName} onChange={(e)=>setProfile(p=>({...p, orgName:e.target.value}))} />
              ) : (
                <p className="text-[var(--color-text-primary)]">{profile.orgName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Role</label>
              {isEditing ? (
                <input className="input" value={profile.role} onChange={(e)=>setProfile(p=>({...p, role:e.target.value}))} />
              ) : (
                <p className="text-[var(--color-text-primary)]">{profile.role}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Website</label>
              {isEditing ? (
                <input className="input" value={profile.website} onChange={(e)=>setProfile(p=>({...p, website:e.target.value}))} />
              ) : (
                <a className="text-[var(--color-primary-teal)] underline text-sm" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>
              )}
            </div>
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Headquarters</label>
              {isEditing ? (
                <input className="input" value={profile.hq} onChange={(e)=>setProfile(p=>({...p, hq:e.target.value}))} />
              ) : (
                <p className="text-[var(--color-text-primary)]">{profile.hq}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Focus Areas</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[var(--color-primary-teal)]" />Focus: <span className="text-[var(--color-text-secondary)]">{profile.focus.join(', ')}</span></div>
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[var(--color-primary-teal)]" />M&A / Partnerships</div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-[var(--color-primary-teal)]" />Global Strategy</div>
            </div>
          </div>
          <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Teams</h4>
            <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-[var(--color-primary-teal)]" /> Strategy, Innovation, Corporate Dev</div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Strategic Initiatives</h3>
          <button className="btn-outline px-3 py-2 rounded" onClick={()=>setShowNew(true)}><Plus className="h-4 w-4 inline mr-2"/>Add Initiative</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {initiatives.map((i, idx)=> (
            <div key={idx} className="p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
              <div className="font-medium text-[var(--color-text-primary)]">{i.title}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Owner: {i.owner} • {i.status}</div>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-background-surface)] rounded-lg p-6 w-full max-w-md border border-[var(--color-divider-gray)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-[var(--color-text-primary)]">Add Initiative</h4>
              <button onClick={()=>setShowNew(false)} className="text-[var(--color-text-secondary)]"><X className="h-4 w-4"/></button>
            </div>
            <div className="space-y-2">
              <input className="input" placeholder="Title" value={newItem.title} onChange={(e)=>setNewItem(p=>({...p, title:e.target.value}))} />
              <input className="input" placeholder="Owner" value={newItem.owner} onChange={(e)=>setNewItem(p=>({...p, owner:e.target.value}))} />
              <input className="input" placeholder="Status" value={newItem.status} onChange={(e)=>setNewItem(p=>({...p, status:e.target.value}))} />
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-outline px-3 py-2 rounded" onClick={()=>setShowNew(false)}>Cancel</button>
                <button className="btn-primary px-3 py-2 rounded" onClick={()=>{ if(!newItem.title) return; setInitiatives(prev=>[{...newItem}, ...prev]); setShowNew(false); setNewItem({ title:'', owner:'', status:'Planned'}); }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        onSubmit={async (currentPassword: string, newPassword: string) => {
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
        }}
      />
      </div>
    </div>
  );
};

export default ExecutiveProfile; 