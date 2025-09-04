'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  console.log('🔄 [useAuth] Hook initialized');
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  
  console.log('🔄 [useAuth] Current state:', { user: authState.user?.email, loading: authState.loading });



  const checkAuth = async (abortController?: AbortController) => {
    console.log('🔄 [useAuth] Starting checkAuth...');
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔄 [useAuth] Fetching /api/auth/verify...');
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        signal: abortController?.signal,
      });

      console.log('🔄 [useAuth] Response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('🔄 [useAuth] Auth successful, user:', userData.user?.email);
        console.log('🔄 [useAuth] Setting user state...');
        setAuthState({
          user: userData.user,
          loading: false,
          error: null,
        });
        console.log('🔄 [useAuth] User state set successfully');
      } else {
        console.log('🔄 [useAuth] Auth failed, clearing user');
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.log('🔄 [useAuth] Auth error:', error);
      setAuthState({
        user: null,
        loading: false,
        error: 'خطأ في الاتصال',
      });
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      
      // إعادة توجيه إلى صفحة تسجيل الدخول
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const refreshAuth = async () => {
    console.log('🔄 [useAuth] refreshAuth called');
    const abortController = new AbortController();
    await checkAuth(abortController);
    // إضافة تأخير صغير للتأكد من تحديث الحالة
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('🔄 [useAuth] refreshAuth completed');
  };
  
  const refreshPermissions = async () => {
    console.log('🔄 [useAuth] refreshPermissions called');
    try {
      // Force refresh user data to get updated permissions
      await refreshAuth();
      
      // Also clear any cached permissions data
      if (typeof window !== 'undefined') {
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('permissions-updated'));
      }
      
      console.log('🔄 [useAuth] refreshPermissions completed');
    } catch (error) {
      console.error('🔄 [useAuth] refreshPermissions error:', error);
    }
  };

  // useEffect لاستدعاء checkAuth عند تحميل المكون
  useEffect(() => {
    console.log('🔄 [useAuth] useEffect triggered - calling checkAuth');
    if (typeof window !== 'undefined') {
      console.log('🔄 [useAuth] Running in browser, calling checkAuth');
      const abortController = new AbortController();
      
      checkAuth(abortController).catch(error => {
        if (error.name !== 'AbortError') {
          console.log('🔄 [useAuth] checkAuth failed in useEffect:', error);
        }
      });
      
      return () => {
        console.log('🔄 [useAuth] Cleanup - aborting previous request');
        abortController.abort();
      };
    } else {
      console.log('🔄 [useAuth] Running on server, skipping checkAuth');
    }
  }, []);

  // useEffect للاستماع لأحداث تحديث الصلاحيات
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handlePermissionsUpdate = () => {
        console.log('🔄 [useAuth] Permissions update event received, refreshing auth...');
        refreshAuth();
      };

      window.addEventListener('permissions-updated', handlePermissionsUpdate);
      
      return () => {
        window.removeEventListener('permissions-updated', handlePermissionsUpdate);
      };
    }
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    logout,
    refreshAuth,
    refreshPermissions,
    isAuthenticated: !!authState.user,
  };
}