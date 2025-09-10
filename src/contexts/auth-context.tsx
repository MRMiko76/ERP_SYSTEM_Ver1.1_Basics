'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🔄 [AuthProvider] Initialized with user:', user?.email, 'loading:', loading);

  const checkAuth = async () => {
    console.log('🔄 [AuthProvider] Starting checkAuth...');
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [AuthProvider] Fetching /api/auth/verify...');
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
      });

      console.log('🔄 [AuthProvider] Response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('🔄 [AuthProvider] Auth successful, user:', userData.user?.email);
        setUser(userData.user);
        setError(null);
      } else {
        console.log('🔄 [AuthProvider] Auth failed, clearing user');
        setUser(null);
        setError(null);
      }
    } catch (error) {
      console.log('🔄 [AuthProvider] Auth error:', error);
      setUser(null);
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 [AUTH CONTEXT] Starting login for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 [AUTH CONTEXT] Login response status:', response.status);
      
      if (response.ok) {
        console.log('🔐 [AUTH CONTEXT] Login successful, checking auth...');
        await checkAuth();
        console.log('🔐 [AUTH CONTEXT] Auth check completed');
        return true;
      } else {
        const errorData = await response.json();
        console.log('🔐 [AUTH CONTEXT] Login failed:', errorData.error);
        setError(errorData.error || 'خطأ في تسجيل الدخول');
        return false;
      }
    } catch (error) {
      console.log('🔐 [AUTH CONTEXT] Login error:', error);
      setError('خطأ في الاتصال');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      setError(null);
      setLoading(false);
      
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const refreshAuth = async () => {
    console.log('🔄 [AuthProvider] refreshAuth called');
    await checkAuth();
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  useEffect(() => {
    console.log('🔄 [AuthProvider] useEffect triggered - calling checkAuth');
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshAuth,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}