'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Notification, TargetRole } from '@/types/notifications';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  
  // Chat functionality
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: any) => void;
  markMessageAsRead: (chatId: string, messageId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  onNewMessage: (callback: (message: any) => void) => (() => void) | undefined;
  onMessageConfirmed: (callback: (message: any) => void) => (() => void) | undefined;
  onMessageReadUpdate: (callback: (data: any) => void) => (() => void) | undefined;
  onUserTyping: (callback: (data: any) => void) => (() => void) | undefined;
  onUserStopTyping: (callback: (data: any) => void) => (() => void) | undefined;
  onUserStatusUpdate: (callback: (data: any) => void) => (() => void) | undefined;
  
  // Notification functionality
  joinNotifications: (roles: TargetRole[]) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotificationCount: () => void;
  onNewNotification: (callback: (notification: Notification) => void) => (() => void) | undefined;
  onNotificationRead: (callback: (data: { notificationId: string; readBy: string }) => void) => (() => void) | undefined;
  onUnreadCountUpdate: (callback: (data: { count: number }) => void) => (() => void) | undefined;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Get auth token from localStorage or cookies
    const token = localStorage.getItem('auth_token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      console.error('No auth token found for socket connection');
      return;
    }

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('user-online');
      
      // Make socket available globally for debugging
      if (typeof window !== 'undefined') {
        (window as any).socket = newSocket;
      }
      
      // Automatically join notification rooms based on user role
      if (user?.role) {
        const userRoles: TargetRole[] = [TargetRole.ALL];
        
        switch (user.role) {
          case 'STUDENT':
            userRoles.push(TargetRole.STUDENTS);
            break;
          case 'PARENT':
            userRoles.push(TargetRole.PARENTS);
            break;
          case 'TEACHER':
            userRoles.push(TargetRole.TEACHERS);
            break;
          case 'ADMIN':
            userRoles.push(TargetRole.ADMINS);
            break;
        }
        
        newSocket.emit('join-notifications', { roles: userRoles });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      
      // Clean up global reference
      if (typeof window !== 'undefined' && (window as any).socket === newSocket) {
        delete (window as any).socket;
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌❌ Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('join-chat', chatId);
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-chat', chatId);
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((chatId: string, message: any) => {
    if (socket && isConnected) {
      socket.emit('message-sent', { chatId, message });
    }
  }, [socket, isConnected]);

  const markMessageAsRead = useCallback((chatId: string, messageId: string) => {
    if (socket && isConnected) {
      socket.emit('message-read', { chatId, messageId });
    }
  }, [socket, isConnected]);

  const startTyping = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-start', { chatId });
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', { chatId });
    }
  }, [socket, isConnected]);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    if (socket) {
      socket.on('new-message', callback);
      return () => socket.off('new-message', callback);
    }
  }, [socket]);

  const onMessageConfirmed = useCallback((callback: (message: any) => void) => {
    if (socket) {
      socket.on('message-confirmed', callback);
      return () => socket.off('message-confirmed', callback);
    }
  }, [socket]);

  const onMessageReadUpdate = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('message-read-update', callback);
      return () => socket.off('message-read-update', callback);
    }
  }, [socket]);

  const onUserTyping = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-typing', callback);
      return () => socket.off('user-typing', callback);
    }
  }, [socket]);

  const onUserStopTyping = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-stop-typing', callback);
      return () => socket.off('user-stop-typing', callback);
    }
  }, [socket]);

  const onUserStatusUpdate = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-status-update', callback);
      return () => socket.off('user-status-update', callback);
    }
  }, [socket]);

  // Notification methods
  const joinNotifications = useCallback((roles: TargetRole[]) => {
    if (socket && isConnected) {
      socket.emit('join-notifications', { roles });
    }
  }, [socket, isConnected]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    if (socket && isConnected) {
      socket.emit('mark-notification-read', { notificationId });
    }
  }, [socket, isConnected]);

  const getUnreadNotificationCount = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('get-unread-count');
    }
  }, [socket, isConnected]);

  const onNewNotification = useCallback((callback: (notification: Notification) => void) => {
    if (socket) {
      socket.on('new-notification', callback);
      return () => socket.off('new-notification', callback);
    }
  }, [socket]);

  const onNotificationRead = useCallback((callback: (data: { notificationId: string; readBy: string }) => void) => {
    if (socket) {
      socket.on('notification-read', callback);
      return () => socket.off('notification-read', callback);
    }
  }, [socket]);

  const onUnreadCountUpdate = useCallback((callback: (data: { count: number }) => void) => {
    if (socket) {
      socket.on('unread-count', callback);
      return () => socket.off('unread-count', callback);
    }
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    // Chat functionality
    joinChat,
    leaveChat,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageConfirmed,
    onMessageReadUpdate,
    onUserTyping,
    onUserStopTyping,
    onUserStatusUpdate,
    // Notification functionality
    joinNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount,
    onNewNotification,
    onNotificationRead,
    onUnreadCountUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};