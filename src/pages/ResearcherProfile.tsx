import React, { useState } from 'react';
import { Microscope, FileText, Calendar, MapPin, Plus, X, Edit, Save, Lock, GraduationCap } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const ResearcherProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const { profile: userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : (userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'Dr. Amina Hassan'),
    affiliation: 'University of Lagos',
    department: 'Biomedical Engineering',
    location: userProfile?.city && userProfile?.country ? `${userProfile.city}, ${userProfile.country}` : 'Lagos, Nigeria',
    website: userProfile?.website || 'https://example.edu/~amina',
    interests: ['AI Diagnostics', 'Telemedicine', 'Epidemiology'],
  });
  const [publications, setPublications] = useState<Array<{ title: string; venue: string; year: string }>>([
    { title: 'AI-based malaria screening in rural clinics', venue: 'MedAI 2024', year: '2024' },
  ]);
  const [newPub, setNewPub] = useState({ title: '', venue: '', year: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const nameParts = profile.name.trim().split(' ');
      const updateData: any = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        website: profile.website,
      };
      
      if (profile.location) {
        const locationParts = profile.location.split(',').map(s => s.trim());
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

        {/* Researcher Status with Edit Button */}
        <div className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-purple-500 dark:to-pink-500 shadow-lg border border-slate-200 dark:border-transparent flex-shrink-0">
                <Microscope className="h-5 w-5 text-purple-600 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Researcher Profile</h3>
                <p className="text-sm text-slate-900 dark:text-slate-400">Manage your research profile and publications</p>
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

        <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Name</label>
              {isEditing ? (
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={profile.name}
                  onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-slate-900 dark:text-slate-200">{profile.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Affiliation</label>
              {isEditing ? (
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={profile.affiliation}
                  onChange={(e) => setProfile(p => ({ ...p, affiliation: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-slate-900 dark:text-slate-200">{profile.affiliation}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Department</label>
              {isEditing ? (
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={profile.department}
                  onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-slate-900 dark:text-slate-200">{profile.department}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Location</label>
              {isEditing ? (
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={profile.location}
                  onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                />
              ) : (
                <p className="text-sm text-slate-900 dark:text-slate-200">{profile.location}</p>
              )}
            </div>
            <div className="col-span-1 sm:col-span-2">
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
          </div>
        </div>

        <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200">Publications</h3>
            <button
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-3">
            {publications.map((p, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
                <div className="font-medium text-slate-900 dark:text-slate-200 text-sm mb-1">{p.title}</div>
                <div className="text-xs text-slate-900 dark:text-slate-400">{p.venue} • {p.year}</div>
              </div>
            ))}
          </div>
        </div>

        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-200">Add Publication</h4>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Title"
                  value={newPub.title}
                  onChange={(e) => setNewPub(p => ({ ...p, title: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Venue"
                  value={newPub.venue}
                  onChange={(e) => setNewPub(p => ({ ...p, venue: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Year"
                  value={newPub.year}
                  onChange={(e) => setNewPub(p => ({ ...p, year: e.target.value }))}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium hover:shadow-lg shadow-cyan-500/30 transition-all duration-200"
                    onClick={() => {
                      if (!newPub.title || !newPub.venue || !newPub.year) return;
                      setPublications(prev => [{ ...newPub }, ...prev]);
                      setShowAdd(false);
                      setNewPub({ title: '', venue: '', year: '' });
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md text-center">
            <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-lg mx-auto mb-3 w-fit border border-slate-200 dark:border-transparent">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-white" />
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5 font-medium">Publications</p>
            <p className="text-2xl font-medium text-slate-900 dark:text-slate-200">{publications.length}</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md text-center">
            <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-lg mx-auto mb-3 w-fit border border-slate-200 dark:border-transparent">
              <Calendar className="h-5 w-5 text-cyan-600 dark:text-white" />
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5 font-medium">Conferences</p>
            <p className="text-2xl font-medium text-slate-900 dark:text-slate-200">3</p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md text-center">
            <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-lg mx-auto mb-3 w-fit border border-slate-200 dark:border-transparent">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-white" />
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5 font-medium">Location</p>
            <p className="text-2xl font-medium text-slate-900 dark:text-slate-200">{profile.location}</p>
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

export default ResearcherProfile;
