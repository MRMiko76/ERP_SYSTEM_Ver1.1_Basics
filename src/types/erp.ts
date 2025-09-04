// تعريفات TypeScript قوية للنظام ERP
// تضمن أن permissions دائماً Array لتجنب خطأ reduce

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  // ضمان أن permissions دائماً Array - لا يمكن أن تكون undefined أو null
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  active: boolean;
  // ضمان أن roles دائماً Array
  roles: Role[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// نماذج للنماذج (Forms)
export interface CreateRoleData {
  name: string;
  description?: string;
  active: boolean;
  // تهيئة افتراضية فارغة
  permissions: string[]; // IDs of permissions
}

export interface UpdateRoleData extends CreateRoleData {
  id: string;
}

export interface CreateUserData {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  password: string;
  active: boolean;
  // تهيئة افتراضية فارغة
  roles: string[]; // IDs of roles
}

export interface UpdateUserData {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  active: boolean;
  roles: string[]; // IDs of roles
  password?: string; // اختياري في التحديث
}

// دوال مساعدة لضمان الأمان
export const safePermissions = (permissions: Permission[] | undefined | null): Permission[] => {
  return Array.isArray(permissions) ? permissions : [];
};

export const safeRoles = (roles: Role[] | undefined | null): Role[] => {
  return Array.isArray(roles) ? roles : [];
};

// قيم افتراضية آمنة
export const defaultRole: Omit<Role, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  active: true,
  permissions: [], // دائماً مصفوفة فارغة
};

export const defaultUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  username: '',
  email: '',
  phone: '',
  avatar: '',
  bio: '',
  active: true,
  roles: [], // دائماً مصفوفة فارغة
};

// أنواع للاستجابات من API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// أنواع للجداول
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface TableAction {
  label: string;
  icon?: string;
  onClick: (item: any) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: (item: any) => boolean;
}