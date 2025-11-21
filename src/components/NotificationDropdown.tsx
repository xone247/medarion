import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  ExternalLink, 
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Zap,
  Star
} from 'lucide-react';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';

const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications,
    updateNotification
  } = useNotifications();
  
  const { theme } = useTheme();
  const { navigateToModule } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens (only if not already loaded)
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, showAll ? 50 : 10, false, true); // Force refresh when opening
    }
  }, [isOpen, showAll, fetchNotifications]);

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'message') return <Bell className="h-4 w-4" />;
    
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700';
      case 'system':
        return 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Remove notification from the list immediately (dismiss it)
    await deleteNotification(notification.id);
    
    // Navigate if there's an action URL
    if (notification.action_url) {
      // Use app navigation instead of opening new tabs
      const modulePath = notification.action_url.replace('/', '');
      if (modulePath) {
        navigateToModule(modulePath);
        setIsOpen(false); // Close dropdown after navigation
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleToggleStar = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    console.log('handleToggleStar called with notificationId:', notificationId, 'type:', typeof notificationId);
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      console.log('Found notification:', notification);
      await updateNotification(notificationId, { is_important: !notification.is_important });
    }
  };

  const displayNotifications = notifications.slice(0, showAll ? 50 : 10);
  const hasMore = notifications.length > 10;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="card-glass p-1.5 sm:p-2 rounded-md relative hover:shadow-soft transition-all duration-200 hover:bg-opacity-90 min-w-[2rem] sm:min-w-[2.5rem] min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary-teal)]" />
      </button>
      
      {/* Notification Counter - Positioned outside the button */}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs sm:text-xs md:text-sm rounded-full min-w-[1.5rem] sm:min-w-[1.75rem] h-6 sm:h-7 px-1.5 sm:px-2 flex items-center justify-center font-bold border-2 border-[var(--color-background-surface)] shadow-lg z-20 whitespace-nowrap">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-h-96 overflow-hidden bg-[var(--color-background-surface)] border-2 border-[var(--color-divider-gray)] rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-divider-gray)] bg-[var(--color-background-surface)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-[var(--color-primary-teal)] hover:text-[var(--color-primary-dark)] transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto bg-[var(--color-background-surface)]">
            {isLoading ? (
              <div className="p-4 text-center text-[var(--color-text-secondary)]">
                Loading notifications...
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)]">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-divider-gray)]">
                {displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-[var(--color-background-default)] ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-[var(--color-background-surface)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read 
                              ? 'text-[var(--color-text-primary)]' 
                              : 'text-[var(--color-text-secondary)]'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleToggleStar(e, notification.id)}
                              className={`p-1 transition-colors ${
                                notification.is_important 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-[var(--color-text-tertiary)] hover:text-yellow-500'
                              }`}
                              title={notification.is_important ? 'Remove star' : 'Add star'}
                            >
                              <Star className={`h-3 w-3 ${notification.is_important ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors p-1"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          {notification.action_url && (
                            <div className="flex items-center gap-1 text-xs text-[var(--color-primary-teal)]">
                              <ExternalLink className="h-3 w-3" />
                              <span>{notification.action_text || 'View'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasMore && (
            <div className="p-3 border-t border-[var(--color-divider-gray)]">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-sm text-[var(--color-primary-teal)] hover:text-[var(--color-primary-dark)] transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${notifications.length} notifications`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
