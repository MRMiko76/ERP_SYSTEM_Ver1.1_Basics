// أنواع البيانات الجديدة لنظام إدارة الأدوار والصلاحيات
// مبنية وفقاً للمتطلبات الجديدة مع ضمان الاستقرار والوضوح

/**
 * الإجراءات الأساسية المتاحة لكل موديول
 * الإجراءات الموحدة: عرض، تعديل، إعتماد، نسخ، مسح، طباعة
 */
export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'duplicate' | 'approve' | 'print';

/**
 * بنية الإجراءات لكل موديول
 * تشمل جميع الإجراءات الموحدة المطلوبة
 */
export interface ModuleActions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  duplicate: boolean;
  approve: boolean;
  print: boolean;
}

/**
 * صلاحية واحدة تحتوي على موديول والإجراءات المسموحة
 */
export interface Permission {
  module: string;
  actions: ModuleActions;
}

/**
 * دور يحتوي على معرف واسم وقائمة الصلاحيات
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  permissions: Permission[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * بيانات إنشاء دور جديد
 */
export interface CreateRoleData {
  name: string;
  description?: string;
  active: boolean;
  permissions: Permission[];
}

/**
 * بيانات تحديث دور موجود
 */
export interface UpdateRoleData extends CreateRoleData {
  id: string;
}

/**
 * تعريف موديول في النظام
 */
export interface SystemModule {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category?: string;
  active: boolean;
}

/**
 * الموديولات المتاحة في النظام
 */
export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    displayName: 'الداش بورد',
    description: 'لوحة التحكم الرئيسية والإحصائيات',
    category: 'الرئيسية',
    active: true
  },
  {
    id: 'users',
    name: 'users',
    displayName: 'إدارة المستخدمين',
    description: 'إدارة حسابات المستخدمين والموظفين',
    category: 'إدارة النظام',
    active: true
  },
  {
    id: 'roles',
    name: 'roles',
    displayName: 'إدارة الأدوار',
    description: 'إدارة أدوار المستخدمين والصلاحيات',
    category: 'إدارة النظام',
    active: true
  },
  {
    id: 'products',
    name: 'products',
    displayName: 'إدارة المنتجات',
    description: 'إدارة كتالوج المنتجات والخدمات',
    category: 'المخزون',
    active: true
  },
  {
    id: 'inventory',
    name: 'inventory',
    displayName: 'إدارة المخزون',
    description: 'تتبع المخزون والكميات',
    category: 'المخزون',
    active: true
  },
  {
    id: 'sales',
    name: 'sales',
    displayName: 'إدارة المبيعات',
    description: 'إدارة عمليات البيع والفواتير',
    category: 'المبيعات',
    active: true
  },
  {
    id: 'purchases',
    name: 'purchases',
    displayName: 'إدارة المشتريات',
    description: 'إدارة عمليات الشراء والموردين',
    category: 'المشتريات',
    active: true
  },
  {
    id: 'customers',
    name: 'customers',
    displayName: 'إدارة العملاء',
    description: 'إدارة بيانات العملاء والعلاقات',
    category: 'العلاقات',
    active: true
  },
  {
    id: 'suppliers',
    name: 'suppliers',
    displayName: 'إدارة الموردين',
    description: 'إدارة بيانات الموردين والعلاقات',
    category: 'العلاقات',
    active: true
  },
  {
    id: 'accounting',
    name: 'accounting',
    displayName: 'المحاسبة',
    description: 'إدارة الحسابات والقيود المحاسبية',
    category: 'المالية',
    active: true
  },
  {
    id: 'reports',
    name: 'reports',
    displayName: 'التقارير',
    description: 'إنشاء وعرض التقارير المختلفة',
    category: 'التقارير',
    active: true
  },
  {
    id: 'settings',
    name: 'settings',
    displayName: 'إعدادات النظام',
    description: 'إعدادات عامة للنظام',
    category: 'إدارة النظام',
    active: true
  }
];

/**
 * تسميات الإجراءات باللغة العربية
 * الإجراءات الموحدة النهائية
 */
export const ACTION_LABELS: Record<ActionType, string> = {
  view: 'عرض',
  create: 'إضافة',
  edit: 'تعديل',
  delete: 'مسح',
  duplicate: 'نسخ',
  approve: 'إعتماد',
  print: 'طباعة'
};

/**
 * إنشاء إجراءات افتراضية (جميعها معطلة)
 */
export const createDefaultActions = (): ModuleActions => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  duplicate: false,
  approve: false,
  print: false
});

/**
 * إنشاء صلاحية افتراضية لموديول
 */
export const createDefaultPermission = (module: string): Permission => ({
  module,
  actions: createDefaultActions()
});

/**
 * إنشاء دور افتراضي
 */
export const createDefaultRole = (): Omit<Role, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '',
  description: '',
  active: true,
  permissions: []
});

/**
 * أدوار افتراضية للنظام
 */
export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'مدير النظام',
    description: 'صلاحيات كاملة على جميع أجزاء النظام',
    active: true,
    permissions: SYSTEM_MODULES.map(module => ({
      module: module.name,
      actions: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        duplicate: true,
        approve: true,
        print: true
      }
    }))
  },
  {
    name: 'مشرف',
    description: 'صلاحيات محدودة للإشراف على العمليات',
    active: true,
    permissions: SYSTEM_MODULES.map(module => ({
      module: module.name,
      actions: {
        view: true,
        create: module.name !== 'settings' && module.name !== 'roles',
        edit: module.name !== 'settings' && module.name !== 'roles',
        delete: false,
        duplicate: module.name === 'products' || module.name === 'customers',
        approve: module.name === 'sales' || module.name === 'purchases',
        print: true
      }
    }))
  },
  {
    name: 'مستخدم عادي',
    description: 'صلاحيات أساسية للعرض والإدخال',
    active: true,
    permissions: SYSTEM_MODULES.map(module => ({
      module: module.name,
      actions: {
        view: module.name !== 'settings' && module.name !== 'roles',
        create: module.name === 'sales' || module.name === 'customers',
        edit: module.name === 'customers',
        delete: false,
        duplicate: false,
        approve: false,
        print: module.name === 'sales' || module.name === 'customers'
      }
    }))
  }
];

/**
 * دوال مساعدة للتحقق من الصلاحيات
 */
export const hasPermission = (role: Role, module: string, action: ActionType): boolean => {
  const permission = role.permissions.find(p => p.module === module);
  return permission ? permission.actions[action] : false;
};

export const hasAnyPermission = (role: Role, module: string): boolean => {
  const permission = role.permissions.find(p => p.module === module);
  if (!permission) return false;
  
  return Object.values(permission.actions).some(action => action === true);
};

export const getAllowedActions = (role: Role, module: string): ActionType[] => {
  const permission = role.permissions.find(p => p.module === module);
  if (!permission) return [];
  
  return (Object.keys(permission.actions) as ActionType[])
    .filter(action => permission.actions[action]);
};