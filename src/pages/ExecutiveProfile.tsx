import React, { useState } from 'react';
import { Briefcase, Building2, Globe, Target, Users, Plus, X, Edit, Save, Lock, Calendar } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const ExecutiveProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const { profile: userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initiatives, setInitiatives] = useState<Array<{ title: string; owner: string; status: string }>>([
    { title: 'Hospital digitization program', owner: 'Innovation Team', status: 'Active' },
    { title: 'Telemedicine rollout', owner: 'Strategy', status: 'Planned' },
  ]);
  const [profile, setProfile] = useState({
    orgName: userProfile?.companyName || userProfile?.company_name || 'Continental Health Group',
    role: 'Head of Strategy',
    website: userProfile?.website || 'https://chgroup.example',
    hq: userProfile?.city && userProfile?.country ? `${userProfile.city}, ${userProfile.country}` : 'Johannesburg, South Africa',
    focus: ['Public Markets', 'M&A/Partnerships', 'Supply Chain'],
  });
  const [newItem, setNewItem] = useState({ title: '', owner: '', status: 'Planned' });
  const [showNew, setShowNew] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updateData: any = {
        companyName: profile.orgName,
        website: profile.website,
      };
      
      if (profile.hq) {
        const locationParts = profile.hq.split(',').map(s => s.trim());
        if (locationParts[0]) updateData.city = locationParts[0];
        if (locationParts[1]) updateData.country = locationParts[1];
      }
      
      await apiService.put('/auth/profile', updateData);
      if (refreshProfile) await refreshProfile();
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="w-full">
      {/* Profile Content */}
      <div className="space-y-5">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Organization Status with Edit Button */}
        <div className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-lg border border-slate-200 dark:border-transparent flex-shrink-0">
                <Briefcase className="h-5 w-5 text-indigo-600 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Executive Profile</h3>
                <p className="text-sm text-slate-900 dark:text-slate-400">Manage your organization and strategic initiatives</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg shadow-cyan-500/30 transition-all duration-200 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Organization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Organization Name</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={profile.orgName}
                    onChange={(e) => setProfile(p => ({ ...p, orgName: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.orgName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Role</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={profile.role}
                    onChange={(e) => setProfile(p => ({ ...p, role: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.role}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Website</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={profile.website}
                    onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
                  />
                ) : (
                  <a className="text-cyan-600 dark:text-cyan-400 underline text-sm hover:text-cyan-700 dark:hover:text-cyan-300" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Headquarters</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={profile.hq}
                    onChange={(e) => setProfile(p => ({ ...p, hq: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.hq}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-4">Focus Areas</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg">
                    <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">Focus:</span>
                    <span className="text-slate-900 dark:text-slate-400 ml-1">{profile.focus.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg">
                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-slate-900 dark:text-slate-200">M&A / Partnerships</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg">
                    <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-slate-900 dark:text-slate-200">Global Strategy</span>
                </div>
              </div>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-4">Teams</h4>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-500/30 rounded-lg">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-slate-900 dark:text-slate-200">Strategy, Innovation, Corporate Dev</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200">Strategic Initiatives</h3>
            <button
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
              onClick={() => setShowNew(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Initiative</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {initiatives.map((i, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
                <div className="font-medium text-slate-900 dark:text-slate-200 text-sm mb-1">{i.title}</div>
                <div className="text-xs text-slate-900 dark:text-slate-400">Owner: {i.owner} • {i.status}</div>
              </div>
            ))}
          </div>
        </div>

        {showNew && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-200">Add Initiative</h4>
                <button onClick={() => setShowNew(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Title"
                  value={newItem.title}
                  onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Owner"
                  value={newItem.owner}
                  onChange={(e) => setNewItem(p => ({ ...p, owner: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Status"
                  value={newItem.status}
                  onChange={(e) => setNewItem(p => ({ ...p, status: e.target.value }))}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setShowNew(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium hover:shadow-lg shadow-cyan-500/30 transition-all duration-200"
                    onClick={() => {
                      if (!newItem.title) return;
                      setInitiatives(prev => [{ ...newItem }, ...prev]);
                      setShowNew(false);
                      setNewItem({ title: '', owner: '', status: 'Planned' });
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Security Section */}
        <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5 flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/30 rounded-lg">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span>Account Security</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">Password</p>
                <p className="text-xs text-slate-900 dark:text-slate-400">Last changed: Never</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium flex items-center gap-2 hover:shadow-lg shadow-cyan-500/30 transition-all duration-200 whitespace-nowrap"
              >
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </button>
            </div>
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

export default ExecutiveProfile; 
