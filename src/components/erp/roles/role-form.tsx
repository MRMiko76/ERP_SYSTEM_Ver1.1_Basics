'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Role, 
  Permission, 
  ActionType, 
  SYSTEM_MODULES, 
  ACTION_LABELS,
  createDefaultPermission 
} from '@/types/roles-permissions';
import { Search, Shield, Users, Settings, FileText, Database, Home, ShoppingCart, Factory, Package, Warehouse, TrendingUp } from 'lucide-react';

// دالة مساعدة لضمان أن permissions مصفوفة آمنة
const safePermissions = (permissions: any): Permission[] => {
  if (!Array.isArray(permissions)) {
    return [];
  }
  return permissions.filter(p => p && typeof p === 'object');
};

// قيم افتراضية آمنة
const defaultRole: Partial<Role> = {
  name: '',
  description: '',
  active: true,
  permissions: [],
};

// Schema للتحقق من صحة البيانات - محدث للإجراءات الموحدة
const roleFormSchema = z.object({
  name: z.string().min(1, 'اسم الدور مطلوب').max(50, 'اسم الدور يجب أن يكون أقل من 50 حرف'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  permissions: z.array(z.object({
    module: z.string(),
    actions: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
      duplicate: z.boolean(),
      approve: z.boolean(),
      print: z.boolean(),
    })
  })).default([]).refine((permissions) => {
    // التحقق من وجود صلاحية واحدة على الأقل مفعلة
    const hasAnyPermission = permissions.some(permission => 
      Object.values(permission.actions).some(action => action === true)
    );
    return hasAnyPermission;
  }, {
    message: 'يجب تحديد صلاحية واحدة على الأقل للدور'
  }),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  initialData?: Role;
  permissions: Permission[]; // مطلوب ودائماً مصفوفة
  onSubmit: (data: RoleFormData) => void;
  loading?: boolean;
  isEdit?: boolean;
}

export function RoleForm({
  initialData,
  permissions = [], // قيمة افتراضية آمنة
  onSubmit,
  loading = false,
  isEdit = false,
}: RoleFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // تهيئة النموذج مع قيم افتراضية آمنة
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialData?.name || defaultRole.name,
      description: initialData?.description || defaultRole.description,
      active: initialData?.active ?? true,
      // تهيئة الصلاحيات - إما من البيانات الأولية أو إنشاء صلاحيات افتراضية
      permissions: initialData?.permissions && initialData.permissions.length > 0 ? 
        initialData.permissions : 
        SYSTEM_MODULES.map(module => createDefaultPermission(module.name)),
    },
  });

  // مراقبة التغييرات في الصلاحيات المحددة
  const selectedPermissions = form.watch('permissions') || [];

  // إعادة تعيين النموذج عند تغيير البيانات الأولية
  useEffect(() => {
    if (initialData && isEdit) {
      console.log('🔄 إعادة تعيين النموذج للتعديل:', JSON.stringify(initialData, null, 2));
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        active: initialData.active ?? true,
        permissions: initialData.permissions && initialData.permissions.length > 0 ? 
          initialData.permissions : 
          SYSTEM_MODULES.map(module => createDefaultPermission(module.name)),
      });
    }
  }, [initialData, isEdit, form]);

  // دوال التحكم في الصلاحيات
  const updatePermission = (moduleId: string, action: ActionType, value: boolean) => {
    const updatedPermissions = selectedPermissions.map(permission => {
      if (permission.module === moduleId) {
        return {
          ...permission,
          actions: {
            ...permission.actions,
            [action]: value
          }
        };
      }
      return permission;
    });
    form.setValue('permissions', updatedPermissions);
  };

  const toggleAllPermissionsForModule = (moduleId: string, enabled: boolean) => {
    const updatedPermissions = selectedPermissions.map(permission => {
      if (permission.module === moduleId) {
        return {
          ...permission,
          actions: {
            view: enabled,
            create: enabled,
            edit: enabled,
            delete: enabled,
            duplicate: enabled,
            approve: enabled,
            print: enabled,
          }
        };
      }
      return permission;
    });
    form.setValue('permissions', updatedPermissions);
  };

  // الحصول على قائمة الوحدات
  const modules = SYSTEM_MODULES;
  
  // تصفية الوحدات حسب البحث والتصفية
  const filteredModules = modules.filter(module => {
    const matchesSearch = searchTerm === '' || 
      module.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = selectedModule === 'all' || module.name === selectedModule;
    
    return matchesSearch && matchesModule;
  });

  // دالة للتحقق من حالة تحديد الوحدة
  const getModuleSelectionStatus = (moduleId: string) => {
    const modulePermission = selectedPermissions.find(p => p.module === moduleId);
    if (!modulePermission) return 'none';
    
    const actions = Object.values(modulePermission.actions);
    const selectedCount = actions.filter(Boolean).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === actions.length) return 'all';
    return 'partial';
  };

  // دالة للحصول على عدد الصلاحيات المحددة في الوحدة
  const getSelectedPermissionsCount = (moduleId: string) => {
    const modulePermission = selectedPermissions.find(p => p.module === moduleId);
    if (!modulePermission) return 0;
    return Object.values(modulePermission.actions).filter(Boolean).length;
  };

  // دالة للتحقق من تحديد إجراء معين في وحدة
  const isActionSelected = (moduleId: string, action: ActionType) => {
    const modulePermission = selectedPermissions.find(p => p.module === moduleId);
    return modulePermission?.actions[action] || false;
  };

  // دالة للحصول على أيقونة الوحدة
  const getModuleIcon = (moduleId: string) => {
    const icons: Record<string, any> = {
      dashboard: Home,
      users: Users,
      roles: Shield,
      purchasing: ShoppingCart,
      manufacturing: Factory,
      packaging: Package,
      warehouses: Warehouse,
      sales: TrendingUp,
      reports: FileText,
      settings: Settings,
      system: Database,
    };
    return icons[moduleId] || Shield;
  };

  const handleSubmit = (data: RoleFormData) => {
    console.log('🔄 RoleForm handleSubmit - البيانات المرسلة:', JSON.stringify(data, null, 2));
    console.log('🔄 نوع العملية:', isEdit ? 'تعديل' : 'إنشاء');
    console.log('🔄 البيانات الأولية:', JSON.stringify(initialData, null, 2));
    
    // ضمان أن البيانات المرسلة آمنة
    onSubmit(data);
  };

  // عرض شاشة التحميل إذا لم تكن الصلاحيات محملة
  if (permissions.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* معلومات الدور الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الدور</CardTitle>
            <CardDescription>
              أدخل المعلومات الأساسية للدور
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الدور *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: مدير النظام" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف مختصر لدور المستخدم وصلاحياته"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">تفعيل الدور</FormLabel>
                    <FormDescription>
                      تحديد ما إذا كان الدور نشطاً ويمكن تعيينه للمستخدمين
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* الصلاحيات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Shield className="h-5 w-5" />
              <span>الصلاحيات</span>
              <Badge variant="outline">
                {selectedPermissions.reduce((count, p) => count + Object.values(p.actions).filter(Boolean).length, 0)} صلاحية محددة
              </Badge>
            </CardTitle>
            <CardDescription>
              اختر الصلاحيات التي يمتلكها هذا الدور. يجب تحديد صلاحية واحدة على الأقل لإنشاء الدور.
            </CardDescription>
            {form.formState.errors.permissions && (
              <div className="text-sm text-red-500 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Shield className="h-4 w-4" />
                  <span>{form.formState.errors.permissions.message}</span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* البحث والتصفية */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في الوحدات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الوحدات</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module.name} value={module.name}>
                      {module.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* أزرار التحديد السريع */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Shield className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">إجراءات سريعة:</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedPermissions = selectedPermissions.map(permission => ({
                      ...permission,
                      actions: {
                        view: true,
                        create: true,
                        edit: true,
                        delete: true,
                        duplicate: true,
                        approve: true,
                        print: true,
                      }
                    }));
                    form.setValue('permissions', updatedPermissions);
                  }}
                  className="text-xs"
                >
                  تحديد الكل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedPermissions = selectedPermissions.map(permission => ({
                      ...permission,
                      actions: {
                        view: false,
                        create: false,
                        edit: false,
                        delete: false,
                        duplicate: false,
                        approve: false,
                        print: false,
                      }
                    }));
                    form.setValue('permissions', updatedPermissions);
                  }}
                  className="text-xs"
                >
                  إلغاء تحديد الكل
                </Button>
              </div>
            </div>

            <Separator />

            {/* عرض الصلاحيات مجمعة حسب الوحدة */}
            <div className="space-y-4">
              {filteredModules.map(module => {
                const ModuleIcon = getModuleIcon(module.name);
                const selectionStatus = getModuleSelectionStatus(module.name);
                const selectedCount = getSelectedPermissionsCount(module.name);
                
                return (
                  <Card key={module.name} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Checkbox
                            checked={selectionStatus === 'all'}
                            ref={(ref) => {
                              if (ref) {
                                ref.indeterminate = selectionStatus === 'partial';
                              }
                            }}
                            onCheckedChange={(checked) => 
                              toggleAllPermissionsForModule(module.name, checked as boolean)
                            }
                          />
                          <ModuleIcon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-lg">{module.displayName}</h3>
                            {module.description && (
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={selectedCount > 0 ? 'default' : 'outline'}>
                          {selectedCount} / {Object.keys(ACTION_LABELS).length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(Object.keys(ACTION_LABELS) as ActionType[]).map(action => (
                          <div key={action} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              checked={isActionSelected(module.name, action)}
                              onCheckedChange={(checked) => 
                                updatePermission(module.name, action, checked as boolean)
                              }
                            />
                            <label className="text-sm font-medium cursor-pointer">
                              {ACTION_LABELS[action]}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredModules.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد وحدات</h3>
                <p className="text-muted-foreground">لم يتم العثور على أي وحدات تطابق البحث</p>
              </div>
            )}

            {/* رسالة توضيحية عند عدم تحديد أي صلاحيات */}
            {selectedPermissions.reduce((count, p) => count + Object.values(p.actions).filter(Boolean).length, 0) === 0 && filteredModules.length > 0 && (
              <div className="text-center py-6 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">لم يتم تحديد أي صلاحيات</h3>
                <p className="text-blue-700 text-sm">يرجى تحديد صلاحية واحدة على الأقل من الوحدات أعلاه لإنشاء الدور</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex items-center justify-end space-x-4 space-x-reverse">
          <Button type="button" variant="outline" disabled={loading}>
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </div>
            ) : (
              isEdit ? 'تحديث الدور' : 'إنشاء الدور'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}