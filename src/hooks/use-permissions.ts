'use client';

import { useQuery } from '@tanstack/react-query';
import { Permission, SYSTEM_MODULES, createDefaultPermission } from '@/types/roles-permissions';

interface PermissionsAPIResponse {
  success: boolean;
  data: {
    modules: Array<{
      name: string;
      displayName: string;
      description: string;
    }>;
    actions: Record<string, string>;
    permissions: Array<{
      module: string;
      displayName: string;
      description: string;
      actions: Array<{
        action: string;
        label: string;
        available: boolean;
      }>;
    }>;
  };
}

// دالة لتحويل بيانات الصلاحيات من API إلى تنسيق Permission
const transformPermissions = (apiResponse: PermissionsAPIResponse): Permission[] => {
  // إنشاء صلاحيات لجميع الموديولات مع جميع الإجراءات متاحة
  return SYSTEM_MODULES.map(module => createDefaultPermission(module.name));
};

// Hook لجلب جميع الصلاحيات المتاحة
export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async (): Promise<Permission[]> => {
      const response = await fetch('/api/permissions');
      if (!response.ok) {
        throw new Error('فشل في جلب الصلاحيات');
      }
      const data: PermissionsAPIResponse = await response.json();
      return transformPermissions(data);
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
    cacheTime: 10 * 60 * 1000, // 10 دقائق
  });
};

// Hook لجلب صلاحيات المستخدم الحالي
export const useUserPermissions = () => {
  return useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/user/permissions');
      if (!response.ok) {
        throw new Error('فشل في جلب صلاحيات المستخدم');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // دقيقتان
    cacheTime: 5 * 60 * 1000, // 5 دقائق
  });
};