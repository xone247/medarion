import React, { useState } from 'react';
import { Shield, Building2, Users, Settings, Crown, Star, Globe, Mail, Phone, MapPin, Calendar, Edit, Save, X, Plus, Lock } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';

const AdminProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'Super Admin',
    email: 'superadmin@demo.medarion.com',
    role: 'Super Administrator',
    companyName: 'Medarion Platform',
    phone: '+1 (555) 123-4567',
    location: 'Global',
    bio: 'Platform administrator with full access to all system features and user management capabilities.',
    permissions: ['User Management', 'Content Management', 'System Configuration', 'Analytics Access', 'Security Controls'],
    lastLogin: '2025-01-26T10:30:00Z',
    accountCreated: '2024-01-01T00:00:00Z'
  });

  const [newPermission, setNewPermission] = useState('');
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, you'd send this data to your backend
    console.log('Admin profile saved:', profile);
  };

  const handleAddPermission = () => {
    if (newPermission.trim()) {
      setProfile(prev => ({
        ...prev,
        permissions: [...prev.permissions, newPermission.trim()]
      }));
      setNewPermission('');
      setShowAddPermission(false);
    }
  };

  const handleRemovePermission = (permission: string) => {
    setProfile(prev => ({
      ...prev,
      permissions: prev.permissions.filter(p => p !== permission)
    }));
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
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Edit Button */}
        <div className="flex justify-end">
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="btn-primary-elevated px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Admin Status */}
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)]">
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success)] text-white border border-[color-mix(in_srgb,var(--color-success),black_10%)]">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
              <Shield className="h-8 w-8 mx-auto text-[var(--color-primary-teal)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">Admin Level</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">Super</p>
            </div>
            <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
              <Calendar className="h-8 w-8 mx-auto text-[var(--color-primary-teal)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">Last Login</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {new Date(profile.lastLogin).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm text-center">
              <Building2 className="h-8 w-8 mx-auto text-[var(--color-primary-teal)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">Platform</p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">Medarion</p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">System Permissions</h3>
            {isEditing && (
              <button
                onClick={() => setShowAddPermission(true)}
                className="btn-primary-elevated btn-sm flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Permission
              </button>
            )}
          </div>

          {showAddPermission && (
            <div className="bg-[var(--color-background-default)] p-4 rounded-lg border border-[var(--color-divider-gray)] mb-4">
              <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-3">Add New Permission</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Permission name"
                  value={newPermission}
                  onChange={(e) => setNewPermission(e.target.value)}
                  className="input flex-1"
                />
                <button
                  onClick={handleAddPermission}
                  className="btn-primary-elevated px-3 py-2 rounded-lg"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddPermission(false);
                    setNewPermission('');
                  }}
                  className="btn-outline px-3 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.permissions.map((permission, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-[var(--color-background-default)] p-3 rounded-lg border border-[var(--color-divider-gray)]"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-[var(--color-primary-teal)]" />
                  <span className="text-[var(--color-text-primary)] font-medium">{permission}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemovePermission(permission)}
                    className="text-[var(--color-error)] hover:text-[var(--color-error-dark)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-background-surface)] p-6 rounded-lg border border-[var(--color-divider-gray)] shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigateToModule('admin-dashboard')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-[var(--color-primary-teal)] hover:text-white transition-colors"
            >
              <Building2 className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">Admin Dashboard</p>
            </button>
            <button
              onClick={() => navigateToModule('users-manager-dashboard')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-[var(--color-primary-teal)] hover:text-white transition-colors"
            >
              <Users className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">User Management</p>
            </button>
            <button
              onClick={() => navigateToModule('blog-manager-dashboard')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-[var(--color-primary-teal)] hover:text-white transition-colors"
            >
              <Settings className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">Content Management</p>
            </button>
            <button
              onClick={() => navigateToModule('settings')}
              className="btn-outline p-4 rounded-lg text-center hover:bg-[var(--color-primary-teal)] hover:text-white transition-colors"
            >
              <Settings className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">System Settings</p>
            </button>
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

export default AdminProfile;
