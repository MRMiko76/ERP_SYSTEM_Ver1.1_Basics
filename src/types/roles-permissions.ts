// أنواع البيانات الجديدة لنظام إدارة الأدوار والصلاحيات
// مبنية وفقاً للمتطلبات الجديدة مع ضمان الاستقرار والوضوح

/**
 * الإجراءات الأساسية المتاحة لكل موديول
 * الإجراءات الموحدة: عرض، تعديل، إعتماد، نسخ، مسح، طباعة
 */
export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'duplicate' | 'approve' | 'print';

/**
 * صفحة واحدة داخل قسم معين
 */
export interface SystemPage {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  module: string; // ربط بالموديول الأساسي
  href: string;
  icon?: string;
  active: boolean;
}

/**
 * قسم يحتوي على مجموعة من الصفحات
 */
export interface SystemSection {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  pages: SystemPage[];
  active: boolean;
}

/**
 * صلاحية صفحة تحتوي على الإجراءات المسموحة
 */
export interface PagePermission {
  pageId: string;
  actions: ModuleActions;
}

/**
 * صلاحية قسم تحتوي على صلاحيات الصفحات
 */
export interface SectionPermission {
  sectionId: string;
  pages: PagePermission[];
}

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
 * صلاحية واحدة تحتوي على موديول والإجراءات المسموحة (للتوافق مع النظام القديم)
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
  // البنية الهرمية الجديدة
  hierarchicalPermissions?: SectionPermission[];
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
  hierarchicalPermissions?: SectionPermission[];
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
    id: 'purchase-orders',
    name: 'purchase-orders',
    displayName: 'أوامر الشراء',
    description: 'إدارة أوامر الشراء واعتمادها',
    category: 'المشتريات',
    active: true
  },
  {
    id: 'raw-materials',
    name: 'raw-materials',
    displayName: 'إدارة الخامات',
    description: 'إدارة المواد الخام والمخزون',
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
 * البنية الهرمية للأقسام والصفحات
 */
export const SYSTEM_SECTIONS: SystemSection[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    displayName: 'لوحة التحكم',
    description: 'الصفحة الرئيسية ولوحة التحكم',
    icon: 'LayoutDashboard',
    pages: [
      {
        id: 'dashboard-main',
        name: 'dashboard',
        displayName: 'لوحة التحكم',
        module: 'dashboard',
        href: '/erp',
        icon: 'LayoutDashboard',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'purchasing',
    name: 'purchasing',
    displayName: 'المشتريات',
    description: 'إدارة عمليات الشراء والموردين',
    icon: 'ShoppingCart',
    pages: [
      {
        id: 'purchase-dashboard',
        name: 'purchase-dashboard',
        displayName: 'لوحة تحكم المشتريات',
        module: 'purchases',
        href: '/erp/purchase',
        icon: 'LayoutDashboard',
        active: true
      },
      {
        id: 'purchase-orders',
        name: 'purchase-orders',
        displayName: 'أوامر الشراء',
        module: 'purchases',
        href: '/erp/purchase/purchase-orders',
        icon: 'FileText',
        active: true
      },
      {
        id: 'suppliers',
        name: 'suppliers',
        displayName: 'الموردين',
        module: 'suppliers',
        href: '/erp/purchase/suppliers',
        icon: 'Users',
        active: true
      },
      {
        id: 'raw-materials',
        name: 'raw-materials',
        displayName: 'الخامات',
        module: 'purchases',
        href: '/erp/raw-materials',
        icon: 'Package',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'manufacturing',
    name: 'manufacturing',
    displayName: 'التصنيع',
    description: 'إدارة عمليات التصنيع والإنتاج',
    icon: 'Settings',
    pages: [
      {
        id: 'production-orders',
        name: 'production-orders',
        displayName: 'أوامر الإنتاج',
        module: 'manufacturing',
        href: '/erp/production-orders',
        icon: 'Cog',
        active: true
      },
      {
        id: 'bom',
        name: 'bom',
        displayName: 'قوائم المواد',
        module: 'manufacturing',
        href: '/erp/bom',
        icon: 'List',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'warehouses',
    name: 'warehouses',
    displayName: 'المخازن',
    description: 'إدارة المخازن والمخزون',
    icon: 'Package',
    pages: [
      {
        id: 'inventory',
        name: 'inventory',
        displayName: 'المخزون',
        module: 'inventory',
        href: '/erp/inventory',
        icon: 'Package',
        active: true
      },
      {
        id: 'products',
        name: 'products',
        displayName: 'المنتجات',
        module: 'products',
        href: '/erp/products',
        icon: 'Box',
        active: true
      },
      {
        id: 'stock-movements',
        name: 'stock-movements',
        displayName: 'حركات المخزون',
        module: 'inventory',
        href: '/erp/stock-movements',
        icon: 'ArrowUpDown',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'sales',
    name: 'sales',
    displayName: 'المبيعات',
    description: 'إدارة عمليات البيع والعملاء',
    icon: 'TrendingUp',
    pages: [
      {
        id: 'sales-orders',
        name: 'sales-orders',
        displayName: 'أوامر البيع',
        module: 'sales',
        href: '/erp/sales-orders',
        icon: 'FileText',
        active: true
      },
      {
        id: 'customers',
        name: 'customers',
        displayName: 'العملاء',
        module: 'customers',
        href: '/erp/customers',
        icon: 'Users',
        active: true
      },
      {
        id: 'sales-invoices',
        name: 'sales-invoices',
        displayName: 'فواتير البيع',
        module: 'sales',
        href: '/erp/sales-invoices',
        icon: 'Receipt',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'finance',
    name: 'finance',
    displayName: 'الماليات',
    description: 'إدارة الحسابات والمعاملات المالية',
    icon: 'DollarSign',
    pages: [
      {
        id: 'accounting',
        name: 'accounting',
        displayName: 'المحاسبة',
        module: 'accounting',
        href: '/erp/accounting',
        icon: 'Calculator',
        active: true
      },
      {
        id: 'payments',
        name: 'payments',
        displayName: 'المدفوعات',
        module: 'accounting',
        href: '/erp/payments',
        icon: 'CreditCard',
        active: true
      },
      {
        id: 'financial-reports',
        name: 'financial-reports',
        displayName: 'التقارير المالية',
        module: 'accounting',
        href: '/erp/financial-reports',
        icon: 'BarChart',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'reports',
    name: 'reports',
    displayName: 'التقارير',
    description: 'تقارير النظام والإحصائيات',
    icon: 'BarChart3',
    pages: [
      {
        id: 'sales-reports',
        name: 'sales-reports',
        displayName: 'تقارير المبيعات',
        module: 'reports',
        href: '/erp/reports/sales',
        icon: 'TrendingUp',
        active: true
      },
      {
        id: 'inventory-reports',
        name: 'inventory-reports',
        displayName: 'تقارير المخزون',
        module: 'reports',
        href: '/erp/reports/inventory',
        icon: 'Package',
        active: true
      },
      {
        id: 'financial-reports-main',
        name: 'financial-reports-main',
        displayName: 'التقارير المالية',
        module: 'reports',
        href: '/erp/reports/financial',
        icon: 'DollarSign',
        active: true
      }
    ],
    active: true
  },
  {
    id: 'settings',
    name: 'settings',
    displayName: 'الإعدادات',
    description: 'إعدادات النظام العامة',
    icon: 'Settings',
    pages: [
      {
        id: 'users',
        name: 'users',
        displayName: 'إدارة المستخدمين',
        module: 'users',
        href: '/erp/users',
        icon: 'Users',
        active: true
      },
      {
        id: 'roles',
        name: 'roles',
        displayName: 'إدارة الأدوار',
        module: 'roles',
        href: '/erp/roles',
        icon: 'Shield',
        active: true
      },
      {
        id: 'system-settings',
        name: 'system-settings',
        displayName: 'إعدادات النظام',
        module: 'settings',
        href: '/erp/settings',
        icon: 'Settings',
        active: true
      }
    ],
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

/**
 * دوال مساعدة للبنية الهرمية الجديدة
 */

/**
 * التحقق من وجود صلاحية صفحة معينة
 */
export function hasPagePermission(role: Role, sectionId: string, pageId: string, action: ActionType): boolean {
  if (!role.hierarchicalPermissions) return false;
  
  const sectionPermission = role.hierarchicalPermissions.find(s => s.sectionId === sectionId);
  if (!sectionPermission) return false;
  
  const pagePermission = sectionPermission.pages.find(p => p.pageId === pageId);
  return pagePermission ? pagePermission.actions[action] : false;
}

/**
 * التحقق من وجود أي صلاحية في قسم معين
 */
export function hasAnySectionPermission(role: Role, sectionId: string): boolean {
  if (!role.hierarchicalPermissions) return false;
  
  const sectionPermission = role.hierarchicalPermissions.find(s => s.sectionId === sectionId);
  if (!sectionPermission) return false;
  
  return sectionPermission.pages.some(page => 
    Object.values(page.actions).some(action => action === true)
  );
}

/**
 * الحصول على الصفحات المسموحة في قسم معين
 */
export function getAllowedPages(role: Role, sectionId: string): string[] {
  if (!role.hierarchicalPermissions) return [];
  
  const sectionPermission = role.hierarchicalPermissions.find(s => s.sectionId === sectionId);
  if (!sectionPermission) return [];
  
  return sectionPermission.pages
    .filter(page => Object.values(page.actions).some(action => action === true))
    .map(page => page.pageId);
}

/**
 * تحويل الصلاحيات الهرمية إلى صلاحيات تقليدية للتوافق مع النظام القديم
 */
export function convertHierarchicalToTraditional(hierarchicalPermissions: SectionPermission[]): Permission[] {
  const permissions: Permission[] = [];
  
  hierarchicalPermissions.forEach(section => {
    section.pages.forEach(page => {
      const systemPage = SYSTEM_SECTIONS
        .find(s => s.id === section.sectionId)?.pages
        .find(p => p.id === page.pageId);
      
      if (systemPage) {
        permissions.push({
          module: systemPage.module,
          actions: page.actions
        });
      }
    });
  });
  
  return permissions;
}

/**
 * تحويل الصلاحيات التقليدية إلى صلاحيات هرمية
 */
export function convertTraditionalToHierarchical(permissions: Permission[]): SectionPermission[] {
  const sectionPermissions: SectionPermission[] = [];
  
  SYSTEM_SECTIONS.forEach(section => {
    const sectionPages: PagePermission[] = [];
    
    section.pages.forEach(page => {
      const permission = permissions.find(p => p.module === page.module);
      if (permission) {
        sectionPages.push({
          pageId: page.id,
          actions: permission.actions
        });
      }
    });
    
    if (sectionPages.length > 0) {
      sectionPermissions.push({
        sectionId: section.id,
        pages: sectionPages
      });
    }
  });
  
  return sectionPermissions;
}