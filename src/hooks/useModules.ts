import { useState, useEffect } from 'react';
import { adminApi, type Module } from '../services/adminApi';
import { AVAILABLE_MODULES, type DashboardModule } from '../types/userTypes';

/**
 * Hook to fetch and use modules from the database
 * Falls back to hardcoded AVAILABLE_MODULES if database is unavailable
 */
export function useModules() {
  const [modules, setModules] = useState<DashboardModule[]>(AVAILABLE_MODULES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbEnabled, setIsDbEnabled] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch modules from database
        const response = await adminApi.getModules({ page: 1, limit: 100 });
        
        if (response.data && response.data.length > 0) {
          // Convert database modules to DashboardModule format
          const dbModules: DashboardModule[] = response.data
            .filter((m: Module) => m.is_enabled) // Only enabled modules
            .map((m: Module) => ({
              id: m.module_id,
              name: m.name,
              component: m.component || m.name,
              icon: m.icon || 'Circle',
              description: m.description || '',
              category: m.category || 'core',
              required_tier: m.required_tier || undefined,
              required_roles: m.required_roles ? (typeof m.required_roles === 'string' ? JSON.parse(m.required_roles) : m.required_roles) : undefined,
              is_enabled: m.is_enabled, // Keep for filtering
            }));
          
          setModules(dbModules);
          setIsDbEnabled(true);
        } else {
          // No modules in database, use hardcoded fallback
          setModules(AVAILABLE_MODULES);
          setIsDbEnabled(false);
        }
      } catch (err) {
        console.warn('Failed to fetch modules from database, using fallback:', err);
        setModules(AVAILABLE_MODULES);
        setIsDbEnabled(false);
        setError(err instanceof Error ? err.message : 'Failed to load modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return {
    modules,
    loading,
    error,
    isDbEnabled,
    refetch: () => {
      const fetchModules = async () => {
        try {
          setLoading(true);
          const response = await adminApi.getModules({ page: 1, limit: 100 });
          
          if (response.data && response.data.length > 0) {
            const dbModules: DashboardModule[] = response.data
              .filter((m: Module) => m.is_enabled)
              .map((m: Module) => ({
                id: m.module_id,
                name: m.name,
                component: m.component || m.name,
                icon: m.icon || 'Circle',
                description: m.description || '',
                category: m.category || 'core',
                required_tier: m.required_tier || undefined,
                required_roles: m.required_roles || undefined,
              }));
            
            setModules(dbModules);
            setIsDbEnabled(true);
          }
        } catch (err) {
          console.warn('Failed to refetch modules:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchModules();
    }
  };
}

