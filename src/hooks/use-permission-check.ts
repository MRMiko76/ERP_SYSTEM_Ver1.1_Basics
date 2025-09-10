'use client';

import { useAuth } from '@/contexts/auth-context';
import { ActionType } from '@/types/roles-permissions';
import { useToast } from '@/hooks/use-toast';
import { useUserPermissions } from '@/hooks/use-permissions';

interface PermissionCheckResult {
  hasPermission: boolean;
  checkPermission: (module: string, action: ActionType) => boolean;
  requirePermission: (module: string, action: ActionType, showToast?: boolean) => boolean;
  showPermissionError: (module: string, action: ActionType) => void;
}

export function usePermissionCheck(): PermissionCheckResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: userPermissions } = useUserPermissions();

  // دالة للتحقق من الصلاحية
  const checkPermission = (module: string, action: ActionType): boolean => {
    // في حالة عدم وجود مستخدم، لا توجد صلاحيات
    if (!user) {
      return false;
    }

    // للمطورين أو مديري النظام، إعطاء جميع الصلاحيات
    if (user.email === 'admin@example.com' || user.email === 'admin@system.com') {
      return true;
    }

    // إذا لم يتم تحميل الصلاحيات بعد، منع الوصول
    if (!userPermissions) {
      return false;
    }

    // التحقق من الصلاحيات الفعلية من قاعدة البيانات
    const modulePermissions = userPermissions.groupedPermissions?.[module];
    if (!modulePermissions || modulePermissions.length === 0) {
      return false;
    }

    // تحويل action إلى التنسيق المستخدم في قاعدة البيانات
    let dbAction = action;
    if (action === 'view') dbAction = 'read';
    if (action === 'edit') dbAction = 'update';

    // البحث عن الصلاحية المطلوبة
    const hasPermission = modulePermissions.some((permission: any) => 
      permission.action === dbAction
    );

    return hasPermission;
  };

  // دالة للتحقق من الصلاحية مع إظهار رسالة خطأ
  const requirePermission = (module: string, action: ActionType, showToast: boolean = true): boolean => {
    const hasPermission = checkPermission(module, action);
    
    if (!hasPermission && showToast) {
      showPermissionError(module, action);
    }
    
    return hasPermission;
  };

  // دالة لإظهار رسالة خطأ الصلاحية
  const showPermissionError = (module: string, action: ActionType) => {
    const actionLabels: Record<ActionType, string> = {
      view: 'العرض',
      create: 'الإنشاء',
      edit: 'التعديل',
      delete: 'الحذف',
      duplicate: 'النسخ',
      approve: 'الإعتماد',
      print: 'الطباعة',
    };

    const moduleLabels: Record<string, string> = {
      dashboard: 'لوحة التحكم',
      users: 'المستخدمين',
      roles: 'الأدوار',
      products: 'المنتجات',
      sales: 'المبيعات',
      purchases: 'المشتريات',
      customers: 'العملاء',
      suppliers: 'الموردين',
      inventory: 'المخزون',
      reports: 'التقارير',
      settings: 'الإعدادات',
    };

    toast({
      title: 'غير مخول للوصول',
      description: `ليس لديك صلاحية ${actionLabels[action] || action} في قسم ${moduleLabels[module] || module}.`,
      variant: 'destructive',
    });
  };

  return {
    hasPermission: !!user,
    checkPermission,
    requirePermission,
    showPermissionError,
  };
}

// Hook مبسط للتحقق من صلاحية واحدة
export function useHasPermission(module: string, action: ActionType): boolean {
  const { checkPermission } = usePermissionCheck();
  return checkPermission(module, action);
}

// Hook للحصول على صلاحيات موديول كامل
export function useModulePermissions(module: string) {
  const { checkPermission } = usePermissionCheck();
  
  return {
     view: checkPermission(module, 'view'),
     edit: checkPermission(module, 'edit'),
     delete: checkPermission(module, 'delete'),
     duplicate: checkPermission(module, 'duplicate'),
     approve: checkPermission(module, 'approve'),
     print: checkPermission(module, 'print'),
     create: checkPermission(module, 'create'), // استخدام صلاحية الإنشاء الفعلية
     resetPassword: checkPermission(module, 'update'), // صلاحية إعادة تعيين كلمة المرور
   };
}