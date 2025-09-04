import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    userRoles: number;
  };
  navigationPermissions: Record<string, boolean>;
  actionPermissions: Record<string, Record<string, boolean>>;
}

interface CreateRoleData {
  name: string;
  description?: string;
  active?: boolean;
  permissions?: string[];
}

// Query keys
const QUERY_KEYS = {
  roles: ['roles'],
  role: (id: string) => ['roles', id],
} as const;

// Fetch all roles with caching
export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.roles,
    queryFn: async (): Promise<Role[]> => {
      const response = await axios.get('/api/roles');
      return response.data.data || response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (roles change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Fetch single role
export function useRole(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.role(id),
    queryFn: async (): Promise<Role> => {
      const response = await axios.get(`/api/roles/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roleData: CreateRoleData): Promise<Role> => {
      // تحويل البيانات إلى التنسيق المطلوب للـ API
      const { permissions, ...otherData } = roleData;
      
      console.log('🔄 CREATE ROLE - البيانات الأصلية:', JSON.stringify(roleData, null, 2));
      
      // التأكد من أن الصلاحيات بالتنسيق الصحيح
      const transformedData = {
        ...otherData,
        permissions: Array.isArray(permissions) ? permissions : []
      };
      
      console.log('🔄 CREATE ROLE - البيانات المحولة:', JSON.stringify(transformedData, null, 2));
      
      const response = await axios.post('/api/roles', transformedData);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch roles queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
    },
    onError: (error) => {
      console.error('Error creating role:', error);
    },
  });
}

// Update role mutation
export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...roleData }: { id: string } & Partial<CreateRoleData>): Promise<Role> => {
      // تحويل البيانات إلى التنسيق المطلوب للـ API
      const { permissions, ...otherData } = roleData;
      
      console.log('🔄 UPDATE ROLE - البيانات الأصلية:', JSON.stringify(roleData, null, 2));
      
      // التأكد من أن الصلاحيات بالتنسيق الصحيح
      const transformedData = {
        ...otherData,
        permissions: Array.isArray(permissions) ? permissions : []
      };
      
      console.log('🔄 UPDATE ROLE - البيانات المحولة:', JSON.stringify(transformedData, null, 2));
      
      const response = await axios.put(`/api/roles/${id}`, transformedData);
      
      // Trigger immediate permissions refresh for all users
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('permissions-updated'));
      }
      
      return response.data.data || response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific role in cache
      queryClient.setQueryData(QUERY_KEYS.role(variables.id), data);
      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
    },
    onError: (error) => {
      console.error('Error updating role:', error);
    },
  });
}

// Delete role mutation
export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/roles/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch roles queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
    },
    onError: (error) => {
      console.error('Error deleting role:', error);
    },
  });
}

// Toggle role status mutation
export function useToggleRoleStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }): Promise<Role> => {
      const response = await axios.patch(`/api/roles/${id}/status`, { active });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific role in cache
      queryClient.setQueryData(QUERY_KEYS.role(variables.id), data);
      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles });
    },
    onError: (error) => {
      console.error('Error toggling role status:', error);
    },
  });
}