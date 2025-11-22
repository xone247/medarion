import React, { useState } from 'react';
import { Shield, Building2, Globe, Target, Users, Plus, X, Edit, Save, FileText, CheckCircle } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

const RegulatorProfile: React.FC = () => {
  const { navigateToModule } = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [initiatives, setInitiatives] = useState<Array<{ title: string; owner: string; status: string }>>([
    { title: 'Digital Health Policy Framework', owner: 'Policy Team', status: 'Active' },
    { title: 'Clinical Trial Oversight', owner: 'Regulatory Affairs', status: 'Planning' },
  ]);
  const [profile, setProfile] = useState({
    orgName: 'Health Regulatory Authority',
    role: 'Senior Regulatory Officer',
    website: 'https://hra.example',
    hq: 'Nairobi, Kenya',
    focus: ['Policy Development', 'Compliance Monitoring', 'Regulatory Oversight'],
  });
  const [newItem, setNewItem] = useState({ title: '', owner: '', status: 'Planning' });
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Header */}
      <div className="border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Regulator Profile</h1>
                <p className="mt-1 text-[var(--color-text-secondary)]">Regulatory oversight and policy management</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[var(--color-primary-teal)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span>{isEditing ? 'Save' : 'Edit'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="h-6 w-6 text-[var(--color-primary-teal)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Organization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.orgName}
                      onChange={(e) => setProfile({...profile, orgName: e.target.value})}
                      className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.orgName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => setProfile({...profile, role: e.target.value})}
                      className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                    />
                  ) : (
                    <a href={profile.website} className="text-[var(--color-primary-teal)] hover:underline">{profile.website}</a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Headquarters</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.hq}
                      onChange={(e) => setProfile({...profile, hq: e.target.value})}
                      className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                    />
                  ) : (
                    <p className="text-[var(--color-text-primary)]">{profile.hq}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Focus Areas</label>
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
                              setProfile({...profile, focus: newFocus});
                            }}
                            className="flex-1 px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                          />
                          <button
                            onClick={() => {
                              const newFocus = profile.focus.filter((_, i) => i !== index);
                              setProfile({...profile, focus: newFocus});
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setProfile({...profile, focus: [...profile.focus, '']})}
                        className="flex items-center space-x-2 text-[var(--color-primary-teal)] hover:underline"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Focus Area</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.focus.map((focus, index) => (
                        <span key={index} className="px-2 py-1 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] rounded-full text-sm">
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
            <div className="bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-divider-gray)] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Target className="h-6 w-6 text-[var(--color-primary-teal)]" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Regulatory Initiatives</h3>
                </div>
                <button
                  onClick={() => setShowNew(!showNew)}
                  className="flex items-center space-x-2 px-3 py-2 bg-[var(--color-primary-teal)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Initiative</span>
                </button>
              </div>

              {showNew && (
                <div className="border border-[var(--color-divider-gray)] rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
                      <input
                        type="text"
                        value={newItem.title}
                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                        className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                        placeholder="Enter initiative title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Owner</label>
                      <input
                        type="text"
                        value={newItem.owner}
                        onChange={(e) => setNewItem({...newItem, owner: e.target.value})}
                        className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                        placeholder="Enter owner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Status</label>
                      <select
                        value={newItem.status}
                        onChange={(e) => setNewItem({...newItem, status: e.target.value})}
                        className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)]"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (newItem.title && newItem.owner) {
                          setInitiatives([...initiatives, newItem]);
                          setNewItem({ title: '', owner: '', status: 'Planning' });
                          setShowNew(false);
                        }
                      }}
                      className="px-4 py-2 bg-[var(--color-primary-teal)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNewItem({ title: '', owner: '', status: 'Planning' });
                        setShowNew(false);
                      }}
                      className="px-4 py-2 bg-[var(--color-background-default)] text-[var(--color-text-secondary)] border border-[var(--color-divider-gray)] rounded-lg hover:bg-[var(--color-background-surface)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {initiatives.map((initiative, index) => (
                  <div key={index} className="border border-[var(--color-divider-gray)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-[var(--color-text-primary)]">{initiative.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          initiative.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : initiative.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {initiative.status}
                        </span>
                        <button
                          onClick={() => {
                            const newInitiatives = initiatives.filter((_, i) => i !== index);
                            setInitiatives(newInitiatives);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Owner: {initiative.owner}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatorProfile;
