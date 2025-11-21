// API configuration and utilities for the Medarion platform
// Use centralized API base URL configuration
import { getApiBaseUrl } from '../config/api';
const API_BASE_URL = getApiBaseUrl() || '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'investor' | 'startup' | 'researcher' | 'regulator';
  companyName?: string;
  phone?: string;
  country?: string;
  city?: string;
  bio?: string;
  profileImage?: string;
  isVerified: boolean;
  createdAt?: string;
  // Additional fields from API
  account_tier?: 'free' | 'paid' | 'academic' | 'enterprise';
  user_type?: string;
  is_admin?: boolean;
  app_roles?: string[];
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  stage: 'idea' | 'mvp' | 'early' | 'growth' | 'mature';
  foundedYear?: number;
  employeesCount?: number;
  headquarters?: string;
  fundingStage?: string;
  totalFunding?: number;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: number;
  companyId: number;
  companyName?: string;
  industry?: string;
  dealType: 'seed' | 'series_a' | 'series_b' | 'series_c' | 'series_d' | 'ipo' | 'acquisition' | 'merger';
  amount?: number;
  valuation?: number;
  leadInvestor?: string;
  participants?: string;
  dealDate?: string;
  status: 'announced' | 'closed' | 'pending' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grant {
  id: number;
  title: string;
  description?: string;
  fundingAgency?: string;
  amount?: number;
  grantType: 'research' | 'development' | 'innovation' | 'startup' | 'academic';
  applicationDeadline?: string;
  awardDate?: string;
  status: 'open' | 'closed' | 'awarded' | 'cancelled';
  requirements?: string;
  contactEmail?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalTrial {
  id: number;
  title: string;
  description?: string;
  phase: 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'preclinical';
  medicalCondition?: string;
  intervention?: string;
  sponsor?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'terminated';
  nctNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  authorId: number;
  authorName?: string;
  firstName?: string;
  lastName?: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SponsoredAd {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  position: 'blog_grid' | 'blog_sidebar' | 'blog_inline';
  priority: number;
}

// API client class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const headers: HeadersInit = {
      ...(isGet ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        // Avoid body for GET requests
        ...(isGet ? { body: undefined } : {}),
        headers,
      });

      const raw = await response.text();
      // Normalize: strip BOM/leading junk and attempt JSON parse
      const cleaned = raw.replace(/^\uFEFF/, '').replace(/^[^{\[]+/, (m) => {
        // If the response starts with HTML, bail early
        return raw.trim().startsWith('<') ? '' : '';
      });
      let data: any;
      try {
        data = cleaned ? JSON.parse(cleaned) : {};
      } catch (e) {
        console.error('Failed to parse JSON from', url, 'raw:', raw.slice(0, 200));
        return { error: 'Invalid server response' };
      }

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Auth endpoints
  async signup(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    userType?: string;
    accountTier?: string;
    companyName?: string;
    phone?: string;
    country?: string;
    city?: string;
  }) {
    return this.request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async signin(credentials: { email: string; password: string }) {
    // Use raw fetch to normalize varying API shapes (session_token vs token, user fields)
    try {
      const res = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data?.error || 'Sign-in failed' };
      }

      const token = data?.token || data?.session_token || null;
      const apiUser: any = data?.user || {};

      // Handle both full_name and separate first_name/last_name
      const fullName = String(apiUser.full_name || '').trim();
      const firstName = apiUser.first_name || (fullName ? fullName.split(' ')[0] : '');
      const lastName = apiUser.last_name || (fullName ? fullName.split(' ').slice(1).join(' ') : '');
      
      const roleMap: Record<string, User['role']> = {
        investors_finance: 'investor',
        startup: 'startup',
        health_science_experts: 'researcher',
        industry_executives: 'executive',
        regulators: 'regulator',
        media_advisors: 'regulator',
      };
      const role: User['role'] = apiUser.is_admin ? 'admin' : (roleMap[String(apiUser.user_type)] || 'startup');

      const user: User = {
        id: Number(apiUser.id ?? 0),
        username: String(apiUser.username || apiUser.email || '').split('@')[0] || '',
        email: String(apiUser.email || ''),
        firstName: String(firstName || ''),
        lastName: String(lastName || ''),
        role,
        companyName: apiUser.company_name || undefined,
        isVerified: Boolean(apiUser.is_verified ?? true),
        createdAt: apiUser.created_at,
        // Always include these fields (with defaults if missing)
        account_tier: apiUser.account_tier || 'free',
        user_type: apiUser.user_type || roleMap[role] || 'startup',
        is_admin: apiUser.is_admin !== undefined ? Boolean(apiUser.is_admin) : false,
        app_roles: apiUser.app_roles || [],
      };

      if (token) this.setToken(token);
      return { data: { token, user } } as ApiResponse<{ token: string; user: User }>;
    } catch (e) {
      return { error: 'Network error' };
    }
  }

  async getProfile() {
    const response = await this.request<{ user: any }>('/auth/profile');
    if (response.data) {
      const apiUser = response.data.user;
      // Preserve additional fields from API response (same as signin)
      const fullName = String(apiUser.firstName || '').trim() + ' ' + String(apiUser.lastName || '').trim();
      const firstName = apiUser.firstName || (fullName ? fullName.split(' ')[0] : '');
      const lastName = apiUser.lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : '');
      
      const roleMap: Record<string, User['role']> = {
        investors_finance: 'investor',
        startup: 'startup',
        health_science_experts: 'researcher',
        industry_executives: 'executive',
        regulators: 'regulator',
        media_advisors: 'regulator',
      };
      const role: User['role'] = apiUser.is_admin ? 'admin' : (roleMap[String(apiUser.user_type)] || 'startup');

      const user: User = {
        id: Number(apiUser.id ?? 0),
        username: String(apiUser.username || apiUser.email || '').split('@')[0] || '',
        email: String(apiUser.email || ''),
        firstName: String(firstName || ''),
        lastName: String(lastName || ''),
        role,
        companyName: apiUser.company_name || undefined,
        isVerified: Boolean(apiUser.is_verified ?? true),
        createdAt: apiUser.created_at,
        // Always include these fields (with defaults if missing)
        account_tier: apiUser.account_tier || 'free',
        user_type: apiUser.user_type || roleMap[role] || 'startup',
        is_admin: apiUser.is_admin !== undefined ? Boolean(apiUser.is_admin) : false,
        app_roles: apiUser.app_roles || [],
      };
      
      return { data: { user } } as ApiResponse<{ user: User }>;
    }
    return response as ApiResponse<{ user: User }>;
  }

  async updateProfile(profileData: Partial<User>) {
    return this.request<{ message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async logout() {
    const result = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
    return result;
  }

  // Companies endpoints
  async getCompanies(params?: {
    industry?: string;
    stage?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ companies: Company[]; pagination: any }>(
      `/companies${query ? `?${query}` : ''}`
    );
  }

  async getCompany(id: number) {
    return this.request<{ company: Company }>(`/companies/${id}`);
  }

  async createCompany(companyData: Partial<Company>) {
    return this.request<{ message: string; company: Company }>('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(id: number, companyData: Partial<Company>) {
    return this.request<{ message: string }>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(id: number) {
    return this.request<{ message: string }>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Deals endpoints
  async getDeals(params?: {
    companyId?: number;
    dealType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ deals: Deal[]; pagination: any }>(
      `/deals${query ? `?${query}` : ''}`
    );
  }

  async getDeal(id: number) {
    return this.request<{ deal: Deal }>(`/deals/${id}`);
  }

  async createDeal(dealData: Partial<Deal>) {
    return this.request<{ message: string; deal: Deal }>('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    });
  }

  async updateDeal(id: number, dealData: Partial<Deal>) {
    return this.request<{ message: string }>(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealData),
    });
  }

  async deleteDeal(id: number) {
    return this.request<{ message: string }>(`/deals/${id}`, {
      method: 'DELETE',
    });
  }

  // Grants endpoints
  async getGrants(params?: {
    grantType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ grants: Grant[]; pagination: any }>(
      `/grants${query ? `?${query}` : ''}`
    );
  }

  async getGrant(id: number) {
    return this.request<{ grant: Grant }>(`/grants/${id}`);
  }

  async createGrant(grantData: Partial<Grant>) {
    return this.request<{ message: string; grant: Grant }>('/grants', {
      method: 'POST',
      body: JSON.stringify(grantData),
    });
  }

  async updateGrant(id: number, grantData: Partial<Grant>) {
    return this.request<{ message: string }>(`/grants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grantData),
    });
  }

  async deleteGrant(id: number) {
    return this.request<{ message: string }>(`/grants/${id}`, {
      method: 'DELETE',
    });
  }

  // Clinical trials endpoints
  async getClinicalTrials(params?: {
    phase?: string;
    status?: string;
    medicalCondition?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ trials: ClinicalTrial[]; pagination: any }>(
      `/clinical-trials${query ? `?${query}` : ''}`
    );
  }

  async getClinicalTrial(id: number) {
    return this.request<{ trial: ClinicalTrial }>(`/clinical-trials/${id}`);
  }

  async createClinicalTrial(trialData: Partial<ClinicalTrial>) {
    return this.request<{ message: string; trial: ClinicalTrial }>('/clinical-trials', {
      method: 'POST',
      body: JSON.stringify(trialData),
    });
  }

  async updateClinicalTrial(id: number, trialData: Partial<ClinicalTrial>) {
    return this.request<{ message: string }>(`/clinical-trials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trialData),
    });
  }

  async deleteClinicalTrial(id: number) {
    return this.request<{ message: string }>(`/clinical-trials/${id}`, {
      method: 'DELETE',
    });
  }

  // Blog endpoints
  async getBlogPosts(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<{ posts: BlogPost[]; pagination: any }>(
      `/blog/get_posts${query ? `?${query}` : ''}`
    );
  }

  async getBlogPost(id: number) {
    // PHP router expects /blog/post?id=...
    return this.request<{ post: BlogPost }>(`/blog/post?id=${id}`);
  }

  async getBlogPostBySlug(slug: string) {
    return this.request<{ post: BlogPost }>(`/blog/post?slug=${encodeURIComponent(slug)}`);
  }

  async createBlogPost(postData: Partial<BlogPost>) {
    const slug = (postData.slug || postData.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const payload: any = {
      title: postData.title || '',
      slug,
      content: postData.content || '',
      excerpt: postData.excerpt || '',
      featured_image: postData.featuredImage || (postData as any).featured_image || '',
      status: postData.status || 'draft',
    };
    if ((postData as any).category) payload.category = (postData as any).category;
    if ((postData as any).category_id) payload.category_id = (postData as any).category_id;
    if (postData.publishedAt) payload.published_at = postData.publishedAt;
    return this.request<any>('/blog', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBlogPost(id: number, postData: Partial<BlogPost>) {
    const payload: any = { id };
    if (postData.title !== undefined) payload.title = postData.title;
    if (postData.slug !== undefined) payload.slug = postData.slug;
    if (postData.content !== undefined) payload.content = postData.content;
    if (postData.excerpt !== undefined) payload.excerpt = postData.excerpt;
    if ((postData as any).featured_image !== undefined) payload.featured_image = (postData as any).featured_image;
    if (postData.featuredImage !== undefined) payload.featured_image = postData.featuredImage;
    if ((postData as any).category !== undefined) payload.category = (postData as any).category;
    if (postData.status !== undefined) payload.status = postData.status;
    if ((postData as any).published_at !== undefined) payload.published_at = (postData as any).published_at;
    if ((postData as any).publishedAt !== undefined) payload.published_at = (postData as any).publishedAt;
    return this.request<any>('/blog/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteBlogPost(id: number) {
    return this.request<any>('/blog/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  // Ads endpoints
  async getAds(params?: { position?: string; limit?: number; }) {
    const queryParams = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k,v]) => { if (v !== undefined) queryParams.append(k, String(v)); });
    const query = queryParams.toString();
    return this.request<{ ads: SponsoredAd[] }>(`/ads${query ? `?${query}` : ''}`);
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types and client
export default apiClient;
