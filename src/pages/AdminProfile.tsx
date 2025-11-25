import React, { useState, useEffect } from 'react';
import { Shield, Building2, Users, Settings, Crown, Star, Globe, Mail, Phone, MapPin, Calendar, Edit, Save, X, Plus, Lock } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import apiService from '../services/apiService';

const AdminProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const { profile: userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
      const appRoles = (userProfile as any).app_roles || [];
      const isAdmin = (userProfile as any).is_admin || (userProfile as any).role === 'admin';
      
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
        permissions: appRoles.length > 0 ? appRoles : ['User Management', 'Content Management', 'System Configuration', 'Analytics Access', 'Security Controls'],
        lastLogin: (userProfile as any).lastLogin || new Date().toISOString(),
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
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Edit Button */}
        <div className="flex justify-end">
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={loading}
            className="btn-primary-elevated px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Admin Status */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-[var(--color-primary-teal)]" />
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Super Administrator</h3>
                <p className="text-[var(--color-text-secondary)]">Full platform access and control</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--color-text-secondary)]">Account Status</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 dark:bg-green-600 text-white border border-green-600 dark:border-green-500">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card-glass p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Company</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.companyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.location}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="input min-h-[100px]"
                  />
                ) : (
                  <p className="text-[var(--color-text-primary)]">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[var(--color-background-surface)] p-6 rounded-xl border border-gray-200 dark:border-[var(--color-divider-gray)] shadow-soft text-center">
              <Shield className="h-8 w-8 mx-auto text-[var(--color-primary-teal)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">Admin Level</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">Super</p>
            </div>
            <div className="bg-white dark:bg-[var(--color-background-surface)] p-6 rounded-xl border border-gray-200 dark:border-[var(--color-divider-gray)] shadow-soft text-center">
              <Calendar className="h-8 w-8 mx-auto text-[var(--color-primary-teal)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">Last Login</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {new Date(profile.lastLogin).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white dark:bg-[var(--color-background-surface)] p-6 rounded-xl border border-gray-200 dark:border-[var(--color-divider-gray)] shadow-soft text-center">
              <Building2 className="h-8 w-8 mx-auto text-[var(--color-primary-teal)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">Platform</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">Medarion</p>
            </div>
          </div>
        </div>

        {/* Permissions - Read Only */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">System Permissions</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Managed by system administrators</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile.permissions.length > 0 ? (
              profile.permissions.map((permission, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-[var(--color-background-default)] p-3 rounded-lg border border-[var(--color-divider-gray)]"
                >
                  <Shield className="h-4 w-4 text-[var(--color-primary-teal)]" />
                  <span className="text-[var(--color-text-primary)] font-medium">{permission}</span>
                </div>
              ))
            ) : (
              <p className="text-[var(--color-text-secondary)] col-span-full">No permissions assigned</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-glass p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 grid-cols-4 gap-4">
            <button
              onClick={() => navigateToModule('admin-dashboard')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              <Building2 className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">Admin Dashboard</p>
            </button>
            <button
              onClick={() => navigateToModule('users-manager-dashboard')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              <Users className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">User Management</p>
            </button>
            <button
              onClick={() => navigateToModule('blog-manager-dashboard')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              <Settings className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">Content Management</p>
            </button>
            <button
              onClick={() => navigateToModule('settings')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              <Settings className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">System Settings</p>
            </button>
          </div>
        </div>
      </div>

      {/* Account Security Section */}
      <div className="bg-white dark:bg-[var(--color-background-surface)] p-6 rounded-xl border border-gray-200 dark:border-[var(--color-divider-gray)] shadow-soft">
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
              className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 dark:hover:opacity-80 transition-colors flex items-center space-x-2 border border-black dark:border-white"
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

export default AdminProfile;
