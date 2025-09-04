import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  active?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  active?: boolean;
  roles?: string[];
}

// Query keys
const QUERY_KEYS = {
  users: (params: UsersParams) => ['users', params],
  user: (id: string) => ['users', id],
} as const;

// Fetch users with caching
export function useUsers(params: UsersParams = {}) {
  console.log('🔍 USE_USERS: ===== بدء استدعاء useUsers hook =====');
  console.log('🔍 USE_USERS: استدعاء hook مع المعاملات:', params);
  
  return useQuery({
    queryKey: QUERY_KEYS.users(params),
    queryFn: async (): Promise<UsersResponse> => {
      console.log('📡 USE_USERS: بدء طلب API للمستخدمين');
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.role) searchParams.set('role', params.role);
      if (params.active) searchParams.set('active', params.active);
      
      const url = `/api/users?${searchParams.toString()}`;
      console.log('🌐 USE_USERS: URL الطلب:', url);
      
      const response = await axios.get(url);
      console.log('✅ USE_USERS: استجابة API:', response.data);
      return response.data;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single user
export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: async (): Promise<User> => {
      const response = await axios.get(`/api/users/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: CreateUserData): Promise<User> => {
      const response = await axios.post('/api/users', userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Error creating user:', error);
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...userData }: { id: string } & Partial<CreateUserData>): Promise<User> => {
      const response = await axios.put(`/api/users/${id}`, userData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(QUERY_KEYS.user(variables.id), data);
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Error updating user:', error);
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch users queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
    },
  });
}

// Toggle user status mutation
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }): Promise<User> => {
      const response = await axios.patch(`/api/users/${id}/status`, { active });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(QUERY_KEYS.user(variables.id), data);
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Error toggling user status:', error);
    },
  });
}