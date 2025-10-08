import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { type Notification, TargetRole } from '@/types/notifications';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAll: () => void;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { 
    isConnected, 
    onNewNotification, 
    onNotificationRead, 
    onUnreadCountUpdate,
    markNotificationAsRead,
    getUnreadNotificationCount 
  } = useSocket();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle new notification from socket
  useEffect(() => {
    const unsubscribeNewNotification = onNewNotification((notification: Notification) => {
      console.log('🔔 Received new notification:', notification.id, notification.title);
      
      setNotifications(prev => {
        // Check if notification already exists to avoid duplicates
        const exists = prev.some(n => n.id === notification.id);
        if (exists) {
          console.log('🔔 Notification already exists, skipping');
          return prev;
        }
        
        return [notification, ...prev];
      });
      
      setUnreadCount(prev => {
        const newCount = prev + 1;
        return newCount;
      });
      
      // Show browser notification if supported and allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    });

    return unsubscribeNewNotification;
  }, [onNewNotification]);

  // Handle notification read status updates
  useEffect(() => {
    const unsubscribeNotificationRead = onNotificationRead((data: { notificationId: string; readBy: string }) => {
      if (data.readBy === user?.id) {
        // Mark notification as read locally
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === data.notificationId 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
      }
    });

    return unsubscribeNotificationRead;
  }, [onNotificationRead, user?.id]);

  // Handle unread count updates
  useEffect(() => {
    const unsubscribeUnreadCount = onUnreadCountUpdate((data: { count: number }) => {
      setUnreadCount(data.count);
    });

    return unsubscribeUnreadCount;
  }, [onUnreadCountUpdate]);

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (user && isConnected) {
      fetchNotifications();
      getUnreadNotificationCount();
    }
  }, [user, isConnected, fetchNotifications, getUnreadNotificationCount]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      // Mark as read via socket
      markNotificationAsRead(notificationId);

      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );

      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // TODO: Call API to ensure persistence when endpoint is available
      // await fetch(`/api/notifications/${notificationId}/read`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      //   },
      // });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, [markNotificationAsRead]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    clearAll,
    refetch: fetchNotifications,
  };
}