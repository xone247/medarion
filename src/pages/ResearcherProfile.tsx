import React, { useState } from 'react';
import { Microscope, FileText, Calendar, MapPin, Plus, X, Edit, Save, Lock } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';

const ResearcherProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Dr. Amina Hassan',
    affiliation: 'University of Lagos',
    department: 'Biomedical Engineering',
    location: 'Lagos, Nigeria',
    website: 'https://example.edu/~amina',
    interests: ['AI Diagnostics', 'Telemedicine', 'Epidemiology'],
  });
  const [publications, setPublications] = useState<Array<{ title: string; venue: string; year: string }>>([
    { title: 'AI-based malaria screening in rural clinics', venue: 'MedAI 2024', year: '2024' },
  ]);
  const [newPub, setNewPub] = useState({ title: '', venue: '', year: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Edit Button */}
        <div className="flex justify-end">
          <button
            className="btn-primary-elevated px-4 py-2 rounded-lg flex items-center space-x-2"
            onClick={()=>setIsEditing(!isEditing)}
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing?'Save Changes':'Edit Profile'}</span>
          </button>
        </div>

      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Name</label>
            {isEditing ? <input className="input" value={profile.name} onChange={(e)=>setProfile(p=>({...p, name:e.target.value}))} /> : <p className="text-[var(--color-text-primary)]">{profile.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Affiliation</label>
            {isEditing ? <input className="input" value={profile.affiliation} onChange={(e)=>setProfile(p=>({...p, affiliation:e.target.value}))} /> : <p className="text-[var(--color-text-primary)]">{profile.affiliation}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Department</label>
            {isEditing ? <input className="input" value={profile.department} onChange={(e)=>setProfile(p=>({...p, department:e.target.value}))} /> : <p className="text-[var(--color-text-primary)]">{profile.department}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Location</label>
            {isEditing ? <input className="input" value={profile.location} onChange={(e)=>setProfile(p=>({...p, location:e.target.value}))} /> : <p className="text-[var(--color-text-primary)]">{profile.location}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Website</label>
            {isEditing ? <input className="input" value={profile.website} onChange={(e)=>setProfile(p=>({...p, website:e.target.value}))} /> : <a className="text-[var(--color-primary-teal)] underline text-sm" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>}
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Publications</h3>
          <button className="btn-outline px-3 py-2 rounded" onClick={()=>setShowAdd(true)}><Plus className="h-4 w-4 inline mr-2"/>Add</button>
        </div>
        <div className="space-y-2">
          {publications.map((p, idx)=> (
            <div key={idx} className="p-3 bg-[var(--color-background-default)] rounded-lg border border-[var(--color-divider-gray)]">
              <div className="font-medium text-[var(--color-text-primary)]">{p.title}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{p.venue} • {p.year}</div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-background-surface)] rounded-lg p-6 w-full max-w-md border border-[var(--color-divider-gray)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-[var(--color-text-primary)]">Add Publication</h4>
              <button onClick={()=>setShowAdd(false)} className="text-[var(--color-text-secondary)]"><X className="h-4 w-4"/></button>
            </div>
            <div className="space-y-2">
              <input className="input" placeholder="Title" value={newPub.title} onChange={(e)=>setNewPub(p=>({...p, title:e.target.value}))} />
              <input className="input" placeholder="Venue" value={newPub.venue} onChange={(e)=>setNewPub(p=>({...p, venue:e.target.value}))} />
              <input className="input" placeholder="Year" value={newPub.year} onChange={(e)=>setNewPub(p=>({...p, year:e.target.value}))} />
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-outline px-3 py-2 rounded" onClick={()=>setShowAdd(false)}>Cancel</button>
                <button className="btn-primary px-3 py-2 rounded" onClick={()=>{ if(!newPub.title||!newPub.venue||!newPub.year) return; setPublications(prev=>[{...newPub}, ...prev]); setShowAdd(false); setNewPub({ title:'', venue:'', year:''}); }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <FileText className="h-5 w-5 mx-auto text-[var(--color-primary-teal)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Publications</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{publications.length}</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <Calendar className="h-5 w-5 mx-auto text-[var(--color-primary-teal)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Conferences</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">3</p>
        </div>
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
          <MapPin className="h-5 w-5 mx-auto text-[var(--color-primary-teal)]" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Location</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{profile.location}</p>
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
  );
};

export default ResearcherProfile; 