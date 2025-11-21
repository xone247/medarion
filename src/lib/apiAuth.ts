import { UserRole } from '../types/userTypes';

export interface UserProfile {
  id: string;
  email: string;
  user_type: UserRole;
  full_name?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
  account_tier?: 'free' | 'paid' | 'enterprise' | 'academic';
  is_admin?: boolean;
  app_roles?: string[];
}

import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl() || '/api';

class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add session token if available
  const sessionToken = localStorage.getItem('medarionSessionToken');
  if (sessionToken) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${sessionToken}`,
    };
  }

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(errorData.error || 'Request failed', response.status);
  }
  
  return response.json();
}

export const signIn = async (email: string, password: string) => {
  try {
    const result = await apiRequest<{ success: boolean; user: UserProfile; session_token: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.success) {
      // Store session token
      localStorage.setItem('medarionSessionToken', result.session_token);
      return { user: result.user, error: null };
    } else {
      return { user: null, error: { message: 'Sign in failed' } };
    }
  } catch (error) {
    return { 
      user: null, 
      error: { 
        message: error instanceof ApiError ? error.message : 'Sign in failed' 
      } 
    };
  }
};

export const signUp = async (email: string, password: string, userType: UserRole, fullName: string, companyName?: string) => {
  try {
    const result = await apiRequest<{ success: boolean; user: UserProfile; session_token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        userType, 
        fullName, 
        companyName 
      }),
    });
    
    if (result.success) {
      // Store session token
      localStorage.setItem('medarionSessionToken', result.session_token);
      return { user: result.user, error: null };
    } else {
      return { user: null, error: { message: 'Sign up failed' } };
    }
  } catch (error) {
    return { 
      user: null, 
      error: { 
        message: error instanceof ApiError ? error.message : 'Sign up failed' 
      } 
    };
  }
};

export const signOut = async () => {
  localStorage.removeItem('medarionSessionToken');
  return { error: null };
};

// API functions for data fetching
export const fetchUsers = async (params?: { role?: string; limit?: number; offset?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.append('role', params.role);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint);
};

export const fetchCompanies = async (params?: { industry?: string; stage?: string; limit?: number; offset?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.industry) searchParams.append('industry', params.industry);
  if (params?.stage) searchParams.append('stage', params.stage);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/companies${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint);
};

export const fetchDeals = async (params?: { deal_type?: string; status?: string; company_id?: number; limit?: number; offset?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.deal_type) searchParams.append('deal_type', params.deal_type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.company_id) searchParams.append('company_id', params.company_id.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/deals${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint);
};

export const fetchGrants = async (params?: { grant_type?: string; status?: string; funding_agency?: string; limit?: number; offset?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.grant_type) searchParams.append('grant_type', params.grant_type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.funding_agency) searchParams.append('funding_agency', params.funding_agency);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/grants${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint);
};

export const fetchClinicalTrials = async (params?: { phase?: string; status?: string; medical_condition?: string; sponsor?: string; limit?: number; offset?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.phase) searchParams.append('phase', params.phase);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.medical_condition) searchParams.append('medical_condition', params.medical_condition);
  if (params?.sponsor) searchParams.append('sponsor', params.sponsor);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/clinical-trials${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint);
};

export const fetchBlogPosts = async (params?: { status?: string; author_id?: number; search?: string; limit?: number; offset?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.author_id) searchParams.append('author_id', params.author_id.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const queryString = searchParams.toString();
  const endpoint = `/blog${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint);
};

export const fetchBlogPost = async (id?: number, slug?: string) => {
  const searchParams = new URLSearchParams();
  if (id) searchParams.append('id', id.toString());
  if (slug) searchParams.append('slug', slug);
  
  const queryString = searchParams.toString();
  const endpoint = `/blog/post${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<{ success: boolean; data: any }>(endpoint);
};
