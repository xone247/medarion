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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-3">Choose Your Account Type</h2>
        <p className="text-base text-[var(--color-text-secondary)]">Select the type of account that best describes your role</p>
      </div>
      
      <div className="grid gap-4">
        {ACCOUNT_TYPES.map((accountType) => (
          <button
            key={accountType.id}
            onClick={() => handleAccountTypeSelect(accountType)}
            className="p-5 border border-[var(--color-divider-gray)]/20 rounded-xl hover:border-black/50 dark:hover:border-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:shadow-md transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-white flex-shrink-0">
                {accountType.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg text-[var(--color-text-primary)] mb-1">{accountType.name}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{accountType.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-3">Choose Your Plan</h2>
        <p className="text-base text-[var(--color-text-secondary)]">Select the plan that best fits your needs</p>
      </div>
      
      <div className="grid gap-4">
        {selectedAccountType?.tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => handleTierSelect(tier)}
            className={`p-5 border rounded-xl transition-all duration-200 text-left ${
              selectedTier === tier
                ? 'border-black dark:border-white bg-black/10 dark:bg-white/10 shadow-md'
                : 'border-[var(--color-divider-gray)]/20 hover:border-black/50 dark:hover:border-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-lg text-[var(--color-text-primary)] capitalize mb-1">{tier} Plan</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {tier === 'free' && 'Basic features and limited access'}
                  {tier === 'paid' && 'Full access to all features'}
                  {tier === 'academic' && 'Special pricing for academic institutions'}
                  {tier === 'enterprise' && 'Advanced features and priority support'}
                </p>
              </div>
              {selectedTier === tier && (
                <div className="ml-4 p-2 rounded-full bg-black/20 dark:bg-white/20">
                  <CheckCircle className="text-[var(--color-primary-teal)]" size={20} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-6 border-t border-[var(--color-divider-gray)]/20">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back</span>
        </button>
        <button
          onClick={() => setStep(3)}
          className="bg-black dark:bg-white hover:opacity-90 dark:hover:opacity-80 text-white dark:text-black px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
        >
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-medium text-[var(--color-text-primary)] mb-3">Create Your Account</h2>
        <p className="text-base text-[var(--color-text-secondary)]">Fill in your details to complete registration</p>
      </div>
      
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Company/Organization</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] bg-[var(--color-background-default)] text-[var(--color-text-primary)] transition-all resize-none"
            placeholder="Tell us about yourself and your interests..."
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-6 border-t border-[var(--color-divider-gray)]/20">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back</span>
        </button>
        <button
          onClick={handleSubmit}
          className="bg-black dark:bg-white hover:opacity-90 dark:hover:opacity-80 text-white dark:text-black px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
        >
          <span>Create Account</span>
          <CheckCircle size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] flex items-center justify-center p-4 sm:p-6 md:p-8 py-10 md:py-16 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none opacity-30" style={{background:'radial-gradient(circle at 30% 30%, rgba(90,215,192,0.15), transparent 60%)'}}/>
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none opacity-30" style={{background:'radial-gradient(circle at 70% 70%, rgba(56,189,248,0.15), transparent 60%)'}}/>
      
      <div className="w-full max-w-3xl relative z-10">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to sign in</span>
          </button>
        </div>
        
        <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 md:p-8 lg:p-10">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
