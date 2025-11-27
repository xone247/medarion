import React, { useState, useEffect } from 'react';
import { User, Edit, Save, Building2, MapPin, Globe, Users, DollarSign, Calendar, Upload, FileText, UserPlus, X, Plus, Lightbulb, Lock } from 'lucide-react';
import AISidePanel from '../components/ai/AISidePanel';
import { useNavigation } from '../contexts/NavigationContext';
import ChangePasswordModal from '../components/ui/ChangePasswordModal';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StartupProfile = () => {
  const { navigateToModule } = useNavigation();
  const { profile: userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showPitchDeckModal, setShowPitchDeckModal] = useState(false);
  const [showFinancialsModal, setShowFinancialsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAISidePanel, setShowAISidePanel] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect admins and other user types to their correct profile pages
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
      
      if (isAdmin) {
        navigate('/admin-profile', { replace: true });
        return;
      }
      if (userType === 'investor' || userType === 'investors_finance') {
        navigate('/investor-profile', { replace: true });
        return;
      }
      if (userType === 'researcher' || userType === 'health_science_experts') {
        navigate('/researcher-profile', { replace: true });
        return;
      }
      if (userType === 'executive' || userType === 'industry_executives') {
        navigate('/executive-profile', { replace: true });
        return;
      }
      if (userType === 'regulator') {
        navigate('/regulator-profile', { replace: true });
        return;
      }
    }
  }, [userProfile, navigate]);

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

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updateData: any = {
        companyName: profile.companyName,
        website: profile.website,
        bio: profile.description,
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

        {/* Startup Status with Edit Button */}
        <div className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-white dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-lg border border-slate-200 dark:border-transparent flex-shrink-0">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Startup Profile</h3>
                <p className="text-sm text-slate-900 dark:text-slate-400">Manage your startup profile and company information</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAISidePanel(true)}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                title="Open AI Assistant"
              >
                <Lightbulb className="h-4 w-4" />
                <span>AI Assistant</span>
              </button>
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

      {/* Profile Completion */}
      <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-200">Profile Completion</h3>
          <span className="text-cyan-600 dark:text-cyan-400 font-medium">85%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 border border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-cyan-500 to-teal-600 h-3 rounded-full" style={{ width: '85%' }}></div>
        </div>
        <p className="text-slate-900 dark:text-slate-400 text-sm mt-2">
          Complete your profile to increase visibility to investors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Information */}
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Basic Information</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Company Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200 font-medium">{profile.companyName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Tagline</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-400">{profile.tagline}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Description</label>
                {isEditing ? (
                  <textarea
                    value={profile.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-400">{profile.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Company Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Sector</label>
                {isEditing ? (
                  <select
                    value={profile.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option>AI Diagnostics</option>
                    <option>Telemedicine</option>
                    <option>Health Tech</option>
                    <option>Pharma Supply Chain</option>
                    <option>Medical Devices</option>
                  </select>
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.sector}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Stage</label>
                {isEditing ? (
                  <select
                    value={profile.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option>Pre-Seed</option>
                    <option>Seed</option>
                    <option>Series A</option>
                    <option>Series B</option>
                    <option>Series C+</option>
                  </select>
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.stage}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Founded</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.founded}
                    onChange={(e) => handleInputChange('founded', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.founded}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Team Size</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.teamSize}
                    onChange={(e) => handleInputChange('teamSize', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.teamSize} employees</p>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-5">Key Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Annual Revenue (USD)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.keyMetrics.revenue}
                    onChange={(e) => handleInputChange('keyMetrics.revenue', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">${parseInt(profile.keyMetrics.revenue).toLocaleString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Customers</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.keyMetrics.customers}
                    onChange={(e) => handleInputChange('keyMetrics.customers', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.keyMetrics.customers}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">YoY Growth (%)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.keyMetrics.growth}
                    onChange={(e) => handleInputChange('keyMetrics.growth', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <p className="text-sm text-slate-900 dark:text-slate-200">{profile.keyMetrics.growth}%</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contact Information */}
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg">
                  <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <span className="text-sm text-slate-900 dark:text-slate-400">{profile.location}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <a href={profile.website} className="text-cyan-600 dark:text-cyan-400 hover:underline text-sm">
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Funding Information */}
          <div className="bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-4">Funding</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-400">Funding Goal</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.fundingGoal}
                      onChange={(e) => handleInputChange('fundingGoal', e.target.value)}
                      className="w-28 px-3 py-1.5 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <span className="text-cyan-600 dark:text-cyan-400 font-medium text-sm">${(parseInt(profile.fundingGoal) / 1000000).toFixed(1)}M</span>
                  )}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-400">Raised to Date</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.currentFunding}
                      onChange={(e) => handleInputChange('currentFunding', e.target.value)}
                      className="w-28 px-3 py-1.5 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <span className="text-cyan-600 dark:text-cyan-400 hover:underline text-sm">${(parseInt(profile.currentFunding) / 1000000).toFixed(1)}M</span>
                  )}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 border border-slate-200 dark:border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-teal-600 h-2 rounded-full" 
                    style={{ width: `${(parseInt(profile.currentFunding) / parseInt(profile.fundingGoal)) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-900 dark:text-slate-400 mt-1.5">
                  {((parseInt(profile.currentFunding) / parseInt(profile.fundingGoal)) * 100).toFixed(0)}% of goal reached
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowPitchDeckModal(true)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white py-2 px-4 rounded-xl transition-colors text-sm flex items-center justify-center space-x-2 font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Pitch Deck</span>
                  </button>
                  <button 
                    onClick={() => setShowFinancialsModal(true)}
                    className="w-full bg-white dark:bg-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-200 py-2 px-4 transition-colors text-sm flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Update Financials</span>
                  </button>
                  <button 
                    onClick={() => setShowTeamModal(true)}
                    className="w-full bg-white dark:bg-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-200 py-2 px-4 transition-colors text-sm flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Team Members</span>
                  </button>
                  <button 
                    onClick={() => setShowAISidePanel(true)}
                    className="w-full bg-white dark:bg-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-200 py-2 px-4 transition-colors text-sm flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <Lightbulb className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Open AI Assistant</span>
                  </button>
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
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
      />

      {/* Pitch Deck Upload Modal */}
      {showPitchDeckModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPitchDeckModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-200">Upload Pitch Deck</h3>
              <button 
                onClick={() => setShowPitchDeckModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <Upload className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <p className="text-slate-900 dark:text-slate-200 mb-2">
                  Drag and drop your pitch deck here, or click to browse
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-400 mb-4">
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
                  className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium"
                >
                  Choose File
                </label>
              </div>
              
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-900 dark:text-slate-400">Uploading...</span>
                    <span className="text-slate-900 dark:text-slate-200 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-teal-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Uploaded Files</h4>
              <div className="space-y-2">
                {pitchDeckFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{file.name}</p>
                        <p className="text-xs text-slate-900 dark:text-slate-400">
                          {file.size} • {file.type} • {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
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
                className="flex-1 bg-white dark:bg-slate-800/50 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-200 py-2 px-4 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financials Modal */}
      {showFinancialsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFinancialsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-200">Update Financial Information</h3>
              <button 
                onClick={() => setShowFinancialsModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Revenue 2023 (USD)</label>
                <input
                  type="text"
                  value={financials.revenue_2023}
                  onChange={(e) => handleFinancialChange('revenue_2023', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Revenue 2022 (USD)</label>
                <input
                  type="text"
                  value={financials.revenue_2022}
                  onChange={(e) => handleFinancialChange('revenue_2022', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Revenue 2021 (USD)</label>
                <input
                  type="text"
                  value={financials.revenue_2021}
                  onChange={(e) => handleFinancialChange('revenue_2021', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Gross Margin (%)</label>
                <input
                  type="text"
                  value={financials.gross_margin}
                  onChange={(e) => handleFinancialChange('gross_margin', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Monthly Burn Rate (USD)</label>
                <input
                  type="text"
                  value={financials.burn_rate}
                  onChange={(e) => handleFinancialChange('burn_rate', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Runway (Months)</label>
                <input
                  type="text"
                  value={financials.runway_months}
                  onChange={(e) => handleFinancialChange('runway_months', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">ARR (USD)</label>
                <input
                  type="text"
                  value={financials.arr}
                  onChange={(e) => handleFinancialChange('arr', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">CAC (USD)</label>
                <input
                  type="text"
                  value={financials.customer_acquisition_cost}
                  onChange={(e) => handleFinancialChange('customer_acquisition_cost', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">LTV (USD)</label>
                <input
                  type="text"
                  value={financials.lifetime_value}
                  onChange={(e) => handleFinancialChange('lifetime_value', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateFinancials}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white px-6 py-2 rounded-xl transition-colors font-medium"
              >
                Update Financials
              </button>
              <button
                onClick={() => setShowFinancialsModal(false)}
                className="bg-white dark:bg-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-200 px-6 py-2 transition-colors border border-slate-200 dark:border-slate-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTeamModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-200">Manage Team Members</h3>
              <button 
                onClick={() => setShowTeamModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Add New Team Member */}
            <div className="mb-6 p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-3">Add New Team Member</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Role</label>
                  <input
                    type="text"
                    value={newTeamMember.role}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., Head of Engineering"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="email@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-900 dark:text-slate-400 mb-1.5">LinkedIn (Optional)</label>
                  <input
                    type="text"
                    value={newTeamMember.linkedin}
                    onChange={(e) => setNewTeamMember(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddTeamMember}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center space-x-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add Team Member</span>
              </button>
            </div>

            {/* Current Team Members */}
            <div>
              <h4 className="text-base font-medium text-slate-900 dark:text-slate-200 mb-3">Current Team Members</h4>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{member.name}</p>
                        <p className="text-xs text-slate-900 dark:text-slate-400">{member.role}</p>
                        <p className="text-xs text-slate-900 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTeamMember(member.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
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
                className="bg-white dark:bg-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-slate-200 px-6 py-2 transition-colors border border-slate-200 dark:border-slate-700 font-medium"
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