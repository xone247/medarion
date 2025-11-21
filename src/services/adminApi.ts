import { apiService } from './apiService';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: number;
  featured_image: string;
  category: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  video_url?: string;
}

export interface Advertisement {
  id: number;
  title: string;
  advertiser: string;
  image_url: string;
  cta_text: string;
  target_url: string;
  category: string;
  placements: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface UserOverride {
  id: number;
  email: string;
  role: string;
  account_tier: string;
  full_name: string;
  company_name: string;
  is_admin: boolean;
  app_roles: string[];
  created_at: string;
  updated_at: string;
}

export interface PlatformConfig {
  data_mode: string;
  ai_mode: string;
  ollama_url: string;
  ollama_model: string;
  access_presets: Record<string, any>;
}

export interface AdminOverview {
  metrics: Record<string, any>;
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  revenueStats: {
    totalRevenue: number;
    monthlyRevenue: number;
  };
  blogStats: {
    blogPosts: number;
  };
  userRoles: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  revenueByTier: Array<{
    tier: string;
    revenue: number;
    users: number;
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    time: string;
    icon: string;
  }>;
  userGrowth: Array<{
    month: string;
    users: number;
  }>;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  account_tier: string;
  user_type: string;
  company_name: string;
  phone: string;
  country: string;
  city: string;
  bio: string;
  profile_image: string;
  is_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  app_roles: string[];
  dashboard_modules: string[];
  ai_quota_used: number;
  ai_quota_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  module_id: string;
  name: string;
  description?: string;
  component?: string;
  icon?: string;
  category: 'core' | 'data' | 'tools' | 'analytics' | 'admin';
  required_tier: 'free' | 'paid' | 'academic' | 'enterprise';
  required_roles?: string[];
  is_enabled: boolean;
  is_core: boolean;
  display_order: number;
  config_data?: Record<string, any>;
  data_source?: string;
  created_at: string;
  updated_at: string;
}

class AdminApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    // Endpoints should NOT start with /api/ since apiService already adds it
    // Just ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // apiService already uses getApiBaseUrl() and adds /api, so just pass the endpoint
    return apiService.request(cleanEndpoint, options);
  }

  // Blog Posts

  async createBlogPost(post: {
    title: string;
    excerpt: string;
    content: string;
    author: string;
    category: string;
    read_time: string;
    featured_image: string;
    featured: boolean;
    video_url?: string;
  }): Promise<BlogPost> {
    const response = await this.request('/admin/blog-posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
    return response.post;
  }

  async updateBlogPost(id: number, post: Partial<BlogPost>): Promise<BlogPost> {
    const response = await this.request(`/admin/blog-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(post),
    });
    return response.post;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await this.request(`/admin/blog-posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Advertisements

  async createAdvertisement(ad: {
    title: string;
    advertiser: string;
    imageUrl?: string;
    ctaText?: string;
    targetUrl?: string;
    category: string;
    placements: string[];
  }): Promise<Advertisement> {
    const response = await this.request('/admin/advertisements', {
      method: 'POST',
      body: JSON.stringify({
        title: ad.title,
        advertiser: ad.advertiser,
        image_url: ad.imageUrl,
        cta_text: ad.ctaText,
        target_url: ad.targetUrl,
        category: ad.category,
        placements: ad.placements,
        is_active: true,
        priority: 0,
      }),
    });
    return (response as any).ad;
  }

  async updateAdvertisement(id: number, ad: {
    title?: string;
    advertiser?: string;
    image_url?: string;
    cta_text?: string;
    target_url?: string;
    category?: string;
    placements?: string[];
    is_active?: boolean;
    priority?: number;
  }): Promise<Advertisement> {
    const response = await this.request(`/admin/advertisements?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(ad),
    });
    return (response as any).ad;
  }

  async deleteAdvertisement(id: number): Promise<void> {
    await this.request(`/admin/advertisements?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Get active advertisements for display
  async getActiveAdvertisements(placement?: string, category?: string): Promise<Advertisement[]> {
    const params = new URLSearchParams();
    if (placement) params.append('placement', placement);
    if (category) params.append('category', category);
    
    const response = await this.request(`/admin/advertisements/active?${params.toString()}`);
    return (response as any).ads;
  }

  // Upload image (multipart) - DEPRECATED: Use ImageUploadModal component instead
  // Kept for backward compatibility but should be replaced with ImageUploadModal
  async uploadAdImage(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', 'ads');
    // Use fetch directly to avoid JSON headers
    const apiBase = getApiBaseUrl();
    const uploadUrl = apiBase ? `${apiBase}/api/upload/admin` : '/api/upload/admin';
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return { url: data.url };
  }

  // Upload company logo - DEPRECATED: Use ImageUploadModal component instead
  // Kept for backward compatibility but should be replaced with ImageUploadModal
  async uploadCompanyLogo(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', 'company');
    // Use fetch directly to avoid JSON headers
    const apiBase = getApiBaseUrl();
    const uploadUrl = apiBase ? `${apiBase}/api/upload/admin` : '/api/upload/admin';
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to upload logo');
    const data = await res.json();
    return { url: data.url };
  }

  // Admin Dashboard Overview
  async getAdminOverview(): Promise<AdminOverview> {
    const response = await this.request('/admin/overview');
    return response.data;
  }

  // Users Management
  async getUsers(page: number = 1, limit: number = 20, search?: string, role?: string): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    
    const response = await this.request(`/admin/users?${params.toString()}`);
    return response.data;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    const response = await this.request('/admin/settings');
    return response.data;
  }

  async updateSystemSettings(settings: SystemSetting[]): Promise<void> {
    await this.request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }

  // Module Configurations (Legacy - for user-specific configs)
  async getModuleConfigurations(): Promise<any[]> {
    const response = await this.request('/admin/modules');
    return response.data;
  }

  // Module Management (Full CRUD)
  async getModules(params?: { search?: string; category?: string; enabled?: string; page?: number; limit?: number }): Promise<{
    data: Module[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.enabled !== undefined) queryParams.append('enabled', params.enabled);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await this.request(`/admin/modules?${queryParams.toString()}`);
    return response;
  }

  async getModule(id: number | string): Promise<Module> {
    const response = await this.request(`/admin/modules/${id}`);
    return response.data;
  }

  async createModule(module: Partial<Module>): Promise<Module> {
    const response = await this.request('/admin/modules', {
      method: 'POST',
      body: JSON.stringify(module),
    });
    return response.data;
  }

  async updateModule(id: number | string, module: Partial<Module>): Promise<Module> {
    const response = await this.request(`/admin/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(module),
    });
    return response.data;
  }

  async deleteModule(id: number | string): Promise<void> {
    await this.request(`/admin/modules/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkModuleOperation(action: 'enable' | 'disable' | 'delete', moduleIds: number[]): Promise<void> {
    await this.request('/admin/modules', {
      method: 'PATCH',
      body: JSON.stringify({ action, module_ids: moduleIds }),
    });
  }

  // Blog Management
  async getBlogPosts(page: number = 1, limit: number = 20, status?: string): Promise<{
    posts: BlogPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    
    // Try the main endpoint first, fallback to alternative routes
    try {
      const response = await this.request(`/admin/blog-posts?${params.toString()}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (err: any) {
      console.warn('[AdminApi] Blog-posts endpoint failed, trying alternative:', err.message);
    }
    
    // Fallback: try alternative endpoint
    try {
      const response = await this.request(`/admin/blog?${params.toString()}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (err: any) {
      console.error('[AdminApi] All blog endpoints failed:', err.message);
      throw err;
    }
    
    throw new Error('Failed to fetch blog posts from any endpoint');
  }

  // Advertisement Management
  async getAdvertisements(page: number = 1, limit: number = 20, category?: string): Promise<{
    advertisements: Advertisement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (category) params.append('category', category);
    const response = await this.request(`/admin/advertisements?${params.toString()}`);
    return response as any;
  }

  // User Overrides
  async getUserOverrides(): Promise<UserOverride[]> {
    const response = await this.request('/admin/user-overrides');
    return response.users;
  }

  async createUserOverride(user: {
    email: string;
    role: string;
    accountTier: string;
    fullName: string;
    companyName: string;
    isAdmin: boolean;
    appRoles: string[];
  }): Promise<UserOverride> {
    const response = await this.request('/admin/user-overrides', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return response.user;
  }

  async deleteUserOverride(id: number): Promise<void> {
    await this.request(`/admin/user-overrides/${id}`, {
      method: 'DELETE',
    });
  }

  // Platform Configuration
  async getPlatformConfig(): Promise<PlatformConfig> {
    const response = await this.request('/admin/platform-config');
    return response.config;
  }

  async updatePlatformConfig(config: Partial<PlatformConfig>): Promise<void> {
    await this.request('/admin/platform-config', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  // Module Configuration
  async getModuleConfig(email: string): Promise<{ modules: string[]; moduleOrder: string[] }> {
    const response = await this.request(`/admin/module-config/${email}`);
    return { modules: response.modules, moduleOrder: response.moduleOrder };
  }

  async saveModuleConfig(email: string, modules: string[], moduleOrder: string[]): Promise<void> {
    await this.request('/admin/module-config', {
      method: 'POST',
      body: JSON.stringify({ email, modules, moduleOrder }),
    });
  }

  // Enhanced User Management Methods
  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    await this.request('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, ...updates }),
    });
  }

  async deleteUser(userId: number, action: 'delete' | 'deactivate' | 'activate' | 'block' | 'suspend' = 'deactivate'): Promise<void> {
    await this.request('/admin/users', {
      method: 'DELETE',
      body: JSON.stringify({ id: userId, action }),
    });
  }

  async verifyUser(userId: number, verified: boolean = true): Promise<void> {
    const action = verified ? 'verify' : 'unverify';
    await this.request('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, action }),
    });
  }

  async changeUserTier(userId: number, tier: string): Promise<void> {
    await this.request('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, action: 'change_tier', tier }),
    });
  }

  async changeUserRole(userId: number, role: string): Promise<void> {
    await this.request('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, action: 'change_role', role }),
    });
  }

  async resetUserPassword(userId: number, newPassword: string = 'password123'): Promise<void> {
    await this.request('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, action: 'reset_password', password: newPassword }),
    });
  }

  async updateUserAppRoles(userId: number, appRoles: string[]): Promise<void> {
    await this.request('/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: userId, action: 'update_app_roles', app_roles: appRoles }),
    });
  }

  async getUserById(userId: number): Promise<User> {
    const response = await this.request(`/admin/users/${userId}`);
    return response.user;
  }

  async createUser(userData: Partial<User>): Promise<{ id: number; message: string }> {
    const response = await this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  }
}

export const adminApi = new AdminApiService();


