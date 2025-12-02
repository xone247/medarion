import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AVAILABLE_MODULES, DEFAULT_MODULES_BY_ROLE, AppRole } from '../types/userTypes';
import { 
  Layers, Users as UsersIcon, Megaphone, Newspaper, Database, Settings, 
  ArrowUp, ArrowDown, Save, Trash2, Plus, TrendingUp, TrendingDown, 
  Activity, BarChart3, Eye, Clock, AlertCircle, Users, TrendingUp as TrendingUpIcon, CheckCircle,
  UserCheck, Globe, Shield, Zap, Target, DollarSign, Calendar,
  Edit, MoreVertical, UserX, UserCheck as UserCheckIcon, Key, 
  Search, Filter, Download, Upload, Ban, Unlock, Mail, Phone, MousePointer, X,
  Building2, RefreshCw, Sparkles, Loader2, Image, Bell, Video, ExternalLink, Check, Send, FileText
} from 'lucide-react';
import { ACCESS_MATRIX } from '../types/accessControl';
import { adminApi, type BlogPost, type Advertisement, type UserOverride, type PlatformConfig, type AdminOverview, type SystemSetting, type User, type Module } from '../services/adminApi';
import apiService from '../services/apiService';
import BlogEditor from '../components/BlogEditor';
import ImageUploadModal from '../components/ImageUploadModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import AlertModal from '../components/ui/AlertModal';
import PromptModal from '../components/ui/PromptModal';
import NewsletterComposer from '../components/NewsletterComposer';

// RevenueByTierChart Component
const RevenueByTierChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  title: string;
}> = ({ data, title }) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-3 sm:mb-4">{title}</h3>
        <div className="text-center text-[var(--color-text-secondary)] py-6 sm:py-8">
          <p className="text-xs sm:text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Ensure data is valid
  const validData = data.filter(item => item && typeof item.value === 'number' && !isNaN(item.value));
  if (validData.length === 0) {
    return (
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-3 sm:mb-4">{title}</h3>
        <div className="text-center text-[var(--color-text-secondary)] py-6 sm:py-8">
          <p className="text-xs sm:text-sm">No valid data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...validData.map(d => d.value || 0));
  const totalRevenue = validData.reduce((sum, item) => sum + (item.value || 0), 0);
  
  const tierColors = {
    'Free': 'bg-gradient-to-r from-slate-400 to-slate-500',
    'Pro': 'bg-gradient-to-r from-cyan-500 to-teal-600',
    'Enterprise': 'bg-gradient-to-r from-indigo-500 to-purple-600',
    'Academic': 'bg-gradient-to-r from-emerald-500 to-green-600'
  };
  
  const tierIcons = {
    'Free': '🆓',
    'Pro': '⭐',
    'Enterprise': '🏢',
    'Academic': '🎓'
  };
  
  return (
    <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]">{title}</h3>
        <div className="text-right">
          <div className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)]">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Revenue</div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="space-y-2.5 sm:space-y-3">
        {validData.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const revenuePercentage = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
          
          return (
            <div key={index} className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg">{tierIcons[item.label as keyof typeof tierIcons] || '💼'}</span>
                  <span className="text-sm sm:text-base font-medium text-[var(--color-text-primary)]">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-medium text-[var(--color-text-primary)]">${item.value.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">{revenuePercentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="w-full bg-[var(--color-background-default)] border border-[var(--color-divider-gray)]/20 rounded-full h-1.5 sm:h-2">
                <div 
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${tierColors[item.label as keyof typeof tierColors] || 'bg-slate-400'}`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

type AdminModules = Record<string, { modules: string[]; order: string[] }>;

// Ads
export type AdPlacement = 'blog_top' | 'blog_inline' | 'blog_sidebar' | 'blog_grid' | 'dashboard_sidebar' | 'dashboard_inline';
export type AdCategory = 'blog_general' | 'dashboard_personalized';

// Chart components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color?: 'primary' | 'success' | 'accent' | 'sky' | 'error';
}> = ({ title, value, change, icon: Icon, color = 'primary' }) => {
  // Modern, professional color palette - easy on the eyes
  // Solid darker colors in light mode for white icon visibility, gradients for dark mode
  const colorClasses = {
    primary: {
      bg: 'bg-cyan-50/50 dark:bg-cyan-950/30',
      text: 'text-slate-700 dark:text-slate-200',
      iconBg: 'bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500',
      hoverBg: 'from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15',
      change: change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
    },
    success: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/30',
      text: 'text-slate-700 dark:text-slate-200',
      iconBg: 'bg-green-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500',
      hoverBg: 'from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15',
      change: change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
    },
    accent: {
      bg: 'bg-amber-50/50 dark:bg-amber-950/30',
      text: 'text-slate-700 dark:text-slate-200',
      iconBg: 'bg-orange-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500',
      hoverBg: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15',
      change: change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
    },
    sky: {
      bg: 'bg-indigo-50/50 dark:bg-indigo-950/30',
      text: 'text-slate-700 dark:text-slate-200',
      iconBg: 'bg-blue-600 dark:bg-gradient-to-br dark:from-indigo-500 dark:to-blue-500',
      hoverBg: 'from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/15 dark:to-blue-500/15',
      change: change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
    },
    error: {
      bg: 'bg-rose-50/50 dark:bg-rose-950/30',
      text: 'text-slate-700 dark:text-slate-200',
      iconBg: 'bg-pink-600 dark:bg-gradient-to-br dark:from-rose-500 dark:to-pink-500',
      hoverBg: 'from-rose-500/10 to-pink-500/10 dark:from-rose-500/15 dark:to-pink-500/15',
      change: change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className={`bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col ${classes.bg}`}>
      {/* Subtle gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${classes.hoverBg}`}></div>
      
      <div className="relative flex items-center justify-between flex-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 sm:mb-2 uppercase tracking-wide">{title}</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-medium mb-2 sm:mb-3 ${classes.text}`}>{value}</p>
          {change !== undefined && (
            <div className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
              change >= 0 
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5 sm:mr-1" /> : <TrendingDown className="h-3 w-3 mr-0.5 sm:mr-1" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${classes.iconBg} flex-shrink-0 ml-3 sm:ml-4 shadow-md group-hover:scale-105 transition-transform duration-200`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white !text-white" />
        </div>
      </div>
    </div>
  );
};

const SimpleBarChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  title: string;
  color?: 'primary' | 'success' | 'accent' | 'sky';
}> = ({ data, title, color = 'primary' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Modern professional gradients
  const colorClasses = {
    primary: 'bg-gradient-to-r from-cyan-500 to-teal-600 dark:from-cyan-500 dark:to-teal-600',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-500 dark:to-green-600',
    accent: 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-500 dark:to-orange-500',
    sky: 'bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-500 dark:to-blue-600'
  };
  
  const colorMap = {
    primary: '#06b6d4', // cyan-500
    success: '#10b981', // emerald-500
    accent: '#f59e0b', // amber-500
    sky: '#6366f1' // indigo-500
  };
  
  return (
    <div className="card-glass p-3 sm:p-4 rounded-lg">
      <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-3 sm:mb-4">{title}</h3>
      <div className="space-y-2 sm:space-y-2.5">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const barColor = colorMap[color];
          
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.label}</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.value.toLocaleString()}</div>
              </div>
              <div className="relative">
                <div className="w-full bg-slate-100 dark:bg-slate-700/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${colorClasses[color]} h-2 rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserGrowthChart: React.FC<{
  data: Array<{ label: string; value: number }>;
  title: string;
  color?: 'primary' | 'success' | 'accent' | 'sky';
}> = ({ data, title, color = 'primary' }) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-3 sm:mb-4">{title}</h3>
        <div className="text-center text-[var(--color-text-secondary)] py-6 sm:py-8">
          <p className="text-sm sm:text-base">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0));
  const totalUsers = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const peakMonth = data.find(item => item.value === maxValue);
  const avgGrowth = Math.floor(totalUsers / data.length);
  
  return (
    <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl overflow-hidden relative h-full flex flex-col shadow-sm">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/20"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-0.5 sm:mb-1">{title}</h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">User acquisition over time</p>
        </div>
        <div className="text-right">
          <div className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)]">
            {totalUsers}
          </div>
          <div className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Users</div>
        </div>
      </div>
      
      {/* Modern Chart Area */}
      <div className="relative z-10 mb-3 sm:mb-4 flex-1">
        <div className="flex items-end justify-between h-20 sm:h-24 space-x-1 sm:space-x-1.5">
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 100;
            const isHighest = item.value === maxValue;
            const isLatest = index === data.length - 1;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative w-full flex justify-center mb-2">
                  {/* Bar */}
                  <div 
                    className={`relative rounded-t-lg transition-all duration-700 ease-out shadow-md hover:shadow-lg cursor-pointer group-hover:scale-105 ${
                      isLatest 
                        ? 'bg-gradient-to-t from-cyan-600 to-teal-600' 
                        : 'bg-gradient-to-t from-cyan-500 to-teal-500'
                    }`}
                    style={{ 
                      height: `${Math.max(height, 8)}%`,
                      width: '75%',
                      minHeight: '8px'
                    }}
                    title={`${item.label}: ${item.value} users`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-t-lg"></div>
                  </div>
                  
                  {/* Value label */}
                  {isHighest && (
                    <div className="absolute -top-6 bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full shadow-md font-medium">
                      {item.value}
                    </div>
                  )}
                  
                  {/* Latest indicator */}
                  {isLatest && (
                    <div className="absolute -top-6 right-0 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                      Latest
                    </div>
                  )}
                </div>
                
                {/* Month label */}
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate w-full">
                    {item.label}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Enhanced Statistics Grid - Compact */}
      <div className="relative z-10 grid grid-cols-3 gap-2">
        <div className="bg-cyan-50/50 dark:bg-cyan-950/30 p-2 rounded-lg border border-cyan-100 dark:border-cyan-900/50">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 bg-cyan-100 dark:bg-cyan-500/30 rounded">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Peak</div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                {peakMonth?.label || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 bg-emerald-100 dark:bg-emerald-500/30 rounded">
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Growth</div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                +{totalUsers}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center space-x-1.5">
            <div className="p-1 bg-indigo-100 dark:bg-indigo-500/30 rounded">
              <Activity className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg</div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                +{avgGrowth}/mo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const CustomPieChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
}> = ({ data, title }) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-3 sm:mb-4">{title}</h3>
        <div className="text-center text-[var(--color-text-secondary)] py-6 sm:py-8">
          <p className="text-xs sm:text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  
  if (total === 0) {
    return (
      <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-3 sm:mb-4">{title}</h3>
        <div className="text-center text-[var(--color-text-secondary)] py-6 sm:py-8">
          <p className="text-xs sm:text-sm">No data to display</p>
        </div>
      </div>
    );
  }
  
  // Modern professional color palette
  const colorMap = {
    'primary': '#06b6d4', // cyan-500
    'success': '#10b981', // emerald-500
    'accent': '#f59e0b', // amber-500
    'sky': '#6366f1', // indigo-500
    'purple': '#8b5cf6', // violet-500
    'pink': '#ec4899', // pink-500
    'orange': '#f97316', // orange-500
    'teal': '#14b8a6', // teal-500
    'red': '#ef4444', // red-500
    'blue': '#3b82f6', // blue-500
    'green': '#10b981', // emerald-500
    'yellow': '#eab308', // yellow-500
    'indigo': '#6366f1', // indigo-500
    'gray': '#6b7280' // gray-500
  };
  
  // Generate colors if not provided - use distinct colors for better visibility
  const defaultColors = ['primary', 'success', 'accent', 'sky', 'purple', 'pink', 'orange', 'teal', 'red', 'blue'];
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length]
  }));
  
  return (
    <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl h-full flex flex-col shadow-sm">
      <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] mb-3 sm:mb-4">{title}</h3>
      <div className="flex items-center justify-center mb-3 flex-1">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {dataWithColors.filter(item => (item.value || 0) > 0).length === 0 ? (
              <circle cx="50" cy="50" r="40" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            ) : (
              dataWithColors.filter(item => (item.value || 0) > 0).map((item, index) => {
              const value = item.value || 0;
              const percentage = total > 0 ? (value / total) * 100 : 0;
              const startAngle = dataWithColors.slice(0, index).reduce((sum, d) => sum + ((d.value || 0) / total) * 360, 0);
              const endAngle = startAngle + (value / total) * 360;
              const color = colorMap[item.color as keyof typeof colorMap] || item.color;
              
              // Skip rendering if value is 0 or invalid
              if (value <= 0 || isNaN(value) || isNaN(percentage) || isNaN(startAngle) || isNaN(endAngle)) {
                return null;
              }
              
              // Convert angles to radians
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              // Calculate path coordinates
              const centerX = 50;
              const centerY = 50;
              const radius = 40;
              const innerRadius = 25;
              
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              
              const innerX1 = centerX + innerRadius * Math.cos(startAngleRad);
              const innerY1 = centerY + innerRadius * Math.sin(startAngleRad);
              const innerX2 = centerX + innerRadius * Math.cos(endAngleRad);
              const innerY2 = centerY + innerRadius * Math.sin(endAngleRad);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              
              const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `L ${innerX2} ${innerY2}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
                'Z'
              ].join(' ');
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={color}
                  stroke="none"
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
              })
            )}
          </svg>
          {/* Center circle for donut effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-xl font-medium text-slate-700 dark:text-slate-200">{total}</div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {dataWithColors.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-sm" 
                style={{ backgroundColor: colorMap[item.color as keyof typeof colorMap] || item.color }}
              />
              <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
            </div>
            <div className="text-right">
              <div className="font-medium text-slate-700 dark:text-slate-200">{item.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {((item.value / total) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityFeed: React.FC<{
  activities: Array<{ type: string; message: string; time: string; icon: string }>;
}> = ({ activities }) => {
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'user': return UsersIcon;
      case 'login': return Activity;
      case 'signup': return UserCheck;
      case 'post': return Newspaper;
      case 'payment': return DollarSign;
      default: return Activity;
    }
  };

  const getIconColor = (iconType: string) => {
    switch (iconType) {
      case 'user': return 'bg-cyan-100 dark:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400';
      case 'login': return 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400';
      case 'signup': return 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400';
      case 'post': return 'bg-amber-100 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400';
      case 'payment': return 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400';
      default: return 'bg-slate-100 dark:bg-slate-500/30 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="card-glass p-3 sm:p-4 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">Recent Activity</h3>
        <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2">
          View All →
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="space-y-2 sm:space-y-2.5">
        {activities.length === 0 ? (
          <div className="text-center py-4 sm:py-6 text-slate-500 dark:text-slate-400">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.icon);
            const iconColor = getIconColor(activity.icon);
            return (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-2.5 card-glass rounded-lg hover:shadow-md transition-all duration-200 group">
                <div className={`p-1.5 sm:p-2 ${iconColor} rounded-lg transition-colors flex-shrink-0`}>
                  <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium line-clamp-2">{activity.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get initial tab from URL or default to 'overview'
  const getInitialTab = (): 'overview'|'users'|'modules'|'blog'|'ads'|'data-management'|'newsletter' => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'users', 'modules', 'blog', 'ads', 'data-management', 'newsletter'].includes(tabParam)) {
      return tabParam as 'overview'|'users'|'modules'|'blog'|'ads'|'data-management'|'newsletter';
    }
    return 'overview';
  };
  
  // Get initial module from URL or default to 'companies'
  const getInitialModule = (): 'companies'|'deals'|'grants'|'investors'|'clinical-trials'|'regulatory'|'regulatory-ecosystem'|'public-markets'|'clinical-centers'|'investigators'|'nation-pulse'|'fundraising-crm' => {
    const moduleParam = searchParams.get('module');
    if (moduleParam && ['companies','deals','grants','investors','clinical-trials','regulatory','regulatory-ecosystem','public-markets','clinical-centers','investigators','nation-pulse','fundraising-crm'].includes(moduleParam)) {
      return moduleParam as any;
    }
    return 'companies';
  };
  
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'modules'|'blog'|'ads'|'data-management'|'newsletter'>(getInitialTab());
  const [selectedDataModule, setSelectedDataModule] = useState<'companies'|'deals'|'grants'|'investors'|'clinical-trials'|'regulatory'|'regulatory-ecosystem'|'public-markets'|'clinical-centers'|'investigators'|'nation-pulse'|'fundraising-crm'>(getInitialModule());
  
  // Update state when URL params change (e.g., on refresh or browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'users', 'modules', 'blog', 'ads', 'data-management', 'newsletter'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview'|'users'|'modules'|'blog'|'ads'|'data-management'|'newsletter');
    }
    
    const moduleParam = searchParams.get('module');
    if (moduleParam && ['companies','deals','grants','investors','clinical-trials','regulatory','regulatory-ecosystem','public-markets','clinical-centers','investigators','nation-pulse','fundraising-crm'].includes(moduleParam)) {
      setSelectedDataModule(moduleParam as any);
    }
  }, [searchParams]);
  
  // Function to update tab and URL
  const handleTabChange = (tab: 'overview'|'users'|'modules'|'blog'|'ads'|'data-management'|'newsletter') => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    setSearchParams(newSearchParams, { replace: true });
  };
  
  // Function to update module and URL
  const handleModuleChange = (module: 'companies'|'deals'|'grants'|'investors'|'clinical-trials'|'regulatory'|'regulatory-ecosystem'|'public-markets'|'clinical-centers'|'investigators'|'nation-pulse'|'fundraising-crm') => {
    setSelectedDataModule(module);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('module', module);
    setSearchParams(newSearchParams, { replace: true });
  };
  const [userQuery, setUserQuery] = useState<string>('');
  const [userPage, setUserPage] = useState<number>(1);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showUserEditModal, setShowUserEditModal] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserActionsMenu, setShowUserActionsMenu] = useState<number | null>(null);
  const usersPageSize = 8;
  
  // Database state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  
  // Video management state
  const [videos, setVideos] = useState<any[]>([]);
  const [videoPage, setVideoPage] = useState<number>(1);
  const [videoSearch, setVideoSearch] = useState<string>('');
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [draftVideo, setDraftVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    is_active: true,
    display_order: 0
  });

  // Newsletter state
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<any[]>([]);
  const [newsletterPage, setNewsletterPage] = useState<number>(1);
  const [newsletterSearch, setNewsletterSearch] = useState<string>('');
  const [newsletterStatus, setNewsletterStatus] = useState<string>('all');
  const [newsletterStats, setNewsletterStats] = useState<any>(null);
  const [editingSubscriber, setEditingSubscriber] = useState<any | null>(null);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState<any[]>([]);
  const [showNewsletterComposer, setShowNewsletterComposer] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [emailConfig, setEmailConfig] = useState<any | null>(null);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailConfigForm, setEmailConfigForm] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: true,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'Medarion Newsletter',
    reply_to: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const newsletterPageSize = 50;

  const [blogCategories, setBlogCategories] = useState<Array<{id: number | null; name: string; slug: string; post_count: number}>>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: number | null; name: string; slug: string} | null>(null);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);

  // State for real data
  const [overviewData, setOverviewData] = useState<AdminOverview | null>(null);
  const [usersData, setUsersData] = useState<{ users: User[]; pagination: any } | null>(null);
  const [blogData, setBlogData] = useState<{ posts: BlogPost[]; pagination: any } | null>(null);
  const [adsData, setAdsData] = useState<{ advertisements: Advertisement[]; pagination: any } | null>(null);
  const [announcementsData, setAnnouncementsData] = useState<{ announcements: any[]; pagination: any } | null>(null);
  const [draftAnnouncement, setDraftAnnouncement] = useState({
    title: '',
    message: '',
    imageUrl: '',
    actionUrl: '',
    actionText: '',
    placement: 'blog_sidebar' as 'blog_sidebar' | 'dashboard_sidebar',
    expiresAt: '',
    sendNotification: true
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementSearchTerm, setAnnouncementSearchTerm] = useState('');
  const [announcementPlacementFilter, setAnnouncementPlacementFilter] = useState<string>('');
  const [announcementPage, setAnnouncementPage] = useState(1);
  const announcementsPageSize = 10;
  const [companiesData, setCompaniesData] = useState<{ companies: any[]; pagination: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Companies state
  const [companiesSearch, setCompaniesSearch] = useState<string>('');
  const [companiesPage, setCompaniesPage] = useState<number>(1);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState<boolean>(false);
  const companiesPageSize = 20;

  // AI Update state
  const [aiUpdateStatus, setAiUpdateStatus] = useState<{
    module: string | null;
    status: 'idle' | 'updating' | 'success' | 'error';
    message: string;
    progress: number;
  }>({
    module: null,
    status: 'idle',
    message: '',
    progress: 0
  });
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<{
    status: 'idle' | 'updating' | 'success' | 'error';
    message: string;
    progress: number;
    results: any;
  }>({
    status: 'idle',
    message: '',
    progress: 0,
    results: null
  });

  // Deals state
  const [dealsData, setDealsData] = useState<{ deals: any[]; pagination: any } | null>(null);
  const [dealsSearch, setDealsSearch] = useState<string>('');
  const [dealsPage, setDealsPage] = useState<number>(1);
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [showDealForm, setShowDealForm] = useState<boolean>(false);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const dealsPageSize = 20;

  // Grants state
  const [grantsData, setGrantsData] = useState<{ grants: any[]; pagination: any } | null>(null);
  const [grantsSearch, setGrantsSearch] = useState<string>('');
  const [grantsPage, setGrantsPage] = useState<number>(1);
  const [editingGrant, setEditingGrant] = useState<any | null>(null);
  const [showGrantForm, setShowGrantForm] = useState<boolean>(false);
  const grantsPageSize = 20;

  // Investors state
  const [investorsData, setInvestorsData] = useState<{ investors: any[]; pagination: any } | null>(null);
  const [investorsSearch, setInvestorsSearch] = useState<string>('');
  const [investorsPage, setInvestorsPage] = useState<number>(1);
  const [editingInvestor, setEditingInvestor] = useState<any | null>(null);
  const [showInvestorForm, setShowInvestorForm] = useState<boolean>(false);
  const investorsPageSize = 20;

  // Clinical Trials state
  const [trialsData, setTrialsData] = useState<{ trials: any[]; pagination: any } | null>(null);
  const [trialsSearch, setTrialsSearch] = useState<string>('');
  const [trialsPage, setTrialsPage] = useState<number>(1);
  const [editingTrial, setEditingTrial] = useState<any | null>(null);
  const [showTrialForm, setShowTrialForm] = useState<boolean>(false);
  const trialsPageSize = 20;

  // Regulatory state
  const [regulatoryData, setRegulatoryData] = useState<{ regulatory: any[]; pagination: any } | null>(null);
  const [regulatorySearch, setRegulatorySearch] = useState<string>('');
  const [regulatoryPage, setRegulatoryPage] = useState<number>(1);
  const [editingRegulatory, setEditingRegulatory] = useState<any | null>(null);
  const [showRegulatoryForm, setShowRegulatoryForm] = useState<boolean>(false);
  const regulatoryPageSize = 20;

  // Regulatory Ecosystem (Regulatory Bodies) state
  const [regulatoryBodiesData, setRegulatoryBodiesData] = useState<{ bodies: any[]; pagination: any } | null>(null);
  const [regulatoryBodiesSearch, setRegulatoryBodiesSearch] = useState<string>('');
  const [regulatoryBodiesPage, setRegulatoryBodiesPage] = useState<number>(1);
  const [editingRegulatoryBody, setEditingRegulatoryBody] = useState<any | null>(null);
  const [showRegulatoryBodyForm, setShowRegulatoryBodyForm] = useState<boolean>(false);
  const regulatoryBodiesPageSize = 20;

  // Public Markets state
  const [publicMarketsData, setPublicMarketsData] = useState<{ stocks: any[]; pagination: any } | null>(null);
  const [publicMarketsSearch, setPublicMarketsSearch] = useState<string>('');
  const [publicMarketsPage, setPublicMarketsPage] = useState<number>(1);
  const [editingStock, setEditingStock] = useState<any | null>(null);
  const [showStockForm, setShowStockForm] = useState<boolean>(false);
  const publicMarketsPageSize = 20;

  // Clinical Centers state
  const [clinicalCentersData, setClinicalCentersData] = useState<{ centers: any[]; pagination: any } | null>(null);
  const [clinicalCentersSearch, setClinicalCentersSearch] = useState<string>('');
  const [clinicalCentersPage, setClinicalCentersPage] = useState<number>(1);
  const [editingCenter, setEditingCenter] = useState<any | null>(null);
  const [showCenterForm, setShowCenterForm] = useState<boolean>(false);
  const clinicalCentersPageSize = 20;

  // Investigators state
  const [investigatorsData, setInvestigatorsData] = useState<{ investigators: any[]; pagination: any } | null>(null);
  const [investigatorsSearch, setInvestigatorsSearch] = useState<string>('');
  const [investigatorsPage, setInvestigatorsPage] = useState<number>(1);
  const [editingInvestigator, setEditingInvestigator] = useState<any | null>(null);
  const [showInvestigatorForm, setShowInvestigatorForm] = useState<boolean>(false);
  const investigatorsPageSize = 20;

  // Nation Pulse state
  const [nationPulseData, setNationPulseData] = useState<{ data: any[]; pagination: any } | null>(null);
  const [nationPulseSearch, setNationPulseSearch] = useState<string>('');
  const [nationPulsePage, setNationPulsePage] = useState<number>(1);
  const [editingNationPulse, setEditingNationPulse] = useState<any | null>(null);
  const [showNationPulseForm, setShowNationPulseForm] = useState<boolean>(false);
  const nationPulsePageSize = 50;

  // Fundraising CRM state
  const [fundraisingCRMData, setFundraisingCRMData] = useState<{ investors: any[]; pagination: any } | null>(null);
  const [fundraisingCRMSearch, setFundraisingCRMSearch] = useState<string>('');
  const [fundraisingCRMPage, setFundraisingCRMPage] = useState<number>(1);
  const [editingCRMInvestor, setEditingCRMInvestor] = useState<any | null>(null);
  const [showCRMInvestorForm, setShowCRMInvestorForm] = useState<boolean>(false);
  const fundraisingCRMPageSize = 50;

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (value: string) => void;
    placeholder?: string;
    defaultValue?: string;
    type?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Module Management state (CRUD) - Must be declared before fetchModulesData
  const [modulesData, setModulesData] = useState<Module[]>([]);
  const [modulesPagination, setModulesPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<string>('');
  const [moduleEnabledFilter, setModuleEnabledFilter] = useState<string>('');
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [showModuleEditModal, setShowModuleEditModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [draftModule, setDraftModule] = useState<Partial<Module>>({
    module_id: '',
    name: '',
    description: '',
    component: '',
    icon: '',
    category: 'core',
    required_tier: 'free',
    required_roles: [],
    is_enabled: true,
    is_core: false,
    display_order: 0,
    data_source: ''
  });

  // Functions to fetch real data
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/admin/overview');
      if (data.success && data.data) {
        setOverviewData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch overview data');
      }
    } catch (err: any) {
      // Don't show error for 401 (unauthorized) - this is expected if not logged in
      // Only show errors for actual failures when user is authenticated
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('Access token')) {
        // Silently handle auth errors - user will be redirected
        console.debug('Auth error (expected if not logged in):', err?.message);
      } else {
        // Only show error for non-auth failures
        setError(`Failed to load overview data: ${err?.message || 'Unknown error'}`);
        console.error('Error fetching overview data:', err);
      }
      setOverviewData({
        metrics: { system_ok: false },
        userStats: { totalUsers: 0, activeUsers: 0, newUsersThisMonth: 0 },
        revenueStats: { totalRevenue: 0, monthlyRevenue: 0 },
        blogStats: { blogPosts: 0 },
        userRoles: [],
        revenueByTier: [],
        recentActivity: [],
        userGrowth: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async (page: number = 1, search?: string, role?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: '20',
      };
      if (search) params.search = search;
      if (role) params.role = role;
      
      const data = await apiService.get('/admin/users', params);
      if (data.success && data.data) {
        setUsersData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      // Don't show error for 401 (unauthorized) - this is expected if not logged in
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('Access token')) {
        // Silently handle auth errors - user will be redirected
        console.debug('Auth error (expected if not logged in):', err?.message);
      } else {
        // Only show error for non-auth failures
        setError(`Failed to load users: ${err?.message || 'Unknown error'}`);
        console.error('Error fetching users data:', err);
      }
      setUsersData({ users: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    } finally {
      setLoading(false);
    }
  };


  const fetchBlogData = async (page: number = 1, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: '20',
      };
      if (status) params.status = status;
      
      const data = await apiService.get('/admin/blog-posts', params);
      if (data.success && data.data) {
        setBlogPosts(data.data.posts || []);
        setBlogData(data.data); // Keep for backwards compatibility
      } else {
        throw new Error(data.error || 'Failed to fetch blog posts');
      }
    } catch (err: any) {
      console.error('[AdminDashboard] Error fetching blog data:', err);
      setError(`Failed to load blog data: ${err?.message || 'Unknown error'}`);
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogCategories = async () => {
    try {
      const response = await apiService.get('/blog/categories');
      if (response && response.categories) {
        setBlogCategories(response.categories);
      }
    } catch (err: any) {
      console.error('Error fetching blog categories:', err);
    }
  };

  const handleCreateCategory = async (name: string, slug: string) => {
    try {
      setLoading(true);
      await apiService.post('/blog/categories', { name, slug });
      await fetchBlogCategories();
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Category created successfully',
        variant: 'success'
      });
    } catch (err: any) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create category',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (id: number, name: string, slug: string) => {
    try {
      setLoading(true);
      await apiService.put(`/blog/categories/${id}`, { name, slug });
      await fetchBlogCategories();
      setEditingCategory(null);
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Category updated successfully',
        variant: 'success'
      });
    } catch (err: any) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update category',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      setLoading(true);
      await apiService.delete(`/blog/categories/${id}`);
      await fetchBlogCategories();
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Category deleted successfully',
        variant: 'success'
      });
    } catch (err: any) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to delete category',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdsData = async (page: number = 1, category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: '20',
      };
      if (category) params.category = category;
      
      const data = await apiService.get('/admin/advertisements', params);
      if (data.success && data.data) {
        setAdsData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch advertisements');
      }
    } catch (err: any) {
      setError(`Failed to load ads: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching ads data:', err);
      setAdsData({ advertisements: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncementsData = async (page: number = 1, placement?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: '20',
      };
      if (placement) params.placement = placement;
      
      const data = await apiService.get('/admin/announcements', params);
      if (data.success && data.data) {
        setAnnouncementsData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch announcements');
      }
    } catch (err: any) {
      setError(`Failed to load announcements: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching announcements data:', err);
      setAnnouncementsData({ announcements: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      setLoading(true);
      const data = await apiService.post('/admin/announcements', {
        title: draftAnnouncement.title,
        message: draftAnnouncement.message,
        image_url: draftAnnouncement.imageUrl,
        action_url: draftAnnouncement.actionUrl,
        action_text: draftAnnouncement.actionText,
        placement: draftAnnouncement.placement,
        expires_at: draftAnnouncement.expiresAt || null,
        send_notification: draftAnnouncement.sendNotification
      });
      if (data.success && data.data && data.data.announcement) {
        await fetchAnnouncementsData();
        setDraftAnnouncement({
          title: '',
          message: '',
          imageUrl: '',
          actionUrl: '',
          actionText: '',
          placement: 'blog_sidebar',
          expiresAt: '',
          sendNotification: true
        });
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Announcement created successfully' + (draftAnnouncement.sendNotification ? ' and notifications sent to all users' : ''),
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to create announcement');
      }
    } catch (err: any) {
      setError(`Failed to create announcement: ${err?.message || 'Unknown error'}`);
      console.error('Error creating announcement:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create announcement',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setShowAdEditModal(true);
  };

  const handleSaveAnnouncement = async (updatedAnnouncement: any) => {
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/announcements/${updatedAnnouncement.id}`, {
        title: updatedAnnouncement.title,
        message: updatedAnnouncement.message,
        image_url: updatedAnnouncement.image_url,
        action_url: updatedAnnouncement.action_url,
        action_text: updatedAnnouncement.action_text,
        placement: updatedAnnouncement.placement,
        expires_at: updatedAnnouncement.expires_at,
        is_active: updatedAnnouncement.is_active
      });
      if (data.success) {
        await fetchAnnouncementsData();
        setShowAdEditModal(false);
        setEditingAnnouncement(null);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Announcement updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update announcement');
      }
    } catch (err: any) {
      setError(`Failed to update announcement: ${err?.message || 'Unknown error'}`);
      console.error('Error updating announcement:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update announcement',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnnouncementStatus = async (id: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/announcements/${id}`, {
        is_active: !currentStatus
      });
      if (data.success) {
        await fetchAnnouncementsData();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update announcement status');
      }
    } catch (err: any) {
      setError(`Failed to update announcement status: ${err?.message || 'Unknown error'}`);
      console.error('Error updating announcement status:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update announcement status',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    const announcement = (announcementsData?.announcements || []).find(a => a.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Announcement',
      message: `Are you sure you want to delete "${announcement?.title || 'this announcement'}"? This action cannot be undone.`,
      variant: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const data = await apiService.delete(`/admin/announcements/${id}`);
          if (data.success) {
            await fetchAnnouncementsData();
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: 'Announcement deleted successfully',
              variant: 'success',
            });
          } else {
            throw new Error(data.error || 'Failed to delete announcement');
          }
        } catch (err: any) {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
          setError(`Failed to delete announcement: ${err?.message || 'Unknown error'}`);
          console.error('Error deleting announcement:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err?.message || 'Failed to delete announcement',
            variant: 'error',
          });
        }
      },
      onCancel: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcementsData?.announcements || [];
    
    if (announcementSearchTerm) {
      const search = announcementSearchTerm.toLowerCase();
      filtered = filtered.filter(ann => 
        ann.title.toLowerCase().includes(search) ||
        ann.message.toLowerCase().includes(search)
      );
    }
    
    if (announcementPlacementFilter) {
      filtered = filtered.filter(ann => ann.placement === announcementPlacementFilter);
    }
    
    return filtered;
  }, [announcementsData, announcementSearchTerm, announcementPlacementFilter]);

  const totalAnnouncementPages = Math.max(1, Math.ceil(filteredAnnouncements.length / announcementsPageSize));
  const safeAnnouncementPage = Math.min(Math.max(1, announcementPage), totalAnnouncementPages);
  const paginatedAnnouncements = filteredAnnouncements.slice((safeAnnouncementPage - 1) * announcementsPageSize, safeAnnouncementPage * announcementsPageSize);

  const fetchCompaniesData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: companiesPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/companies', params);
      if (data.success) {
        setCompaniesData({
          companies: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: companiesPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch companies');
      }
    } catch (err: any) {
      setError(`Failed to load companies: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching companies data:', err);
      setCompaniesData({ companies: [], pagination: { total: 0, page: 1, limit: companiesPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  const fetchDealsData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: dealsPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/deals', params);
      if (data.success) {
        setDealsData({
          deals: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: dealsPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch deals');
      }
    } catch (err: any) {
      setError(`Failed to load deals: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching deals data:', err);
      setDealsData({ deals: [], pagination: { total: 0, page: 1, limit: dealsPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies list for deals form dropdown
  const fetchCompaniesList = async () => {
    try {
      const data = await apiService.get('/admin/companies', { limit: '500' });
      if (data.success && data.data) {
        setCompaniesList(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching companies list:', err);
    }
  };

  const fetchGrantsData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: grantsPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/grants', params);
      if (data.success) {
        setGrantsData({
          grants: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: grantsPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch grants');
      }
    } catch (err: any) {
      setError(`Failed to load grants: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching grants data:', err);
      setGrantsData({ grants: [], pagination: { total: 0, page: 1, limit: grantsPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Investors data
  const fetchInvestorsData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: investorsPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/investors', params);
      if (data.success) {
        setInvestorsData({
          investors: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: investorsPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch investors');
      }
    } catch (err: any) {
      setError(`Failed to load investors: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching investors data:', err);
      setInvestorsData({ investors: [], pagination: { total: 0, page: 1, limit: investorsPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Clinical Trials data
  const fetchTrialsData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: trialsPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/clinical-trials', params);
      if (data.success) {
        setTrialsData({
          trials: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: trialsPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch clinical trials');
      }
    } catch (err: any) {
      setError(`Failed to load clinical trials: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching clinical trials data:', err);
      setTrialsData({ trials: [], pagination: { total: 0, page: 1, limit: trialsPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Regulatory data
  const fetchRegulatoryData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        all: 'true', // Fetch all data instead of paginated
        page: page.toString(),
        limit: regulatoryPageSize.toString(),
      };
      if (search) params.search = search;
      
      console.log('[AdminDashboard] Fetching regulatory data with params:', params);
      const data = await apiService.get('/admin/regulatory', params);
      console.log('[AdminDashboard] Regulatory data response:', data);
      
      if (data.success) {
        setRegulatoryData({
          regulatory: data.data || [],
          pagination: data.pagination || { total: data.data?.length || 0, page: 1, limit: data.data?.length || 0, has_more: false },
        });
        console.log('[AdminDashboard] Set regulatory data:', data.data?.length || 0, 'records');
      } else {
        throw new Error(data.error || 'Failed to fetch regulatory data');
      }
    } catch (err: any) {
      setError(`Failed to load regulatory data: ${err?.message || 'Unknown error'}`);
      console.error('[AdminDashboard] Error fetching regulatory data:', err);
      setRegulatoryData({ regulatory: [], pagination: { total: 0, page: 1, limit: regulatoryPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Regulatory Bodies data
  const fetchRegulatoryBodiesData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: regulatoryBodiesPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/regulatory-bodies', params);
      if (data.success) {
        setRegulatoryBodiesData({
          bodies: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: regulatoryBodiesPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch regulatory bodies data');
      }
    } catch (err: any) {
      setError(`Failed to load regulatory bodies: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching regulatory bodies data:', err);
      setRegulatoryBodiesData({ bodies: [], pagination: { total: 0, page: 1, limit: regulatoryBodiesPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Public Markets data
  const fetchPublicMarketsData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: publicMarketsPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/public-markets', params);
      if (data.success) {
        setPublicMarketsData({
          stocks: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: publicMarketsPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch public markets data');
      }
    } catch (err: any) {
      setError(`Failed to load public markets: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching public markets data:', err);
      setPublicMarketsData({ stocks: [], pagination: { total: 0, page: 1, limit: publicMarketsPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Clinical Centers data
  const fetchClinicalCentersData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: clinicalCentersPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/clinical-centers', params);
      if (data.success) {
        setClinicalCentersData({
          centers: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: clinicalCentersPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch clinical centers');
      }
    } catch (err: any) {
      setError(`Failed to load clinical centers: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching clinical centers data:', err);
      setClinicalCentersData({ centers: [], pagination: { total: 0, page: 1, limit: clinicalCentersPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Investigators data
  const fetchInvestigatorsData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: investigatorsPageSize.toString(),
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/investigators', params);
      if (data.success) {
        setInvestigatorsData({
          investigators: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: investigatorsPageSize, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch investigators');
      }
    } catch (err: any) {
      setError(`Failed to load investigators: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching investigators data:', err);
      setInvestigatorsData({ investigators: [], pagination: { total: 0, page: 1, limit: investigatorsPageSize, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Nation Pulse data
  const fetchNationPulseData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: '50',
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/nation-pulse', params);
      if (data.success) {
        setNationPulseData({
          data: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: 50, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch nation pulse data');
      }
    } catch (err: any) {
      setError(`Failed to load nation pulse data: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching nation pulse data:', err);
      setNationPulseData({ data: [], pagination: { total: 0, page: 1, limit: 50, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Fundraising CRM data
  const fetchFundraisingCRMData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: page.toString(),
        limit: '50',
      };
      if (search) params.search = search;
      
      const data = await apiService.get('/admin/crm-investors', params);
      if (data.success) {
        setFundraisingCRMData({
          investors: data.data || [],
          pagination: data.pagination || { total: 0, page: 1, limit: 50, has_more: false },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch CRM investors');
      }
    } catch (err: any) {
      setError(`Failed to load CRM investors: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching CRM investors data:', err);
      setFundraisingCRMData({ investors: [], pagination: { total: 0, page: 1, limit: 50, has_more: false } });
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { 
        page: page.toString(), 
        limit: '20' 
      };
      if (moduleSearchTerm) params.search = moduleSearchTerm;
      if (moduleCategoryFilter) params.category = moduleCategoryFilter;
      if (moduleEnabledFilter !== '') params.enabled = moduleEnabledFilter;
      
      const data = await apiService.get('/admin/modules', params);
      if (data.success) {
        setModulesData(data.data || []);
        setModulesPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      } else {
        throw new Error(data.error || 'Failed to fetch modules');
      }
    } catch (err: any) {
      setError(`Failed to load modules: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching modules data:', err);
      setModulesData([]);
      setModulesPagination({ page: 1, limit: 20, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  // AI Update Functions - Only runs when explicitly requested (pay-per-use)
  const handleBulkUpdate = async () => {
    try {
      setBulkUpdateStatus({
        status: 'updating',
        message: 'Updating all modules with AI... This may take a few minutes.',
        progress: 0,
        results: null
      });

      // Use relative path which will be proxied by Vite
      const response = await fetch(`/api/ai/update/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medarionAuthToken') || 'test-token'}`
        },
        body: JSON.stringify({
          companies: 10,
          deals: 10,
          investors: 5,
          grants: 5,
          clinical_trials: 5,
          public_stocks: 5,
          regulatory_bodies: 5,
          clinical_centers: 5,
          investigators: 5
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Handle warning case (AI not configured)
      if (data.warning) {
        setBulkUpdateStatus({
          status: 'warning',
          message: data.message || 'AI service is not configured',
          progress: 0,
          results: null
        });
        setTimeout(() => {
          setBulkUpdateStatus({ status: 'idle', message: '', progress: 0, results: null });
        }, 5000);
        return;
      }
      
      if (data.success) {
        setBulkUpdateStatus({
          status: 'success',
          message: `Successfully updated ${data.summary?.total_updates || 0} records across all modules`,
          progress: 100,
          results: data.results
        });

        // Refresh current module data
        if (selectedDataModule === 'companies') fetchCompaniesData(companiesPage, companiesSearch || undefined);
        else if (selectedDataModule === 'deals') fetchDealsData(dealsPage, dealsSearch || undefined);
        else if (selectedDataModule === 'grants') fetchGrantsData(grantsPage, grantsSearch || undefined);
        else if (selectedDataModule === 'investors') fetchInvestorsData(investorsPage, investorsSearch || undefined);
        else if (selectedDataModule === 'clinical-trials') fetchTrialsData(trialsPage, trialsSearch || undefined);
        else if (selectedDataModule === 'regulatory-ecosystem') fetchRegulatoryBodiesData(regulatoryBodiesPage, regulatoryBodiesSearch || undefined);
        else if (selectedDataModule === 'public-markets') fetchPublicMarketsData(publicMarketsPage, publicMarketsSearch || undefined);
        else if (selectedDataModule === 'clinical-centers') fetchClinicalCentersData(clinicalCentersPage, clinicalCentersSearch || undefined);
        else if (selectedDataModule === 'investigators') fetchInvestigatorsData(investigatorsPage, investigatorsSearch || undefined);

        // Clear success message after 10 seconds
        setTimeout(() => {
          setBulkUpdateStatus({ status: 'idle', message: '', progress: 0, results: null });
        }, 10000);
      } else {
        throw new Error(data.error || 'Bulk update failed');
      }
    } catch (error: any) {
      setBulkUpdateStatus({
        status: 'error',
        message: `Error: ${error.message || 'Failed to update'}`,
        progress: 0,
        results: null
      });
      console.error('Bulk update error:', error);
    }
  };

  const handleAIUpdate = async (module: string, count: number = 10) => {
    try {
      setAiUpdateStatus({
        module,
        status: 'updating',
        message: `Updating ${module} with AI...`,
        progress: 0
      });

      // Use relative path which will be proxied by Vite
      const response = await fetch(`/api/ai/update/${module}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medarionAuthToken') || 'test-token'}`
        },
        body: JSON.stringify({ count })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Handle warning case (AI not configured)
      if (data.warning) {
        setAiUpdateStatus({
          module,
          status: 'warning',
          message: data.message || 'AI service is not configured',
          progress: 0
        });
        setTimeout(() => {
          setAiUpdateStatus({ module: '', status: 'idle', message: '', progress: 0 });
        }, 5000);
        return;
      }
      
      if (data.success) {
        setAiUpdateStatus({
          module,
          status: 'success',
          message: `Successfully updated ${data.count || 0} ${module} records`,
          progress: 100
        });

        // Refresh the current module data
        if (selectedDataModule === module || selectedDataModule === module.replace('_', '-')) {
          if (module === 'companies') fetchCompaniesData(companiesPage, companiesSearch || undefined);
          else if (module === 'deals') fetchDealsData(dealsPage, dealsSearch || undefined);
          else if (module === 'grants') fetchGrantsData(grantsPage, grantsSearch || undefined);
          else if (module === 'investors') fetchInvestorsData(investorsPage, investorsSearch || undefined);
          else if (module === 'clinical_trials') fetchTrialsData(trialsPage, trialsSearch || undefined);
          else if (module === 'regulatory_bodies') fetchRegulatoryBodiesData(regulatoryBodiesPage, regulatoryBodiesSearch || undefined);
          else if (module === 'public_stocks') fetchPublicMarketsData(publicMarketsPage, publicMarketsSearch || undefined);
          else if (module === 'clinical_centers') fetchClinicalCentersData(clinicalCentersPage, clinicalCentersSearch || undefined);
          else if (module === 'investigators') fetchInvestigatorsData(investigatorsPage, investigatorsSearch || undefined);
        }

        // Clear success message after 5 seconds
        setTimeout(() => {
          setAiUpdateStatus({ module: null, status: 'idle', message: '', progress: 0 });
        }, 5000);
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error: any) {
      setAiUpdateStatus({
        module,
        status: 'error',
        message: `Error: ${error.message || 'Failed to update'}`,
        progress: 0
      });
      console.error('AI update error:', error);
    }
  };

  // Alias for handleBulkUpdate to match button onClick
  const handleAIUpdateAll = handleBulkUpdate;

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
      // Fetch recent users for overview
      fetchUsersData(1);
      // Fetch recent blog posts for overview
      fetchBlogData(1);
    } else if (activeTab === 'users') {
      fetchUsersData();
    } else if (activeTab === 'blog') {
      // Immediately load blog data when blog tab is clicked
      fetchBlogData();
      fetchBlogCategories();
      fetchVideosData();
    } else if (activeTab === 'newsletter') {
      fetchNewsletterData();
      fetchNewsletterStats();
      fetchNewsletterCampaigns();
      fetchEmailConfig();
    } else if (activeTab === 'ads') {
      fetchAdsData();
      fetchAnnouncementsData();
    } else if (activeTab === 'modules') {
      fetchModulesData();
    } else if (activeTab === 'data-management') {
      // Fetch data based on selected module
      if (selectedDataModule === 'companies') {
        fetchCompaniesData(companiesPage, companiesSearch || undefined);
      } else if (selectedDataModule === 'deals') {
        fetchDealsData(dealsPage, dealsSearch || undefined);
        fetchCompaniesList();
      } else if (selectedDataModule === 'grants') {
        fetchGrantsData(grantsPage, grantsSearch || undefined);
      } else if (selectedDataModule === 'investors') {
        fetchInvestorsData(investorsPage, investorsSearch || undefined);
      } else if (selectedDataModule === 'clinical-trials') {
        fetchTrialsData(trialsPage, trialsSearch || undefined);
      } else if (selectedDataModule === 'regulatory') {
        fetchRegulatoryData(regulatoryPage, regulatorySearch || undefined);
        fetchCompaniesList();
      } else if (selectedDataModule === 'regulatory-ecosystem') {
        fetchRegulatoryBodiesData(regulatoryBodiesPage, regulatoryBodiesSearch || undefined);
      } else if (selectedDataModule === 'public-markets') {
        fetchPublicMarketsData(publicMarketsPage, publicMarketsSearch || undefined);
      } else if (selectedDataModule === 'clinical-centers') {
        fetchClinicalCentersData(clinicalCentersPage, clinicalCentersSearch || undefined);
      } else if (selectedDataModule === 'investigators') {
        fetchInvestigatorsData(investigatorsPage, investigatorsSearch || undefined);
      }
    }
  }, [activeTab, selectedDataModule]);
  
        // Reload data when search or page changes for data-management tab
        useEffect(() => {
          if (activeTab === 'data-management') {
            if (selectedDataModule === 'companies') {
              fetchCompaniesData(companiesPage, companiesSearch || undefined);
            } else if (selectedDataModule === 'deals') {
              fetchDealsData(dealsPage, dealsSearch || undefined);
            } else if (selectedDataModule === 'grants') {
              fetchGrantsData(grantsPage, grantsSearch || undefined);
            } else if (selectedDataModule === 'investors') {
              fetchInvestorsData(investorsPage, investorsSearch || undefined);
            } else if (selectedDataModule === 'clinical-trials') {
              fetchTrialsData(trialsPage, trialsSearch || undefined);
            } else if (selectedDataModule === 'regulatory') {
              fetchRegulatoryData(regulatoryPage, regulatorySearch || undefined);
            } else if (selectedDataModule === 'regulatory-ecosystem') {
              fetchRegulatoryBodiesData(regulatoryBodiesPage, regulatoryBodiesSearch || undefined);
            } else if (selectedDataModule === 'public-markets') {
              fetchPublicMarketsData(publicMarketsPage, publicMarketsSearch || undefined);
            } else if (selectedDataModule === 'clinical-centers') {
              fetchClinicalCentersData(clinicalCentersPage, clinicalCentersSearch || undefined);
            } else if (selectedDataModule === 'investigators') {
              fetchInvestigatorsData(investigatorsPage, investigatorsSearch || undefined);
            }
          }
        }, [activeTab, selectedDataModule, companiesPage, companiesSearch, dealsPage, dealsSearch, grantsPage, grantsSearch, investorsPage, investorsSearch, trialsPage, trialsSearch, regulatoryPage, regulatorySearch, regulatoryBodiesPage, regulatoryBodiesSearch, publicMarketsPage, publicMarketsSearch, clinicalCentersPage, clinicalCentersSearch, investigatorsPage, investigatorsSearch]);

  // Reload modules when filters change
  useEffect(() => {
    if (activeTab === 'modules') {
      const params: any = { page: modulesPagination.page, limit: 20 };
      if (moduleSearchTerm) params.search = moduleSearchTerm;
      if (moduleCategoryFilter) params.category = moduleCategoryFilter;
      if (moduleEnabledFilter !== '') params.enabled = moduleEnabledFilter;
      adminApi.getModules(params).then(response => {
        setModulesData(response.data);
        setModulesPagination(response.pagination);
      }).catch(err => {
        setError('Failed to load modules data');
        console.error('Error fetching modules data:', err);
      });
    }
  }, [moduleSearchTerm, moduleCategoryFilter, moduleEnabledFilter, activeTab]);

  // Parse app_roles from JSON string if it exists
  const appRoles = profile && (profile as any).app_roles 
    ? (typeof (profile as any).app_roles === 'string' 
        ? (() => {
            try {
              const parsed = JSON.parse((profile as any).app_roles);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              // If not JSON, treat as comma-separated string or single value
              const str = (profile as any).app_roles;
              if (str.includes(',')) {
                return str.split(',').map((r: string) => r.trim());
              }
              return [str];
            }
          })()
        : (Array.isArray((profile as any).app_roles) 
            ? (profile as any).app_roles 
            : [(profile as any).app_roles]))
    : [];

  const canSuper = !!(profile && (
    (profile as any).is_admin === true || 
    (profile as any).is_admin === 1 ||
    (profile as any).role === 'admin' ||
    (Array.isArray(appRoles) && (
      appRoles.includes('Super Admin') ||
      appRoles.includes('super_admin') ||
      appRoles.includes('Super Administrator')
    ))
  ));
  const canBlog = canSuper || !!appRoles.some((r: AppRole) => ['blog_admin','content_editor'].includes(r)) || (profile as any)?.role === 'admin';
  const canAds = canSuper || !!appRoles.includes('ads_admin') || appRoles.includes('Ads Manager');
  

  const loadUserOverrides = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/admin/user-overrides');
      if (data && data.success) {
        setUserOverrides(data.users || data.data || []);
      } else {
        // If table doesn't exist or no data, just set empty array without error
        setUserOverrides([]);
      }
    } catch (err: any) {
      // User overrides are optional - don't set error state, just log and continue
      // This prevents the error from showing in the UI
      if (process.env.NODE_ENV === 'development') {
        console.warn('User overrides not available (this is optional):', err?.message);
      }
      // Silently set empty array - user overrides are optional
      setUserOverrides([]);
      // Don't call setError() - this is not a critical error
    } finally {
      setLoading(false);
    }
  };


  // Load user overrides on component mount
  useEffect(() => {
    if (canSuper || canBlog || canAds) {
      loadUserOverrides();
    }
  }, [canSuper, canBlog, canAds]);


  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    role: '',
    accountTier: '',
    fullName: '',
    companyName: '',
    phone: '',
    country: '',
    city: '',
    isAdmin: false,
    appRoles: [] as string[]
  });

  const [draftPost, setDraftPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: (profile as any)?.full_name || 'Admin',
    category: 'General',
    video_url: '',
    read_time: '5 min read',
    featured_image: '',
    featured: false,
    status: 'published'
  });

  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [draftAd, setDraftAd] = useState({
    title: '',
    imageUrl: '',
    ctaText: '',
    targetUrl: '',
    advertiser: '',
    category: 'blog_general' as AdCategory,
    placements: ['blog_top'] as string[]
  });

  // Ads management state
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [showAdEditModal, setShowAdEditModal] = useState(false);
  const [showAdImageModal, setShowAdImageModal] = useState(false);
  const [showAnnouncementImageModal, setShowAnnouncementImageModal] = useState(false);
  const [showCompanyLogoModal, setShowCompanyLogoModal] = useState(false);
  const [showInvestorLogoModal, setShowInvestorLogoModal] = useState(false);
  const [adSearchTerm, setAdSearchTerm] = useState('');
  const [adCategoryFilter, setAdCategoryFilter] = useState<string>('');
  const [adStatusFilter, setAdStatusFilter] = useState<string>('');
  const [adPage, setAdPage] = useState(1);
  const adsPageSize = 10;

  // Modules state (legacy - user-specific configs)
  const [moduleEmail, setModuleEmail] = useState('');
  const [moduleSelection, setModuleSelection] = useState<string[]>([]);
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);

  // Data is loaded via the load functions above

  // Helpers
  const saveUsers = (arr: UserOverride[]) => {
    setUserOverrides(arr);
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.role) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Email and Role are required',
        variant: 'error'
      });
      return;
    }
    
    // Generate username from email if not provided
    const username = newUser.username || newUser.email.split('@')[0];
    const firstName = newUser.fullName?.split(' ')[0] || '';
    const lastName = newUser.fullName?.split(' ').slice(1).join(' ') || '';
    
    try {
      setLoading(true);
      // Create a new user via the admin/users endpoint
      const data = await apiService.post('/admin/users', {
        username: username,
        email: newUser.email,
        password: 'TempPassword123!', // Temporary password - user should change on first login
        firstName: firstName,
        lastName: lastName,
        role: newUser.role,
        userType: newUser.role, // userType should match role
        accountTier: newUser.accountTier || 'free',
        companyName: newUser.companyName || '',
        phone: newUser.phone || '',
        country: newUser.country || '',
        city: newUser.city || ''
      });
      
      if (data.success) {
        // Refresh users list
        await fetchUsersData();
        // Reset form
        setNewUser({
          email: '',
          username: '',
          role: '',
          accountTier: '',
          fullName: '',
          companyName: '',
          phone: '',
          country: '',
          city: '',
          isAdmin: false,
          appRoles: []
        });
        setShowAddUserModal(false);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'User created successfully. A temporary password (TempPassword123!) has been set. The user should change it on first login.',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(`Failed to create user: ${err?.message || 'Unknown error'}`);
      console.error('Error creating user:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create user',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (id: number) => {
    try {
      setLoading(true);
      const data = await apiService.delete(`/admin/user-overrides/${id}`);
      if (data.success) {
        setUserOverrides(prev => prev.filter(u => u.id !== id));
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'User override deleted successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to delete user override');
      }
    } catch (err: any) {
      setError(`Failed to delete user override: ${err?.message || 'Unknown error'}`);
      console.error('Error deleting user override:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to delete user override',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced User Management Functions
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserEditModal(true);
  };

  const handleSaveUser = async (updatedUser: User) => {
    try {
      setLoading(true);
      const data = await apiService.patch('/admin/users', {
        id: updatedUser.id,
        ...updatedUser
      });
      if (data.success) {
        await fetchUsersData();
        setShowUserEditModal(false);
        setEditingUser(null);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'User updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (err: any) {
      setError(`Failed to update user: ${err?.message || 'Unknown error'}`);
      console.error('Error updating user:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update user',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId: number, action: 'activate' | 'deactivate' | 'block' | 'suspend') => {
    try {
      setLoading(true);
      const data = await apiService.delete('/admin/users', {
        id: userId,
        action
      });
      if (data.success) {
        await fetchUsersData();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `User ${action}d successfully`,
          variant: 'success'
        });
      } else {
        throw new Error(data.error || `Failed to ${action} user`);
      }
    } catch (err: any) {
      setError(`Failed to ${action} user: ${err?.message || 'Unknown error'}`);
      console.error(`Error ${action}ing user:`, err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || `Failed to ${action} user`,
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId: number, verified: boolean) => {
    try {
      setLoading(true);
      const action = verified ? 'verify' : 'unverify';
      const data = await apiService.patch('/admin/users', {
        id: userId,
        action
      });
      if (data.success) {
        await fetchUsersData();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `User ${verified ? 'verified' : 'unverified'} successfully`,
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update user verification');
      }
    } catch (err: any) {
      setError(`Failed to update user verification: ${err?.message || 'Unknown error'}`);
      console.error('Error updating user verification:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update user verification',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserTier = async (userId: number, tier: string) => {
    try {
      setLoading(true);
      const data = await apiService.patch('/admin/users', {
        id: userId,
        action: 'change_tier',
        tier
      });
      if (data.success) {
        await fetchUsersData();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'User tier updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to change user tier');
      }
    } catch (err: any) {
      setError(`Failed to change user tier: ${err?.message || 'Unknown error'}`);
      console.error('Error changing user tier:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to change user tier',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserRole = async (userId: number, role: string) => {
    try {
      setLoading(true);
      const data = await apiService.patch('/admin/users', {
        id: userId,
        action: 'change_role',
        role
      });
      if (data.success) {
        await fetchUsersData();
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'User role updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to change user role');
      }
    } catch (err: any) {
      setError(`Failed to change user role: ${err?.message || 'Unknown error'}`);
      console.error('Error changing user role:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to change user role',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      setLoading(true);
      const data = await apiService.patch('/admin/users', {
        id: userId,
        action: 'reset_password',
        password: 'password123' // Default password
      });
      if (data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Password reset successfully. Default password: password123',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(`Failed to reset password: ${err?.message || 'Unknown error'}`);
      console.error('Error resetting password:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to reset password',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'block' | 'delete') => {
    try {
      setLoading(true);
      for (const userId of selectedUsers) {
        const data = await apiService.delete('/admin/users', {
          id: userId,
          action
        });
        if (!data.success) {
          throw new Error(data.error || `Failed to ${action} user ${userId}`);
        }
      }
      setSelectedUsers([]);
      await fetchUsersData();
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: `${selectedUsers.length} user(s) ${action}d successfully`,
        variant: 'success'
      });
    } catch (err: any) {
      setError(`Failed to ${action} selected users: ${err?.message || 'Unknown error'}`);
      console.error(`Error ${action}ing users:`, err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || `Failed to ${action} selected users`,
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (usersData?.users) {
      setSelectedUsers(
        selectedUsers.length === usersData.users.length 
          ? [] 
          : usersData.users.map(u => u.id)
      );
    }
  };

  const loadModulesForEmail = (email: string) => {
    setModuleEmail(email);
    try {
      const raw = localStorage.getItem('medarionAdminModules');
      if (raw) {
        const all = JSON.parse(raw) as AdminModules;
        const entry = all[email];
        if (entry) {
          setModuleSelection(entry.modules);
          setModuleOrder(entry.order);
          return;
        }
      }
      const ov = userOverrides.find(u=>u.email===email);
      const role = (ov?.role as keyof typeof DEFAULT_MODULES_BY_ROLE) || 'startup';
      const defaults = DEFAULT_MODULES_BY_ROLE[role] || DEFAULT_MODULES_BY_ROLE.startup;
      setModuleSelection(defaults);
      setModuleOrder(defaults);
    } catch {
      const defaults = DEFAULT_MODULES_BY_ROLE.startup;
      setModuleSelection(defaults);
      setModuleOrder(defaults);
    }
  };

  const toggleModule = (id: string) => {
    if (moduleSelection.includes(id)) {
      const sel = moduleSelection.filter(m=>m!==id);
      setModuleSelection(sel);
      setModuleOrder(moduleOrder.filter(m=>m!==id));
    } else {
      const sel = [...moduleSelection, id];
      setModuleSelection(sel);
      setModuleOrder([...moduleOrder, id]);
    }
  };

  const moveModule = (id: string, dir: 'up'|'down') => {
    const idx = moduleOrder.indexOf(id);
    if (idx === -1) return;
    const arr = [...moduleOrder];
    const swapWith = dir==='up' ? idx-1 : idx+1;
    if (swapWith < 0 || swapWith >= arr.length) return;
    const tmp = arr[swapWith];
    arr[swapWith] = arr[idx];
    arr[idx] = tmp;
    setModuleOrder(arr);
  };

  const saveModules = () => {
    if (!moduleEmail) return;
    const ensureDashboardFirst = (list: string[]) => {
      const rest = list.filter(x=>x!=='dashboard');
      return ['dashboard', ...rest];
    };
    const entry = { modules: ensureDashboardFirst(moduleSelection), order: ensureDashboardFirst(moduleOrder) };
    let all: AdminModules = {};
    try { const raw = localStorage.getItem('medarionAdminModules'); if (raw) all = JSON.parse(raw); } catch {}
    all[moduleEmail] = entry;
    localStorage.setItem('medarionAdminModules', JSON.stringify(all));
  };

  // Module Management handlers
  const handleCreateModule = async () => {
    try {
      setLoading(true);
      const data = await apiService.post('/admin/modules', draftModule);
      if (data.success && data.data) {
        await fetchModulesData(modulesPagination.page);
        setDraftModule({
          module_id: '',
          name: '',
          description: '',
          component: '',
          icon: '',
          category: 'core',
          required_tier: 'free',
          required_roles: [],
          is_enabled: true,
          is_core: false,
          display_order: 0,
          data_source: ''
        });
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Module created successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to create module');
      }
    } catch (err: any) {
      setError(`Failed to create module: ${err?.message || 'Unknown error'}`);
      console.error('Error creating module:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create module',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowModuleEditModal(true);
  };

  const handleSaveModule = async (updatedModule: Module) => {
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/modules/${updatedModule.id}`, updatedModule);
      if (data.success) {
        await fetchModulesData(modulesPagination.page);
        setShowModuleEditModal(false);
        setEditingModule(null);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Module updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update module');
      }
    } catch (err: any) {
      setError(`Failed to update module: ${err?.message || 'Unknown error'}`);
      console.error('Error updating module:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update module',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id: number) => {
    const module = modulesData.find(m => m.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Module',
      message: `Are you sure you want to delete "${module?.name || 'this module'}"? This action cannot be undone.`,
      variant: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const data = await apiService.delete(`/admin/modules/${id}`);
          if (data.success) {
            await fetchModulesData(modulesPagination.page);
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: 'Module deleted successfully',
              variant: 'success',
            });
          } else {
            throw new Error(data.error || 'Failed to delete module');
          }
        } catch (err: any) {
          setError(`Failed to delete module: ${err?.message || 'Unknown error'}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err?.message || 'Failed to delete module',
            variant: 'error',
          });
          console.error('Error deleting module:', err);
        }
      },
    });
  };

  const handleToggleModuleStatus = async (id: number, isEnabled: boolean) => {
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/modules/${id}`, { is_enabled: !isEnabled });
      if (data.success) {
        await fetchModulesData(modulesPagination.page);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `Module ${!isEnabled ? 'enabled' : 'disabled'} successfully`,
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to toggle module status');
      }
    } catch (err: any) {
      setError(`Failed to toggle module status: ${err?.message || 'Unknown error'}`);
      console.error('Error toggling module status:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to toggle module status',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkModuleOperation = async (action: 'enable' | 'disable' | 'delete') => {
    if (selectedModules.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'No Selection',
        message: 'Please select at least one module',
        variant: 'warning',
      });
      return;
    }
    
    if (action === 'delete') {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Modules',
        message: `Are you sure you want to delete ${selectedModules.length} module(s)? This action cannot be undone.`,
        variant: 'danger',
        isLoading: false,
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isLoading: true }));
          try {
            const data = await apiService.patch('/admin/modules', {
              action,
              module_ids: selectedModules
            });
            if (data.success) {
              setSelectedModules([]);
              await fetchModulesData(modulesPagination.page);
              setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
              setAlertModal({
                isOpen: true,
                title: 'Success',
                message: `${selectedModules.length} module(s) deleted successfully`,
                variant: 'success',
              });
            } else {
              throw new Error(data.error || `Failed to ${action} modules`);
            }
          } catch (err: any) {
            setError(`Failed to ${action} modules: ${err?.message || 'Unknown error'}`);
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setAlertModal({
              isOpen: true,
              title: 'Error',
              message: err?.message || `Failed to ${action} modules`,
              variant: 'error',
            });
            console.error(`Error ${action}ing modules:`, err);
          }
        },
      });
      return;
    }
    
    try {
      setLoading(true);
      const data = await apiService.patch('/admin/modules', {
        action,
        module_ids: selectedModules
      });
      if (data.success) {
        setSelectedModules([]);
        await fetchModulesData(modulesPagination.page);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `${selectedModules.length} module(s) ${action === 'enable' ? 'enabled' : 'disabled'} successfully`,
          variant: 'success',
        });
      } else {
        throw new Error(data.error || `Failed to ${action} modules`);
      }
    } catch (err: any) {
      setError(`Failed to ${action} modules: ${err?.message || 'Unknown error'}`);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || `Failed to ${action} modules`,
        variant: 'error',
      });
      console.error(`Error ${action}ing modules:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModule = (moduleId: number) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAllModules = () => {
    if (modulesData.length > 0) {
      setSelectedModules(
        selectedModules.length === modulesData.length 
          ? [] 
          : modulesData.map(m => m.id)
      );
    }
  };

  // Filtered modules for display
  const filteredModules = useMemo(() => {
    return modulesData;
  }, [modulesData]);

  const handleCreateBlogPost = async () => {
    try {
      setLoading(true);
      
      // Validate required fields before sending
      if (!draftPost.title || !draftPost.title.trim()) {
        setError('Title is required');
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Title is required',
          variant: 'error'
        });
        setLoading(false);
        return;
      }
      
      if (!draftPost.content || !draftPost.content.trim()) {
        setError('Content is required');
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Content is required',
          variant: 'error'
        });
        setLoading(false);
        return;
      }
      
      const data = await apiService.post('/admin/blog-posts', {
        title: draftPost.title.trim(),
        excerpt: draftPost.excerpt?.trim() || '',
        content: draftPost.content.trim(),
        author: draftPost.author || (profile as any)?.full_name || 'Admin',
        category: draftPost.category || 'General',
        readTime: draftPost.read_time || '5 min read',
        imageUrl: draftPost.featured_image || '',
        featured_image: draftPost.featured_image || '',
        featured: draftPost.featured || false,
        status: draftPost.status || 'published',
        video_url: draftPost.video_url && draftPost.video_url.trim() ? draftPost.video_url.trim() : null
      });
      if (data.success && data.data && data.data.post) {
        setBlogPosts(prev => [data.data.post, ...prev]);
        setDraftPost({
          title: '',
          excerpt: '',
          content: '',
          author: (profile as any)?.full_name || 'Admin',
          category: 'General',
          read_time: '5 min read',
          featured_image: '',
          featured: false,
          status: 'published'
        });
        await fetchBlogData(); // Refresh to get updated pagination
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Blog post created successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to create blog post');
      }
    } catch (err: any) {
      setError(`Failed to create blog post: ${err?.message || 'Unknown error'}`);
      console.error('Error creating blog post:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create blog post',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlogPost = async (id: number) => {
    // Find the post to get its title for the confirmation message
    const post = blogPosts.find(p => p.id === id);
    const postTitle = post?.title || 'this blog post';
    
    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      title: 'Delete Blog Post',
      message: `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }));
          const data = await apiService.delete(`/admin/blog-posts/${id}`);
          if (data.success) {
            // Remove from local state immediately for better UX
            setBlogPosts(prev => prev.filter(post => post.id !== id));
            // Refresh the full list to ensure consistency
            await fetchBlogData();
            setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: `Blog post "${postTitle}" has been deleted successfully.`,
              variant: 'success'
            });
          } else {
            throw new Error(data.error || 'Failed to delete blog post');
          }
        } catch (err: any) {
          setError(`Failed to delete blog post: ${err?.message || 'Unknown error'}`);
          console.error('Error deleting blog post:', err);
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err?.message || 'Failed to delete blog post',
            variant: 'error'
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleEditBlogPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleUpdateBlogPost = async () => {
    if (!editingPost) return;
    
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/blog-posts/${editingPost.id}`, {
        title: editingPost.title,
        excerpt: editingPost.excerpt,
        content: editingPost.content,
        author: editingPost.author_id || (profile as any)?.full_name || 'Admin',
        category: editingPost.category,
        imageUrl: editingPost.featured_image || '',
        featured_image: editingPost.featured_image || '',
        featured: editingPost.featured || false,
        status: editingPost.status,
        video_url: editingPost.video_url || ''
      });
      
      if (data.success && data.data && data.data.post) {
        setBlogPosts(prev => prev.map(post => 
          post && post.id === editingPost.id ? data.data.post : post
        ));
        setEditingPost(null);
        setShowEditor(false);
        await fetchBlogData(); // Refresh to get updated data
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Blog post updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (err: any) {
      setError(`Failed to update blog post: ${err?.message || 'Unknown error'}`);
      console.error('Error updating blog post:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update blog post',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setShowEditor(false);
  };

  // ==================== VIDEO MANAGEMENT FUNCTIONS ====================
  
  const fetchVideosData = async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      const data = await apiService.get('/admin/videos', params);
      if (data.success && data.data) {
        setVideos(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch videos');
      }
    } catch (err: any) {
      setError(`Failed to load videos: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching videos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async () => {
    try {
      if (!draftVideo.title.trim() || !draftVideo.video_url.trim()) {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Title and video URL are required',
          variant: 'error'
        });
        return;
      }
      
      setLoading(true);
      const data = await apiService.post('/admin/videos', draftVideo);
      if (data.success) {
        await fetchVideosData(videoPage, videoSearch || undefined);
        setDraftVideo({
          title: '',
          description: '',
          video_url: '',
          thumbnail_url: '',
          is_active: true,
          display_order: 0
        });
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Video created successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to create video');
      }
    } catch (err: any) {
      setError(`Failed to create video: ${err?.message || 'Unknown error'}`);
      console.error('Error creating video:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create video',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setDraftVideo({
      title: video.title || '',
      description: video.description || '',
      video_url: video.video_url || '',
      thumbnail_url: video.thumbnail_url || '',
      is_active: video.is_active !== undefined ? video.is_active : true,
      display_order: video.display_order || 0
    });
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;
    
    try {
      if (!draftVideo.title.trim() || !draftVideo.video_url.trim()) {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Title and video URL are required',
          variant: 'error'
        });
        return;
      }
      
      setLoading(true);
      const data = await apiService.put(`/admin/videos/${editingVideo.id}`, draftVideo);
      if (data.success) {
        await fetchVideosData(videoPage, videoSearch || undefined);
        setEditingVideo(null);
        setDraftVideo({
          title: '',
          description: '',
          video_url: '',
          thumbnail_url: '',
          is_active: true,
          display_order: 0
        });
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Video updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update video');
      }
    } catch (err: any) {
      setError(`Failed to update video: ${err?.message || 'Unknown error'}`);
      console.error('Error updating video:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update video',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteVideo = (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Video',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }));
          const data = await apiService.delete(`/admin/videos/${id}`);
          if (data.success) {
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: `Video "${title}" deleted successfully`,
              variant: 'success'
            });
            await fetchVideosData(videoPage, videoSearch || undefined);
          } else {
            throw new Error(data.error || 'Failed to delete video');
          }
        } catch (err: any) {
          setError(`Failed to delete video: ${err?.message || 'Unknown error'}`);
          console.error('Error deleting video:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err?.message || 'Failed to delete video',
            variant: 'error'
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  // ==================== NEWSLETTER FUNCTIONS ====================
  
  const fetchNewsletterData = async (page: number = 1, search?: string, status?: string) => {
    try {
      setLoading(true);
      const params: any = { page, limit: newsletterPageSize };
      if (search) params.search = search;
      if (status && status !== 'all') params.status = status;
      const data = await apiService.get('/newsletter/subscribers', params);
      if (data.success && data.data) {
        setNewsletterSubscribers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch subscribers');
      }
    } catch (err: any) {
      setError(`Failed to load subscribers: ${err?.message || 'Unknown error'}`);
      console.error('Error fetching subscribers:', err);
      setNewsletterSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsletterStats = async () => {
    try {
      const data = await apiService.get('/newsletter/stats');
      if (data.success && data.stats) {
        setNewsletterStats(data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching newsletter stats:', err);
    }
  };

  const fetchNewsletterCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/newsletter/campaigns');
      if (data.success) {
        setNewsletterCampaigns(data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setNewsletterCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const data = await apiService.get('/newsletter/email-config');
      if (data.success) {
        setEmailConfig(data.data);
        if (data.data) {
          setEmailConfigForm({
            smtp_host: data.data.smtp_host || '',
            smtp_port: data.data.smtp_port || 587,
            smtp_secure: data.data.smtp_secure !== undefined ? data.data.smtp_secure : true,
            smtp_user: data.data.smtp_user || '',
            smtp_password: '', // Never pre-fill password
            from_email: data.data.from_email || '',
            from_name: data.data.from_name || 'Medarion Newsletter',
            reply_to: data.data.reply_to || ''
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching email config:', err);
    }
  };

  const handleSaveEmailConfig = async () => {
    try {
      if (!emailConfigForm.smtp_host || !emailConfigForm.smtp_port || !emailConfigForm.smtp_user || !emailConfigForm.smtp_password || !emailConfigForm.from_email || !emailConfigForm.from_name) {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Please fill in all required fields',
          variant: 'error'
        });
        return;
      }
      
      setLoading(true);
      const data = await apiService.post('/newsletter/email-config', emailConfigForm);
      if (data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: data.message || 'Email configuration saved and verified successfully',
          variant: 'success'
        });
        await fetchEmailConfig();
        setShowEmailConfig(false);
      } else {
        throw new Error(data.message || 'Failed to save email configuration');
      }
    } catch (err: any) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to save email configuration',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Please enter a test email address',
        variant: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      const data = await apiService.post('/newsletter/email-config/test', { test_email: testEmail.trim() });
      if (data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: data.message || `Test email sent successfully to ${testEmail}`,
          variant: 'success'
        });
        setTestEmail('');
      } else {
        throw new Error(data.message || 'Failed to send test email');
      }
    } catch (err: any) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to send test email',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscriber = (id: number, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Subscriber',
      message: `Are you sure you want to delete "${email}" from the newsletter? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }));
          const data = await apiService.delete(`/newsletter/subscribers/${id}`);
          if (data.success) {
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: `Subscriber "${email}" deleted successfully`,
              variant: 'success'
            });
            await fetchNewsletterData(newsletterPage, newsletterSearch || undefined, newsletterStatus);
            await fetchNewsletterStats();
          } else {
            throw new Error(data.error || 'Failed to delete subscriber');
          }
        } catch (err: any) {
          setError(`Failed to delete subscriber: ${err?.message || 'Unknown error'}`);
          console.error('Error deleting subscriber:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err?.message || 'Failed to delete subscriber',
            variant: 'error'
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowNewsletterComposer(true);
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowNewsletterComposer(true);
  };

  const handleDeleteCampaign = async (id: number, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Campaign',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }));
          const data = await apiService.delete(`/newsletter/campaigns/${id}`);
          if (data.success) {
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: 'Campaign deleted successfully',
              variant: 'success'
            });
            fetchNewsletterCampaigns();
          }
        } catch (err: any) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to delete campaign',
            variant: 'error'
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  const handleCampaignSaved = () => {
    setShowNewsletterComposer(false);
    setEditingCampaign(null);
    fetchNewsletterCampaigns();
  };

  const handleCreateAdvertisement = async () => {
    try {
      setLoading(true);
      const data = await apiService.post('/admin/advertisements', {
        title: draftAd.title,
        advertiser: draftAd.advertiser,
        imageUrl: draftAd.imageUrl,
        ctaText: draftAd.ctaText,
        targetUrl: draftAd.targetUrl,
        category: draftAd.category,
        placements: draftAd.placements
      });
      if (data.success && data.data && data.data.ad) {
        await fetchAdsData(); // Refresh ads data
        setDraftAd({
          title: '',
          imageUrl: '',
          ctaText: '',
          targetUrl: '',
          advertiser: '',
          category: 'blog_general',
          placements: ['blog_top']
        });
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Advertisement created successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to create advertisement');
      }
    } catch (err: any) {
      setError(`Failed to create advertisement: ${err?.message || 'Unknown error'}`);
      console.error('Error creating advertisement:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to create advertisement',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setShowAdEditModal(true);
  };

  const handleSaveAd = async (updatedAd: Advertisement) => {
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/advertisements/${updatedAd.id}`, {
        title: updatedAd.title,
        advertiser: updatedAd.advertiser,
        image_url: updatedAd.image_url,
        cta_text: updatedAd.cta_text,
        target_url: updatedAd.target_url,
        category: updatedAd.category,
        placements: updatedAd.placements,
        is_active: updatedAd.is_active,
        priority: updatedAd.priority
      });
      if (data.success) {
        await fetchAdsData(); // Refresh ads data
        setShowAdEditModal(false);
        setEditingAd(null);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Advertisement updated successfully',
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update advertisement');
      }
    } catch (err: any) {
      setError(`Failed to update advertisement: ${err?.message || 'Unknown error'}`);
      console.error('Error updating advertisement:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update advertisement',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdStatus = async (id: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      const data = await apiService.put(`/admin/advertisements/${id}`, {
        is_active: !currentStatus
      });
      if (data.success) {
        await fetchAdsData(); // Refresh ads data
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: `Advertisement ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
          variant: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update advertisement status');
      }
    } catch (err: any) {
      setError(`Failed to update advertisement status: ${err?.message || 'Unknown error'}`);
      console.error('Error updating advertisement status:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err?.message || 'Failed to update advertisement status',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdvertisement = async (id: number) => {
    const ad = (adsData?.advertisements || []).find(a => a.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Advertisement',
      message: `Are you sure you want to delete "${ad?.title || 'this advertisement'}"? This action cannot be undone.`,
      variant: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const data = await apiService.delete(`/admin/advertisements/${id}`);
          if (data.success) {
            await fetchAdsData();
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
            setAlertModal({
              isOpen: true,
              title: 'Success',
              message: 'Advertisement deleted successfully',
              variant: 'success',
            });
          } else {
            throw new Error(data.error || 'Failed to delete advertisement');
          }
        } catch (err: any) {
          setError(`Failed to delete advertisement: ${err?.message || 'Unknown error'}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err?.message || 'Failed to delete advertisement',
            variant: 'error',
          });
          console.error('Error deleting advertisement:', err);
        }
      },
    });
  };

  // Filtered ads
  const filteredAds = useMemo(() => {
    let filtered = adsData?.advertisements || [];
    
    if (adSearchTerm) {
      const search = adSearchTerm.toLowerCase();
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(search) ||
        ad.advertiser?.toLowerCase().includes(search) ||
        ad.cta_text?.toLowerCase().includes(search)
      );
    }
    
    if (adCategoryFilter) {
      filtered = filtered.filter(ad => ad.category === adCategoryFilter);
    }
    
    if (adStatusFilter) {
      if (adStatusFilter === 'active') {
        filtered = filtered.filter(ad => ad.is_active);
      } else if (adStatusFilter === 'inactive') {
        filtered = filtered.filter(ad => !ad.is_active);
      }
    }
    
    return filtered;
  }, [adsData, adSearchTerm, adCategoryFilter, adStatusFilter]);

  const totalAdPages = Math.max(1, Math.ceil(filteredAds.length / adsPageSize));
  const safeAdPage = Math.min(Math.max(1, adPage), totalAdPages);
  const paginatedAds = filteredAds.slice((safeAdPage - 1) * adsPageSize, safeAdPage * adsPageSize);


  const canSee = (tab: typeof activeTab) => {
    if (tab === 'blog') return canBlog;
    if (tab === 'ads') return canAds;
    if (tab === 'newsletter') return canSuper || canBlog; // Newsletter accessible to super admins and blog admins
    if (['users','modules','seeder','overview','data-management'].includes(tab)) return canSuper;
    return false;
  };

  const visibleTabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'modules', label: 'Modules', icon: Layers },
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'blog', label: 'Blog', icon: Newspaper },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'ads', label: 'Ads', icon: Megaphone },
  ].filter(t => canSee(t.id as any)), [canSuper, canBlog, canAds]);

  // Wait for profile to load before showing unauthorized
  const { loading: authLoading } = useAuth();
  
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!canSuper && !canBlog && !canAds) {
    // Redirect to appropriate dashboard based on user type
    useEffect(() => {
      if (profile) {
        const userType = (profile as any)?.user_type || (profile as any)?.role || 'startup';
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
        };
        const targetPath = redirectMap[userType] || '/startup-dashboard';
        window.location.replace(targetPath);
      } else {
        window.location.replace('/auth');
      }
    }, [profile]);
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const filteredUserOverrides = (userOverrides || []).filter(u => {
    if (!userQuery.trim()) return true;
    const q = userQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.role||'').toLowerCase().includes(q) ||
      (u.account_tier||'').toLowerCase().includes(q) ||
      (u.full_name||'').toLowerCase().includes(q) ||
      (u.company_name||'').toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredUserOverrides.length / usersPageSize));
  const pageSafe = Math.min(Math.max(1, userPage), totalPages);
  const pagedUserOverrides = filteredUserOverrides.slice((pageSafe-1)*usersPageSize, pageSafe*usersPageSize);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">

      {/* Tabs - Mobile: Dropdown, Desktop: Horizontal */}
      <div className="lg:hidden mb-4 sm:mb-6">
        <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)] rounded-xl p-4 shadow-sm">
          <label className="block text-xs sm:text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Dashboard Sections
          </label>
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value as any)}
            className="w-full px-4 py-3 text-sm sm:text-base border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)] focus:border-[var(--color-primary-teal)] transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right pr-10"
            style={{
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            {visibleTabs.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs - Desktop */}
      <div className="hidden lg:flex gap-2 sm:gap-3 flex-wrap">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id as any)}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base ${
              activeTab === id 
                ? 'btn-primary-elevated border-[var(--color-primary-teal)]/50 shadow-lg' 
                : 'btn-outline border-[var(--color-divider-gray)] hover:border-[var(--color-primary-teal)]/30'
            }`}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activeTab === id ? 'text-white' : 'text-[var(--color-text-primary)]'}`}/>
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab==='overview' && (
          <div className="space-y-6">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-500 dark:text-slate-400">Loading...</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 dark:bg-red-500/40 border border-red-200 dark:border-red-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 dark:text-white">{error}</span>
                </div>
              </div>
            )}
            
            {overviewData && !loading && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Key Metrics - Compact Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title="Total Users"
                value={overviewData?.userStats.totalUsers.toLocaleString() || '0'}
                change={overviewData?.userStats.newUsersThisMonth ? Math.round((overviewData.userStats.newUsersThisMonth / overviewData.userStats.totalUsers) * 100) : 0}
                icon={UsersIcon}
                color="primary"
              />
              <StatCard
                title="Active Users"
                value={overviewData?.userStats.activeUsers.toLocaleString() || '0'}
                change={overviewData?.userStats.totalUsers ? Math.round((overviewData.userStats.activeUsers / overviewData.userStats.totalUsers) * 100) : 0}
                icon={Activity}
                color="success"
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${overviewData?.revenueStats.monthlyRevenue.toLocaleString() || '0'}`}
                change={overviewData?.revenueStats.totalRevenue ? Math.round((overviewData.revenueStats.monthlyRevenue / overviewData.revenueStats.totalRevenue) * 100) : 0}
                icon={DollarSign}
                color="accent"
              />
              <StatCard
                title="Blog Posts"
                value={overviewData?.blogStats.blogPosts.toLocaleString() || '0'}
                change={overviewData?.blogStats.blogPosts ? Math.min(100, overviewData.blogStats.blogPosts * 2) : 0}
                icon={Newspaper}
                color="sky"
              />
            </div>

            {/* Charts and Activity Row - 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              <div className="lg:col-span-2">
                <UserGrowthChart
                  data={overviewData?.userGrowth?.slice(-6).map(item => ({ 
                    label: item.month || 'Unknown', 
                    value: Number(item.users) || 0 
                  })).filter(item => item.value >= 0) || []}
                  title="User Growth (Last 6 Months)"
                  color="primary"
                />
              </div>
              <CustomPieChart
                data={overviewData?.userRoles?.map((item, index) => ({
                  label: item.role || 'Unknown',
                  value: Number(item.count) || 0,
                  color: ['primary', 'success', 'accent', 'sky', 'purple'][index] || 'primary'
                })).filter(item => item.value > 0) || []}
                title="User Distribution by Role"
              />
            </div>

            {/* Revenue, Activity, and Recent Users Row - 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              <RevenueByTierChart
                data={overviewData?.revenueByTier?.map(item => ({ 
                  label: item.tier || 'Unknown', 
                  value: Number(item.revenue) || 0 
                })).filter(item => item.value >= 0) || []}
                title="Revenue by Tier"
              />
              <ActivityFeed activities={overviewData?.recentActivity || []} />
              
              {/* Recent Users Section */}
              <div className="bg-[var(--color-background-surface)] border border-[var(--color-divider-gray)]/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl h-full flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]">Recent Users</h3>
                  <button 
                    onClick={() => handleTabChange('users')}
                    className="text-xs sm:text-sm text-[var(--color-primary-teal)] hover:text-[var(--color-primary-teal)]/80 transition-colors font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-2 sm:space-y-2.5 flex-1">
                  {usersData?.users && usersData.users.length > 0 ? (
                    usersData.users.slice(0, 5).map((user, index) => (
                      <div key={user.id || index} className="flex items-center justify-between p-2.5 sm:p-3 bg-[var(--color-background-default)] border border-[var(--color-divider-gray)]/20 rounded-lg sm:rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--color-primary-teal)] rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0">
                            {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email || 'Unknown User'}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)] truncate">{user.email || 'No email'}</div>
                          </div>
                        </div>
                        <span className={`text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${
                          user.is_active 
                            ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-300'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] text-center py-6 sm:py-8">No recent users</div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Stats - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-cyan-50/50 dark:bg-cyan-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/15 dark:to-teal-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-between flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">New Users</p>
                    <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{overviewData?.userStats.newUsersThisMonth || 0}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">This month</p>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white !text-white" />
                  </div>
                </div>
              </div>

              <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-emerald-50/50 dark:bg-emerald-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-between flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">${overviewData?.revenueStats.totalRevenue.toLocaleString() || '0'}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">All time</p>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-green-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white !text-white" />
                  </div>
                </div>
              </div>

              <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-lg transition-all duration-200 group relative overflow-hidden h-full flex flex-col bg-amber-50/50 dark:bg-amber-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-between flex-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Conversion Rate</p>
                    <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 mb-0.5 sm:mb-1">{overviewData?.metrics.conversion_rate || '12.5'}%</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Overall</p>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-orange-600 dark:bg-gradient-to-br dark:from-amber-500 dark:to-orange-500 shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0 ml-2 sm:ml-3">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white !text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* System Status, Quick Actions, and Recent Blog Posts - 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {/* System Status - Compact Style */}
              <div className="card-glass p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-3 sm:mb-4">System Status</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Database</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">API</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Healthy</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-rose-100 dark:bg-rose-500/30 rounded-lg flex-shrink-0">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Cache</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Warning</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Storage</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">85% used</p>
                  </div>
                </div>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="card-glass p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-3 sm:mb-4">Quick Actions</h3>
                <div className="space-y-2 sm:space-y-2.5">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full flex items-center justify-between p-2 sm:p-2.5 card-glass rounded-lg hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg flex-shrink-0">
                        <UsersIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Manage Users</span>
                    </div>
                    <ArrowUp className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0 ml-2" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('blog')}
                    className="w-full flex items-center justify-between p-2 sm:p-2.5 card-glass rounded-lg hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg flex-shrink-0">
                        <Newspaper className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Manage Blog</span>
                    </div>
                    <ArrowUp className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0 ml-2" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('ads')}
                    className="w-full flex items-center justify-between p-2 sm:p-2.5 card-glass rounded-lg hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-1.5 bg-rose-100 dark:bg-rose-500/30 rounded-lg flex-shrink-0">
                        <Megaphone className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Manage Ads</span>
                    </div>
                    <ArrowUp className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0 ml-2" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('data-management')}
                    className="w-full flex items-center justify-between p-2 sm:p-2.5 card-glass rounded-lg hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg flex-shrink-0">
                        <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">Data Management</span>
                    </div>
                    <ArrowUp className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0 ml-2" />
                  </button>
                </div>
              </div>

              {/* Recent Blog Posts Section */}
              <div className="card-glass p-3 sm:p-4 rounded-lg h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">Recent Blog Posts</h3>
                  <button 
                    onClick={() => setActiveTab('blog')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-2 sm:space-y-2.5 flex-1">
                  {blogData?.posts && blogData.posts.length > 0 ? (
                    blogData.posts.slice(0, 4).map((post, index) => (
                      <div key={post.id || index} className="p-2 card-glass rounded-lg hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {post.title || 'Untitled Post'}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{post.category || 'General'}</span>
                              <span>•</span>
                              <span>{post.read_time || '5 min'}</span>
                            </div>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                            post.status === 'published'
                              ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300'
                          }`}>
                            {post.status || 'draft'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No blog posts yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Module Overview and Performance Metrics - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {/* Module Overview Section - 2 columns */}
              <div className="lg:col-span-2 card-glass p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">Module Overview</h3>
                  <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2">
                    View All →
                  </button>
                </div>
                
                {/* Module Grid - More compact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Companies Module */}
                <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Companies</h4>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.moduleStats?.companies || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Active</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.floor((overviewData?.moduleStats?.companies || 0) * 0.95)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">New</span>
                      <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        +{Math.floor((overviewData?.moduleStats?.companies || 0) * 0.02)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Deals Module */}
                <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Deals</h4>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.moduleStats?.deals || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Value</span>
                      <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        ${((overviewData?.moduleStats?.deals || 0) * 7.2).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">This Month</span>
                      <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        +{Math.floor((overviewData?.moduleStats?.deals || 0) * 0.05)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Grants Module */}
                <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Grants</h4>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Available</span>
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.moduleStats?.grants || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Value</span>
                      <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        ${((overviewData?.moduleStats?.grants || 0) * 0.3).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Deadline</span>
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                        {Math.floor((overviewData?.moduleStats?.grants || 0) * 0.08)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Trials Module */}
                <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Clinical Trials</h4>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Active</span>
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.moduleStats?.clinical_trials || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Recruiting</span>
                      <span className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        {Math.floor((overviewData?.moduleStats?.clinical_trials || 0) * 0.38)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Completed</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.floor((overviewData?.moduleStats?.clinical_trials || 0) * 1.75)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Investors Module */}
                <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Investors</h4>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.moduleStats?.investors || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Active</span>
                      <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.floor((overviewData?.moduleStats?.investors || 0) * 0.85)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">New</span>
                      <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        +{Math.floor((overviewData?.moduleStats?.investors || 0) * 0.02)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Module */}
                <div className="card-glass p-2.5 sm:p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">Regulatory</h4>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.moduleStats?.regulatory_bodies || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Updated</span>
                      <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.floor((overviewData?.moduleStats?.regulatory_bodies || 0) * 0.02)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Pending</span>
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                        {Math.floor((overviewData?.moduleStats?.regulatory_bodies || 0) * 0.005)}
                      </span>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Performance Metrics Section */}
              <div className="card-glass p-3 sm:p-4 rounded-lg h-full flex flex-col">
                <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 mb-3 sm:mb-4">Performance Metrics</h3>
                <div className="space-y-2.5 sm:space-y-3 flex-1">
                  <div className="p-2.5 card-glass rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Page Load Time</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">0.8s</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700/30 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="p-2.5 card-glass rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">API Response</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">120ms</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700/30 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div className="p-2.5 card-glass rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Uptime</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">99.9%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700/30 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '99.9%' }}></div>
                    </div>
                  </div>
                  <div className="p-2.5 card-glass rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Error Rate</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">0.01%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700/30 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Active Sessions</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {overviewData?.userStats.activeUsers || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ads Overview and Campaign Performance - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Ads Overview Section - Compact Style - 2 columns */}
              <div className="lg:col-span-2 card-glass p-3 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-0.5">Advertisement Overview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Campaign performance and ad management</p>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Live</span>
                </div>
              </div>
              
              {/* Ads Metrics Grid - Compact Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                <div className="card-glass p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg">
                      <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-xs bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                      {overviewData?.adsStats?.activeCampaigns || 0}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Active Campaigns</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Live campaigns</div>
                  </div>
                </div>
                
                <div className="card-glass p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg">
                      <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-medium">+12%</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                      {overviewData?.adsStats?.totalImpressions ? (overviewData.adsStats.totalImpressions / 1000).toFixed(1) + 'K' : '0'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Impressions</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Last 30 days</div>
                  </div>
                </div>
                
                <div className="card-glass p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-100 dark:!bg-purple-100 rounded-lg">
                      <MousePointer className="h-4 w-4 text-purple-600 dark:text-purple-600" />
                    </div>
                    <span className="text-xs bg-purple-100 dark:!bg-purple-100 text-purple-700 dark:text-purple-700 px-1.5 py-0.5 rounded-full font-medium">+8%</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                      {overviewData?.adsStats?.clickThroughRate || 0}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Click-Through Rate</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Last 30 days</div>
                  </div>
                </div>
                
                <div className="card-glass p-3 rounded-lg hover:shadow-md transition-all duration-200 group h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-orange-100 dark:!bg-orange-100 rounded-lg">
                      <DollarSign className="h-4 w-4 text-orange-600 dark:text-black" />
                    </div>
                    <span className="text-xs bg-orange-100 dark:!bg-orange-100 text-orange-700 dark:text-orange-700 px-1.5 py-0.5 rounded-full font-medium">+15%</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-0.5">
                      {`$${overviewData?.adsStats?.revenueGenerated ? (overviewData.adsStats.revenueGenerated / 1000).toFixed(1) + 'K' : '0'}`}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Revenue Generated</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">From campaigns</div>
                  </div>
                </div>
              </div>
              
              {/* Top Performing Campaigns and Placement Performance - 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200">Top Campaigns</h4>
                    <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      View All →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {[
                      { name: 'Healthcare Innovation Summit', impressions: '45.2K', ctr: '4.2%', revenue: '$2.1K', status: 'active' },
                      { name: 'MedTech Startup Showcase', impressions: '38.7K', ctr: '3.8%', revenue: '$1.8K', status: 'active' },
                      { name: 'Clinical Research Opportunities', impressions: '32.1K', ctr: '3.5%', revenue: '$1.5K', status: 'active' }
                    ].map((campaign, index) => (
                      <div key={index} className="flex items-center justify-between p-1.5 card-glass rounded-lg hover:shadow-md transition-all duration-200 group">
                        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${campaign.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{campaign.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{campaign.impressions}</div>
                          </div>
                        </div>
                        <div className="text-right ml-1.5 flex-shrink-0">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{campaign.ctr}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{campaign.revenue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">Placement Performance</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-1.5 card-glass rounded-lg hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div className="p-1 bg-cyan-100 dark:bg-cyan-500/30 rounded-lg flex-shrink-0">
                          <Newspaper className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Header Banner</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Top placement</div>
                        </div>
                      </div>
                      <div className="text-right ml-1.5 flex-shrink-0">
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">5.2%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Best</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-1.5 card-glass rounded-lg hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div className="p-1 bg-emerald-100 dark:bg-emerald-500/30 rounded-lg flex-shrink-0">
                          <Megaphone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Sidebar Ads</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Side placement</div>
                        </div>
                      </div>
                      <div className="text-right ml-1.5 flex-shrink-0">
                        <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400">3.1%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Good</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-1.5 card-glass rounded-lg hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                        <div className="p-1 bg-purple-100 dark:!bg-purple-100 rounded-lg flex-shrink-0">
                          <Target className="h-3 w-3 text-purple-600 dark:text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">In-Content</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Article content</div>
                        </div>
                      </div>
                      <div className="text-right ml-1.5 flex-shrink-0">
                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400">2.8%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Avg</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Campaign Performance Chart - Compact Style */}
              <div className="max-w-full">
                <div className="card-glass p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Campaign Performance (Last 7 Days)</h4>
                  <div className="card-glass p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-end justify-between h-32 space-x-2">
                      {[
                        { day: 'Mon', impressions: 12000, clicks: 380, revenue: 1200 },
                        { day: 'Tue', impressions: 15000, clicks: 450, revenue: 1500 },
                        { day: 'Wed', impressions: 18000, clicks: 540, revenue: 1800 },
                        { day: 'Thu', impressions: 22000, clicks: 660, revenue: 2200 },
                        { day: 'Fri', impressions: 25000, clicks: 750, revenue: 2500 },
                        { day: 'Sat', impressions: 20000, clicks: 600, revenue: 2000 },
                        { day: 'Sun', impressions: 16000, clicks: 480, revenue: 1600 }
                      ].map((item, index) => {
                        const maxImpressions = 25000;
                        const height = (item.impressions / maxImpressions) * 100;
                        const isToday = index === 6;
                        
                        return (
                          <div key={index} className="flex flex-col items-center flex-1 group">
                            <div className="relative w-full flex justify-center mb-2">
                              <div 
                                className={`relative rounded-t-lg transition-all duration-500 ease-out shadow-md hover:shadow-lg cursor-pointer group-hover:scale-105 ${
                                  isToday 
                                    ? 'bg-gradient-to-t from-blue-600 to-orange-500' 
                                    : 'bg-gradient-to-t from-blue-500/80 to-blue-500/40'
                                }`}
                                style={{ 
                                  height: `${Math.max(height, 8)}%`,
                                  width: '80%',
                                  minHeight: '8px'
                                }}
                                title={`${item.day}: ${item.impressions.toLocaleString()} impressions`}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent rounded-t-lg"></div>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.day}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {item.impressions > 1000 ? `${(item.impressions/1000).toFixed(0)}k` : item.impressions}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
          </div>
        )}


        {activeTab==='users' && (
          <div className="space-y-3">
            {/* Enhanced User Management Header */}
            <div className="card-glass p-3 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">User Management</h3>
                <div className="flex items-center gap-3">
                  <button 
                    className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => {/* TODO: Export users */}}
                  >
                    <Download className="h-4 w-4 text-white dark:text-white"/>
                    <span>Export</span>
                  </button>
                  <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" onClick={() => setShowAddUserModal(true)}>
                    <Plus className="h-4 w-4 text-white dark:text-white"/>
                    <span>Add User</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input 
                    className="input pl-10" 
                    placeholder="Search users..." 
                    value={userSearchTerm} 
                    onChange={e => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="input" 
                  value={userRoleFilter} 
                  onChange={e => setUserRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="investors_finance">Investor</option>
                  <option value="industry_executives">Executive</option>
                  <option value="health_science_experts">Researcher</option>
                  <option value="media_advisors">Media</option>
                  <option value="startup">Startup</option>
                </select>
                <select 
                  className="input" 
                  value={userStatusFilter} 
                  onChange={e => setUserStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                </select>
                <div className="flex items-center gap-2">
                  <button 
                    className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => {
                      setUserSearchTerm('');
                      setUserRoleFilter('');
                      setUserStatusFilter('');
                    }}
                  >
                    <Filter className="h-4 w-4"/>
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="card-glass bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 dark:text-white font-medium">
                      {selectedUsers.length} user(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        className="btn-outline px-3 py-2 rounded-lg text-green-600 dark:text-white hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => handleBulkAction('activate')}
                      >
                        <UserCheckIcon className="h-4 w-4"/>
                        <span>Activate</span>
                      </button>
                      <button 
                        className="btn-outline px-3 py-2 rounded-lg text-yellow-600 dark:text-white hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        onClick={() => handleBulkAction('deactivate')}
                      >
                        <UserX className="h-4 w-4"/>
                        <span>Deactivate</span>
                      </button>
                      <button 
                        className="btn-outline px-3 py-2 rounded-lg text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleBulkAction('block')}
                      >
                        <Ban className="h-4 w-4"/>
                        <span>Block</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Users Table */}
            <div className="card-glass rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length === usersData?.users.length && usersData?.users.length > 0}
                          onChange={handleSelectAllUsers}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Tier</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Verified</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Joined</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {usersData?.users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 rounded-full flex items-center justify-center text-white !text-white font-medium">
                              {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-700 dark:text-slate-200">
                                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                            {user.role?.replace('_', ' ') || 'No role'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                            {user.account_tier || 'No tier'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-300'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_verified 
                              ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-300'
                          }`}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button 
                              className="btn-outline px-2 py-1 rounded text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-white"/>
                            </button>
                            <div className="relative">
                              <button 
                                className="btn-outline px-2 py-1 rounded text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                onClick={() => setShowUserActionsMenu(showUserActionsMenu === user.id ? null : user.id)}
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-white"/>
                              </button>
                              {showUserActionsMenu === user.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                                  <div className="py-1">
                                    <button 
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        handleVerifyUser(user.id, !user.is_verified);
                                        setShowUserActionsMenu(null);
                                      }}
                                    >
                                      <UserCheckIcon className="h-4 w-4"/>
                                      {user.is_verified ? 'Unverify' : 'Verify'}
                                    </button>
                                    <button 
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        handleUserStatusChange(user.id, user.is_active ? 'deactivate' : 'activate');
                                        setShowUserActionsMenu(null);
                                      }}
                                    >
                                      {user.is_active ? <UserX className="h-4 w-4"/> : <UserCheckIcon className="h-4 w-4"/>}
                                      {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button 
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                      onClick={() => {
                                        handleResetPassword(user.id);
                                        setShowUserActionsMenu(null);
                                      }}
                                    >
                                      <Key className="h-4 w-4"/>
                                      Reset Password
                                    </button>
                                    <button 
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2 text-red-600"
                                      onClick={() => {
                                        handleUserStatusChange(user.id, 'block');
                                        setShowUserActionsMenu(null);
                                      }}
                                    >
                                      <Ban className="h-4 w-4"/>
                                      Block User
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {usersData?.pagination && (
                <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to {Math.min(usersData.pagination.page * usersData.pagination.limit, usersData.pagination.total)} of {usersData.pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                      disabled={usersData.pagination.page <= 1}
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
                      Page {usersData.pagination.page} of {usersData.pagination.pages}
                    </span>
                    <button 
                      className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                      disabled={usersData.pagination.page >= usersData.pagination.pages}
                      onClick={() => setUserPage(p => Math.min(usersData.pagination.pages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab==='modules' && (
          <div className="space-y-3">
            {/* Create New Module */}
            <div id="create-module-section" className="card-glass p-3 rounded-lg">
              <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">Create New Module</h3>
              <div className="grid grid-cols-2 gap-4">
                <input className="input" placeholder="Module ID (e.g., new_module)" value={draftModule.module_id} onChange={e=>setDraftModule(prev=>({...prev, module_id:e.target.value}))}/>
                <input className="input" placeholder="Module Name" value={draftModule.name} onChange={e=>setDraftModule(prev=>({...prev, name:e.target.value}))}/>
                <textarea className="input col-span-2" placeholder="Description" value={draftModule.description||''} onChange={e=>setDraftModule(prev=>({...prev, description:e.target.value}))} rows={2}/>
                <input className="input" placeholder="Component Name" value={draftModule.component||''} onChange={e=>setDraftModule(prev=>({...prev, component:e.target.value}))}/>
                <input className="input" placeholder="Icon (e.g., BarChart3)" value={draftModule.icon||''} onChange={e=>setDraftModule(prev=>({...prev, icon:e.target.value}))}/>
                <select className="input" value={draftModule.category} onChange={e=>setDraftModule(prev=>({...prev, category:e.target.value as any}))}>
                  <option value="core">Core</option>
                  <option value="data">Data</option>
                  <option value="tools">Tools</option>
                  <option value="analytics">Analytics</option>
                  <option value="admin">Admin</option>
                </select>
                <select className="input" value={draftModule.required_tier} onChange={e=>setDraftModule(prev=>({...prev, required_tier:e.target.value as any}))}>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="academic">Academic</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <input type="number" className="input" placeholder="Display Order" value={draftModule.display_order||0} onChange={e=>setDraftModule(prev=>({...prev, display_order:parseInt(e.target.value)||0}))}/>
                <input className="input" placeholder="Data Source" value={draftModule.data_source||''} onChange={e=>setDraftModule(prev=>({...prev, data_source:e.target.value}))}/>
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={draftModule.is_enabled} onChange={e=>setDraftModule(prev=>({...prev, is_enabled:e.target.checked}))} className="w-4 h-4"/>
                    <span className="text-sm text-slate-700 dark:text-slate-200">Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={draftModule.is_core} onChange={e=>setDraftModule(prev=>({...prev, is_core:e.target.checked}))} className="w-4 h-4"/>
                    <span className="text-sm text-slate-700 dark:text-slate-200">Core Module</span>
                  </label>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" onClick={handleCreateModule}>
                    <Plus className="h-4 w-4 text-white dark:text-white"/>
                    <span>Create Module</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="card-glass p-3 rounded-lg">
              <div className="grid grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input className="input pl-10" placeholder="Search modules..." value={moduleSearchTerm} onChange={e=>{ setModuleSearchTerm(e.target.value); setModulesPagination(prev=>({...prev, page:1})); }} />
                </div>
                <select className="input" value={moduleCategoryFilter} onChange={e=>{ setModuleCategoryFilter(e.target.value); setModulesPagination(prev=>({...prev, page:1})); }}>
                  <option value="">All Categories</option>
                  <option value="core">Core</option>
                  <option value="data">Data</option>
                  <option value="tools">Tools</option>
                  <option value="analytics">Analytics</option>
                  <option value="admin">Admin</option>
                </select>
                <select className="input" value={moduleEnabledFilter} onChange={e=>{ setModuleEnabledFilter(e.target.value); setModulesPagination(prev=>({...prev, page:1})); }}>
                  <option value="">All Status</option>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
                <button className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2" onClick={()=>{ setModuleSearchTerm(''); setModuleCategoryFilter(''); setModuleEnabledFilter(''); setModulesPagination(prev=>({...prev, page:1})); }}>
                  <Filter className="h-4 w-4"/>
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedModules.length > 0 && (
              <div className="card-glass p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {selectedModules.length} module(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline px-3 py-2 rounded-lg text-sm" onClick={()=>handleBulkModuleOperation('enable')}>
                      Enable
                    </button>
                    <button className="btn-outline px-3 py-2 rounded-lg text-sm" onClick={()=>handleBulkModuleOperation('disable')}>
                      Disable
                    </button>
                    <button className="btn-outline px-3 py-2 rounded-lg text-sm text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20" onClick={()=>handleBulkModuleOperation('delete')}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modules Table */}
            <div className="card-glass rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Modules ({filteredModules.length})</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your platform modules</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" checked={selectedModules.length === filteredModules.length && filteredModules.length > 0} onChange={handleSelectAllModules} className="w-4 h-4"/>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Module</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Tier</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Order</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Core</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredModules.map(module => (
                      <tr key={module.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedModules.includes(module.id)} onChange={()=>handleSelectModule(module.id)} className="w-4 h-4" disabled={module.is_core}/>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-slate-700 dark:text-slate-200">{module.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{module.module_id}</div>
                            {module.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{module.description.substring(0, 60)}...</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                            {module.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                            {module.required_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-700 dark:text-slate-200">{module.display_order}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => handleToggleModuleStatus(module.id, module.is_enabled)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              module.is_enabled
                                ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {module.is_enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {module.is_core ? (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                              Core
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button 
                              className="btn-outline px-2 py-1 rounded text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => handleEditModule(module)}
                            >
                              <Edit className="h-4 w-4"/>
                            </button>
                            {!module.is_core && (
                              <button 
                                className="btn-outline px-2 py-1 rounded text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20" 
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                <Trash2 className="h-4 w-4"/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredModules.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No modules found. Create your first module above.
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {modulesPagination.pages > 1 && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Page {modulesPagination.page} of {modulesPagination.pages} ({modulesPagination.total} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                      disabled={modulesPagination.page <= 1}
                      onClick={() => { setModulesPagination(prev=>({...prev, page: prev.page - 1})); fetchModulesData(modulesPagination.page - 1); }}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Page {modulesPagination.page} of {modulesPagination.pages}
                    </span>
                    <button 
                      className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                      disabled={modulesPagination.page >= modulesPagination.pages}
                      onClick={() => { setModulesPagination(prev=>({...prev, page: prev.page + 1})); fetchModulesData(modulesPagination.page + 1); }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Module Edit Modal */}
        {showModuleEditModal && editingModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">Edit Module</h3>
                <button 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => {
                    setShowModuleEditModal(false);
                    setEditingModule(null);
                  }}
                >
                  <X className="h-5 w-5"/>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingModule) handleSaveModule(editingModule);
              }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Module ID</label>
                    <input 
                      className="input w-full" 
                      value={editingModule.module_id} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, module_id: e.target.value} : null)}
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Name</label>
                    <input 
                      className="input w-full" 
                      value={editingModule.name || ''} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, name: e.target.value} : null)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                    <textarea 
                      className="input w-full" 
                      value={editingModule.description || ''} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, description: e.target.value} : null)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Component</label>
                    <input 
                      className="input w-full" 
                      value={editingModule.component || ''} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, component: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Icon</label>
                    <input 
                      className="input w-full" 
                      value={editingModule.icon || ''} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, icon: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Category</label>
                    <select 
                      className="input w-full" 
                      value={editingModule.category} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, category: e.target.value as any} : null)}
                    >
                      <option value="core">Core</option>
                      <option value="data">Data</option>
                      <option value="tools">Tools</option>
                      <option value="analytics">Analytics</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Required Tier</label>
                    <select 
                      className="input w-full" 
                      value={editingModule.required_tier} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, required_tier: e.target.value as any} : null)}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="academic">Academic</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Display Order</label>
                    <input 
                      type="number"
                      className="input w-full" 
                      value={editingModule.display_order || 0} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, display_order: parseInt(e.target.value) || 0} : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Data Source</label>
                    <input 
                      className="input w-full" 
                      value={editingModule.data_source || ''} 
                      onChange={e => setEditingModule(prev => prev ? {...prev, data_source: e.target.value} : null)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingModule.is_enabled} 
                        onChange={e => setEditingModule(prev => prev ? {...prev, is_enabled: e.target.checked} : null)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">Enabled</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingModule.is_core} 
                        onChange={e => setEditingModule(prev => prev ? {...prev, is_core: e.target.checked} : null)}
                        disabled
                        className="w-4 h-4 opacity-50"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">Core Module (cannot be changed)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    className="btn-outline px-4 py-2 rounded-lg"
                    onClick={() => {
                      setShowModuleEditModal(false);
                      setEditingModule(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Save className="h-4 w-4 text-white dark:text-white"/>
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab==='blog' && (
          <div className="space-y-3">
            {showEditor ? (
            <div>
              <BlogEditor
                post={editingPost || draftPost}
                onChange={(field, value) => {
                  if (editingPost) {
                    setEditingPost(prev => prev ? { ...prev, [field]: value } : null);
                  } else {
                    setDraftPost(prev => ({ ...prev, [field]: value }));
                  }
                }}
                onSave={editingPost ? handleUpdateBlogPost : handleCreateBlogPost}
                onCancel={handleCancelEdit}
                isEditing={!!editingPost}
              />
              </div>
            ) : (
              <>
                {/* Create New Post Button */}
                <div className="flex justify-between items-center">
                  <div></div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowCategoryManager(true)}
                      className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      <span>Manage Categories</span>
                    </button>
                    <button
                      onClick={() => setShowEditor(true)}
                      className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5 text-white dark:text-white" />
                      <span>Create New Post</span>
                    </button>
                  </div>
                </div>

                {/* Blog Posts List - Always visible */}
                <div className="card-glass rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Blog Posts ({blogPosts.length})</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your blog content</p>
                  </div>
                  {loading && blogPosts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
                      <p className="text-sm">Loading blog posts...</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {blogPosts.filter(p => p && p.id).map(p => (
                        <div key={p.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h4 
                                  className="font-medium text-sm sm:text-base text-slate-700 dark:text-slate-200 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex-shrink-0"
                                  onClick={() => {
                                    const blogUrl = p.slug 
                                      ? `/blog/${p.slug}` 
                                      : `/blog/${p.id}`;
                                    window.open(blogUrl, '_blank');
                                  }}
                                  title="Click to open blog post in new tab"
                                >
                                  {p.title}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                {p.status === 'published' && (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium whitespace-nowrap">
                                    Published
                                  </span>
                                )}
                                {p.status === 'draft' && (
                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium whitespace-nowrap">
                                    Draft
                                  </span>
                                )}
                                {p.featured && (
                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium whitespace-nowrap">
                                    Featured
                                  </span>
                                )}
                              </div>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{p.excerpt}</p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                                  <span className="truncate">Author {p.author_id}</span>
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                                  <span className="truncate">{p.published_at ? new Date(p.published_at).toLocaleDateString() : 'Not published'}</span>
                                </span>
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium whitespace-nowrap">
                                  {p.category}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium whitespace-nowrap">
                                  {p.read_time || '5 min read'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 sm:self-start">
                              <button 
                                className="btn-outline px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" 
                                onClick={() => handleEditBlogPost(p)}
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button 
                                className="btn-outline px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm" 
                                onClick={() => handleDeleteBlogPost(p.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/>
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {blogPosts.length === 0 && (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                          <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">No blog posts yet</p>
                          <p className="text-xs">Create your first blog post to get started</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Management Section */}
                <div className="card-glass rounded-lg overflow-hidden mt-3">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Video Management ({videos.length})</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage videos for the blog page video section</p>
                  </div>
                  
                  {/* Create/Edit Video Form */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                      {editingVideo ? 'Edit Video' : 'Create New Video'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        className="input" 
                        placeholder="Video Title *" 
                        value={draftVideo.title} 
                        onChange={e => setDraftVideo(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <input 
                        className="input" 
                        placeholder="Video URL (YouTube or other) *" 
                        value={draftVideo.video_url} 
                        onChange={e => setDraftVideo(prev => ({ ...prev, video_url: e.target.value }))}
                      />
                      <div className="col-span-2">
                        <textarea 
                          className="input min-h-[100px]" 
                          placeholder="Description" 
                          value={draftVideo.description} 
                          onChange={e => setDraftVideo(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <input 
                        className="input" 
                        placeholder="Thumbnail URL (optional)" 
                        value={draftVideo.thumbnail_url} 
                        onChange={e => setDraftVideo(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={draftVideo.is_active} 
                            onChange={e => setDraftVideo(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-500 dark:text-slate-400">Active</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-slate-500 dark:text-slate-400">Display Order:</label>
                          <input 
                            type="number" 
                            className="input w-20" 
                            value={draftVideo.display_order} 
                            onChange={e => setDraftVideo(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        {editingVideo ? (
                          <>
                            <button 
                              className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" 
                              onClick={handleUpdateVideo}
                            >
                              <Check className="h-4 w-4" />
                              <span>Update Video</span>
                            </button>
                            <button 
                              className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2" 
                              onClick={() => {
                                setEditingVideo(null);
                                setDraftVideo({
                                  title: '',
                                  description: '',
                                  video_url: '',
                                  thumbnail_url: '',
                                  is_active: true,
                                  display_order: 0
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" 
                            onClick={handleCreateVideo}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Create Video</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Videos List */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {loading && videos.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
                        <p>Loading videos...</p>
                      </div>
                    ) : videos.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No videos yet</p>
                        <p className="text-sm">Create your first video to get started</p>
                      </div>
                    ) : (
                      videos.map((video) => (
                        <div key={video.id} className="p-4 hover:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-slate-700 dark:text-slate-200">{video.title}</h4>
                                {video.is_active ? (
                                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium">
                                    Inactive
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                                  Order: {video.display_order}
                                </span>
                              </div>
                              {video.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{video.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <a 
                                  href={video.video_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View Video
                                </a>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4"/>
                                  {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2" 
                                onClick={() => handleEditVideo(video)}
                              >
                                <Edit className="h-4 w-4"/>
                                <span>Edit</span>
                              </button>
                              <button 
                                className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20" 
                                onClick={() => handleDeleteVideo(video.id, video.title)}
                              >
                                <Trash2 className="h-4 w-4"/>
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </>
            )}
          </div>
        )}

        {activeTab==='newsletter' && (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div></div>
              <button
                onClick={handleCreateCampaign}
                className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Plus className="h-5 w-5 text-white dark:text-white" />
                <span>Create Campaign</span>
              </button>
            </div>

            {/* Statistics Cards */}
            {newsletterStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="card-glass p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Subscribers</p>
                      <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mt-1">{newsletterStats.total || 0}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md">
                      <Mail className="h-5 w-5 text-white !text-white" />
                  </div>
                </div>
                </div>
                <div className="card-glass p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active</p>
                      <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mt-1">{newsletterStats.active || 0}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-600 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-green-500 shadow-md">
                      <CheckCircle className="h-5 w-5 text-white !text-white" />
                  </div>
                </div>
                </div>
                <div className="card-glass p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Week</p>
                      <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mt-1">{newsletterStats.this_week || 0}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md">
                      <TrendingUp className="h-5 w-5 text-white !text-white" />
                  </div>
                </div>
                </div>
                <div className="card-glass p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Month</p>
                      <p className="text-2xl font-medium text-slate-700 dark:text-slate-200 mt-1">{newsletterStats.this_month || 0}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500 shadow-md">
                      <Calendar className="h-5 w-5 text-white !text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Configuration */}
            <div className="card-glass rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">Email Configuration</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure SMTP settings for sending newsletters</p>
                </div>
                <button
                  onClick={() => {
                    setShowEmailConfig(!showEmailConfig);
                    if (!showEmailConfig && emailConfig) {
                      fetchEmailConfig();
                    }
                  }}
                  className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {showEmailConfig ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                  <span>{showEmailConfig ? 'Hide' : 'Configure'}</span>
                </button>
              </div>
              
              {showEmailConfig && (
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">SMTP Host *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="smtp.gmail.com"
                        value={emailConfigForm.smtp_host}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">SMTP Port *</label>
                      <input
                        type="number"
                        className="input w-full"
                        placeholder="587"
                        value={emailConfigForm.smtp_port}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">SMTP Username *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="your-email@gmail.com"
                        value={emailConfigForm.smtp_user}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, smtp_user: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">SMTP Password *</label>
                      <input
                        type="password"
                        className="input w-full"
                        placeholder={emailConfig ? 'Enter new password or leave blank to keep current' : 'Enter password'}
                        value={emailConfigForm.smtp_password}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, smtp_password: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">From Email *</label>
                      <input
                        type="email"
                        className="input w-full"
                        placeholder="newsletter@medarion.africa"
                        value={emailConfigForm.from_email}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, from_email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">From Name *</label>
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Medarion Newsletter"
                        value={emailConfigForm.from_name}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, from_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Reply-To Email</label>
                      <input
                        type="email"
                        className="input w-full"
                        placeholder="Optional"
                        value={emailConfigForm.reply_to}
                        onChange={(e) => setEmailConfigForm(prev => ({ ...prev, reply_to: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailConfigForm.smtp_secure}
                          onChange={(e) => setEmailConfigForm(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">Use SSL/TLS (Secure)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleSaveEmailConfig}
                      className="btn-primary px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Configuration</span>
                    </button>
                    {emailConfig && (
                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="email"
                          className="input flex-1"
                          placeholder="Enter email to test configuration"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <button
                          onClick={handleTestEmail}
                          className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Send Test Email</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {emailConfig && (
                    <div className="p-4 bg-green-50 dark:bg-green-500/40 rounded-lg border border-green-200 dark:border-green-500/50">
                      <p className="text-sm text-green-800 dark:text-white">
                        ✓ Email configuration is active. New subscribers will receive welcome emails automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campaigns Section */}
            <div className="card-glass rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">
                  Newsletter Campaigns ({newsletterCampaigns.length})
                </h3>
              </div>

              {newsletterCampaigns.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No campaigns yet</p>
                  <p className="text-sm mt-1">Create your first newsletter campaign to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {newsletterCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 hover:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-slate-700 dark:text-slate-200">{campaign.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'sent' 
                                ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : campaign.status === 'scheduled'
                                ? 'bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200'
                            }`}>
                              {campaign.status === 'sent' ? 'Sent' : campaign.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                            <strong>Subject:</strong> {campaign.subject}
                          </p>
                          {campaign.preview_text && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">
                              {campaign.preview_text}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created: {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                            {campaign.sent_at && (
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                Sent: {new Date(campaign.sent_at).toLocaleDateString()}
                              </span>
                            )}
                            {campaign.total_recipients > 0 && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {campaign.total_recipients} recipients
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditCampaign(campaign)}
                            className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                            className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subscribers Section */}
            <div className="card-glass rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">
                  Subscribers ({newsletterSubscribers.length})
                </h3>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <div className="flex flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by email, name, or company..."
                      value={newsletterSearch}
                      onChange={(e) => {
                        setNewsletterSearch(e.target.value);
                        setNewsletterPage(1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchNewsletterData(1, newsletterSearch || undefined, newsletterStatus);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newsletterStatus}
                      onChange={(e) => {
                        setNewsletterStatus(e.target.value);
                        setNewsletterPage(1);
                        fetchNewsletterData(1, newsletterSearch || undefined, e.target.value);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                    <button
                      onClick={() => fetchNewsletterData(newsletterPage, newsletterSearch || undefined, newsletterStatus)}
                      className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              {loading && newsletterSubscribers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
                  <p>Loading subscribers...</p>
                </div>
              ) : newsletterSubscribers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No subscribers found</p>
                  <p className="text-sm mt-1">
                    {newsletterSearch ? 'Try adjusting your search criteria' : 'Subscribers will appear here once they sign up'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {newsletterSubscribers.map((subscriber) => (
                    <div key={subscriber.id} className="p-4 hover:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center text-white dark:text-white font-medium">
                              {subscriber.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-700 dark:text-slate-200">{subscriber.email}</h4>
                                {subscriber.is_active ? (
                                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              {subscriber.name && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subscriber.name}</p>
                              )}
                              {subscriber.company && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Company: {subscriber.company}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Subscribed: {subscriber.subscribed_at ? new Date(subscriber.subscribed_at).toLocaleDateString() : 'N/A'}
                                </span>
                                {subscriber.unsubscribed_at && (
                                  <span className="flex items-center gap-1 text-red-600 dark:text-white">
                                    Unsubscribed: {new Date(subscriber.unsubscribed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSubscriber(subscriber)}
                            className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.email)}
                            className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab==='ads' && (
          <div className="space-y-3">
            {/* Search and Filters moved below near the list */}

            {/* Create New Ad */}
            <div id="create-ad-section" className="card-glass p-3 rounded-lg">
              <h3 className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">Create New Advertisement</h3>
              <div className="grid grid-cols-2 gap-4">
                <input className="input" placeholder="Ad Title" value={draftAd.title} onChange={e=>setDraftAd(prev=>({...prev, title:e.target.value}))}/>
                <input className="input" placeholder="Advertiser Name" value={draftAd.advertiser||''} onChange={e=>setDraftAd(prev=>({...prev, advertiser:e.target.value}))}/>
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <input className="input col-span-2" placeholder="Image URL" value={draftAd.imageUrl} onChange={e=>setDraftAd(prev=>({...prev, imageUrl:e.target.value}))}/>
                  {/* Use ImageUploadModal for consistent upload experience */}
                  <button
                    type="button"
                    onClick={() => setShowAdImageModal(true)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 cursor-pointer shadow-sm hover:bg-slate-50 dark:bg-slate-800/30 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2 text-white dark:text-white"/>
                    <span>{draftAd.imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                  </button>
                </div>
                <input className="input" placeholder="Call-to-Action Text" value={draftAd.ctaText} onChange={e=>setDraftAd(prev=>({...prev, ctaText:e.target.value}))}/>
                <input className="input" placeholder="Target URL" value={draftAd.targetUrl} onChange={e=>setDraftAd(prev=>({...prev, targetUrl:e.target.value}))}/>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Ad Placements</label>
                  <div className="grid grid-cols-2 grid-cols-7 gap-3">
                    {(['blog_top','blog_inline','blog_sidebar','blog_grid','blog_bottom','dashboard_sidebar','dashboard_inline'] as AdPlacement[]).map(pl => {
                      const active = draftAd.placements.includes(pl);
                      return (
                        <button
                          key={pl}
                          type="button"
                          onClick={() => {
                            const present = draftAd.placements;
                            const next = active ? present.filter(x=>x!==pl) : [...present, pl];
                            setDraftAd(prev=>({...prev, placements: next}));
                          }}
                          className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                            active
                              ? 'border-black dark:border-gray-600 bg-black/10 dark:bg-gray-700/50 text-black dark:text-white shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/30'
                          }`}
                        >
                          {pl.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Category:</span>
                    <select className="input" value={draftAd.category} onChange={e=>setDraftAd(prev=>({...prev, category: e.target.value as AdCategory}))}>
                      <option value="blog_general">Blog General</option>
                      <option value="dashboard_personalized">Dashboard Personalized</option>
                    </select>
                  </div>
                  <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" onClick={handleCreateAdvertisement}>
                    <Plus className="h-4 w-4 text-white dark:text-white"/>
                    <span>Create Ad</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filters (now close to list) */}
            <div className="card-glass p-4 rounded-xl">
              <div className="grid grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input className="input pl-10" placeholder="Search ads..." value={adSearchTerm} onChange={e=>{ setAdSearchTerm(e.target.value); setAdPage(1); }} />
                </div>
                <select className="input" value={adCategoryFilter} onChange={e=>{ setAdCategoryFilter(e.target.value); setAdPage(1); }}>
                  <option value="">All Categories</option>
                  <option value="blog_general">Blog General</option>
                  <option value="dashboard_personalized">Dashboard Personalized</option>
                </select>
                <select className="input" value={adStatusFilter} onChange={e=>{ setAdStatusFilter(e.target.value); setAdPage(1); }}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2" onClick={()=>{ setAdSearchTerm(''); setAdCategoryFilter(''); setAdStatusFilter(''); setAdPage(1); }}>
                  <Filter className="h-4 w-4"/>
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Ads Table */}
            <div className="card-glass rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Advertisements ({filteredAds.length})</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your advertising content</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Ad</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Advertiser</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Placements</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Priority</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {paginatedAds.map(ad => (
                      <tr key={ad.id} className="hover:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {ad.image_url && (
                              <img src={ad.image_url} alt={ad.title} className="w-16 h-16 object-cover rounded-lg" />
                            )}
                            <div>
                              <div className="font-medium text-slate-700 dark:text-slate-200">{ad.title}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">{ad.cta_text || 'No CTA'}</div>
                        </div>
                        </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                          {ad.advertiser || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                            {ad.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(ad.placements) ? ad.placements.map((placement: string) => (
                            <span key={placement} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
                              {placement.replace('_', ' ')}
                            </span>
                            )) : (
                              <span className="text-xs text-slate-500 dark:text-slate-400">None</span>
                            )}
                        </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-violet-100 dark:bg-violet-500/40 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                            {ad.priority || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                      <button 
                            onClick={() => handleToggleAdStatus(ad.id, ad.is_active)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              ad.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {ad.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button 
                              className="btn-outline px-2 py-1 rounded text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              onClick={() => handleEditAd(ad)}
                            >
                              <Edit className="h-4 w-4"/>
                            </button>
                            <button 
                              className="btn-outline px-2 py-1 rounded text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20" 
                              onClick={() => handleDeleteAdvertisement(ad.id)}
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                        </td>
                      </tr>
                ))}
                  </tbody>
                </table>
                
                {paginatedAds.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No advertisements found</p>
                    <p className="text-sm">Create your first ad or adjust your filters</p>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {totalAdPages > 1 && (
                <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {((safeAdPage - 1) * adsPageSize) + 1} to {Math.min(safeAdPage * adsPageSize, filteredAds.length)} of {filteredAds.length} ads
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                      disabled={safeAdPage <= 1}
                      onClick={() => setAdPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
                      Page {safeAdPage} of {totalAdPages}
                    </span>
                    <button 
                      className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                      disabled={safeAdPage >= totalAdPages}
                      onClick={() => setAdPage(p => Math.min(totalAdPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Announcements Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-medium text-slate-700 dark:text-slate-200">Announcements Management</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage announcements for paid account users</p>
                </div>
              </div>

              {/* Create New Announcement */}
              <div id="create-announcement-section" className="card-glass p-6 rounded-xl mb-6">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Create New Announcement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input className="input" placeholder="Announcement Title *" value={draftAnnouncement.title} onChange={e=>setDraftAnnouncement(prev=>({...prev, title:e.target.value}))}/>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Placement:</span>
                    <select className="input" value={draftAnnouncement.placement} onChange={e=>setDraftAnnouncement(prev=>({...prev, placement: e.target.value as 'blog_sidebar' | 'dashboard_sidebar'}))}>
                      <option value="blog_sidebar">Blog Sidebar</option>
                      <option value="dashboard_sidebar">Dashboard Sidebar</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <textarea className="input" placeholder="Announcement Message *" rows={3} value={draftAnnouncement.message} onChange={e=>setDraftAnnouncement(prev=>({...prev, message:e.target.value}))}/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Image</label>
                    {draftAnnouncement.imageUrl && (
                      <div className="mb-3 p-4 bg-green-50 dark:bg-green-500/40 rounded-lg border border-green-200 dark:border-green-500/50">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800 dark:text-white mb-2">
                              ✓ Current Image
                            </p>
                            <a
                              href={draftAnnouncement.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-700 dark:text-white hover:underline break-all"
                            >
                              {draftAnnouncement.imageUrl}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDraftAnnouncement(prev => ({ ...prev, imageUrl: '' }))}
                            className="flex-shrink-0 p-1.5 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                          <img
                            src={draftAnnouncement.imageUrl}
                            alt="Current announcement image"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              // Hide image on error instead of showing fallback
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.onerror = null; // Prevent infinite loop
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAnnouncementImageModal(true)}
                      className="btn-outline w-full flex items-center justify-center gap-2 py-2"
                    >
                      <Image className="h-4 w-4" />
                      {draftAnnouncement.imageUrl ? 'Replace Image' : 'Upload Image'}
                    </button>
                  </div>
                  <input className="input" placeholder="Action URL (optional)" value={draftAnnouncement.actionUrl} onChange={e=>setDraftAnnouncement(prev=>({...prev, actionUrl:e.target.value}))}/>
                  <input className="input" placeholder="Action Text (optional, e.g., 'Learn More')" value={draftAnnouncement.actionText} onChange={e=>setDraftAnnouncement(prev=>({...prev, actionText:e.target.value}))}/>
                  <input className="input" type="datetime-local" placeholder="Expires At (optional)" value={draftAnnouncement.expiresAt} onChange={e=>setDraftAnnouncement(prev=>({...prev, expiresAt:e.target.value}))}/>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" checked={draftAnnouncement.sendNotification} onChange={e=>setDraftAnnouncement(prev=>({...prev, sendNotification:e.target.checked}))} className="w-4 h-4"/>
                    <label className="text-sm text-slate-700 dark:text-slate-200">Send notification to all users</label>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2" onClick={handleCreateAnnouncement} disabled={!draftAnnouncement.title || !draftAnnouncement.message}>
                      <Plus className="h-4 w-4 text-white dark:text-white"/>
                      <span>Create Announcement</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="card-glass p-4 rounded-xl mb-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                    <input className="input pl-10" placeholder="Search announcements..." value={announcementSearchTerm} onChange={e=>{ setAnnouncementSearchTerm(e.target.value); setAnnouncementPage(1); }} />
                  </div>
                  <select className="input" value={announcementPlacementFilter} onChange={e=>{ setAnnouncementPlacementFilter(e.target.value); setAnnouncementPage(1); }}>
                    <option value="">All Placements</option>
                    <option value="blog_sidebar">Blog Sidebar</option>
                    <option value="dashboard_sidebar">Dashboard Sidebar</option>
                  </select>
                  <button className="btn-outline px-3 py-2 rounded-lg flex items-center gap-2" onClick={()=>{ setAnnouncementSearchTerm(''); setAnnouncementPlacementFilter(''); setAnnouncementPage(1); }}>
                    <Filter className="h-4 w-4"/>
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Announcements Table */}
              <div className="card-glass rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Announcements ({filteredAnnouncements.length})</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage announcements for paid account users</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Announcement</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Placement</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Expires</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedAnnouncements.map(ann => (
                        <tr key={ann.id} className="hover:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              {ann.image_url && (
                                <img src={ann.image_url} alt={ann.title} className="w-16 h-16 object-cover rounded-lg" />
                              )}
                              <div>
                                <div className="font-medium text-slate-700 dark:text-slate-200">{ann.title}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{ann.message}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                              {ann.placement.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                            {ann.expires_at ? new Date(ann.expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => handleToggleAnnouncementStatus(ann.id, ann.is_active)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                ann.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {ann.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button 
                                className="btn-outline px-2 py-1 rounded text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => handleEditAnnouncement(ann)}
                              >
                                <Edit className="h-4 w-4"/>
                              </button>
                              <button 
                                className="btn-outline px-2 py-1 rounded text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20" 
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                              >
                                <Trash2 className="h-4 w-4"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {paginatedAnnouncements.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No announcements found</p>
                      <p className="text-sm">Create your first announcement or adjust your filters</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {totalAnnouncementPages > 1 && (
                  <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Showing {((safeAnnouncementPage - 1) * announcementsPageSize) + 1} to {Math.min(safeAnnouncementPage * announcementsPageSize, filteredAnnouncements.length)} of {filteredAnnouncements.length} announcements
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                        disabled={safeAnnouncementPage <= 1}
                        onClick={() => setAnnouncementPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
                        Page {safeAnnouncementPage} of {totalAnnouncementPages}
                      </span>
                      <button 
                        className="btn-outline px-3 py-2 rounded-lg disabled:opacity-50"
                        disabled={safeAnnouncementPage >= totalAnnouncementPages}
                        onClick={() => setAnnouncementPage(p => Math.min(totalAnnouncementPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data-management' && (
          <div className="space-y-3 pb-8 mb-8">
            {/* AI Update Controls - Only runs when requested (pay-per-use) */}
            <div className="card-glass p-3 rounded-lg bg-gradient-to-br from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/30 dark:to-teal-950/30 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-600 dark:bg-gradient-to-br dark:from-cyan-500 dark:to-teal-500">
                    <Sparkles className="h-5 w-5 text-white !text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-slate-700 dark:text-slate-200">AI Data Update</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Update data modules with AI-powered insights (Pay-per-use)</p>
                  </div>
                </div>
                <button
                  className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAIUpdateAll}
                  disabled={bulkUpdateStatus.status === 'updating'}
                >
                  {bulkUpdateStatus.status === 'updating' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white dark:text-white" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-white dark:text-white" />
                      <span>Update All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Data Tables - Will be rendered here based on selectedDataModule */}
            {/* Note: The actual data tables are rendered after line 6339, outside this section */}
            {/* They need to be moved here or conditionally rendered when activeTab === 'data-management' */}
      </div>
      )}

      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">Add New User</h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUser({
                    email: '',
                    username: '',
                    role: '',
                    accountTier: '',
                    fullName: '',
                    companyName: '',
                    phone: '',
                    country: '',
                    city: '',
                    isAdmin: false,
                    appRoles: []
                  });
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddUser();
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Email *</label>
                  <input 
                    className="input w-full" 
                    type="email"
                    required
                    value={newUser.email} 
                    onChange={e => setNewUser(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Username</label>
                  <input 
                    className="input w-full" 
                    value={newUser.username} 
                    onChange={e => setNewUser(prev => ({...prev, username: e.target.value}))}
                    placeholder="Auto-generated from email if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Full Name</label>
                  <input 
                    className="input w-full" 
                    value={newUser.fullName} 
                    onChange={e => setNewUser(prev => ({...prev, fullName: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Role *</label>
                  <select 
                    className="input w-full" 
                    required
                    value={newUser.role} 
                    onChange={e => setNewUser(prev => ({...prev, role: e.target.value}))}
                  >
                    <option value="">Select Role</option>
                    <option value="investors_finance">Investor</option>
                    <option value="industry_executives">Executive</option>
                    <option value="health_science_experts">Researcher</option>
                    <option value="media_advisors">Media</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Account Tier</label>
                  <select 
                    className="input w-full" 
                    value={newUser.accountTier} 
                    onChange={e => setNewUser(prev => ({...prev, accountTier: e.target.value}))}
                  >
                    <option value="">Select Tier</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Company</label>
                  <input 
                    className="input w-full" 
                    value={newUser.companyName} 
                    onChange={e => setNewUser(prev => ({...prev, companyName: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Phone</label>
                  <input 
                    className="input w-full" 
                    value={newUser.phone} 
                    onChange={e => setNewUser(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={newUser.country} 
                    onChange={e => setNewUser(prev => ({...prev, country: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">City</label>
                  <input 
                    className="input w-full" 
                    value={newUser.city} 
                    onChange={e => setNewUser(prev => ({...prev, city: e.target.value}))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={newUser.isAdmin} 
                    onChange={e => setNewUser(prev => ({...prev, isAdmin: e.target.checked}))}
                  />
                  <span className="text-sm">Admin User</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUser({
                      email: '',
                      username: '',
                      role: '',
                      accountTier: '',
                      fullName: '',
                      companyName: '',
                      phone: '',
                      country: '',
                      city: '',
                      isAdmin: false,
                      appRoles: []
                    });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="h-4 w-4"/>
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {showUserEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">Edit User</h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowUserEditModal(false);
                  setEditingUser(null);
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveUser(editingUser);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">First Name</label>
                  <input 
                    className="input w-full" 
                    value={editingUser.first_name || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Last Name</label>
                  <input 
                    className="input w-full" 
                    value={editingUser.last_name || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Email</label>
                  <input 
                    className="input w-full" 
                    type="email"
                    value={editingUser.email || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Phone</label>
                  <input 
                    className="input w-full" 
                    value={editingUser.phone || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, phone: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Company</label>
                  <input 
                    className="input w-full" 
                    value={editingUser.company_name || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, company_name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingUser.country || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, country: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">City</label>
                  <input 
                    className="input w-full" 
                    value={editingUser.city || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, city: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Role</label>
                  <select 
                    className="input w-full" 
                    value={editingUser.role || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, role: e.target.value} : null)}
                  >
                    <option value="">Select Role</option>
                    <option value="investors_finance">Investor</option>
                    <option value="industry_executives">Executive</option>
                    <option value="health_science_experts">Researcher</option>
                    <option value="media_advisors">Media</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Account Tier</label>
                  <select 
                    className="input w-full" 
                    value={editingUser.account_tier || ''} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, account_tier: e.target.value} : null)}
                  >
                    <option value="">Select Tier</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Bio</label>
                <textarea 
                  className="input w-full h-24" 
                  value={editingUser.bio || ''} 
                  onChange={e => setEditingUser(prev => prev ? {...prev, bio: e.target.value} : null)}
                  placeholder="User bio..."
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={editingUser.is_verified || false} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, is_verified: e.target.checked} : null)}
                  />
                  <span className="text-sm">Verified User</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={editingUser.is_active || false} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, is_active: e.target.checked} : null)}
                  />
                  <span className="text-sm">Active User</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={editingUser.is_admin || false} 
                    onChange={e => setEditingUser(prev => prev ? {...prev, is_admin: e.target.checked} : null)}
                  />
                  <span className="text-sm">Admin User</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowUserEditModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="h-4 w-4"/>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad Edit Modal */}
      {showAdEditModal && (editingAd || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingAnnouncement ? 'Edit Announcement' : 'Edit Advertisement'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowAdEditModal(false);
                  setEditingAd(null);
                  setEditingAnnouncement(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingAd) handleSaveAd(editingAd);
              if (editingAnnouncement) handleSaveAnnouncement(editingAnnouncement);
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {editingAnnouncement ? (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Title</label>
                      <input 
                        className="input w-full" 
                        value={editingAnnouncement.title || ''} 
                        onChange={e => setEditingAnnouncement(prev => prev ? {...prev, title: e.target.value} : null)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Message</label>
                      <textarea 
                        className="input w-full min-h-[100px]" 
                        value={editingAnnouncement.message || ''} 
                        onChange={e => setEditingAnnouncement(prev => prev ? {...prev, message: e.target.value} : null)}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Image</label>
                      {/* Current Image Display */}
                      {editingAnnouncement.image_url && (
                        <div className="mb-3 p-4 bg-green-50 dark:bg-green-500/40 rounded-lg border border-green-200 dark:border-green-500/50">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-800 dark:text-white mb-2">
                                ✓ Current Image
                              </p>
                              <a
                                href={editingAnnouncement.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-700 dark:text-white hover:underline break-all"
                              >
                                {editingAnnouncement.image_url}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingAnnouncement(prev => prev ? { ...prev, image_url: '' } : null)}
                              className="flex-shrink-0 p-1.5 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                            <img
                              src={editingAnnouncement.image_url}
                              alt="Current announcement image"
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                // Use data URI as fallback
                              const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" fill="#e5e7eb"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">Image not available</text></svg>`;
                              e.currentTarget.src = `data:image/svg+xml;base64,${btoa(svg)}`;
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Upload Button */}
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementImageModal(true)}
                        className="btn-outline w-full flex items-center justify-center gap-2 py-2"
                      >
                        <Image className="h-4 w-4" />
                        {editingAnnouncement.image_url ? 'Replace Image' : 'Upload Image'}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Action URL</label>
                      <input 
                        className="input w-full" 
                        value={editingAnnouncement.action_url || ''} 
                        onChange={e => setEditingAnnouncement(prev => prev ? {...prev, action_url: e.target.value} : null)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Action Text</label>
                      <input 
                        className="input w-full" 
                        value={editingAnnouncement.action_text || ''} 
                        onChange={e => setEditingAnnouncement(prev => prev ? {...prev, action_text: e.target.value} : null)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Placement</label>
                      <select 
                        className="input w-full" 
                        value={editingAnnouncement.placement || 'blog_sidebar'} 
                        onChange={e => setEditingAnnouncement(prev => prev ? {...prev, placement: e.target.value} : null)}
                      >
                        <option value="blog_sidebar">Blog Sidebar</option>
                        <option value="dashboard_sidebar">Dashboard Sidebar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Expires At</label>
                      <input 
                        type="datetime-local"
                        className="input w-full" 
                        value={editingAnnouncement.expires_at ? new Date(editingAnnouncement.expires_at).toISOString().slice(0, 16) : ''} 
                        onChange={e => setEditingAnnouncement(prev => prev ? {...prev, expires_at: e.target.value || null} : null)}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingAnnouncement.is_active !== undefined ? editingAnnouncement.is_active : true}
                          onChange={e => setEditingAnnouncement(prev => prev ? {...prev, is_active: e.target.checked} : null)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Title</label>
                      <input 
                        className="input w-full" 
                        value={editingAd.title || ''} 
                        onChange={e => setEditingAd(prev => prev ? {...prev, title: e.target.value} : null)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Advertiser</label>
                      <input 
                        className="input w-full" 
                        value={editingAd.advertiser || ''} 
                        onChange={e => setEditingAd(prev => prev ? {...prev, advertiser: e.target.value} : null)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Image</label>
                      {/* Current Image Display */}
                      {editingAd.image_url && (
                    <div className="mb-3 p-4 bg-green-50 dark:bg-green-500/40 rounded-lg border border-green-200 dark:border-green-500/50">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 dark:text-white mb-2">
                            ✓ Current Image
                          </p>
                          <a
                            href={editingAd.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-700 dark:text-white hover:underline break-all"
                          >
                            {editingAd.image_url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingAd(prev => prev ? { ...prev, image_url: '' } : null)}
                          className="flex-shrink-0 p-1.5 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                        <img
                          src={editingAd.image_url}
                          alt="Current ad image"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            // Hide image on error instead of showing fallback
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => setShowAdImageModal(true)}
                    className="btn-outline w-full flex items-center justify-center gap-2 py-2"
                  >
                    <Image className="h-4 w-4" />
                    {editingAd.image_url ? 'Replace Image' : 'Upload Image'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">CTA Text</label>
                  <input 
                    className="input w-full" 
                    value={editingAd.cta_text || ''} 
                    onChange={e => setEditingAd(prev => prev ? {...prev, cta_text: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Target URL</label>
                  <input 
                    className="input w-full" 
                    value={editingAd.target_url || ''} 
                    onChange={e => setEditingAd(prev => prev ? {...prev, target_url: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Category</label>
                  <select 
                    className="input w-full" 
                    value={editingAd.category || ''} 
                    onChange={e => setEditingAd(prev => prev ? {...prev, category: e.target.value} : null)}
                  >
                    <option value="blog_general">Blog General</option>
                    <option value="dashboard_personalized">Dashboard Personalized</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Priority</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingAd.priority || 0} 
                    onChange={e => setEditingAd(prev => prev ? {...prev, priority: parseInt(e.target.value) || 0} : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Status</label>
                  <select 
                    className="input w-full" 
                    value={editingAd.is_active ? 'active' : 'inactive'} 
                    onChange={e => setEditingAd(prev => prev ? {...prev, is_active: e.target.value === 'active'} : null)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Placements</label>
                  <div className="grid grid-cols-2 grid-cols-7 gap-3">
                    {(['blog_top','blog_inline','blog_sidebar','blog_grid','dashboard_sidebar','dashboard_inline'] as AdPlacement[]).map(pl => (
                      <label key={pl} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:bg-slate-800/30 transition-colors cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={Array.isArray(editingAd.placements) && editingAd.placements.includes(pl)} 
                          onChange={(e)=>{
                            const currentPlacements = Array.isArray(editingAd.placements) ? editingAd.placements : [];
                            const next = e.target.checked 
                              ? [...currentPlacements, pl] 
                              : currentPlacements.filter(x => x !== pl);
                            setEditingAd(prev => prev ? {...prev, placements: next} : null);
                          }}
                          className="w-4 h-4 text-teal-600 dark:text-teal-400"
                        />
                        <span className="text-sm">{pl.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowAdEditModal(false);
                    setEditingAd(null);
                    setEditingAnnouncement(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="h-4 w-4"/>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Company Form Modal */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingCompany ? 'Edit Company' : 'Create New Company'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowCompanyForm(false);
                  setEditingCompany(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const companyData = {
                  name: editingCompany?.name || '',
                  description: editingCompany?.description || '',
                  website: editingCompany?.website || '',
                  industry: editingCompany?.industry || '',
                  sector: editingCompany?.sector || '',
                  stage: editingCompany?.stage || '',
                  founded_year: editingCompany?.founded_year ? parseInt(editingCompany.founded_year) : null,
                  employees_count: editingCompany?.employees_count ? parseInt(editingCompany.employees_count) : null,
                  headquarters: editingCompany?.headquarters || '',
                  country: editingCompany?.country || '',
                  funding_stage: editingCompany?.funding_stage || '',
                  total_funding: editingCompany?.total_funding ? parseFloat(editingCompany.total_funding) : 0,
                  last_funding_date: editingCompany?.last_funding_date || null,
                  logo_url: editingCompany?.logo_url || '',
                  is_active: editingCompany?.is_active !== undefined ? editingCompany.is_active : true,
                  investors: Array.isArray(editingCompany?.investors) ? editingCompany.investors : [],
                  products: Array.isArray(editingCompany?.products) ? editingCompany.products : [],
                  markets: Array.isArray(editingCompany?.markets) ? editingCompany.markets : [],
                  achievements: Array.isArray(editingCompany?.achievements) ? editingCompany.achievements : [],
                  partnerships: Array.isArray(editingCompany?.partnerships) ? editingCompany.partnerships : [],
                  awards: Array.isArray(editingCompany?.awards) ? editingCompany.awards : [],
                };

                const url = editingCompany?.id 
                  ? `/api/admin/companies/${editingCompany.id}`
                  : '/api/admin/companies';
                const method = editingCompany?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(companyData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingCompany?.id ? 'Company updated successfully' : 'Company created successfully',
                    variant: 'success',
                  });
                  setShowCompanyForm(false);
                  setEditingCompany(null);
                  fetchCompaniesData(companiesPage, companiesSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save company');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save company',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">Basic Information</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Company Name *</label>
                  <input 
                    className="input w-full" 
                    value={editingCompany?.name || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingCompany?.description || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Website</label>
                  <input 
                    type="url"
                    className="input w-full" 
                    value={editingCompany?.website || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, website: e.target.value} : {website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Logo</label>
                  {/* Current Logo Display */}
                  {editingCompany?.logo_url && (
                    <div className="mb-3 p-4 bg-green-50 dark:bg-green-500/40 rounded-lg border border-green-200 dark:border-green-500/50">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 dark:text-white mb-2">
                            ✓ Current Logo
                          </p>
                          <a
                            href={editingCompany.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-700 dark:text-white hover:underline break-all"
                          >
                            {editingCompany.logo_url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingCompany(prev => prev ? { ...prev, logo_url: '' } : { logo_url: '' })}
                          className="flex-shrink-0 p-1.5 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                        <img
                          src={editingCompany.logo_url}
                          alt="Current company logo"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            // Hide image on error instead of showing fallback
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => setShowCompanyLogoModal(true)}
                    className="btn-outline w-full flex items-center justify-center gap-2 py-2"
                  >
                    <Image className="h-4 w-4" />
                    {editingCompany?.logo_url ? 'Replace Logo' : 'Upload Logo'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Industry</label>
                  <input 
                    className="input w-full" 
                    value={editingCompany?.industry || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, industry: e.target.value} : {industry: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Sector</label>
                  <input 
                    className="input w-full" 
                    value={editingCompany?.sector || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, sector: e.target.value} : {sector: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Stage</label>
                  <select 
                    className="input w-full" 
                    value={editingCompany?.stage || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, stage: e.target.value} : {stage: e.target.value})}
                  >
                    <option value="">Select Stage</option>
                    <option value="idea">Idea</option>
                    <option value="mvp">MVP</option>
                    <option value="early">Early</option>
                    <option value="growth">Growth</option>
                    <option value="mature">Mature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Funding Stage</label>
                  <input 
                    className="input w-full" 
                    value={editingCompany?.funding_stage || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, funding_stage: e.target.value} : {funding_stage: e.target.value})}
                    placeholder="Seed, Series A, etc."
                  />
                </div>

                {/* Location & Details */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mt-4 mb-3">Location & Details</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingCompany?.country || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Headquarters</label>
                  <input 
                    className="input w-full" 
                    value={editingCompany?.headquarters || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, headquarters: e.target.value} : {headquarters: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Founded Year</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingCompany?.founded_year || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, founded_year: e.target.value ? parseInt(e.target.value) : null} : {founded_year: e.target.value ? parseInt(e.target.value) : null})}
                    min="1900"
                    max="2100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Employees</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingCompany?.employees_count || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, employees_count: e.target.value ? parseInt(e.target.value) : null} : {employees_count: e.target.value ? parseInt(e.target.value) : null})}
                    min="0"
                  />
                </div>

                {/* Funding Information */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mt-4 mb-3">Funding Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Total Funding ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingCompany?.total_funding || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, total_funding: e.target.value ? parseFloat(e.target.value) : 0} : {total_funding: e.target.value ? parseFloat(e.target.value) : 0})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Last Funding Date</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingCompany?.last_funding_date || ''} 
                    onChange={e => setEditingCompany(prev => prev ? {...prev, last_funding_date: e.target.value || null} : {last_funding_date: e.target.value || null})}
                  />
                </div>

                {/* JSON Array Fields */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mt-4 mb-3">Additional Information</h4>
                </div>
                
                {/* Investors Array */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Investors (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingCompany?.investors) ? editingCompany.investors.join('\n') : ''} 
                    onChange={e => {
                      const investors = e.target.value.split('\n').filter(v => v.trim());
                      setEditingCompany(prev => prev ? {...prev, investors} : {investors});
                    }}
                    placeholder="Investor 1&#10;Investor 2&#10;Investor 3"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter each investor on a new line</p>
                </div>

                {/* Products Array */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Products (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingCompany?.products) ? editingCompany.products.join('\n') : ''} 
                    onChange={e => {
                      const products = e.target.value.split('\n').filter(v => v.trim());
                      setEditingCompany(prev => prev ? {...prev, products} : {products});
                    }}
                    placeholder="Product 1&#10;Product 2"
                  />
                </div>

                {/* Markets Array */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Markets (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingCompany?.markets) ? editingCompany.markets.join('\n') : ''} 
                    onChange={e => {
                      const markets = e.target.value.split('\n').filter(v => v.trim());
                      setEditingCompany(prev => prev ? {...prev, markets} : {markets});
                    }}
                    placeholder="Market 1&#10;Market 2"
                  />
                </div>

                {/* Achievements Array */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Achievements (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingCompany?.achievements) ? editingCompany.achievements.join('\n') : ''} 
                    onChange={e => {
                      const achievements = e.target.value.split('\n').filter(v => v.trim());
                      setEditingCompany(prev => prev ? {...prev, achievements} : {achievements});
                    }}
                    placeholder="Achievement 1&#10;Achievement 2"
                  />
                </div>

                {/* Partnerships Array */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Partnerships (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingCompany?.partnerships) ? editingCompany.partnerships.join('\n') : ''} 
                    onChange={e => {
                      const partnerships = e.target.value.split('\n').filter(v => v.trim());
                      setEditingCompany(prev => prev ? {...prev, partnerships} : {partnerships});
                    }}
                    placeholder="Partnership 1&#10;Partnership 2"
                  />
                </div>

                {/* Awards Array */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Awards (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingCompany?.awards) ? editingCompany.awards.join('\n') : ''} 
                    onChange={e => {
                      const awards = e.target.value.split('\n').filter(v => v.trim());
                      setEditingCompany(prev => prev ? {...prev, awards} : {awards});
                    }}
                    placeholder="Award 1&#10;Award 2"
                  />
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2 mt-4">
                    <input 
                      type="checkbox" 
                      checked={editingCompany?.is_active !== undefined ? editingCompany.is_active : true} 
                      onChange={e => setEditingCompany(prev => prev ? {...prev, is_active: e.target.checked} : {is_active: e.target.checked})}
                      className="w-4 h-4 text-teal-600 dark:text-teal-400"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">Active Company</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowCompanyForm(false);
                    setEditingCompany(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingCompany?.id ? 'Update Company' : 'Create Company')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Trial Form Modal */}
      {showTrialForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingTrial ? 'Edit Clinical Trial' : 'Create New Clinical Trial'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowTrialForm(false);
                  setEditingTrial(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const trialData = {
                  title: editingTrial?.title || '',
                  description: editingTrial?.description || '',
                  phase: editingTrial?.phase || 'Phase I',
                  medical_condition: editingTrial?.medical_condition || '',
                  intervention: editingTrial?.intervention || '',
                  sponsor: editingTrial?.sponsor || '',
                  location: editingTrial?.location || '',
                  country: editingTrial?.country || '',
                  start_date: editingTrial?.start_date || new Date().toISOString().split('T')[0],
                  end_date: editingTrial?.end_date || null,
                  status: editingTrial?.status || 'recruiting',
                  nct_number: editingTrial?.nct_number || null,
                  indication: editingTrial?.indication || null,
                };

                const url = editingTrial?.id 
                  ? `/api/admin/clinical-trials/${editingTrial.id}`
                  : '/api/admin/clinical-trials';
                const method = editingTrial?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(trialData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingTrial?.id ? 'Clinical trial updated successfully' : 'Clinical trial created successfully',
                    variant: 'success',
                  });
                  setShowTrialForm(false);
                  setEditingTrial(null);
                  fetchTrialsData(trialsPage, trialsSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save clinical trial');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save clinical trial',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Title *</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.title || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, title: e.target.value} : {title: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingTrial?.description || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Phase *</label>
                  <select 
                    className="input w-full" 
                    value={editingTrial?.phase || 'Phase I'} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, phase: e.target.value} : {phase: e.target.value})}
                    required
                  >
                    <option value="Phase I">Phase I</option>
                    <option value="Phase II">Phase II</option>
                    <option value="Phase III">Phase III</option>
                    <option value="Phase IV">Phase IV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Status</label>
                  <select 
                    className="input w-full" 
                    value={editingTrial?.status || 'recruiting'} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, status: e.target.value} : {status: e.target.value})}
                  >
                    <option value="recruiting">Recruiting</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Medical Condition</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.medical_condition || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, medical_condition: e.target.value} : {medical_condition: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Intervention</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.intervention || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, intervention: e.target.value} : {intervention: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Sponsor</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.sponsor || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, sponsor: e.target.value} : {sponsor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Location</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.location || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, location: e.target.value} : {location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.country || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Start Date</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingTrial?.start_date || new Date().toISOString().split('T')[0]} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, start_date: e.target.value} : {start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">End Date</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingTrial?.end_date || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, end_date: e.target.value || null} : {end_date: e.target.value || null})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">NCT Number</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.nct_number || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, nct_number: e.target.value} : {nct_number: e.target.value})}
                    placeholder="NCT00000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Indication</label>
                  <input 
                    className="input w-full" 
                    value={editingTrial?.indication || ''} 
                    onChange={e => setEditingTrial(prev => prev ? {...prev, indication: e.target.value} : {indication: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowTrialForm(false);
                    setEditingTrial(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingTrial?.id ? 'Update Clinical Trial' : 'Create Clinical Trial')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regulatory Form Modal */}
      {showRegulatoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingRegulatory ? 'Edit Regulatory Record' : 'Create New Regulatory Record'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowRegulatoryForm(false);
                  setEditingRegulatory(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const regulatoryData = {
                  company_id: editingRegulatory?.company_id ? parseInt(editingRegulatory.company_id) : null,
                  regulatory_body: editingRegulatory?.regulatory_body || editingRegulatory?.regulatory_body_name || '',
                  product: editingRegulatory?.product || editingRegulatory?.approval_type || '',
                  approval_date: editingRegulatory?.approval_date || new Date().toISOString().split('T')[0],
                  status: editingRegulatory?.status || 'pending',
                  region: editingRegulatory?.region || null,
                  notes: editingRegulatory?.notes || null,
                };

                const url = editingRegulatory?.id 
                  ? `/api/admin/regulatory/${editingRegulatory.id}`
                  : '/api/admin/regulatory';
                const method = editingRegulatory?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(regulatoryData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingRegulatory?.id ? 'Regulatory record updated successfully' : 'Regulatory record created successfully',
                    variant: 'success',
                  });
                  setShowRegulatoryForm(false);
                  setEditingRegulatory(null);
                  fetchRegulatoryData(regulatoryPage, regulatorySearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save regulatory record');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save regulatory record',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Company *</label>
                  <select 
                    className="input w-full" 
                    value={editingRegulatory?.company_id || ''} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, company_id: e.target.value ? parseInt(e.target.value) : null} : {company_id: e.target.value ? parseInt(e.target.value) : null})}
                    required
                  >
                    <option value="">Select Company</option>
                    {companiesList.map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Regulatory Body *</label>
                  <input 
                    className="input w-full" 
                    value={editingRegulatory?.regulatory_body || editingRegulatory?.regulatory_body_name || ''} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, regulatory_body: e.target.value} : {regulatory_body: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Product/Approval Type *</label>
                  <input 
                    className="input w-full" 
                    value={editingRegulatory?.product || editingRegulatory?.approval_type || ''} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, product: e.target.value} : {product: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Approval Date *</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingRegulatory?.approval_date || new Date().toISOString().split('T')[0]} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, approval_date: e.target.value} : {approval_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Status</label>
                  <select 
                    className="input w-full" 
                    value={editingRegulatory?.status || 'pending'} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, status: e.target.value} : {status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Region</label>
                  <input 
                    className="input w-full" 
                    value={editingRegulatory?.region || ''} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, region: e.target.value} : {region: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Notes</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingRegulatory?.notes || ''} 
                    onChange={e => setEditingRegulatory(prev => prev ? {...prev, notes: e.target.value} : {notes: e.target.value})}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowRegulatoryForm(false);
                    setEditingRegulatory(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingRegulatory?.id ? 'Update Regulatory Record' : 'Create Regulatory Record')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regulatory Bodies Form Modal */}
      {showRegulatoryBodyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingRegulatoryBody ? 'Edit Regulatory Body' : 'Create New Regulatory Body'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowRegulatoryBodyForm(false);
                  setEditingRegulatoryBody(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const bodyData = {
                  name: editingRegulatoryBody?.name || '',
                  country: editingRegulatoryBody?.country || '',
                  abbreviation: editingRegulatoryBody?.abbreviation || '',
                  website: editingRegulatoryBody?.website || '',
                  description: editingRegulatoryBody?.description || '',
                  jurisdiction: editingRegulatoryBody?.jurisdiction || '',
                  regulatory_framework: editingRegulatoryBody?.regulatory_framework || '',
                  approval_process: editingRegulatoryBody?.approval_process || '',
                  fees_structure: editingRegulatoryBody?.fees_structure || '',
                  is_active: editingRegulatoryBody?.is_active !== undefined ? editingRegulatoryBody.is_active : true,
                };

                const url = editingRegulatoryBody?.id 
                  ? `/api/admin/regulatory-bodies/${editingRegulatoryBody.id}`
                  : '/api/admin/regulatory-bodies';
                const method = editingRegulatoryBody?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(bodyData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({ isOpen: true, title: 'Success', message: editingRegulatoryBody?.id ? 'Regulatory body updated successfully' : 'Regulatory body created successfully', variant: 'success' });
                  setShowRegulatoryBodyForm(false);
                  setEditingRegulatoryBody(null);
                  fetchRegulatoryBodiesData(regulatoryBodiesPage, regulatoryBodiesSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save regulatory body');
                }
              } catch (err: any) {
                setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to save regulatory body', variant: 'error' });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Name *</label>
                  <input 
                    className="input w-full" 
                    value={editingRegulatoryBody?.name || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country *</label>
                  <input 
                    className="input w-full" 
                    value={editingRegulatoryBody?.country || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Abbreviation</label>
                  <input 
                    className="input w-full" 
                    value={editingRegulatoryBody?.abbreviation || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, abbreviation: e.target.value} : {abbreviation: e.target.value})}
                    placeholder="e.g., NAFDAC, FDA"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Website</label>
                  <input 
                    type="url"
                    className="input w-full" 
                    value={editingRegulatoryBody?.website || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, website: e.target.value} : {website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingRegulatoryBody?.description || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                    placeholder="Description of the regulatory body"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Jurisdiction</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={editingRegulatoryBody?.jurisdiction || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, jurisdiction: e.target.value} : {jurisdiction: e.target.value})}
                    rows={3}
                    placeholder="Geographic or regulatory jurisdiction"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Regulatory Framework</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={editingRegulatoryBody?.regulatory_framework || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, regulatory_framework: e.target.value} : {regulatory_framework: e.target.value})}
                    rows={3}
                    placeholder="Regulatory framework information"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Approval Process</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={editingRegulatoryBody?.approval_process || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, approval_process: e.target.value} : {approval_process: e.target.value})}
                    rows={3}
                    placeholder="Description of the approval process"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Fees Structure</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={editingRegulatoryBody?.fees_structure || ''} 
                    onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, fees_structure: e.target.value} : {fees_structure: e.target.value})}
                    rows={3}
                    placeholder="Fee structure information"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingRegulatoryBody?.is_active !== undefined ? editingRegulatoryBody.is_active : true}
                      onChange={e => setEditingRegulatoryBody(prev => prev ? {...prev, is_active: e.target.checked} : {is_active: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowRegulatoryBodyForm(false);
                    setEditingRegulatoryBody(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingRegulatoryBody?.id ? 'Update Regulatory Body' : 'Create Regulatory Body')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Public Markets Form Modal */}
      {showStockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingStock ? 'Edit Stock' : 'Create New Stock'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowStockForm(false);
                  setEditingStock(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const stockData = {
                  company_name: editingStock?.company_name || '',
                  ticker: editingStock?.ticker || '',
                  exchange: editingStock?.exchange || '',
                  price: editingStock?.price ? parseFloat(editingStock.price) : null,
                  market_cap: editingStock?.market_cap ? parseFloat(editingStock.market_cap) : null,
                  currency: editingStock?.currency || 'USD',
                  sector: editingStock?.sector || '',
                  country: editingStock?.country || '',
                };

                const url = editingStock?.id 
                  ? `/api/admin/public-markets/${editingStock.id}`
                  : '/api/admin/public-markets';
                const method = editingStock?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(stockData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingStock?.id ? 'Stock updated successfully' : 'Stock created successfully',
                    variant: 'success',
                  });
                  setShowStockForm(false);
                  setEditingStock(null);
                  fetchPublicMarketsData(publicMarketsPage, publicMarketsSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save stock');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save stock',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Company Name *</label>
                  <input 
                    className="input w-full" 
                    value={editingStock?.company_name || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, company_name: e.target.value} : {company_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Ticker *</label>
                  <input 
                    className="input w-full" 
                    value={editingStock?.ticker || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, ticker: e.target.value} : {ticker: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Exchange</label>
                  <input 
                    className="input w-full" 
                    value={editingStock?.exchange || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, exchange: e.target.value} : {exchange: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Price ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingStock?.price || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, price: e.target.value ? parseFloat(e.target.value) : null} : {price: e.target.value ? parseFloat(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Market Cap ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingStock?.market_cap || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, market_cap: e.target.value ? parseFloat(e.target.value) : null} : {market_cap: e.target.value ? parseFloat(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Currency</label>
                  <select 
                    className="input w-full" 
                    value={editingStock?.currency || 'USD'} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, currency: e.target.value} : {currency: e.target.value})}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Sector</label>
                  <input 
                    className="input w-full" 
                    value={editingStock?.sector || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, sector: e.target.value} : {sector: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingStock?.country || ''} 
                    onChange={e => setEditingStock(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowStockForm(false);
                    setEditingStock(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingStock?.id ? 'Update Stock' : 'Create Stock')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Centers Form Modal */}
      {showCenterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingCenter ? 'Edit Clinical Center' : 'Create New Clinical Center'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowCenterForm(false);
                  setEditingCenter(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const centerData = {
                  name: editingCenter?.name || '',
                  country: editingCenter?.country || '',
                  city: editingCenter?.city || '',
                  address: editingCenter?.address || '',
                  website: editingCenter?.website || null,
                  description: editingCenter?.description || '',
                  capacity_patients: editingCenter?.capacity_patients ? parseInt(editingCenter.capacity_patients) : null,
                  established_year: editingCenter?.established_year ? parseInt(editingCenter.established_year) : null,
                  is_active: editingCenter?.is_active !== undefined ? editingCenter.is_active : true,
                };

                const url = editingCenter?.id 
                  ? `/api/admin/clinical-centers/${editingCenter.id}`
                  : '/api/admin/clinical-centers';
                const method = editingCenter?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(centerData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingCenter?.id ? 'Clinical center updated successfully' : 'Clinical center created successfully',
                    variant: 'success',
                  });
                  setShowCenterForm(false);
                  setEditingCenter(null);
                  fetchClinicalCentersData(clinicalCentersPage, clinicalCentersSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save clinical center');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save clinical center',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Name *</label>
                  <input 
                    className="input w-full" 
                    value={editingCenter?.name || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingCenter?.country || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">City</label>
                  <input 
                    className="input w-full" 
                    value={editingCenter?.city || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, city: e.target.value} : {city: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Address</label>
                  <input 
                    className="input w-full" 
                    value={editingCenter?.address || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, address: e.target.value} : {address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Website</label>
                  <input 
                    type="url"
                    className="input w-full" 
                    value={editingCenter?.website || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, website: e.target.value} : {website: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Capacity (Patients)</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingCenter?.capacity_patients || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, capacity_patients: e.target.value ? parseInt(e.target.value) : null} : {capacity_patients: e.target.value ? parseInt(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Established Year</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingCenter?.established_year || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, established_year: e.target.value ? parseInt(e.target.value) : null} : {established_year: e.target.value ? parseInt(e.target.value) : null})}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingCenter?.description || ''} 
                    onChange={e => setEditingCenter(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingCenter?.is_active !== undefined ? editingCenter.is_active : true}
                      onChange={e => setEditingCenter(prev => prev ? {...prev, is_active: e.target.checked} : {is_active: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowCenterForm(false);
                    setEditingCenter(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingCenter?.id ? 'Update Clinical Center' : 'Create Clinical Center')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Investigators Form Modal */}
      {showInvestigatorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingInvestigator ? 'Edit Investigator' : 'Create New Investigator'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowInvestigatorForm(false);
                  setEditingInvestigator(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const investigatorData = {
                  name: editingInvestigator?.name || (editingInvestigator?.first_name && editingInvestigator?.last_name ? `${editingInvestigator.first_name} ${editingInvestigator.last_name}` : ''),
                  first_name: editingInvestigator?.first_name || null,
                  last_name: editingInvestigator?.last_name || null,
                  title: editingInvestigator?.title || '',
                  specialization: editingInvestigator?.specialization || editingInvestigator?.specialties || '',
                  affiliation: editingInvestigator?.affiliation || '',
                  email: editingInvestigator?.email || null,
                  phone: editingInvestigator?.phone || null,
                  country: editingInvestigator?.country || '',
                  city: editingInvestigator?.city || '',
                };

                const url = editingInvestigator?.id 
                  ? `/api/admin/investigators/${editingInvestigator.id}`
                  : '/api/admin/investigators';
                const method = editingInvestigator?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(investigatorData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingInvestigator?.id ? 'Investigator updated successfully' : 'Investigator created successfully',
                    variant: 'success',
                  });
                  setShowInvestigatorForm(false);
                  setEditingInvestigator(null);
                  fetchInvestigatorsData(investigatorsPage, investigatorsSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save investigator');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save investigator',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {(editingInvestigator?.first_name !== undefined || editingInvestigator?.name === undefined) ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">First Name</label>
                      <input 
                        className="input w-full" 
                        value={editingInvestigator?.first_name || ''} 
                        onChange={e => setEditingInvestigator(prev => prev ? {...prev, first_name: e.target.value} : {first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Last Name</label>
                      <input 
                        className="input w-full" 
                        value={editingInvestigator?.last_name || ''} 
                        onChange={e => setEditingInvestigator(prev => prev ? {...prev, last_name: e.target.value} : {last_name: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Name *</label>
                    <input 
                      className="input w-full" 
                      value={editingInvestigator?.name || ''} 
                      onChange={e => setEditingInvestigator(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value})}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Title</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestigator?.title || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, title: e.target.value} : {title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Specialization</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestigator?.specialization || editingInvestigator?.specialties || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, specialization: e.target.value} : {specialization: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Affiliation</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestigator?.affiliation || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, affiliation: e.target.value} : {affiliation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Email</label>
                  <input 
                    type="email"
                    className="input w-full" 
                    value={editingInvestigator?.email || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, email: e.target.value} : {email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Phone</label>
                  <input 
                    type="tel"
                    className="input w-full" 
                    value={editingInvestigator?.phone || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, phone: e.target.value} : {phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestigator?.country || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">City</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestigator?.city || ''} 
                    onChange={e => setEditingInvestigator(prev => prev ? {...prev, city: e.target.value} : {city: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowInvestigatorForm(false);
                    setEditingInvestigator(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingInvestigator?.id ? 'Update Investigator' : 'Create Investigator')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <NewsletterComposer
        isOpen={showNewsletterComposer}
        onClose={() => {
          setShowNewsletterComposer(false);
          setEditingCampaign(null);
        }}
        onSave={handleCampaignSaved}
        onSend={handleCampaignSaved}
        campaign={editingCampaign}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
      
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
      
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
        defaultValue={promptModal.defaultValue}
        type={promptModal.type}
      />

      {/* Deal Form Modal */}
      {showDealForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowDealForm(false);
                  setEditingDeal(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const dealData = {
                  company_id: editingDeal?.company_id ? parseInt(editingDeal.company_id) : null,
                  deal_type: editingDeal?.deal_type || '',
                  amount: editingDeal?.amount ? parseFloat(editingDeal.amount) : 0,
                  valuation: editingDeal?.valuation ? parseFloat(editingDeal.valuation) : null,
                  lead_investor: editingDeal?.lead_investor || '',
                  participants: Array.isArray(editingDeal?.participants) ? editingDeal.participants : 
                               (editingDeal?.participants ? editingDeal.participants.split(',').map((p: string) => p.trim()).filter(Boolean) : []),
                  deal_date: editingDeal?.deal_date || new Date().toISOString().split('T')[0],
                  status: editingDeal?.status || 'closed',
                  description: editingDeal?.description || '',
                  sector: editingDeal?.sector || '',
                };

                const url = editingDeal?.id 
                  ? `/api/admin/deals/${editingDeal.id}`
                  : '/api/admin/deals';
                const method = editingDeal?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(dealData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingDeal?.id ? 'Deal updated successfully' : 'Deal created successfully',
                    variant: 'success',
                  });
                  setShowDealForm(false);
                  setEditingDeal(null);
                  fetchDealsData(dealsPage, dealsSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save deal');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save deal',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Company *</label>
                  <select 
                    className="input w-full" 
                    value={editingDeal?.company_id || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, company_id: e.target.value ? parseInt(e.target.value) : null} : {company_id: e.target.value ? parseInt(e.target.value) : null})}
                    required
                  >
                    <option value="">Select Company</option>
                    {companiesList.map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Deal Type *</label>
                  <select 
                    className="input w-full" 
                    value={editingDeal?.deal_type || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, deal_type: e.target.value} : {deal_type: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="pre-seed">Pre-Seed</option>
                    <option value="seed">Seed</option>
                    <option value="series_a">Series A</option>
                    <option value="series_b">Series B</option>
                    <option value="series_c">Series C</option>
                    <option value="series_d">Series D</option>
                    <option value="grant">Grant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Status</label>
                  <select 
                    className="input w-full" 
                    value={editingDeal?.status || 'closed'} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, status: e.target.value} : {status: e.target.value})}
                  >
                    <option value="closed">Closed</option>
                    <option value="pending">Pending</option>
                    <option value="announced">Announced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Amount ($) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingDeal?.amount || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, amount: e.target.value ? parseFloat(e.target.value) : 0} : {amount: e.target.value ? parseFloat(e.target.value) : 0})}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Valuation ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingDeal?.valuation || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, valuation: e.target.value ? parseFloat(e.target.value) : null} : {valuation: e.target.value ? parseFloat(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Deal Date *</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingDeal?.deal_date || new Date().toISOString().split('T')[0]} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, deal_date: e.target.value} : {deal_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Lead Investor</label>
                  <input 
                    className="input w-full" 
                    value={editingDeal?.lead_investor || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, lead_investor: e.target.value} : {lead_investor: e.target.value})}
                    placeholder="Investor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Sector</label>
                  <input 
                    className="input w-full" 
                    value={editingDeal?.sector || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, sector: e.target.value} : {sector: e.target.value})}
                    placeholder="e.g., Telemedicine, AI Health"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Participants (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingDeal?.participants) ? editingDeal.participants.join('\n') : 
                           (editingDeal?.participants && typeof editingDeal.participants === 'string' ? editingDeal.participants : '')} 
                    onChange={e => {
                      const participants = e.target.value.split('\n').filter(v => v.trim());
                      setEditingDeal(prev => prev ? {...prev, participants} : {participants});
                    }}
                    placeholder="Investor 1&#10;Investor 2&#10;Investor 3"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter each participant investor on a new line</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingDeal?.description || ''} 
                    onChange={e => setEditingDeal(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                    placeholder="Deal description or notes"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowDealForm(false);
                    setEditingDeal(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingDeal?.id ? 'Update Deal' : 'Create Deal')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Form Modal */}
      {showGrantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingGrant ? 'Edit Grant' : 'Create New Grant'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowGrantForm(false);
                  setEditingGrant(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const grantData = {
                  title: editingGrant?.title || '',
                  description: editingGrant?.description || '',
                  funding_agency: editingGrant?.funding_agency || '',
                  amount: editingGrant?.amount ? parseFloat(editingGrant.amount) : 0,
                  grant_type: editingGrant?.grant_type || '',
                  application_deadline: editingGrant?.application_deadline || null,
                  award_date: editingGrant?.award_date || null,
                  status: editingGrant?.status || 'open',
                  requirements: editingGrant?.requirements || '',
                  contact_email: editingGrant?.contact_email || '',
                  website: editingGrant?.website || '',
                  country: editingGrant?.country || '',
                  sector: editingGrant?.sector || '',
                  duration: editingGrant?.duration || '',
                  funders: Array.isArray(editingGrant?.funders) ? editingGrant.funders : 
                          (editingGrant?.funders && typeof editingGrant.funders === 'string' ? editingGrant.funders.split(',').map((f: string) => f.trim()).filter(Boolean) : []),
                };

                const url = editingGrant?.id 
                  ? `/api/admin/grants/${editingGrant.id}`
                  : '/api/admin/grants';
                const method = editingGrant?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(grantData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingGrant?.id ? 'Grant updated successfully' : 'Grant created successfully',
                    variant: 'success',
                  });
                  setShowGrantForm(false);
                  setEditingGrant(null);
                  fetchGrantsData(grantsPage, grantsSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save grant');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save grant',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Title *</label>
                  <input 
                    className="input w-full" 
                    value={editingGrant?.title || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, title: e.target.value} : {title: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingGrant?.description || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Funding Agency *</label>
                  <input 
                    className="input w-full" 
                    value={editingGrant?.funding_agency || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, funding_agency: e.target.value} : {funding_agency: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Amount ($) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingGrant?.amount || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, amount: e.target.value ? parseFloat(e.target.value) : 0} : {amount: e.target.value ? parseFloat(e.target.value) : 0})}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Grant Type</label>
                  <input 
                    className="input w-full" 
                    value={editingGrant?.grant_type || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, grant_type: e.target.value} : {grant_type: e.target.value})}
                    placeholder="e.g., Research, Innovation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Status</label>
                  <select 
                    className="input w-full" 
                    value={editingGrant?.status || 'open'} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, status: e.target.value} : {status: e.target.value})}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Application Deadline</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingGrant?.application_deadline || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, application_deadline: e.target.value || null} : {application_deadline: e.target.value || null})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Award Date</label>
                  <input 
                    type="date"
                    className="input w-full" 
                    value={editingGrant?.award_date || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, award_date: e.target.value || null} : {award_date: e.target.value || null})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Country</label>
                  <input 
                    className="input w-full" 
                    value={editingGrant?.country || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, country: e.target.value} : {country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Sector</label>
                  <input 
                    className="input w-full" 
                    value={editingGrant?.sector || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, sector: e.target.value} : {sector: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Duration</label>
                  <input 
                    className="input w-full" 
                    value={editingGrant?.duration || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, duration: e.target.value} : {duration: e.target.value})}
                    placeholder="e.g., 12 months"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Contact Email</label>
                  <input 
                    type="email"
                    className="input w-full" 
                    value={editingGrant?.contact_email || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, contact_email: e.target.value} : {contact_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Website</label>
                  <input 
                    type="url"
                    className="input w-full" 
                    value={editingGrant?.website || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, website: e.target.value} : {website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Funders (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingGrant?.funders) ? editingGrant.funders.join('\n') : 
                           (editingGrant?.funders && typeof editingGrant.funders === 'string' ? editingGrant.funders : '')} 
                    onChange={e => {
                      const funders = e.target.value.split('\n').filter(v => v.trim());
                      setEditingGrant(prev => prev ? {...prev, funders} : {funders});
                    }}
                    placeholder="Funder 1&#10;Funder 2&#10;Funder 3"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter each funder on a new line</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Requirements</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingGrant?.requirements || ''} 
                    onChange={e => setEditingGrant(prev => prev ? {...prev, requirements: e.target.value} : {requirements: e.target.value})}
                    rows={4}
                    placeholder="Grant requirements and eligibility criteria"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowGrantForm(false);
                    setEditingGrant(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingGrant?.id ? 'Update Grant' : 'Create Grant')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Tables - Only show when Data Management tab is active */}
      {activeTab === 'data-management' && (
        <>
      {/* Companies Module */}
      {selectedDataModule === 'companies' && (
        <div className="space-y-4 pb-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Companies</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Explore African healthcare companies and their funding history</p>
            </div>
            <button 
              onClick={() => { setEditingCompany(null); setShowCompanyForm(true); }} 
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <Plus className="h-5 w-5 relative z-10" />
              <span className="relative z-10">Add Company</span>
            </button>
          </div>

          {/* Stats Bar */}
          {companiesData && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card-glass p-3 rounded-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200/50 dark:border-teal-800/50">
          <div className="flex items-center justify-between">
            <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</p>
                    <p className="text-xl font-medium text-slate-800 dark:text-slate-100 mt-1">{companiesData.pagination?.total || 0}</p>
            </div>
                  <Building2 className="h-8 w-8 text-teal-600 dark:text-teal-400 opacity-60" />
                </div>
              </div>
              <div className="card-glass p-3 rounded-xl bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Showing</p>
                    <p className="text-xl font-medium text-slate-800 dark:text-slate-100 mt-1">{companiesData.companies?.length || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-600 dark:text-emerald-400 opacity-60" />
                </div>
              </div>
              <div className="card-glass p-3 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Page</p>
                    <p className="text-xl font-medium text-slate-800 dark:text-slate-100 mt-1">{companiesData.pagination?.page || 1}</p>
                  </div>
                  <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400 opacity-60" />
                </div>
              </div>
              <div className="card-glass p-3 rounded-xl bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Industries</p>
                    <p className="text-xl font-medium text-slate-800 dark:text-slate-100 mt-1">
                      {new Set(companiesData.companies?.map((c: any) => c.industry).filter(Boolean)).size || 0}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-indigo-600 dark:text-indigo-400 opacity-60" />
                </div>
              </div>
            </div>
          )}

          {/* Loading/Error States */}
          {loading ? (
            <div className="card-glass p-12 rounded-2xl text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-500/20 mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-base font-medium text-slate-700 dark:text-slate-200">Loading companies...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please wait while we fetch the data</p>
            </div>
          ) : error ? (
            <div className="card-glass p-12 rounded-2xl text-center bg-red-50 dark:bg-red-500/40 border-2 border-red-200 dark:border-red-500/50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-base font-medium text-red-700 dark:text-red-300">Error Loading Companies</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
          ) : (
            <>
              {/* Companies Grid - Modern Card Design */}
              {companiesData?.companies && companiesData.companies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {companiesData.companies.map((company: any) => (
                    <div 
                      key={company.id} 
                      className="group relative card-glass p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-teal-300 dark:hover:border-teal-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 bg-gradient-to-br from-white/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50"
                    >
                      {/* Hover Gradient Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-teal-500/5 group-hover:via-cyan-500/5 group-hover:to-teal-500/5 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                      
                      <div className="relative">
                        {/* Logo Section */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {company.logo_url ? (
                              <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md group-hover:shadow-lg transition-shadow">
                                <img 
                                  src={company.logo_url} 
                                  alt={company.name || 'Company logo'} 
                                  className="w-full h-full object-contain p-1.5"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-600 to-cyan-600 text-white text-lg font-medium';
                                      fallback.textContent = (company.name || 'C').charAt(0).toUpperCase();
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center text-white text-lg font-medium shadow-md group-hover:shadow-lg transition-shadow">
                                {(company.name || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-lg text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                {company.name || 'N/A'}
                              </h3>
                              {company.industry && (
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                                  {company.industry}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Company Details */}
                        <div className="space-y-2.5 mb-4">
                          {company.country && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Globe className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              <span>{company.country}</span>
                            </div>
                          )}
                          {company.total_funding && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-medium text-slate-800 dark:text-slate-100">
                                ${(parseFloat(company.total_funding) / 1000000).toFixed(1)}M
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">funding</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <button 
                            onClick={() => { setEditingCompany(company); setShowCompanyForm(true); }} 
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 font-medium text-sm transition-all duration-200 hover:scale-105" 
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Company', message: `Are you sure you want to delete ${company.name}?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/companies/${company.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Company deleted successfully', variant: 'success' }); fetchCompaniesData(companiesPage, companiesSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete company', variant: 'error' }); } } })} 
                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-105" 
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
            </button>
          </div>
              </div>
            </div>
                  ))}
                </div>
              ) : (
                <div className="card-glass p-12 rounded-2xl text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Building2 className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">No companies found</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Get started by adding your first company</p>
                  <button 
                    onClick={() => { setEditingCompany(null); setShowCompanyForm(true); }} 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Your First Company</span>
                  </button>
                </div>
              )}

              {/* Pagination - Modern Design */}
              {companiesData?.pagination && (
                <div className="card-glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Page <span className="font-medium text-teal-600 dark:text-teal-400">{companiesData.pagination.page}</span> of{' '}
                      <span className="font-medium">{Math.ceil(companiesData.pagination.total / 20)}</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({companiesData.pagination.total} total)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCompaniesPage(p => Math.max(1, p - 1))} 
                      disabled={companiesPage === 1} 
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCompaniesPage(p => p + 1)} 
                      disabled={!companiesData.pagination.has_more} 
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium text-sm shadow-md shadow-teal-500/30 hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Deals Module */}
      {selectedDataModule === 'deals' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Deals</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Track M&A, licensing, and funding deal activity across African healthcare</p>
            </div>
            <button 
              onClick={() => { setEditingDeal(null); setShowDealForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Deal</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Deal Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dealsData?.deals && dealsData.deals.length > 0 ? (
                    dealsData.deals.map((deal: any) => (
                      <tr key={deal.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{deal.company_name || 'N/A'}</td>
                        <td className="px-4 py-3">{deal.deal_type || 'N/A'}</td>
                        <td className="px-4 py-3">{deal.amount ? `$${(parseFloat(deal.amount) / 1000000).toFixed(1)}M` : 'N/A'}</td>
                        <td className="px-4 py-3">{deal.deal_date ? new Date(deal.deal_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingDeal(deal); setShowDealForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Deal', message: `Are you sure you want to delete this deal?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/deals/${deal.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Deal deleted successfully', variant: 'success' }); fetchDealsData(dealsPage, dealsSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete deal', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No deals found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {dealsData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {dealsData.pagination.page} of {Math.ceil(dealsData.pagination.total / 20)}</span>
              <div className="flex gap-2">
                <button onClick={() => setDealsPage(p => Math.max(1, p - 1))} disabled={dealsPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setDealsPage(p => p + 1)} disabled={!dealsData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grants Module */}
      {selectedDataModule === 'grants' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Grants</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Monitor grants and funding opportunities from global health organizations</p>
            </div>
            <button 
              onClick={() => { setEditingGrant(null); setShowGrantForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Grant</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Deadline</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grantsData?.grants && grantsData.grants.length > 0 ? (
                    grantsData.grants.map((grant: any) => (
                      <tr key={grant.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{grant.title || 'N/A'}</td>
                        <td className="px-4 py-3">{grant.amount ? `$${(parseFloat(grant.amount) / 1000000).toFixed(1)}M` : 'N/A'}</td>
                        <td className="px-4 py-3">{grant.country || 'N/A'}</td>
                        <td className="px-4 py-3">{grant.application_deadline ? new Date(grant.application_deadline).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingGrant(grant); setShowGrantForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Grant', message: `Are you sure you want to delete ${grant.title}?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/grants/${grant.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Grant deleted successfully', variant: 'success' }); fetchGrantsData(grantsPage, grantsSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete grant', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No grants found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {grantsData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {grantsData.pagination.page} of {Math.ceil(grantsData.pagination.total / 20)}</span>
              <div className="flex gap-2">
                <button onClick={() => setGrantsPage(p => Math.max(1, p - 1))} disabled={grantsPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setGrantsPage(p => p + 1)} disabled={!grantsData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Investors Module UI - will be added after testing*/}
      {selectedDataModule === 'investors' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Investors</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Explore investor profiles and their activity in African healthcare</p>
            </div>
            <button 
              onClick={() => { setEditingInvestor(null); setShowInvestorForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Investor</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Headquarters</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Total Investments</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investorsData?.investors && investorsData.investors.length > 0 ? (
                    investorsData.investors.map((investor: any) => (
                      <tr key={investor.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{investor.name || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.type || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.headquarters || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.total_investments || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingInvestor(investor); setShowInvestorForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Investor', message: `Are you sure you want to delete ${investor.name}?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/investors/${investor.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Investor deleted successfully', variant: 'success' }); fetchInvestorsData(investorsPage, investorsSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete investor', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No investors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {investorsData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {investorsData.pagination.page} of {Math.ceil(investorsData.pagination.total / investorsPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setInvestorsPage(p => Math.max(1, p - 1))} disabled={investorsPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setInvestorsPage(p => p + 1)} disabled={!investorsData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Investor Form Modal */}
      {showInvestorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                {editingInvestor ? 'Edit Investor' : 'Create New Investor'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setShowInvestorForm(false);
                  setEditingInvestor(null);
                }}
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                const token = localStorage.getItem('medarionAuthToken') || 'test-token';
                const investorData = {
                  name: editingInvestor?.name || '',
                  logo: editingInvestor?.logo || null,
                  description: editingInvestor?.description || '',
                  type: editingInvestor?.type || 'VC',
                  headquarters: editingInvestor?.headquarters || '',
                  founded: editingInvestor?.founded || null,
                  assets_under_management: editingInvestor?.assets_under_management ? parseFloat(editingInvestor.assets_under_management) : null,
                  website: editingInvestor?.website || null,
                  total_investments: editingInvestor?.total_investments ? parseInt(editingInvestor.total_investments) : 0,
                  average_investment: editingInvestor?.average_investment ? parseFloat(editingInvestor.average_investment) : null,
                  team_size: editingInvestor?.team_size ? parseInt(editingInvestor.team_size) : null,
                  contact_email: editingInvestor?.contact_email || null,
                  focus_sectors: Array.isArray(editingInvestor?.focus_sectors) ? editingInvestor.focus_sectors : 
                                (editingInvestor?.focus_sectors ? editingInvestor.focus_sectors.split('\n').map((s: string) => s.trim()).filter(Boolean) : []),
                  investment_stages: Array.isArray(editingInvestor?.investment_stages) ? editingInvestor.investment_stages : 
                                   (editingInvestor?.investment_stages ? editingInvestor.investment_stages.split('\n').map((s: string) => s.trim()).filter(Boolean) : []),
                  countries: Array.isArray(editingInvestor?.countries) ? editingInvestor.countries : 
                            (editingInvestor?.countries ? editingInvestor.countries.split('\n').map((c: string) => c.trim()).filter(Boolean) : []),
                  is_active: editingInvestor?.is_active !== undefined ? editingInvestor.is_active : true,
                };

                const url = editingInvestor?.id 
                  ? `/api/admin/investors/${editingInvestor.id}`
                  : '/api/admin/investors';
                const method = editingInvestor?.id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(investorData),
                });

                const data = await response.json();
                if (data.success) {
                  setAlertModal({
                    isOpen: true,
                    title: 'Success',
                    message: editingInvestor?.id ? 'Investor updated successfully' : 'Investor created successfully',
                    variant: 'success',
                  });
                  setShowInvestorForm(false);
                  setEditingInvestor(null);
                  fetchInvestorsData(investorsPage, investorsSearch || undefined);
                } else {
                  throw new Error(data.error || 'Failed to save investor');
                }
              } catch (err: any) {
                setAlertModal({
                  isOpen: true,
                  title: 'Error',
                  message: err?.message || 'Failed to save investor',
                  variant: 'error',
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Name *</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestor?.name || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, name: e.target.value} : {name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Type *</label>
                  <select 
                    className="input w-full" 
                    value={editingInvestor?.type || 'VC'} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, type: e.target.value} : {type: e.target.value})}
                    required
                  >
                    <option value="VC">VC</option>
                    <option value="Private Equity (PE)">Private Equity (PE)</option>
                    <option value="Foundation/Fund">Foundation/Fund</option>
                    <option value="Impact & ESG Investors">Impact & ESG Investors</option>
                    <option value="Institutional Investors">Institutional Investors</option>
                    <option value="Strategic & Corporate Investors">Strategic & Corporate Investors</option>
                    <option value="Angel & Family Office Investors">Angel & Family Office Investors</option>
                    <option value="Public Market Investors">Public Market Investors</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Headquarters</label>
                  <input 
                    className="input w-full" 
                    value={editingInvestor?.headquarters || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, headquarters: e.target.value} : {headquarters: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Founded Year</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingInvestor?.founded || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, founded: e.target.value ? parseInt(e.target.value) : null} : {founded: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="YYYY"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Assets Under Management ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingInvestor?.assets_under_management || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, assets_under_management: e.target.value ? parseFloat(e.target.value) : null} : {assets_under_management: e.target.value ? parseFloat(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Total Investments</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingInvestor?.total_investments || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, total_investments: e.target.value ? parseInt(e.target.value) : 0} : {total_investments: e.target.value ? parseInt(e.target.value) : 0})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Average Investment ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="input w-full" 
                    value={editingInvestor?.average_investment || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, average_investment: e.target.value ? parseFloat(e.target.value) : null} : {average_investment: e.target.value ? parseFloat(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Team Size</label>
                  <input 
                    type="number"
                    className="input w-full" 
                    value={editingInvestor?.team_size || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, team_size: e.target.value ? parseInt(e.target.value) : null} : {team_size: e.target.value ? parseInt(e.target.value) : null})}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Website</label>
                  <input 
                    type="url"
                    className="input w-full" 
                    value={editingInvestor?.website || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, website: e.target.value} : {website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Contact Email</label>
                  <input 
                    type="email"
                    className="input w-full" 
                    value={editingInvestor?.contact_email || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, contact_email: e.target.value} : {contact_email: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Logo</label>
                  {/* Current Logo Display */}
                  {editingInvestor?.logo && (
                    <div className="mb-3 p-4 bg-green-50 dark:bg-green-500/40 rounded-lg border border-green-200 dark:border-green-500/50">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 dark:text-white mb-2">
                            ✓ Current Logo
                          </p>
                          <a
                            href={editingInvestor.logo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-700 dark:text-white hover:underline break-all"
                          >
                            {editingInvestor.logo}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingInvestor(prev => prev ? { ...prev, logo: '' } : { logo: '' })}
                          className="flex-shrink-0 p-1.5 text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                        <img
                          src={editingInvestor.logo}
                          alt="Current investor logo"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            // Hide image on error instead of showing fallback
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => setShowInvestorLogoModal(true)}
                    className="btn-outline w-full flex items-center justify-center gap-2 py-2"
                  >
                    <Image className="h-4 w-4" />
                    {editingInvestor?.logo ? 'Replace Logo' : 'Upload Logo'}
                  </button>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Description</label>
                  <textarea 
                    className="input w-full min-h-[100px]" 
                    value={editingInvestor?.description || ''} 
                    onChange={e => setEditingInvestor(prev => prev ? {...prev, description: e.target.value} : {description: e.target.value})}
                    rows={4}
                    placeholder="Investor description"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Focus Sectors (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingInvestor?.focus_sectors) ? editingInvestor.focus_sectors.join('\n') : 
                           (editingInvestor?.focus_sectors && typeof editingInvestor.focus_sectors === 'string' ? editingInvestor.focus_sectors : '')} 
                    onChange={e => {
                      const sectors = e.target.value.split('\n').filter(v => v.trim());
                      setEditingInvestor(prev => prev ? {...prev, focus_sectors: sectors} : {focus_sectors: sectors});
                    }}
                    placeholder="Sector 1&#10;Sector 2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Investment Stages (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingInvestor?.investment_stages) ? editingInvestor.investment_stages.join('\n') : 
                           (editingInvestor?.investment_stages && typeof editingInvestor.investment_stages === 'string' ? editingInvestor.investment_stages : '')} 
                    onChange={e => {
                      const stages = e.target.value.split('\n').filter(v => v.trim());
                      setEditingInvestor(prev => prev ? {...prev, investment_stages: stages} : {investment_stages: stages});
                    }}
                    placeholder="Seed&#10;Series A&#10;Series B"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Countries (one per line)</label>
                  <textarea 
                    className="input w-full min-h-[80px]" 
                    value={Array.isArray(editingInvestor?.countries) ? editingInvestor.countries.join('\n') : 
                           (editingInvestor?.countries && typeof editingInvestor.countries === 'string' ? editingInvestor.countries : '')} 
                    onChange={e => {
                      const countries = e.target.value.split('\n').filter(v => v.trim());
                      setEditingInvestor(prev => prev ? {...prev, countries} : {countries});
                    }}
                    placeholder="Country 1&#10;Country 2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingInvestor?.is_active !== undefined ? editingInvestor.is_active : true}
                      onChange={e => setEditingInvestor(prev => prev ? {...prev, is_active: e.target.checked} : {is_active: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  className="btn-outline px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowInvestorForm(false);
                    setEditingInvestor(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4"/>
                  <span>{loading ? 'Saving...' : (editingInvestor?.id ? 'Update Investor' : 'Create Investor')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Trials Module */}
      {selectedDataModule === 'clinical-trials' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Clinical Trials</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Track clinical research and trials data across African healthcare</p>
            </div>
            <button 
              onClick={() => { setEditingTrial(null); setShowTrialForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Clinical Trial</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Sponsor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trialsData?.trials && trialsData.trials.length > 0 ? (
                    trialsData.trials.map((trial: any) => (
                      <tr key={trial.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{trial.title || 'N/A'}</td>
                        <td className="px-4 py-3">{trial.phase || 'N/A'}</td>
                        <td className="px-4 py-3">{trial.status || 'N/A'}</td>
                        <td className="px-4 py-3">{trial.sponsor || 'N/A'}</td>
                        <td className="px-4 py-3">{trial.location || trial.country || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingTrial(trial); setShowTrialForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Clinical Trial', message: `Are you sure you want to delete "${trial.title}"?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/clinical-trials/${trial.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Clinical trial deleted successfully', variant: 'success' }); fetchTrialsData(trialsPage, trialsSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete clinical trial', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No clinical trials found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {trialsData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {trialsData.pagination.page} of {Math.ceil(trialsData.pagination.total / trialsPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setTrialsPage(p => Math.max(1, p - 1))} disabled={trialsPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setTrialsPage(p => p + 1)} disabled={!trialsData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Regulatory Module */}
      {selectedDataModule === 'regulatory' && (
        <div className="space-y-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-medium text-slate-700 dark:text-slate-200">Regulatory Management</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all regulatory approvals in the platform</p>
            </div>
            <button 
              onClick={() => { setEditingRegulatory(null); setShowRegulatoryForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Regulatory Record</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Product/Approval</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Regulatory Body</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regulatoryData?.regulatory && regulatoryData.regulatory.length > 0 ? (
                    regulatoryData.regulatory.map((reg: any) => (
                      <tr key={reg.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{reg.company_name || 'N/A'}</td>
                        <td className="px-4 py-3">{reg.product || reg.approval_type || 'N/A'}</td>
                        <td className="px-4 py-3">{reg.regulatory_body_name || reg.regulatory_body || 'N/A'}</td>
                        <td className="px-4 py-3">{reg.status || 'N/A'}</td>
                        <td className="px-4 py-3">{reg.approval_date || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingRegulatory(reg); setShowRegulatoryForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Regulatory Record', message: `Are you sure you want to delete this regulatory record?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/regulatory/${reg.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Regulatory record deleted successfully', variant: 'success' }); fetchRegulatoryData(regulatoryPage, regulatorySearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete regulatory record', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No regulatory records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {regulatoryData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {regulatoryData.pagination.page} of {Math.ceil(regulatoryData.pagination.total / regulatoryPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setRegulatoryPage(p => Math.max(1, p - 1))} disabled={regulatoryPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setRegulatoryPage(p => p + 1)} disabled={!regulatoryData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regulatory Ecosystem Module */}
      {selectedDataModule === 'regulatory-ecosystem' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Regulatory Ecosystem</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Explore regulatory bodies and compliance across African healthcare markets</p>
            </div>
            <button 
              onClick={() => { setEditingRegulatoryBody(null); setShowRegulatoryBodyForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Regulatory Body</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Abbreviation</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Website</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regulatoryBodiesData?.bodies && regulatoryBodiesData.bodies.length > 0 ? (
                    regulatoryBodiesData.bodies.map((body: any) => (
                      <tr key={body.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{body.name || 'N/A'}</td>
                        <td className="px-4 py-3">{body.country || 'N/A'}</td>
                        <td className="px-4 py-3">{body.abbreviation || 'N/A'}</td>
                        <td className="px-4 py-3">
                          {body.website ? (
                            <a href={body.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-white hover:underline">
                              {body.website.length > 30 ? body.website.substring(0, 30) + '...' : body.website}
                            </a>
                          ) : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${body.is_active ? 'bg-emerald-100 dark:bg-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-500/40 text-slate-700 dark:text-slate-200'}`}>
                            {body.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingRegulatoryBody(body); setShowRegulatoryBodyForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Regulatory Body', message: `Are you sure you want to delete "${body.name}"?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/regulatory-bodies/${body.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Regulatory body deleted successfully', variant: 'success' }); fetchRegulatoryBodiesData(regulatoryBodiesPage, regulatoryBodiesSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete regulatory body', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No regulatory bodies found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {regulatoryBodiesData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {regulatoryBodiesData.pagination.page} of {Math.ceil(regulatoryBodiesData.pagination.total / regulatoryBodiesPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setRegulatoryBodiesPage(p => Math.max(1, p - 1))} disabled={regulatoryBodiesPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setRegulatoryBodiesPage(p => p + 1)} disabled={!regulatoryBodiesData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Public Markets Module */}
      {selectedDataModule === 'public-markets' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Public Markets</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive financial data hub for African healthcare public markets</p>
            </div>
            <button 
              onClick={() => { setEditingStock(null); setShowStockForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Stock</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Ticker</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Exchange</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Market Cap</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {publicMarketsData?.stocks && publicMarketsData.stocks.length > 0 ? (
                    publicMarketsData.stocks.map((stock: any) => (
                      <tr key={stock.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{stock.company_name || 'N/A'}</td>
                        <td className="px-4 py-3">{stock.ticker || 'N/A'}</td>
                        <td className="px-4 py-3">{stock.exchange || 'N/A'}</td>
                        <td className="px-4 py-3">{stock.price ? `$${parseFloat(stock.price).toFixed(2)}` : 'N/A'}</td>
                        <td className="px-4 py-3">{stock.market_cap ? `$${(parseFloat(stock.market_cap) / 1000000).toFixed(2)}M` : 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingStock(stock); setShowStockForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Stock', message: `Are you sure you want to delete "${stock.company_name}"?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/public-markets/${stock.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Stock deleted successfully', variant: 'success' }); fetchPublicMarketsData(publicMarketsPage, publicMarketsSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete stock', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No stocks found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {publicMarketsData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {publicMarketsData.pagination.page} of {Math.ceil(publicMarketsData.pagination.total / publicMarketsPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setPublicMarketsPage(p => Math.max(1, p - 1))} disabled={publicMarketsPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setPublicMarketsPage(p => p + 1)} disabled={!publicMarketsData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clinical Centers Module */}
      {selectedDataModule === 'clinical-centers' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Clinical Centers</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Discover centers conducting clinical trials and research across Africa</p>
            </div>
            <button 
              onClick={() => { setEditingCenter(null); setShowCenterForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Clinical Center</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">City</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Capacity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicalCentersData?.centers && clinicalCentersData.centers.length > 0 ? (
                    clinicalCentersData.centers.map((center: any) => (
                      <tr key={center.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{center.name || 'N/A'}</td>
                        <td className="px-4 py-3">{center.country || 'N/A'}</td>
                        <td className="px-4 py-3">{center.city || 'N/A'}</td>
                        <td className="px-4 py-3">{center.capacity_patients || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingCenter(center); setShowCenterForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Clinical Center', message: `Are you sure you want to delete "${center.name}"?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/clinical-centers/${center.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Clinical center deleted successfully', variant: 'success' }); fetchClinicalCentersData(clinicalCentersPage, clinicalCentersSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete clinical center', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No clinical centers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {clinicalCentersData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {clinicalCentersData.pagination.page} of {Math.ceil(clinicalCentersData.pagination.total / clinicalCentersPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setClinicalCentersPage(p => Math.max(1, p - 1))} disabled={clinicalCentersPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setClinicalCentersPage(p => p + 1)} disabled={!clinicalCentersData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Investigators Module */}
      {selectedDataModule === 'investigators' && (
        <div className="space-y-4 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Investigators</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Explore clinical trial investigators and physicians across Africa</p>
            </div>
            <button 
              onClick={() => { setEditingInvestigator(null); setShowInvestigatorForm(true); }} 
              className="btn-primary-elevated flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Investigator</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Affiliation</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investigatorsData?.investigators && investigatorsData.investigators.length > 0 ? (
                    investigatorsData.investigators.map((investigator: any) => (
                      <tr key={investigator.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{(investigator.first_name && investigator.last_name) ? `${investigator.first_name} ${investigator.last_name}` : investigator.name || 'N/A'}</td>
                        <td className="px-4 py-3">{investigator.title || 'N/A'}</td>
                        <td className="px-4 py-3">{investigator.affiliation || 'N/A'}</td>
                        <td className="px-4 py-3">{investigator.country || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingInvestigator(investigator); setShowInvestigatorForm(true); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-white transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Delete Investigator', message: `Are you sure you want to delete this investigator?`, onConfirm: async () => { try { const token = localStorage.getItem('medarionAuthToken') || 'test-token'; const response = await fetch(`/api/admin/investigators/${investigator.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.success) { setAlertModal({ isOpen: true, title: 'Success', message: 'Investigator deleted successfully', variant: 'success' }); fetchInvestigatorsData(investigatorsPage, investigatorsSearch || undefined); } else { throw new Error(data.error || 'Failed to delete'); } } catch (err: any) { setAlertModal({ isOpen: true, title: 'Error', message: err?.message || 'Failed to delete investigator', variant: 'error' }); } } })} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-white transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No investigators found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {investigatorsData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {investigatorsData.pagination.page} of {Math.ceil(investigatorsData.pagination.total / investigatorsPageSize)}</span>
              <div className="flex gap-2">
                <button onClick={() => setInvestigatorsPage(p => Math.max(1, p - 1))} disabled={investigatorsPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setInvestigatorsPage(p => p + 1)} disabled={!investigatorsData.pagination.has_more} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nation Pulse Module */}
      {selectedDataModule === 'nation-pulse' && (
        <div className="space-y-4 pb-8">
            <div>
            <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Nation Pulse</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Health and economic indicators across African nations (read-only)</p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Data Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Metric</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Year</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nationPulseData?.data && nationPulseData.data.length > 0 ? (
                    nationPulseData.data.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{item.country || 'N/A'}</td>
                        <td className="px-4 py-3">{item.data_type || 'N/A'}</td>
                        <td className="px-4 py-3">{item.metric_name || 'N/A'}</td>
                        <td className="px-4 py-3">{item.metric_value ? `${item.metric_value} ${item.metric_unit || ''}` : 'N/A'}</td>
                        <td className="px-4 py-3">{item.year || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Read-only</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {nationPulseData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {nationPulseData.pagination.page} of {nationPulseData.pagination.pages || 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setNationPulsePage(p => Math.max(1, p - 1))} disabled={nationPulsePage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setNationPulsePage(p => p + 1)} disabled={nationPulseData.pagination.page >= nationPulseData.pagination.pages} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fundraising CRM Module */}
      {selectedDataModule === 'fundraising-crm' && (
        <div className="space-y-4 pb-8">
            <div>
            <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-2">Fundraising CRM</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">View investor relationships and pipeline (account-specific, read-only)</p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-white">{error}</div>
          ) : (
            <div className="card-glass overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Pipeline Stage</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Last Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundraisingCRMData?.investors && fundraisingCRMData.investors.length > 0 ? (
                    fundraisingCRMData.investors.map((investor: any) => (
                      <tr key={investor.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50">
                        <td className="px-4 py-3">{investor.name || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.type || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.pipeline_stage || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.email || 'N/A'}</td>
                        <td className="px-4 py-3">{investor.last_contact || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-500 dark:text-slate-400">Read-only</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No CRM investors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {fundraisingCRMData?.pagination && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {fundraisingCRMData.pagination.page} of {fundraisingCRMData.pagination.pages || 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setFundraisingCRMPage(p => Math.max(1, p - 1))} disabled={fundraisingCRMPage === 1} className="btn-outline">Previous</button>
                <button onClick={() => setFundraisingCRMPage(p => p + 1)} disabled={fundraisingCRMData.pagination.page >= fundraisingCRMData.pagination.pages} className="btn-outline">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[700px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
              <div>
                <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">Blog Categories</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage blog post categories</p>
              </div>
              <button
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCategory(null);
                }}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-200 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setEditingCategory({ id: null, name: '', slug: '' });
                  }}
                  className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {editingCategory ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Category Name</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={editingCategory.name}
                      onChange={e => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                        setEditingCategory({ ...editingCategory, name, slug });
                      }}
                      placeholder="e.g., Healthcare Innovation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Slug</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={editingCategory.slug}
                      onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                      placeholder="e.g., healthcare-innovation"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        if (!editingCategory.name || !editingCategory.slug) {
                          setAlertModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'Name and slug are required',
                            variant: 'error'
                          });
                          return;
                        }
                        if (editingCategory.id) {
                          await handleUpdateCategory(editingCategory.id, editingCategory.name, editingCategory.slug);
                        } else {
                          await handleCreateCategory(editingCategory.name, editingCategory.slug);
                        }
                        setEditingCategory(null);
                      }}
                      className="btn-primary px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="btn-outline px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {blogCategories.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No categories yet</p>
                      <p className="text-sm">Click "Add Category" to create one</p>
                    </div>
                  ) : (
                    blogCategories.map(cat => (
                      <div key={cat.id || cat.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex-1">
                          <div className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">/{cat.slug}</div>
                          {cat.post_count !== undefined && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {cat.post_count} {cat.post_count === 1 ? 'post' : 'posts'}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingCategory({ id: cat.id, name: cat.name, slug: cat.slug })}
                            className="btn-outline px-3 py-1.5 rounded-lg text-sm"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {cat.id && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Delete Category',
                                  message: `Are you sure you want to delete "${cat.name}"? This cannot be undone.`,
                                  variant: 'danger',
                                  onConfirm: async () => {
                                    await handleDeleteCategory(cat.id!);
                                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                                  }
                                });
                              }}
                              className="btn-outline px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '', variant: 'info' })}
      />
      
      {/* Image Upload Modals */}
      {/* Advertisement Image Modal */}
      <ImageUploadModal
        isOpen={showAdImageModal}
        onClose={() => setShowAdImageModal(false)}
        currentImageUrl={editingAd?.image_url || null}
        onImageUploaded={(url) => {
          setEditingAd(prev => prev ? { ...prev, image_url: url } : null);
          setShowAdImageModal(false);
        }}
        onImageRemoved={() => {
          setEditingAd(prev => prev ? { ...prev, image_url: '' } : null);
        }}
        title="Upload Advertisement Image"
        uploadType="ads"
        fieldName="image"
      />

      {/* Announcement Image Modal */}
      <ImageUploadModal
        isOpen={showAnnouncementImageModal}
        onClose={() => setShowAnnouncementImageModal(false)}
        currentImageUrl={editingAnnouncement?.image_url || draftAnnouncement.imageUrl || null}
        onImageUploaded={(url) => {
          if (editingAnnouncement) {
            setEditingAnnouncement(prev => prev ? { ...prev, image_url: url } : null);
          } else {
            setDraftAnnouncement(prev => ({ ...prev, imageUrl: url }));
          }
          setShowAnnouncementImageModal(false);
        }}
        onImageRemoved={() => {
          if (editingAnnouncement) {
            setEditingAnnouncement(prev => prev ? { ...prev, image_url: '' } : null);
          } else {
            setDraftAnnouncement(prev => ({ ...prev, imageUrl: '' }));
          }
        }}
        title="Upload Announcement Image"
        uploadType="announcement"
        fieldName="image"
      />

      {/* Company Logo Modal */}
      <ImageUploadModal
        isOpen={showCompanyLogoModal}
        onClose={() => setShowCompanyLogoModal(false)}
        currentImageUrl={editingCompany?.logo_url || editingCompany?.logo || null}
        onImageUploaded={(url) => {
          setEditingCompany(prev => prev ? { ...prev, logo_url: url, logo: url } : { logo_url: url, logo: url });
          setShowCompanyLogoModal(false);
        }}
        onImageRemoved={() => {
          setEditingCompany(prev => prev ? { ...prev, logo_url: '', logo: '' } : { logo_url: '', logo: '' });
        }}
        title="Upload Company Logo"
        uploadType="company"
        fieldName="logo"
      />

      {/* Investor Logo Modal */}
      <ImageUploadModal
        isOpen={showInvestorLogoModal}
        onClose={() => setShowInvestorLogoModal(false)}
        currentImageUrl={editingInvestor?.logo || null}
        onImageUploaded={(url) => {
          setEditingInvestor(prev => prev ? { ...prev, logo: url } : { logo: url });
          setShowInvestorLogoModal(false);
        }}
        onImageRemoved={() => {
          setEditingInvestor(prev => prev ? { ...prev, logo: '' } : { logo: '' });
        }}
        title="Upload Investor Logo"
        uploadType="investor"
        fieldName="logo"
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', variant: 'warning', isLoading: false, onConfirm: () => {} })}
      />
      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
        defaultValue={promptModal.defaultValue}
        type={promptModal.type}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: () => {}, defaultValue: '', type: 'text' })}
      />

    </div>
  );
};

export default AdminDashboard; 
