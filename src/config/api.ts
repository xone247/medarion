// API Configuration for Medarion Platform
// Handles both local development and production environments
// Configured for direct connection to backend (which connects to Vast.ai via SSH tunnel)

/**
 * Get the API base URL based on the current environment
 * - Local dev: Uses relative path (via Vite proxy to localhost:3001)
 * - Production: Uses relative path (same origin - Apache proxies to Node.js backend)
 * 
 * The backend (Node.js) connects directly to Vast.ai via SSH tunnel on localhost:8081
 */
export function getApiBaseUrl(): string {
  // Check if we're in production (not localhost)
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  if (isProduction) {
    // Production: Use api subdomain to access Node.js backend
    // Backend is running on api.medarion.africa subdomain
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
    const windowBase = (window as any)?.API_BASE_URL;
    
    if (typeof envBase === 'string' && envBase) {
      return envBase;
    }
    if (typeof windowBase === 'string' && windowBase) {
      return windowBase;
    }
    // Default: Use api subdomain (backend routes are at /api/*, but subdomain already handles routing)
    return 'https://api.medarion.africa';
  } else {
    // Local dev: Use relative path (Vite proxy handles it)
    // Vite proxy routes /api/ai/* to http://localhost:3001
    // Backend connects to Vast.ai on localhost:8081 (via SSH tunnel)
    return '';
  }
}

/**
 * Get the full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

// Export default base URL for backward compatibility
export const API_BASE_URL = getApiBaseUrl();

