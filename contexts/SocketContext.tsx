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

  // Store callback functions to set up listeners when socket connects
  const [chatCallbacks, setChatCallbacks] = useState<{
    newMessage?: (message: any) => void;
    messageConfirmed?: (message: any) => void;
    messageReadUpdate?: (data: any) => void;
    userTyping?: (data: any) => void;
    userStopTyping?: (data: any) => void;
    userStatusUpdate?: (data: any) => void;
  }>({});

  const [notificationCallbacks, setNotificationCallbacks] = useState<{
    newNotification?: (notification: Notification) => void;
    notificationRead?: (data: { notificationId: string; readBy: string }) => void;
    unreadCountUpdate?: (data: { count: number }) => void;
  }>({});

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
      
      // Set up chat event listeners if callbacks are registered
      if (chatCallbacks.newMessage) {
        newSocket.on('new-message', chatCallbacks.newMessage);
      }
      if (chatCallbacks.messageConfirmed) {
        newSocket.on('message-confirmed', chatCallbacks.messageConfirmed);
      }
      if (chatCallbacks.messageReadUpdate) {
        newSocket.on('message-read-update', chatCallbacks.messageReadUpdate);
      }
      if (chatCallbacks.userTyping) {
        newSocket.on('user-typing', chatCallbacks.userTyping);
      }
      if (chatCallbacks.userStopTyping) {
        newSocket.on('user-stop-typing', chatCallbacks.userStopTyping);
      }
      if (chatCallbacks.userStatusUpdate) {
        newSocket.on('user-status-update', chatCallbacks.userStatusUpdate);
      }

      // Set up notification event listeners if callbacks are registered
      if (notificationCallbacks.newNotification) {
        newSocket.on('new-notification', notificationCallbacks.newNotification);
      }
      if (notificationCallbacks.notificationRead) {
        newSocket.on('notification-read', notificationCallbacks.notificationRead);
      }
      if (notificationCallbacks.unreadCountUpdate) {
        newSocket.on('unread-count', notificationCallbacks.unreadCountUpdate);
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

      // Remove all listeners when disconnected
      newSocket.removeAllListeners();
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
    setChatCallbacks(prev => ({ ...prev, newMessage: callback }));
    
    // If socket is already connected, set up the listener immediately
    if (socket && isConnected) {
      socket.on('new-message', callback);
    }
    
    return () => {
      setChatCallbacks(prev => ({ ...prev, newMessage: undefined }));
      if (socket) {
        socket.off('new-message', callback);
      }
    };
  }, [socket, isConnected]);

  const onMessageConfirmed = useCallback((callback: (message: any) => void) => {
    setChatCallbacks(prev => ({ ...prev, messageConfirmed: callback }));
    
    if (socket && isConnected) {
      socket.on('message-confirmed', callback);
    }
    
    return () => {
      setChatCallbacks(prev => ({ ...prev, messageConfirmed: undefined }));
      if (socket) {
        socket.off('message-confirmed', callback);
      }
    };
  }, [socket, isConnected]);

  const onMessageReadUpdate = useCallback((callback: (data: any) => void) => {
    setChatCallbacks(prev => ({ ...prev, messageReadUpdate: callback }));
    
    if (socket && isConnected) {
      socket.on('message-read-update', callback);
    }
    
    return () => {
      setChatCallbacks(prev => ({ ...prev, messageReadUpdate: undefined }));
      if (socket) {
        socket.off('message-read-update', callback);
      }
    };
  }, [socket, isConnected]);

  const onUserTyping = useCallback((callback: (data: any) => void) => {
    setChatCallbacks(prev => ({ ...prev, userTyping: callback }));
    
    if (socket && isConnected) {
      socket.on('user-typing', callback);
    }
    
    return () => {
      setChatCallbacks(prev => ({ ...prev, userTyping: undefined }));
      if (socket) {
        socket.off('user-typing', callback);
      }
    };
  }, [socket, isConnected]);

  const onUserStopTyping = useCallback((callback: (data: any) => void) => {
    setChatCallbacks(prev => ({ ...prev, userStopTyping: callback }));
    
    if (socket && isConnected) {
      socket.on('user-stop-typing', callback);
    }
    
    return () => {
      setChatCallbacks(prev => ({ ...prev, userStopTyping: undefined }));
      if (socket) {
        socket.off('user-stop-typing', callback);
      }
    };
  }, [socket, isConnected]);

  const onUserStatusUpdate = useCallback((callback: (data: any) => void) => {
    setChatCallbacks(prev => ({ ...prev, userStatusUpdate: callback }));
    
    if (socket && isConnected) {
      socket.on('user-status-update', callback);
    }
    
    return () => {
      setChatCallbacks(prev => ({ ...prev, userStatusUpdate: undefined }));
      if (socket) {
        socket.off('user-status-update', callback);
      }
    };
  }, [socket, isConnected]);

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
    setNotificationCallbacks(prev => ({ ...prev, newNotification: callback }));
    
    if (socket && isConnected) {
      socket.on('new-notification', callback);
    }
    
    return () => {
      setNotificationCallbacks(prev => ({ ...prev, newNotification: undefined }));
      if (socket) {
        socket.off('new-notification', callback);
      }
    };
  }, [socket, isConnected]);

  const onNotificationRead = useCallback((callback: (data: { notificationId: string; readBy: string }) => void) => {
    setNotificationCallbacks(prev => ({ ...prev, notificationRead: callback }));
    
    if (socket && isConnected) {
      socket.on('notification-read', callback);
    }
    
    return () => {
      setNotificationCallbacks(prev => ({ ...prev, notificationRead: undefined }));
      if (socket) {
        socket.off('notification-read', callback);
      }
    };
  }, [socket, isConnected]);

  const onUnreadCountUpdate = useCallback((callback: (data: { count: number }) => void) => {
    setNotificationCallbacks(prev => ({ ...prev, unreadCountUpdate: callback }));
    
    if (socket && isConnected) {
      socket.on('unread-count', callback);
    }
    
    return () => {
      setNotificationCallbacks(prev => ({ ...prev, unreadCountUpdate: undefined }));
      if (socket) {
        socket.off('unread-count', callback);
      }
    };
  }, [socket, isConnected]);

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