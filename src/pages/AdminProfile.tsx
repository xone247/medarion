import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, Settings, Crown, Star, Globe, Mail, Phone, MapPin, Calendar, Edit, Save, X, Plus, Lock, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import apiService from '../services/apiService';

const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const { profile: userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Redirect non-admins to their correct profile pages
  useEffect(() => {
    if (userProfile) {
      const userType = (userProfile as any).user_type || (userProfile as any).role || '';
      const isAdmin = (userProfile as any).is_admin === true || 
                      userType === 'admin' || 
                      ((userProfile as any).app_roles && (
                        typeof (userProfile as any).app_roles === 'string' 
                          ? JSON.parse((userProfile as any).app_roles) 
                          : (userProfile as any).app_roles
                      )?.includes('super_admin'));
      
      if (!isAdmin) {
        if (userType === 'startup') {
          navigate('/startup-profile', { replace: true });
        } else if (userType === 'investor' || userType === 'investors_finance') {
          navigate('/investor-profile', { replace: true });
        } else if (userType === 'researcher' || userType === 'health_science_experts') {
          navigate('/researcher-profile', { replace: true });
        } else if (userType === 'executive' || userType === 'industry_executives') {
          navigate('/executive-profile', { replace: true });
        } else if (userType === 'regulator') {
          navigate('/regulator-profile', { replace: true });
        } else {
          navigate('/startup-profile', { replace: true });
        }
      }
    }
  }, [userProfile, navigate]);
  
  // Initialize profile from userProfile data
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: '',
    companyName: '',
    phone: '',
    location: '',
    bio: '',
    permissions: [] as string[],
    lastLogin: '',
    accountCreated: ''
  });

  // Load profile data from userProfile
  useEffect(() => {
    if (userProfile) {
      const firstName = (userProfile as any).firstName || (userProfile as any).first_name || '';
      const lastName = (userProfile as any).lastName || (userProfile as any).last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Admin User';
      const isAdmin = (userProfile as any).is_admin === true || (userProfile as any).role === 'admin';
      
      // Get actual permissions from app_roles or determine from is_admin
      let permissions: string[] = [];
      if (isAdmin) {
        permissions = ['Super Administrator', 'User Management', 'Content Management', 'System Configuration', 'Data Management', 'Analytics Access', 'Security Controls'];
      } else {
        const appRoles = (userProfile as any).app_roles;
        if (Array.isArray(appRoles)) {
          permissions = appRoles;
        } else if (typeof appRoles === 'string') {
          try {
            permissions = JSON.parse(appRoles);
          } catch {
            permissions = appRoles.split(',').map((r: string) => r.trim());
          }
        }
        if (permissions.length === 0) {
          permissions = ['Administrator'];
        }
      }
      
      setProfile({
        fullName,
        email: (userProfile as any).email || '',
        role: isAdmin ? 'Super Administrator' : (userProfile as any).role || 'Administrator',
        companyName: (userProfile as any).companyName || (userProfile as any).company_name || '',
        phone: (userProfile as any).phone || '',
        location: (userProfile as any).city && (userProfile as any).country 
          ? `${(userProfile as any).city}, ${(userProfile as any).country}`
          : (userProfile as any).country || (userProfile as any).city || 'Not set',
        bio: (userProfile as any).bio || 'Platform administrator with full access to all system features and user management capabilities.',
        permissions,
        lastLogin: (userProfile as any).lastLogin || (userProfile as any).last_login || new Date().toISOString(),
        accountCreated: (userProfile as any).createdAt || (userProfile as any).created_at || new Date().toISOString()
      });
    }
  }, [userProfile]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Split fullName into firstName and lastName
      const nameParts = profile.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Extract location parts
      const locationParts = profile.location.split(',').map(s => s.trim());
      const city = locationParts[0] || '';
      const country = locationParts[1] || locationParts[0] || '';
      
      // Prepare update data
      const updateData: any = {
        firstName,
        lastName,
        companyName: profile.companyName,
        phone: profile.phone,
        bio: profile.bio
      };
      
      if (city) updateData.city = city;
      if (country) updateData.country = country;
      
      // Save to API
      await apiService.put('/auth/profile', updateData);
      
      // Refresh profile
      if (refreshProfile) {
        await refreshProfile();
      }
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
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
      <div className="space-y-4">
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
        
        {/* Admin Status with Edit Button */}
        <div className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-lg border border-slate-200 dark:border-transparent flex-shrink-0">
                <Crown className="h-5 w-5 text-amber-600 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Super Administrator</h3>
                <p className="text-sm text-slate-900 dark:text-slate-400">Full platform access and control</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5">Account Status</p>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                  Active
                </span>
              </div>
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white dark:text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:from-cyan-600 hover:to-teal-700 shadow-cyan-500/30 transition-all duration-200 whitespace-nowrap"
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

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Profile Information</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Company</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.companyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 dark:text-slate-200">{profile.location}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500 shadow-lg mx-auto mb-3 w-fit border border-slate-200 dark:border-transparent">
                <Shield className="h-5 w-5 text-indigo-600 dark:text-white" />
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5 font-medium">Admin Level</p>
              <p className="text-xl font-medium text-slate-900 dark:text-slate-200">Super</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-lg mx-auto mb-3 w-fit border border-slate-200 dark:border-transparent">
                <Calendar className="h-5 w-5 text-cyan-600 dark:text-white" />
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5 font-medium">Last Login</p>
              <p className="text-base font-medium text-slate-900 dark:text-slate-200">
                {new Date(profile.lastLogin).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-lg mx-auto mb-3 w-fit border border-slate-200 dark:border-transparent">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-white" />
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-400 mb-1.5 font-medium">Platform</p>
              <p className="text-base font-medium text-slate-900 dark:text-slate-200">Medarion</p>
            </div>
          </div>
        </div>

        {/* Permissions - Read Only */}
        <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200">System Permissions</h3>
            <p className="text-xs text-slate-900 dark:text-slate-400">Managed by system administrators</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile.permissions.length > 0 ? (
              profile.permissions.map((permission, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2.5 bg-white dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                >
                  <Shield className="h-4 w-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                  <span className="text-sm text-slate-900 dark:text-slate-200 font-medium truncate">{permission}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-900 dark:text-slate-400 col-span-full">No permissions assigned</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 transition-all group"
            >
              <div className="p-2 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg mx-auto mb-3 w-fit group-hover:bg-cyan-200 dark:group-hover:bg-cyan-500/50 transition-colors">
                <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200">Admin Dashboard</p>
            </button>
            <button
              onClick={() => navigate('/admin-dashboard?tab=users')}
              className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg mx-auto mb-3 w-fit group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/50 transition-colors">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200">User Management</p>
            </button>
            <button
              onClick={() => navigate('/admin-dashboard?tab=data-management')}
              className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center hover:shadow-lg hover:border-rose-300 dark:hover:border-rose-700 transition-all group"
            >
              <div className="p-2 bg-rose-100 dark:bg-rose-500/30 rounded-lg mx-auto mb-3 w-fit group-hover:bg-rose-200 dark:group-hover:bg-rose-500/50 transition-colors">
                <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200">Data Management</p>
            </button>
            <button
              onClick={() => navigate('/admin-dashboard?tab=overview')}
              className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
            >
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg mx-auto mb-3 w-fit group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/50 transition-colors">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-slate-200">Analytics</p>
            </button>
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white dark:text-white font-medium flex items-center gap-2 hover:shadow-lg hover:from-cyan-600 hover:to-teal-700 shadow-cyan-500/30 transition-all duration-200 whitespace-nowrap"
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

export default AdminProfile;
