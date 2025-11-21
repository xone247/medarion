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

// Mock user database
const mockUsers: UserProfile[] = [
  {
    id: '1',
    email: 'startup@demo.medarion.com',
    user_type: 'startup',
    full_name: 'Dr. Amina Hassan',
    company_name: 'HealthTech Solutions',
    account_tier: 'free',
    is_admin: false,
    app_roles: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'investor@demo.medarion.com',
    user_type: 'investors_finance',
    full_name: 'James Mwangi',
    company_name: 'Savannah Capital',
    account_tier: 'paid',
    is_admin: false,
    app_roles: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'executive@demo.medarion.com',
    user_type: 'industry_executives',
    full_name: 'Sarah Okafor',
    company_name: 'AfriHealth Corp',
    account_tier: 'academic',
    is_admin: false,
    app_roles: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    email: 'scientist@demo.medarion.com',
    user_type: 'health_science_experts',
    full_name: 'Dr. Kwame Asante',
    company_name: 'African Health Research Institute',
    account_tier: 'free',
    is_admin: false,
    app_roles: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    email: 'media@demo.medarion.com',
    user_type: 'media_advisors',
    full_name: 'Fatima Al-Rashid',
    company_name: 'HealthTech Media Africa',
    account_tier: 'free',
    is_admin: false,
    app_roles: ['content_editor'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    email: 'blogadmin@demo.medarion.com',
    user_type: 'media_advisors',
    full_name: 'Content Editor',
    company_name: 'Medarion',
    account_tier: 'free',
    is_admin: false,
    app_roles: ['blog_admin'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    email: 'adsadmin@demo.medarion.com',
    user_type: 'industry_executives',
    full_name: 'Ads Manager',
    company_name: 'Medarion',
    account_tier: 'free',
    is_admin: false,
    app_roles: ['ads_admin'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    email: 'superadmin@demo.medarion.com',
    user_type: 'investors_finance',
    full_name: 'Super Admin',
    company_name: 'Medarion',
    account_tier: 'enterprise',
    is_admin: true,
    app_roles: ['super_admin'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const signIn = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Demo mode: accept any password for demo users
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return { user: null, error: { message: 'Invalid credentials' } };
  }
  
  // Generate a mock token
  const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('medarionToken', token);
  
  return { user, error: null };
};

export const signUp = async (email: string, password: string, userType: UserRole, fullName: string, companyName?: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return { user: null, error: { message: 'User already exists' } };
  }
  
  // Create new user
  const newUser: UserProfile = {
    id: (mockUsers.length + 1).toString(),
    email,
    user_type: userType,
    full_name: fullName,
    company_name: companyName,
    account_tier: 'free',
    is_admin: false,
    app_roles: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Add to mock database
  mockUsers.push(newUser);
  
  // Generate a mock token
  const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('medarionToken', token);
  
  return { user: newUser, error: null };
};

export const signOut = async () => {
  localStorage.removeItem('medarionToken');
  return { error: null };
};

export { };