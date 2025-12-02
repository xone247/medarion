import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Globe, Eye, EyeOff, Building2, Users, ArrowLeft, CheckCircle, AlertCircle, Briefcase, Stethoscope, Newspaper, UserPlus } from 'lucide-react'
import { UserRole, ROLE_LABELS } from '../types/userTypes'
import SignupPage from './SignupPage'

interface AuthPageProps {
  onBack: () => void
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showSignup, setShowSignup] = useState(false)
  const [userType, setUserType] = useState<UserRole>('startup')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const isAdmin = (profile as any)?.is_admin || (profile as any)?.app_roles?.includes('super_admin')
      if (isAdmin) {
        navigate('/admin', { replace: true })
        return
      }
      
      const userType = (profile as any)?.user_type || (profile as any)?.role || 'startup'
      const redirectMap: Record<string, string> = {
        'startup': '/startup-dashboard',
        'investors_finance': '/investor-dashboard',
        'investor': '/investor-dashboard',
        'industry_executives': '/executive-dashboard',
        'executive': '/executive-dashboard',
        'health_science_experts': '/researcher-dashboard',
        'researcher': '/researcher-dashboard',
        'regulators': '/regulator-dashboard',
        'regulator': '/regulator-dashboard',
        'admin': '/admin'
      }
      const targetPath = redirectMap[userType] || '/startup-dashboard'
      navigate(targetPath, { replace: true })
    }
  }, [user, profile, authLoading, navigate])
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    confirmPassword: ''
  })

  const { signIn, signUp } = useAuth()

  const handleSignup = async (signupData: any) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await signUp(
        signupData.email,
        signupData.password,
        signupData.userType as UserRole,
        `${signupData.firstName} ${signupData.lastName}`,
        signupData.companyName,
        signupData.accountTier || 'free' // Pass account tier from step 2
      )
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Account created successfully! You can now sign in.')
        setShowSignup(false)
        setIsLogin(true)
      }
    } catch (error) {
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const userTypeOptions = [
    { value: 'investors_finance', label: 'Investors & Finance', icon: Building2, description: 'Investment firms, VCs, and financial institutions' },
    { value: 'industry_executives', label: 'Industry Executives', icon: Briefcase, description: 'Healthcare industry leaders and executives' },
    { value: 'health_science_experts', label: 'Health & Science Experts', icon: Stethoscope, description: 'Researchers, clinicians, and health experts' },
    { value: 'media_advisors', label: 'Media & Advisors', icon: Newspaper, description: 'Media professionals and industry advisors' },
    { value: 'startup', label: 'Startup', icon: Users, description: 'Healthcare startups and entrepreneurs' }
  ]

  // Production design: demo access removed

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return false
    }

    if (!isLogin) {
      if (!formData.fullName) {
        setError('Full name is required')
        return false
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          const message = (error as any)?.message || 'Sign-in failed'
          setError(message)
          setLoading(false)
        } else {
          // Sign-in successful - redirect will happen in AuthContext
          // Don't show success message as redirect is immediate
          // The redirect happens via window.location.replace in handleSignIn
          return // Exit early, redirect will happen
        }
      } else {
        const { error } = await signUp(
          formData.email,
          formData.password,
          userType,
          formData.fullName,
          formData.companyName
        )
        if (error) {
          const message = (error as any)?.message || 'Sign-up failed'
          setError(message)
        } else {
          setSuccess('Account created successfully! You can now sign in.')
          // Switch to login mode after successful signup
          setTimeout(() => {
            setIsLogin(true)
            setSuccess('')
            setFormData({
              email: formData.email, // Keep email for convenience
              password: '',
              fullName: '',
              companyName: '',
              confirmPassword: ''
            })
          }, 2000)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  // No demo login in production

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setFormData({
      email: '',
      password: '',
      fullName: '',
      companyName: '',
      confirmPassword: ''
    })
  }

  // Show loading or redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-default)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-teal)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    )
  }

  // Show signup page if signup is requested
  if (showSignup) {
    return <SignupPage onBack={() => setShowSignup(false)} onSignup={handleSignup} />
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-default)] transition-colors duration-500">
      {/* Hero Section */}
      <div className="page-hero">
        <div aria-hidden className="page-hero-bg">
          <img
            src={(import.meta as any)?.env?.VITE_AUTH_HERO_URL || (import.meta as any)?.env?.VITE_BLOG_HERO_URL || '/images/page hero section.jpeg'}
            alt=""
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=1080&fit=crop&q=80';
            }}
          />
          <div className="page-hero-overlay" />
          <div className="page-hero-gradient" />
        </div>
        
        <div className="page-hero-content">
          <div className="page-hero-content-inner">
            <h1 className="page-hero-heading">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="page-hero-subtext">
              {isLogin 
                ? 'Access your dashboard and continue your journey with African healthcare intelligence.'
                : 'Join Medarion to access comprehensive healthcare data, insights, and AI-powered assistance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="max-w-screen-2xl mx-auto px-6 md:px-8 lg:px-12 xl:px-16 py-16 md:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
        {/* Left showcase panel (hidden on small screens) */}
        <div className="hidden lg:flex flex-col justify-between rounded-2xl p-8 md:p-10 border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--color-text-primary)] leading-tight">Sign in to continue</h2>
            <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed">Market intelligence, clinical trials, investors, and grants at your fingertips.</p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[var(--color-primary-teal)]/10 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-[var(--color-primary-teal)]" />
                </div>
                <span className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">Glassy, distraction-free UI with dark/light support</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">Role-based access and secure sessions</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[var(--color-secondary-gold)]/10 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-[var(--color-secondary-gold)]" />
                </div>
                <span className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">AI assistance powered by light RAG</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right auth panel */}
        <div className="flex flex-col">
          {/* Signup Button */}
          {isLogin && (
            <div className="mb-6">
              <button
                onClick={() => setShowSignup(true)}
                className="w-full btn-outline py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus size={18} />
                <span>Create New Account</span>
              </button>
            </div>
          )}

          <div className="flex-1 rounded-2xl p-6 md:p-8 lg:p-10 border border-[var(--color-divider-gray)]/20 bg-[var(--color-background-surface)] shadow-lg hover:shadow-xl transition-shadow duration-300">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-4">
                I am a:
              </label>
              <div className="space-y-3">
                {userTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setUserType(option.value as UserRole)}
                      className={`w-full flex items-start p-4 rounded-xl transition-all duration-200 text-left border ${
                        userType === option.value
                          ? 'border-[var(--color-primary-teal)] bg-[var(--color-primary-teal)]/10 shadow-md'
                          : 'border-[var(--color-divider-gray)]/20 text-[var(--color-text-primary)] hover:bg-[var(--color-background-default)] hover:border-[var(--color-primary-teal)]/30 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 mt-0.5 flex-shrink-0 ${
                        userType === option.value ? 'bg-[var(--color-primary-teal)]/20' : 'bg-[var(--color-primary-teal)]/10'
                      }`}>
                        <Icon className="h-5 w-5 text-[var(--color-primary-teal)]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--color-text-primary)] mb-1">{option.label}</div>
                        <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{option.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    {userType === 'startup' ? 'Company Name' : 'Organization Name'}
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                    placeholder={userType === 'startup' ? 'Enter your company name' : 'Enter your organization name'}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  ) : (
                    <Eye className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-70 transition-opacity"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-[var(--color-text-secondary)]" />
                    ) : (
                      <Eye className="h-5 w-5 text-[var(--color-text-secondary)]" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary-elevated py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Please wait...</span>
                  </>
                ) : (
                  isLogin ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--color-primary-teal)] hover:underline transition-opacity"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {!isLogin && (
            <div className="mt-6 pt-6 border-t border-[var(--color-divider-gray)]/20">
              <div className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-[var(--color-primary-teal)] hover:opacity-80 transition-opacity">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-[var(--color-primary-teal)] hover:opacity-80 transition-opacity">
                  Privacy Policy
                </a>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AuthPage