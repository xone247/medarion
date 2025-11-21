import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, User } from '../lib/api'
import { getProfileSlugFromRole, legacyPageForProfile, makePathForPage } from '../lib/routes'
import { UserRole } from '../types/userTypes'

interface AuthContextType {
  user: User | null
  profile: User | null
  loading: boolean
  signUp: (email: string, password: string, userType: UserRole, fullName: string, companyName?: string, accountTier?: string) => Promise<{ error: unknown }>
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function applyOverrides(u: User | null): User | null {
  if (!u) return u;
  try {
    const raw = localStorage.getItem('medarionUserOverrides');
    if (!raw) return u;
    const map = JSON.parse(raw) as Record<string, Partial<User>>;
    const override = map[u.email];
    if (!override) return u;
    // Preserve all existing fields, especially account_tier, user_type, is_admin, app_roles
    return { ...u, ...override } as User;
  } catch {
    return u;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // DEVELOPMENT BYPASS - Remove this in production
        const devBypass = localStorage.getItem('dev_admin_bypass')
        if (devBypass === 'true') {
          const devUser: User = {
            id: 1,
            username: 'superadmin',
            email: 'superadmin@medarion.com',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'admin',
            companyName: 'Medarion',
            isVerified: true,
            createdAt: new Date().toISOString()
          }
          setUser(devUser)
          setProfile(devUser)
          setLoading(false)
          return
        }
        
        // Check if we have a token
        const token = localStorage.getItem('auth_token')
        
        // PRIORITY: Load from localStorage first if it exists (most reliable)
        const session = localStorage.getItem('medarionSession')
        if (session) {
          try {
            const parsed = JSON.parse(session)
            if (parsed.user && parsed.user.email) {
              // Check if this matches the token user (if token exists)
              // If localStorage has a complete profile, use it
              const fullProfile = {
                ...parsed.user,
                account_tier: parsed.user.account_tier || 'free',
                user_type: parsed.user.user_type || 'startup',
                is_admin: parsed.user.is_admin !== undefined ? parsed.user.is_admin : false,
                app_roles: parsed.user.app_roles || [],
              }
              
              // Only call API if localStorage profile is incomplete
              if (!fullProfile.account_tier || !fullProfile.user_type) {
                if (token) {
                  apiClient.setToken(token)
                  try {
                    const response = await apiClient.getProfile()
                    if (response.data?.user) {
                      // Merge API response with localStorage data (localStorage takes precedence)
                      const merged = {
                        ...response.data.user,
                        ...fullProfile, // localStorage data overrides API
                        account_tier: fullProfile.account_tier || response.data.user.account_tier || 'free',
                        user_type: fullProfile.user_type || response.data.user.user_type || 'startup',
                        is_admin: fullProfile.is_admin !== undefined ? fullProfile.is_admin : (response.data.user.is_admin || false),
                        app_roles: fullProfile.app_roles || response.data.user.app_roles || [],
                      }
                      // Debug: Merged profile (can be removed in production)
                      // console.log('[AuthContext] Merged profile (localStorage + API):', merged)
                      setUser(merged)
                      setProfile(merged)
                      setLoading(false)
                      return
                    }
                  } catch (apiError) {
                    console.warn('[AuthContext] API call failed, using localStorage:', apiError)
                  }
                }
              }
              
              // Debug: Loading from localStorage (can be removed in production)
              // console.log('[AuthContext] Loading profile from localStorage:', fullProfile)
              setUser(fullProfile)
              setProfile(fullProfile)
              setLoading(false)
              return
            }
          } catch (e) {
            console.error('[AuthContext] Error parsing session:', e)
          }
        }
        
        // Fallback: Try API if no localStorage or incomplete
        if (token) {
          apiClient.setToken(token)
          try {
            const response = await apiClient.getProfile()
            if (response.data?.user) {
              const applied = applyOverrides(response.data.user)
              const fullProfile = {
                ...applied,
                account_tier: applied.account_tier || (response.data.user as any)?.account_tier || 'free',
                user_type: applied.user_type || (response.data.user as any)?.user_type || 'startup',
                is_admin: applied.is_admin !== undefined ? applied.is_admin : ((response.data.user as any)?.is_admin || false),
                app_roles: applied.app_roles || (response.data.user as any)?.app_roles || [],
              }
              // Debug: Setting profile from API (can be removed in production)
              // console.log('[AuthContext] Setting profile from API:', fullProfile)
              setUser(fullProfile)
              setProfile(fullProfile)
            } else {
              // Token is invalid, clear it
              apiClient.setToken(null)
              localStorage.removeItem('medarionSession')
            }
          } catch (apiError) {
            console.error('[AuthContext] API error:', apiError)
            apiClient.setToken(null)
            localStorage.removeItem('medarionSession')
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        apiClient.setToken(null)
        localStorage.removeItem('medarionSession')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const handleSignUp = async (email: string, password: string, userType: UserRole, fullName: string, companyName?: string, accountTier?: string) => {
    try {
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ')
      
      const response = await apiClient.signup({
        username: email.split('@')[0],
        email,
        password,
        firstName: firstName || '',
        lastName: lastName || '',
        userType: userType, // Add userType (required by backend)
        accountTier: accountTier || 'free', // Use provided tier or default to free
        companyName: companyName || undefined
      })

      if (response.error) {
        return { error: response.error }
      }

      if (response.data) {
        apiClient.setToken(response.data.token)
        const applied = applyOverrides(response.data.user)
        setUser(applied)
        setProfile(applied)
        localStorage.setItem('medarionSession', JSON.stringify({ 
          user: applied, 
          profile: applied
        }))
        // Post-login redirect by role using path routing
        const slug = getProfileSlugFromRole(applied.role)
        const page = legacyPageForProfile(slug)
        window.location.replace(makePathForPage(page))
      }

      return { error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: 'Signup failed' }
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.signin({ email, password })
      
      if (response.error) {
        return { error: response.error }
      }

      if (response.data) {
        apiClient.setToken(response.data.token)
        const applied = applyOverrides(response.data.user)
        setUser(applied)
        setProfile(applied)
        localStorage.setItem('medarionSession', JSON.stringify({ 
          user: applied, 
          profile: applied
        }))
        // Also store token in localStorage for persistence
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token)
        }
        // Redirect after sign-in - use window.location.replace for immediate redirect
        // Check is_admin first, then use user_type for redirect mapping
        const isAdmin = (applied as any).is_admin || (applied as any).app_roles?.includes('super_admin')
        if (isAdmin) {
          window.location.replace('/admin-dashboard')
          return
        }
        
        const userType = (applied as any).user_type || applied.role || 'startup'
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
        window.location.replace(targetPath)
      }

      return { error: null }
    } catch (error) {
      console.error('Signin error:', error)
      return { error: 'Signin failed' }
    }
  }

  const handleSignOut = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.setToken(null)
      localStorage.removeItem('medarionSession')
      setUser(null)
      setProfile(null)
      // Send user to auth page explicitly
      window.location.replace('/auth')
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}