import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { AVAILABLE_MODULES, DEFAULT_MODULES_BY_ROLE, type DashboardModule } from '../types/userTypes';
import { useAuth } from './AuthContext';
import { ACCESS_MATRIX } from '../types/accessControl';
import type { AccountTier } from '../types/userTypes';
import { useModules } from '../hooks/useModules';
import { getApiBaseUrl } from '../config/api';

interface DashboardContextType {
  userModules: string[];
  moduleOrder: string[];
  availableModules: DashboardModule[];
  currentModule: string | null;
  addModule: (moduleId: string) => void;
  removeModule: (moduleId: string) => void;
  reorderModules: (newOrder: string[]) => void;
  resetToDefaults: () => void;
  getModuleById: (moduleId: string) => DashboardModule | undefined;
  setCurrentModule: (moduleId: string | null) => void;
  showDashboardSummary: boolean;
  setShowDashboardSummary: (show: boolean) => void;
}

type AdminModules = Record<string, { modules: string[]; order: string[] }>;

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { modules: dbModules } = useModules(); // Fetch modules from database
  const [userModules, setUserModules] = useState<string[]>([]);
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [showDashboardSummary, setShowDashboardSummary] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use database modules if available, otherwise fall back to hardcoded
  const availableModulesList = dbModules.length > 0 ? dbModules : AVAILABLE_MODULES;

  // Helper: pin permanent modules for super admin
  const pinForSuperAdmin = (modules: string[]) => {
    // No pinned modules - blog_manager and ads_manager are Admin Dashboard tabs only
    return modules;
  };

  // Initialize modules based on user role and database
  useEffect(() => {
    if (profile?.user_type && profile?.email && !isInitialized) {
      const loadModules = async () => {
        const baseDefaults = DEFAULT_MODULES_BY_ROLE[profile.user_type as keyof typeof DEFAULT_MODULES_BY_ROLE] || [];
        const defaultModules = pinForSuperAdmin(baseDefaults);
        
        // Helper: validate IDs against available modules (database or hardcoded)
        const isValidIds = (ids: unknown): ids is string[] => {
          if (!Array.isArray(ids)) return false;
          const validSet = new Set(availableModulesList.map(m => m.id));
          return ids.every(id => typeof id === 'string' && validSet.has(id));
        };

        // Helper: filter out modules that are no longer available
        const filterAvailableModules = (moduleIds: string[]): string[] => {
          const availableIds = new Set(availableModulesList.map(m => m.id));
          return moduleIds.filter(id => availableIds.has(id));
        };

        // Load per-user overrides from Super Admin (by email) - localStorage fallback
        let adminOverride: { modules: string[]; order: string[] } | null = null;
        try {
          const rawAdmin = localStorage.getItem('medarionAdminModules');
          if (rawAdmin) {
            const all = JSON.parse(rawAdmin) as AdminModules;
            if (all[profile.email]) adminOverride = all[profile.email]!;
          }
        } catch {}

        // Try to load from database first
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('medarionSessionToken');
          // Only try to fetch if we have a valid token (not 'test-token')
          if (token && token !== 'test-token') {
            // Use apiService to get the correct URL (it handles base URL and /api prefix)
            const apiBase = getApiBaseUrl();
            const apiUrl = apiBase ? `${apiBase}/api/admin/module-config/${profile.email}` : `/api/admin/module-config/${profile.email}`;
            const response = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.modules && data.moduleOrder) {
                // Filter out unavailable modules
                const filteredModules = filterAvailableModules(data.modules);
                const filteredOrder = filterAvailableModules(data.moduleOrder);
                
                if (filteredModules.length > 0 && isValidIds(filteredModules) && isValidIds(filteredOrder)) {
                  const mergedModules = pinForSuperAdmin(filteredModules);
                  setUserModules(mergedModules);
                  setModuleOrder(pinForSuperAdmin(filteredOrder));
                  setIsInitialized(true);
                  return;
                }
              }
            } else if (response.status === 401) {
              // 401 is expected when not logged in - silently fall back to localStorage
              // Don't log this as an error
            }
          }
        } catch (error) {
          // Only log if it's not a 401 (authentication) error
          if (error instanceof Error && !error.message.includes('401')) {
            console.warn('Failed to load modules from database, trying localStorage:', error);
          }
        }

        // Fallback to localStorage
        const savedModules = profile.id ? localStorage.getItem(`dashboard_modules_${profile.id}`) : null;
        const savedOrder = profile.id ? localStorage.getItem(`dashboard_order_${profile.id}`) : null;

        if (adminOverride) {
          const modulesOk = isValidIds(adminOverride.modules);
          const orderOk = isValidIds(adminOverride.order);
          const filteredModules = filterAvailableModules(modulesOk ? adminOverride.modules : defaultModules);
          const filteredOrder = filterAvailableModules(orderOk ? adminOverride.order : filteredModules);
          const mergedModules = pinForSuperAdmin(filteredModules);
          setUserModules(mergedModules);
          setModuleOrder(pinForSuperAdmin(filteredOrder));
        } else if (savedModules && savedOrder) {
          let parsedModules: unknown;
          let parsedOrder: unknown;
          try { parsedModules = JSON.parse(savedModules); } catch {}
          try { parsedOrder = JSON.parse(savedOrder); } catch {}

          const modulesOk = isValidIds(parsedModules);
          const orderOk = isValidIds(parsedOrder);

          if (modulesOk && orderOk) {
            const filteredModules = filterAvailableModules(parsedModules as string[]);
            const filteredOrder = filterAvailableModules(parsedOrder as string[]);
            setUserModules(pinForSuperAdmin(filteredModules));
            setModuleOrder(pinForSuperAdmin(filteredOrder));
          } else {
            setUserModules(defaultModules);
            setModuleOrder(defaultModules);
          }
        } else {
          // Use defaults from profile if available
          if ((profile as any).dashboard_modules && Array.isArray((profile as any).dashboard_modules)) {
            const filteredModules = filterAvailableModules((profile as any).dashboard_modules);
            const filteredOrder = (profile as any).module_order && Array.isArray((profile as any).module_order) 
              ? filterAvailableModules((profile as any).module_order)
              : filteredModules;
            setUserModules(pinForSuperAdmin(filteredModules));
            setModuleOrder(pinForSuperAdmin(filteredOrder));
          } else {
            setUserModules(defaultModules);
            setModuleOrder(defaultModules);
          }
        }
        setIsInitialized(true);
      };

      loadModules();
    }
  }, [profile, isInitialized, dbModules, availableModulesList]);

  // Clean up modules that are no longer available when modules list changes
  useEffect(() => {
    if (isInitialized && userModules.length > 0) {
      const availableIds = new Set(availableModulesList.map(m => m.id));
      const filteredModules = userModules.filter(id => availableIds.has(id));
      const filteredOrder = moduleOrder.filter(id => availableIds.has(id));
      
      if (filteredModules.length !== userModules.length || filteredOrder.length !== moduleOrder.length) {
        // Some modules were removed, update state
        setUserModules(filteredModules);
        setModuleOrder(filteredOrder);
        
        // Save to database
        if (profile?.email) {
          const saveToDatabase = async () => {
            try {
              const token = localStorage.getItem('token');
              await fetch('/api/admin/module-config', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  email: profile.email,
                  modules: filteredModules,
                  moduleOrder: filteredOrder
                })
              });
            } catch (error) {
              console.error('Error saving cleaned modules to database:', error);
            }
          };
          saveToDatabase();
        }
      }
    }
  }, [availableModulesList, isInitialized]);

  // Save modules to database when they change
  useEffect(() => {
    if (profile?.email && userModules.length > 0 && isInitialized) {
      // Save to localStorage as backup
      if (profile?.id) {
        localStorage.setItem(`dashboard_modules_${profile.id}`, JSON.stringify(userModules));
        localStorage.setItem(`dashboard_order_${profile.id}`, JSON.stringify(moduleOrder));
      }
      
      // Save to database
      const saveToDatabase = async () => {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('medarionSessionToken') || 'test-token';
          // Use getApiBaseUrl to construct the correct URL
          const apiBase = getApiBaseUrl();
          const apiUrl = apiBase ? `${apiBase}/api/admin/module-config` : `/api/admin/module-config`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              email: profile.email,
              modules: userModules,
              moduleOrder: moduleOrder
            })
          });
          
          if (!response.ok) {
            console.error('Failed to save modules to database');
          }
        } catch (error) {
          console.error('Error saving modules to database:', error);
        }
      };
      
      saveToDatabase();
    }
  }, [userModules, moduleOrder, profile?.email, profile?.id, isInitialized]);

  const addModule = async (moduleId: string) => {
    // Check if module is available in database
    const moduleExists = availableModulesList.some(m => m.id === moduleId);
    if (!moduleExists) {
      console.warn(`Module ${moduleId} is not available`);
      return;
    }

    if (!userModules.includes(moduleId)) {
      const newModules = [...userModules, moduleId];
      const newOrder = [...moduleOrder, moduleId];
      setUserModules(newModules);
      setModuleOrder(newOrder);
      
      // Save to database immediately
      if (profile?.email) {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('medarionSessionToken');
          const apiBase = getApiBaseUrl();
          const apiUrl = apiBase ? `${apiBase}/api/admin/module-config` : `/api/admin/module-config`;
          await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              email: profile.email,
              modules: newModules,
              moduleOrder: newOrder
            })
          });
        } catch (error) {
          console.error('Error saving module to database:', error);
        }
      }
    }
  };

  const removeModule = async (moduleId: string) => {
    // No protected modules - blog_manager and ads_manager are Admin Dashboard tabs only
    
    const newModules = userModules.filter(id => id !== moduleId);
    const newOrder = moduleOrder.filter(id => id !== moduleId);
    setUserModules(newModules);
    setModuleOrder(newOrder);
    
    // Save to database immediately
    if (profile?.email) {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('medarionSessionToken');
        await fetch(getApiUrl('/api/admin/module-config'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: profile.email,
            modules: newModules,
            moduleOrder: newOrder
          })
        });
      } catch (error) {
        console.error('Error saving module removal to database:', error);
      }
    }
  };

  const reorderModules = async (newOrder: string[]) => {
    setModuleOrder(newOrder);
    
    // Save to database immediately
    if (profile?.email) {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('medarionSessionToken');
        await fetch(getApiUrl('/api/admin/module-config'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: profile.email,
            modules: userModules,
            moduleOrder: newOrder
          })
        });
      } catch (error) {
        console.error('Error saving module order to database:', error);
      }
    }
  };

  const resetToDefaults = async () => {
    if (profile?.user_type) {
      const baseDefaults = DEFAULT_MODULES_BY_ROLE[profile.user_type as keyof typeof DEFAULT_MODULES_BY_ROLE] || [];
      const defaultModules = pinForSuperAdmin(baseDefaults);
      setUserModules(defaultModules);
      setModuleOrder(defaultModules);
      
      // Save to database immediately
      if (profile?.email) {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('medarionSessionToken');
          const apiBase = getApiBaseUrl();
          const apiUrl = apiBase ? `${apiBase}/api/admin/module-config` : `/api/admin/module-config`;
          await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              email: profile.email,
              modules: defaultModules,
              moduleOrder: defaultModules
            })
          });
        } catch (error) {
          console.error('Error saving reset modules to database:', error);
        }
      }
    }
  };

  const getModuleById = (moduleId: string) => {
    return availableModulesList.find(module => module.id === moduleId);
  };

  const getAvailableModules = () => {
    if (!profile) return [];
    
    // Get user type and tier
    const userType = profile.user_type as keyof typeof ACCESS_MATRIX;
    const userTier = ((profile as any).account_tier || 'free') as AccountTier;
    const tierHierarchy = { 'free': 0, 'paid': 1, 'academic': 2, 'enterprise': 3 } as const;
    const isAdmin = profile.is_admin || false;
    
    // Get user's app_roles as an array
    let userRoles: string[] = [];
    if (profile.app_roles) {
      if (typeof profile.app_roles === 'string') {
        try {
          userRoles = JSON.parse(profile.app_roles);
        } catch {
          userRoles = Array.isArray(profile.app_roles) ? profile.app_roles : [];
        }
      } else if (Array.isArray(profile.app_roles)) {
        userRoles = profile.app_roles;
      }
    }
    
    return availableModulesList.filter(module => {
      // Check if module is enabled in database (if from database)
      if (dbModules.length > 0) {
        const dbModule = dbModules.find(m => m.id === module.id);
        if (dbModule && !(dbModule as any).is_enabled) {
          return false;
        }
      }
      
      // Admin can see all enabled modules
      if (isAdmin) return true;
      
      // Check required roles - if module has required_roles, user must have at least one
      if ((module as any).required_roles && Array.isArray((module as any).required_roles) && (module as any).required_roles.length > 0) {
        const requiredRoles = (module as any).required_roles as string[];
        if (userRoles.length === 0 || !requiredRoles.some(role => userRoles.includes(role))) {
          return false;
        }
      }
      
      // Check required tier - user's tier must be >= module's required tier
      if ((module as any).required_tier) {
        const requiredTier = (module as any).required_tier as AccountTier;
        const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
        const requiredTierLevel = tierHierarchy[requiredTier] || 0;
        if (userTierLevel < requiredTierLevel) {
          return false;
        }
      }
      
      // Special handling for AI tools - check ACCESS_MATRIX
      if (module.id === 'ai-tools' || module.id === 'ai_tools') {
        try {
          const rolePolicies = ACCESS_MATRIX[userType];
          if (rolePolicies) {
            const policy = rolePolicies[userTier];
            if (!policy || !policy.aiEnabled) return false;
          } else {
            return false;
          }
        } catch { 
          return false; 
        }
      }
      
      // If no restrictions specified, show module to all users (or check user type compatibility)
      // Modules without required_roles or required_tier are available to all users of appropriate type
      return true;
    });
  };

  const value = {
    userModules,
    moduleOrder,
    availableModules: getAvailableModules(),
    currentModule,
    addModule,
    removeModule,
    reorderModules,
    resetToDefaults,
    getModuleById,
    setCurrentModule,
    showDashboardSummary,
    setShowDashboardSummary,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};