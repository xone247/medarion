import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/apiService';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  category: 'message' | 'system' | 'update' | 'reminder' | 'alert';
  is_read: boolean;
  is_important: boolean;
  action_url?: string;
  action_text?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: number;
}

export interface NotificationPreferences {
  id: number;
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_types: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
    system: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (page?: number, limit?: number, unreadOnly?: boolean, forceRefresh?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  createNotification: (notification: Partial<Notification>) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  
  // Real-time updates
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: number) => void;
  updateNotification: (notificationId: number, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Memoize the unread count calculation to prevent unnecessary re-renders
  const calculatedUnreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  // Update unread count when notifications change
  useEffect(() => {
    setUnreadCount(calculatedUnreadCount);
  }, [calculatedUnreadCount]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false, forceRefresh = false) => {
    if (!user) {
      console.log('[NotificationContext] No user, skipping fetch');
      return;
    }
    
    // Check if we have a token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token && process.env.NODE_ENV === 'production') {
      console.warn('[NotificationContext] No auth token found, skipping fetch');
      return;
    }
    
    // If we already have data and it's not a force refresh, don't fetch again
    if (hasLoaded && !forceRefresh && notifications.length > 0) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get('/notifications/', {
        page,
        limit,
        unread_only: unreadOnly
      });
      if (data.success) {
        setNotifications(data.notifications || []);
        setHasLoaded(true);
      } else {
        setError(data.error || 'Failed to fetch notifications');
        setNotifications([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, hasLoaded]); // Removed notifications.length from dependencies

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      console.log('[NotificationContext] No user, skipping unread count fetch');
      return;
    }
    
    // Check if we have a token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token && process.env.NODE_ENV === 'production') {
      console.warn('[NotificationContext] No auth token found, skipping unread count fetch');
      return;
    }
    
    try {
      const data = await apiService.get('/notifications/unread-count/');
      if (data.success) {
        setUnreadCount(data.unread_count || data.count || 0);
      } else {
        // Fallback to counting from notifications state
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Fallback to counting from notifications state
      setUnreadCount(notifications.filter(n => !n.is_read).length);
    }
  }, [user]); // Removed notifications from dependencies

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!user) return;
    
    try {
      await apiService.patch(`/notifications/${notificationId}/read`, {});
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Even if API fails, update local state for better UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await apiService.patch('/notifications/mark-all-read', {});
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Even if API fails, update local state for better UX
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    if (!user) return;
    
    try {
      await apiService.delete(`/notifications/${notificationId}`);
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      // Even if API fails, update local state for better UX
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  }, [user]);

  // Create notification (admin/system use)
  const createNotification = useCallback(async (notification: Partial<Notification>) => {
    if (!user) return;
    
    try {
      const data = await apiService.post('/notifications/', notification);
      if (data.success) {
        // Add to local state if it's for the current user
        if (data.notification.user_id === user.id) {
          addNotification(data.notification);
        }
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }, [user]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await apiService.get('/notifications/preferences/');
      if (data.success) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  }, [user]);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    try {
      const data = await apiService.put('/notifications/preferences/', newPreferences);
      if (data.success) {
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  }, [user]);

  // Real-time update methods
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const removeNotification = useCallback((notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const updateNotification = useCallback(async (notificationId: number, updates: Partial<Notification>) => {
    if (!user) return;
    
    try {
      console.log('Updating notification:', notificationId, 'type:', typeof notificationId, 'with updates:', updates);
      const endpoint = `/notifications/${notificationId}`;
      console.log('Endpoint constructed:', endpoint);
      const data = await apiService.patch(endpoint, updates);
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, ...updates }
              : notification
          )
        );
      }
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  }, [user]);

  // Initialize data when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      // fetchPreferences(); // Temporarily disabled until preferences endpoint is implemented
    } else {
      // Clear data when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setError(null);
      setHasLoaded(false);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Poll for new notifications every 5 minutes (disabled for now to prevent rate limiting)
  useEffect(() => {
    if (!user) return;
    
    // Temporarily disabled polling to prevent rate limiting
    // const interval = setInterval(() => {
    //   fetchUnreadCount();
    // }, 300000); // 5 minutes
    
    // return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    fetchPreferences,
    updatePreferences,
    addNotification,
    removeNotification,
    updateNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
