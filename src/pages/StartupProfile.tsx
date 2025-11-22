import React, { useState, useEffect } from 'react';
import { User, Edit, Save, Building2, MapPin, Globe, Users, DollarSign, Calendar, Upload, FileText, UserPlus, X, Plus, Lightbulb, Lock } from 'lucide-react';
import AISidePanel from '../components/ai/AISidePanel';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const StartupProfile = () => {
  const { navigateToModule } = useNavigation();
  const { profile: userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPitchDeckModal, setShowPitchDeckModal] = useState(false);
  const [showFinancialsModal, setShowFinancialsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAISidePanel, setShowAISidePanel] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Initialize profile from userProfile data
  const [profile, setProfile] = useState<{
    companyName: string;
    tagline: string;
    description: string;
    sector: string;
    stage: string;
    founded: string;
    location: string;
    website: string;
    teamSize: string;
    fundingGoal: string;
    currentFunding: string;
    keyMetrics: {
      revenue: string;
      customers: string;
      growth: string;
    };
    [key: string]: any;
  }>({
    companyName: userProfile?.companyName || userProfile?.company_name || 'Startup Company',
    tagline: userProfile?.bio || 'Your company tagline',
    description: userProfile?.bio || 'Describe your startup and mission',
    sector: 'Healthcare',
    stage: 'Early Stage',
    founded: userProfile?.createdAt ? new Date(userProfile.createdAt).getFullYear().toString() : '2020',
    location: userProfile?.city && userProfile?.country ? `${userProfile.city}, ${userProfile.country}` : 'Location not set',
    website: userProfile?.website || '',
    teamSize: '1',
    fundingGoal: '1000000',
    currentFunding: '0',
    keyMetrics: {
      revenue: '0',
      customers: '0',
      growth: '0'
    }
  });

  // Update profile when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfile(prev => ({
        ...prev,
        companyName: userProfile.companyName || userProfile.company_name || prev.companyName,
        location: (userProfile.city && userProfile.country) ? `${userProfile.city}, ${userProfile.country}` : prev.location,
        website: userProfile.website || prev.website,
      }));
    }
  }, [userProfile]);

  const [financials, setFinancials] = useState({
    revenue_2023: '250000',
    revenue_2022: '180000',
    revenue_2021: '95000',
    gross_margin: '75',
    burn_rate: '45000',
    runway_months: '18',
    arr: '300000',
    customer_acquisition_cost: '850',
    lifetime_value: '4200'
  });

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Dr. Amina Hassan', role: 'CEO & Co-founder', email: 'amina@healthtech.ng', linkedin: 'linkedin.com/in/aminahassan' },
    { id: 2, name: 'David Okafor', role: 'CTO & Co-founder', email: 'david@healthtech.ng', linkedin: 'linkedin.com/in/davidokafor' },
    { id: 3, name: 'Sarah Mwangi', role: 'Head of Product', email: 'sarah@healthtech.ng', linkedin: 'linkedin.com/in/sarahmwangi' }
  ]);

  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    role: '',
    email: '',
    linkedin: ''
  });

  const [pitchDeckFiles, setPitchDeckFiles] = useState([
    { id: 1, name: 'HealthTech_Solutions_Pitch_Deck_v3.pdf', size: '2.4 MB', uploadDate: '2024-12-15', type: 'Current Deck' },
    { id: 2, name: 'Financial_Projections_2025.pdf', size: '1.8 MB', uploadDate: '2024-12-10', type: 'Financial Model' }
  ]);

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would save to backend
    console.log('Profile saved:', profile);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFinancialChange = (field: string, value: string) => {
    setFinancials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePitchDeckUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            
            // Add new file to list
            const newFile = {
              id: Date.now(),
              name: file.name,
              size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              uploadDate: new Date().toISOString().split('T')[0],
              type: 'Pitch Deck'
            };
            setPitchDeckFiles(prev => [newFile, ...prev]);
            
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleUpdateFinancials = () => {
    console.log('Updating financials:', financials);
    setShowFinancialsModal(false);
    // In a real app, this would save to backend
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

  const handleAddTeamMember = () => {
    if (newTeamMember.name && newTeamMember.role && newTeamMember.email) {
      const member = {
        id: Date.now(),
        ...newTeamMember
      };
      setTeamMembers(prev => [...prev, member]);
      setNewTeamMember({ name: '', role: '', email: '', linkedin: '' });
      console.log('Added team member:', member);
    }
  };

  const handleRemoveTeamMember = (id: number) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id));
  };

  const handleDeleteFile = (id: number) => {
    setPitchDeckFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <div className="bg-[var(--color-background-default)] min-h-screen">
      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowAISidePanel(true)}
            className="btn-outline px-3 py-2 rounded-lg flex items-center space-x-2"
            title="Open AI Assistant"
          >
            <Lightbulb className="h-4 w-4 text-[var(--color-primary-teal)]" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="btn-primary-elevated px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
        </div>

      {/* Profile Completion */}
      <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Profile Completion</h3>
          <span className="text-accent-500 font-bold">85%</span>
        </div>
        <div className="w-full bg-divider rounded-full h-3 border border-divider">
          <div className="bg-accent-500 h-3 rounded-full" style={{ width: '85%' }}></div>
        </div>
        <p className="text-text-secondary text-sm mt-2">
          Complete your profile to increase visibility to investors
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-primary font-medium">{profile.companyName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Tagline</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-secondary">{profile.tagline}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={profile.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-secondary">{profile.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Company Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Sector</label>
                {isEditing ? (
                  <select
                    value={profile.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>AI Diagnostics</option>
                    <option>Telemedicine</option>
                    <option>Health Tech</option>
                    <option>Pharma Supply Chain</option>
                    <option>Medical Devices</option>
                  </select>
                ) : (
                  <p className="text-text-primary">{profile.sector}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Stage</label>
                {isEditing ? (
                  <select
                    value={profile.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>Pre-Seed</option>
                    <option>Seed</option>
                    <option>Series A</option>
                    <option>Series B</option>
                    <option>Series C+</option>
                  </select>
                ) : (
                  <p className="text-text-primary">{profile.stage}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Founded</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.founded}
                    onChange={(e) => handleInputChange('founded', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-primary">{profile.founded}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Team Size</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.teamSize}
                    onChange={(e) => handleInputChange('teamSize', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-primary">{profile.teamSize} employees</p>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Key Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Annual Revenue (USD)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.keyMetrics.revenue}
                    onChange={(e) => handleInputChange('keyMetrics.revenue', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-primary">${parseInt(profile.keyMetrics.revenue).toLocaleString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Customers</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.keyMetrics.customers}
                    onChange={(e) => handleInputChange('keyMetrics.customers', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-primary">{profile.keyMetrics.customers}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">YoY Growth (%)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.keyMetrics.growth}
                    onChange={(e) => handleInputChange('keyMetrics.growth', e.target.value)}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-text-primary">{profile.keyMetrics.growth}%</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-text-secondary" />
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="flex-1 px-2 py-1 border border-divider rounded bg-background-surface text-text-primary text-sm"
                  />
                ) : (
                  <span className="text-text-secondary">{profile.location}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-text-secondary" />
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="flex-1 px-2 py-1 border border-divider rounded bg-background-surface text-text-primary text-sm"
                  />
                ) : (
                  <a href={profile.website} className="text-primary-600 hover:underline text-sm">
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Funding Information */}
          <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Funding</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Funding Goal</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.fundingGoal}
                      onChange={(e) => handleInputChange('fundingGoal', e.target.value)}
                      className="w-24 px-2 py-1 border border-divider rounded bg-background-surface text-text-primary text-sm"
                    />
                  ) : (
                    <span className="text-accent-500 font-bold">${(parseInt(profile.fundingGoal) / 1000000).toFixed(1)}M</span>
                  )}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Raised to Date</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.currentFunding}
                      onChange={(e) => handleInputChange('currentFunding', e.target.value)}
                      className="w-24 px-2 py-1 border border-divider rounded bg-background-surface text-text-primary text-sm"
                    />
                  ) : (
                    <span className="text-primary-600 hover:underline text-sm">${(parseInt(profile.currentFunding) / 1000000).toFixed(1)}M</span>
                  )}
                </div>
                <div className="w-full bg-divider rounded-full h-2 border border-divider">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${(parseInt(profile.currentFunding) / parseInt(profile.fundingGoal)) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {((parseInt(profile.currentFunding) / parseInt(profile.fundingGoal)) * 100).toFixed(0)}% of goal reached
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowPitchDeckModal(true)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 border border-primary-700"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Pitch Deck</span>
                  </button>
                  <button 
                    onClick={() => setShowFinancialsModal(true)}
                    className="w-full bg-background rounded-lg hover:bg-divider text-text-primary py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 border border-divider"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Update Financials</span>
                  </button>
                  <button 
                    onClick={() => setShowTeamModal(true)}
                    className="w-full bg-background rounded-lg hover:bg-divider text-text-primary py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 border border-divider"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Team Members</span>
                  </button>
                  <button 
                    onClick={() => setShowAISidePanel(true)}
                    className="w-full bg-background rounded-lg hover:bg-divider text-text-primary py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 border border-divider"
                  >
                    <Lightbulb className="h-4 w-4 text-[var(--color-primary-teal)]" />
                    <span>Open AI Assistant</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="bg-background-surface p-6 rounded-lg border border-divider shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
              <Lock className="h-5 w-5 text-[var(--color-primary-teal)]" />
              <span>Account Security</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Password</p>
                  <p className="text-xs text-text-secondary">Last changed: Never</p>
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
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
      />

      {/* Pitch Deck Upload Modal */}
      {showPitchDeckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-surface rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto border border-divider">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Upload Pitch Deck</h3>
              <button 
                onClick={() => setShowPitchDeckModal(false)}
                className="text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="border-2 border-dashed border-divider rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary mb-2">
                  Drag and drop your pitch deck here, or click to browse
                </p>
                <p className="text-sm text-text-secondary mb-4">
                  Supported formats: PDF, PPT, PPTX (Max 10MB)
                </p>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handlePitchDeckUpload}
                  className="hidden"
                  id="pitch-deck-upload"
                />
                <label
                  htmlFor="pitch-deck-upload"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors border border-primary-700"
                >
                  Choose File
                </label>
              </div>
              
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary">Uploading...</span>
                    <span className="text-text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-divider rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-text-primary mb-3">Uploaded Files</h4>
              <div className="space-y-2">
                {pitchDeckFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-divider">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-text-secondary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{file.name}</p>
                        <p className="text-xs text-text-secondary">
                          {file.size} • {file.type} • {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPitchDeckModal(false)}
                className="flex-1 bg-background rounded-lg hover:bg-divider text-text-primary py-2 px-4 rounded-lg transition-colors border border-divider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financials Modal */}
      {showFinancialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-surface rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto border border-divider">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Update Financial Information</h3>
              <button 
                onClick={() => setShowFinancialsModal(false)}
                className="text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Revenue 2023 (USD)</label>
                <input
                  type="text"
                  value={financials.revenue_2023}
                  onChange={(e) => handleFinancialChange('revenue_2023', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Revenue 2022 (USD)</label>
                <input
                  type="text"
                  value={financials.revenue_2022}
                  onChange={(e) => handleFinancialChange('revenue_2022', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Revenue 2021 (USD)</label>
                <input
                  type="text"
                  value={financials.revenue_2021}
                  onChange={(e) => handleFinancialChange('revenue_2021', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Gross Margin (%)</label>
                <input
                  type="text"
                  value={financials.gross_margin}
                  onChange={(e) => handleFinancialChange('gross_margin', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Monthly Burn Rate (USD)</label>
                <input
                  type="text"
                  value={financials.burn_rate}
                  onChange={(e) => handleFinancialChange('burn_rate', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Runway (Months)</label>
                <input
                  type="text"
                  value={financials.runway_months}
                  onChange={(e) => handleFinancialChange('runway_months', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">ARR (USD)</label>
                <input
                  type="text"
                  value={financials.arr}
                  onChange={(e) => handleFinancialChange('arr', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">CAC (USD)</label>
                <input
                  type="text"
                  value={financials.customer_acquisition_cost}
                  onChange={(e) => handleFinancialChange('customer_acquisition_cost', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">LTV (USD)</label>
                <input
                  type="text"
                  value={financials.lifetime_value}
                  onChange={(e) => handleFinancialChange('lifetime_value', e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateFinancials}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors border border-primary-700"
              >
                Update Financials
              </button>
              <button
                onClick={() => setShowFinancialsModal(false)}
                className="bg-background rounded-lg hover:bg-divider text-text-primary px-6 py-2 rounded-lg transition-colors border border-divider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-surface rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto border border-divider">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Manage Team Members</h3>
              <button 
                onClick={() => setShowTeamModal(false)}
                className="text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Add New Team Member */}
            <div className="mb-6 p-4 bg-background rounded-lg border border-divider">
              <h4 className="text-lg font-semibold text-text-primary mb-3">Add New Team Member</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                  <input
                    type="text"
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Head of Engineering"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="email@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">LinkedIn (Optional)</label>
                  <input
                    type="text"
                    value={newTeamMember.linkedin}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg bg-background-surface text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddTeamMember}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 border border-primary-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Team Member</span>
              </button>
            </div>

            {/* Current Team Members */}
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-3">Current Team Members</h4>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-divider">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{member.name}</p>
                        <p className="text-xs text-text-secondary">{member.role}</p>
                        <p className="text-xs text-text-secondary">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTeamMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTeamModal(false)}
                className="bg-background rounded-lg hover:bg-divider text-text-primary px-6 py-2 rounded-lg transition-colors border border-divider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Side Panel (uses mock when Ollama not configured) */}
      <AISidePanel
        open={showAISidePanel}
        onClose={() => setShowAISidePanel(false)}
        context={{
          country: profile.location.split(',').pop()?.trim() || undefined,
          sector: profile.sector,
          stage: profile.stage,
          companyId: profile.companyName,
        }}
      />
      </div>
    </div>
  );
};

export default StartupProfile;