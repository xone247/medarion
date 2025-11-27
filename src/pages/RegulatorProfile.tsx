import React, { useState } from 'react';
import { Shield, Building2, Globe, Target, Users, Plus, X, Edit, Save, FileText, CheckCircle, Lock } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const RegulatorProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const { profile: userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initiatives, setInitiatives] = useState<Array<{ title: string; owner: string; status: string }>>([
    { title: 'Digital Health Policy Framework', owner: 'Policy Team', status: 'Active' },
    { title: 'Clinical Trial Oversight', owner: 'Regulatory Affairs', status: 'Planning' },
  ]);
  const [profile, setProfile] = useState({
    orgName: userProfile?.companyName || userProfile?.company_name || 'Health Regulatory Authority',
    role: 'Senior Regulatory Officer',
    website: userProfile?.website || 'https://hra.example',
    hq: userProfile?.city && userProfile?.country ? `${userProfile.city}, ${userProfile.country}` : 'Nairobi, Kenya',
    focus: ['Policy Development', 'Compliance Monitoring', 'Regulatory Oversight'],
  });
  const [newItem, setNewItem] = useState({ title: '', owner: '', status: 'Planning' });
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

        {/* Regulator Status with Edit Button */}
        <div className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-blue-500 dark:to-indigo-500 shadow-lg border border-slate-200 dark:border-transparent flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Regulator Profile</h3>
                <p className="text-sm text-slate-900 dark:text-slate-400">Regulatory oversight and policy management</p>
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
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/30 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-200">Profile Information</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Organization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.orgName}
                      onChange={(e) => setProfile({ ...profile, orgName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.orgName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <a href={profile.website} className="text-cyan-600 dark:text-cyan-400 hover:underline text-sm">{profile.website}</a>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Headquarters</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.hq}
                      onChange={(e) => setProfile({ ...profile, hq: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.hq}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Focus Areas</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {profile.focus.map((focus, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={focus}
                            onChange={(e) => {
                              const newFocus = [...profile.focus];
                              newFocus[index] = e.target.value;
                              setProfile({ ...profile, focus: newFocus });
                            }}
                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <button
                            onClick={() => {
                              const newFocus = profile.focus.filter((_, i) => i !== index);
                              setProfile({ ...profile, focus: newFocus });
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setProfile({ ...profile, focus: [...profile.focus, ''] })}
                        className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Focus Area</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.focus.map((focus, index) => (
                        <span key={index} className="px-2.5 py-1 bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-medium">
                          {focus}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Regulatory Initiatives */}
          <div className="lg:col-span-2">
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-base font-medium text-slate-900 dark:text-slate-200">Regulatory Initiatives</h3>
                </div>
                <button
                  onClick={() => setShowNew(!showNew)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Initiative</span>
                </button>
              </div>

              {showNew && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-5 bg-white dark:bg-slate-800/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Title</label>
                      <input
                        type="text"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter initiative title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Owner</label>
                      <input
                        type="text"
                        value={newItem.owner}
                        onChange={(e) => setNewItem({ ...newItem, owner: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter owner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Status</label>
                      <select
                        value={newItem.status}
                        onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        if (newItem.title && newItem.owner) {
                          setInitiatives([...initiatives, newItem]);
                          setNewItem({ title: '', owner: '', status: 'Planning' });
                          setShowNew(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium hover:shadow-lg shadow-cyan-500/30 transition-all duration-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNewItem({ title: '', owner: '', status: 'Planning' });
                        setShowNew(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {initiatives.map((initiative, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-200 text-sm">{initiative.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          initiative.status === 'Active' 
                            ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                            : initiative.status === 'Completed'
                            ? 'bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300'
                        }`}>
                          {initiative.status}
                        </span>
                        <button
                          onClick={() => {
                            const newInitiatives = initiatives.filter((_, i) => i !== index);
                            setInitiatives(newInitiatives);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-slate-400">Owner: {initiative.owner}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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

export default RegulatorProfile;
