'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return; // Prevent multiple initializations
    
    // Initialize the auth state from localStorage and cookies
    const initializeAuth = () => {
      try {
        // Get token from localStorage
        const storedToken = localStorage.getItem('auth_token');
        
        // Check if token exists and is valid (not empty)
        if (storedToken && storedToken.trim() !== '') {
          // Make sure cookie is set too (for API requests)
          document.cookie = `auth_token=${storedToken}; path=/; max-age=86400; samesite=strict`;
          
          setToken(storedToken);
          fetchUserProfile(storedToken);
        } else {
          // Clear any invalid tokens
          localStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setLoading(false);
      }
      
      setInitialized(true);
    };

    // Use a small timeout to ensure localStorage is available after navigation
    const timeoutId = setTimeout(initializeAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, [initialized]);

  // Listen for storage changes (handles login from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('AuthContext: Storage change detected for auth_token');
        if (e.newValue) {
          console.log('AuthContext: New token detected, fetching profile');
          setToken(e.newValue);
          fetchUserProfile(e.newValue);
        } else {
          console.log('AuthContext: Token removed, clearing auth state');
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      console.log('AuthContext: Fetching user profile with token');
      
      // Set both auth methods - cookie and header
      document.cookie = `auth_token=${authToken}; path=/; max-age=86400; samesite=strict`;
      
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
        },
        // Use credentials: 'include' to send cookies too
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: Profile fetched successfully:', data.user.email);
        setUser(data.user);
      } else {
        console.error('AuthContext: Failed to fetch profile, status:', response.status);
        // Clear invalid token
        localStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Error fetching profile:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set state first
        setUser(data.user);
        setToken(data.token);
        
        // Then ensure localStorage is set
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('userRole', data.user.role); // Store user role
        
        // Also set the cookie for server-side access (without secure flag for localhost)
        document.cookie = `auth_token=${data.token}; path=/; max-age=86400; samesite=strict`;
        
        // Ensure loading is false after successful login
        setLoading(false);
        
        // Force a small delay to ensure all state updates are processed
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userRole'); // Clear user role on logout
    // Clear the cookie as well
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict';
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
