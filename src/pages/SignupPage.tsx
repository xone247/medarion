import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, User, Building, GraduationCap, Briefcase, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AccountType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  userType: string;
  tiers: string[];
}

const ACCOUNT_TYPES: AccountType[] = [
  {
    id: 'investor',
    name: 'Investor & Finance',
    description: 'Track deals, grants, and investment opportunities across Africa',
    icon: <Building size={24} />,
    userType: 'investors_finance',
    tiers: ['free', 'paid', 'enterprise']
  },
  {
    id: 'startup',
    name: 'Startup',
    description: 'Find investors, track grants, and grow your healthcare startup',
    icon: <Briefcase size={24} />,
    userType: 'startup',
    tiers: ['free', 'paid', 'enterprise']
  },
  {
    id: 'researcher',
    name: 'Health & Science Expert',
    description: 'Access clinical trials, grants, and research opportunities',
    icon: <GraduationCap size={24} />,
    userType: 'health_science_experts',
    tiers: ['academic', 'paid', 'enterprise']
  },
  {
    id: 'executive',
    name: 'Industry Executive',
    description: 'Monitor market trends, regulatory changes, and industry insights',
    icon: <Users size={24} />,
    userType: 'industry_executives',
    tiers: ['free', 'paid', 'enterprise']
  },
  {
    id: 'media',
    name: 'Media & Advisor',
    description: 'Stay informed about healthcare developments and market trends',
    icon: <User size={24} />,
    userType: 'media_advisors',
    tiers: ['free', 'paid', 'enterprise']
  }
];

interface SignupPageProps {
  onBack: () => void;
  onSignup: (data: any) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSignup }) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
    country: '',
    city: '',
    bio: ''
  });

  const handleAccountTypeSelect = (accountType: AccountType) => {
    setSelectedAccountType(accountType);
    setSelectedTier(accountType.tiers[0]); // Default to first tier
    setStep(2);
  };

  const handleTierSelect = (tier: string) => {
    setSelectedTier(tier);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const signupData = {
      ...formData,
      userType: selectedAccountType?.userType,
      accountTier: selectedTier,
      username: formData.email.split('@')[0]
    };

    onSignup(signupData);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Choose Your Account Type</h2>
        <p className="text-[var(--color-text-secondary)]">Select the type of account that best describes your role</p>
      </div>
      
      <div className="grid gap-4">
        {ACCOUNT_TYPES.map((accountType) => (
          <button
            key={accountType.id}
            onClick={() => handleAccountTypeSelect(accountType)}
            className="p-4 border border-[var(--color-divider-gray)] rounded-lg hover:border-[var(--color-primary-teal)] hover:bg-[var(--color-primary-teal)]/10 transition-all text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="text-[var(--color-primary-teal)]">{accountType.icon}</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{accountType.name}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{accountType.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Choose Your Plan</h2>
        <p className="text-[var(--color-text-secondary)]">Select the plan that best fits your needs</p>
      </div>
      
      <div className="grid gap-4">
        {selectedAccountType?.tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => handleTierSelect(tier)}
            className={`p-4 border rounded-lg transition-all text-left ${
              selectedTier === tier
                ? 'border-[var(--color-primary-teal)] bg-[var(--color-primary-teal)]/10'
                : 'border-[var(--color-divider-gray)] hover:border-[var(--color-primary-teal)] hover:bg-[var(--color-primary-teal)]/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] capitalize">{tier} Plan</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {tier === 'free' && 'Basic features and limited access'}
                  {tier === 'paid' && 'Full access to all features'}
                  {tier === 'academic' && 'Special pricing for academic institutions'}
                  {tier === 'enterprise' && 'Advanced features and priority support'}
                </p>
              </div>
              {selectedTier === tier && <CheckCircle className="text-[var(--color-primary-teal)]" size={20} />}
            </div>
          </button>
        ))}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          onClick={() => setStep(3)}
          className="btn-primary-elevated btn-lg flex items-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Create Your Account</h2>
        <p className="text-[var(--color-text-secondary)]">Fill in your details to complete registration</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Company/Organization</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-[var(--color-divider-gray)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-surface)] text-[var(--color-text-primary)]"
            placeholder="Tell us about yourself and your interests..."
          />
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary-elevated btn-lg flex items-center space-x-2"
        >
          <span>Create Account</span>
          <CheckCircle size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-lg shadow-xl p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
