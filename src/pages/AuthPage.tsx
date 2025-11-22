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
        navigate('/admin-dashboard', { replace: true })
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
        'regulator': '/regulator-dashboard'
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
    <div className="min-h-screen bg-[var(--color-background-default)] flex items-center px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle at 30% 30%, rgba(90,215,192,0.22), transparent 60%)'}}/>
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle at 70% 70%, rgba(56,189,248,0.20), transparent 60%)'}}/>

      <div className="max-w-5xl w-full mx-auto grid grid-cols-2 gap-6 items-stretch">
        {/* Left showcase panel (hidden on small screens) */}
        <div className="flex flex-col justify-between card-glass sheen noise-overlay shadow-elevated rounded-2xl p-8 border border-[var(--color-divider-gray)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-teal)] flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Medarion</h1>
                <p className="text-xs text-[var(--color-text-secondary)]">AI Healthcare HUB</p>
              </div>
            </div>
            <h2 className="mt-8 text-3xl font-semibold text-[var(--color-text-primary)]">Sign in to continue</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">Market intelligence, clinical trials, investors, and grants at your fingertips.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3"><span className="w-2 h-2 mt-2 rounded-full bg-[var(--color-primary-teal)]" /><span className="text-sm text-[var(--color-text-secondary)]">Glassy, distraction-free UI with dark/light support</span></li>
              <li className="flex items-start gap-3"><span className="w-2 h-2 mt-2 rounded-full bg-[var(--color-accent-sky)]" /><span className="text-sm text-[var(--color-text-secondary)]">Role-based access and secure sessions</span></li>
              <li className="flex items-start gap-3"><span className="w-2 h-2 mt-2 rounded-full bg-[var(--color-secondary-gold)]" /><span className="text-sm text-[var(--color-text-secondary)]">AI assistance powered by light RAG</span></li>
            </ul>
          </div>
          <div className="aspect-[16/9] rounded-xl bg-[var(--color-background-default)] border border-[var(--color-divider-gray)] flex items-center justify-center text-[var(--color-text-secondary)]">
            Illustration / Preview
          </div>
        </div>

        {/* Right auth panel */}
        <div>
          <div className="text-center md:text-left">
            <h2 className="md:hidden text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="md:hidden mt-2 text-sm text-[var(--color-text-secondary)]">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={switchMode} className="font-medium text-[var(--color-primary-teal)] hover:opacity-80">{isLogin ? 'Sign up' : 'Sign in'}</button>
            </p>
            
            {/* Signup Button */}
            <div className="mt-4">
              <button
                onClick={() => setShowSignup(true)}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <UserPlus size={18} />
                <span>Create New Account</span>
              </button>
            </div>
          </div>

          {/* Demo banner removed in production */}

          <div className="mt-4 card-glass sheen noise-overlay shadow-elevated rounded-2xl p-6 sm:p-8 border border-[var(--color-divider-gray)]">
          {/* Success Message */}
          {success && (
            <div className="mb-6 glass-soft border border-green-400/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 glass-soft border border-red-400/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                I am a:
              </label>
              <div className="space-y-2">
                {userTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setUserType(option.value as UserRole)}
                      className={`w-full flex items-start p-3 rounded-lg transition-colors text-left border ${
                        userType === option.value
                          ? 'border-[var(--color-primary-teal)] bg-[color-mix(in_srgb,var(--color-primary-teal),transparent_94%)] text-[var(--color-primary-teal)]'
                          : 'border-[var(--color-divider-gray)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-default)]'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-[var(--color-primary-teal)]" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{option.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--color-text-primary)]">
                    Full Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required={!isLogin}
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="input w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-[var(--color-text-primary)]">
                    {userType === 'startup' ? 'Company Name' : 'Organization Name'}
                  </label>
                  <div className="mt-1">
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="input w-full"
                      placeholder={userType === 'startup' ? 'Enter your company name' : 'Enter your organization name'}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)]">
                Email address *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input w-full"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)]">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input w-full pr-10"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-primary)]">
                  Confirm Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="input w-full pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-elevated btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Please wait...
                  </div>
                ) : (
                  isLogin ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Quick Demo Login Buttons */}
          {/* Demo quick login removed in production */}

          {!isLogin && (
            <div className="mt-6">
              <div className="text-xs text-[var(--color-text-secondary)] text-center">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-[var(--color-primary-teal)] hover:opacity-80">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[var(--color-primary-teal)] hover:opacity-80">
                  Privacy Policy
                </a>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage