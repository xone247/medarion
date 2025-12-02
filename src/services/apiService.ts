// Centralized API service for consistent authentication and headers
import { getApiBaseUrl } from '../config/api';

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    // Use getApiBaseUrl() if no baseUrl provided, otherwise use provided value
    // Default to '/api' if getApiBaseUrl() returns empty string
    const apiBase = getApiBaseUrl();
    // For production, baseUrl is 'https://api.medarion.africa', endpoints need /api prefix
    // For local dev, baseUrl is '', endpoints need /api prefix
    const finalBase = baseUrl || (apiBase || '');
    // Check if baseUrl already ends with /api to avoid double /api/api/
    if (finalBase && finalBase.endsWith('/api')) {
      this.baseUrl = finalBase;
    } else {
      // Always add /api prefix to baseUrl (endpoints are like /blog, /ai, etc.)
      this.baseUrl = finalBase ? `${finalBase}/api` : '/api';
    }
    this.updateAuthToken();
  }

  // Update auth token from localStorage
  updateAuthToken() {
    // Try to get token from localStorage (check all possible keys)
    const authToken = localStorage.getItem('medarionAuthToken') ||
                     localStorage.getItem('medarionSessionToken') ||
                     localStorage.getItem('auth_token') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('authToken');
    
    // Use actual token if found, otherwise null (don't use test-token in production)
    this.authToken = authToken;
    
    // Debug logging (can be removed in production)
    // Only log warning if we're on a page that requires authentication
    // Suppress for public pages like m-index, blog, etc.
    if (!authToken && process.env.NODE_ENV === 'development') {
      // Check if we're on a public page by checking the current route
      const isPublicPage = typeof window !== 'undefined' && (
        window.location.pathname.includes('/m-index') ||
        window.location.pathname.includes('/blog') ||
        window.location.pathname.includes('/arion') ||
        window.location.pathname === '/' ||
        window.location.pathname.includes('/contact') ||
        window.location.pathname.includes('/about') ||
        window.location.pathname.includes('/pricing') ||
        window.location.pathname.includes('/documentation')
      );
      
      // Only log warning if not on a public page
      if (!isPublicPage) {
        console.warn('[apiService] No auth token found in localStorage');
      }
    }
  }

  // Get headers with authentication
  private getHeaders(): HeadersInit {
    this.updateAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if token exists
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  // Generic request method
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    // Debug logging (can be removed in production)
    // Suppress logging for public pages
    if (process.env.NODE_ENV === 'development') {
      const isPublicPage = typeof window !== 'undefined' && (
        window.location.pathname.includes('/m-index') ||
        window.location.pathname.includes('/blog') ||
        window.location.pathname.includes('/arion') ||
        window.location.pathname === '/' ||
        window.location.pathname.includes('/contact') ||
        window.location.pathname.includes('/about') ||
        window.location.pathname.includes('/pricing') ||
        window.location.pathname.includes('/documentation')
      );
      
      // Only log for authenticated pages or when there's a token
      if (!isPublicPage || this.authToken) {
        console.log('[apiService] Request:', url);
        console.log('[apiService] Token:', this.authToken ? `${this.authToken.substring(0, 20)}...` : 'none');
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const text = await response.text();
      
      // Check if response is HTML (error page or redirect)
      const isHtml = text.trim().startsWith('<!') || text.includes('<!doctype') || text.includes('<!DOCTYPE');
      
      if (isHtml) {
        // This is likely a routing issue - log for debugging
        console.error('Received HTML instead of JSON for:', url, 'Response preview:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. This usually indicates a routing issue. URL: ${url}`);
      }
      
      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        
        if (isJson) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } else {
          errorMessage = `Server returned non-JSON error. Status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`);
      }

      const data = JSON.parse(text);
      return data;
    } catch (error: any) {
      // Re-throw if it's already our formatted error
      if (error.message && error.message.includes('HTML instead of JSON')) {
        throw error;
      }
      // Otherwise wrap in a more informative error
      throw new Error(`API request failed for ${url}: ${error.message}`);
    }
  }

  // GET request
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    console.log('PATCH method called with endpoint:', endpoint, 'type:', typeof endpoint);
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
