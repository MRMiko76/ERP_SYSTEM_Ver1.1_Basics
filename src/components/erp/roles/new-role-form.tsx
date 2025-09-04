'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Role,
  CreateRoleData,
  UpdateRoleData,
  Permission,
  ModuleActions,
  ActionType,
  SYSTEM_MODULES,
  ACTION_LABELS,
  createDefaultActions,
  createDefaultPermission
} from '@/types/roles-permissions';

// Schema للتحقق من صحة البيانات
const roleFormSchema = z.object({
  name: z.string().min(2, 'اسم الدور يجب أن يكون على الأقل حرفين'),
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
      approve: z.boolean()
    })
  })).default([])
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface NewRoleFormProps {
  initialData?: Role;
  onSubmit: (data: CreateRoleData | UpdateRoleData) => Promise<void>;
  loading?: boolean;
  isEdit?: boolean;
}

export function NewRoleForm({ initialData, onSubmit, loading = false, isEdit = false }: NewRoleFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // تحويل البيانات من تنسيق API إلى تنسيق النموذج
  const convertApiDataToFormData = (data: any) => {
    if (!data) return SYSTEM_MODULES.map(module => createDefaultPermission(module.name));
    
    // إذا كانت البيانات تحتوي على actionPermissions (من API)
    if (data.actionPermissions) {
      return SYSTEM_MODULES.map(module => {
        const modulePermissions = data.actionPermissions[module.name] || {};
        return {
          module: module.name,
          actions: {
            view: modulePermissions.read || modulePermissions.view || false,
            create: modulePermissions.create || false,
            edit: modulePermissions.update || modulePermissions.edit || false,
            delete: modulePermissions.delete || false,
            duplicate: modulePermissions.duplicate || false,
            approve: modulePermissions.approve || false
          }
        };
      });
    }
    
    // إذا كانت البيانات تحتوي على permissions (التنسيق الصحيح)
    if (data.permissions) {
      return data.permissions;
    }
    
    // افتراضي
    return SYSTEM_MODULES.map(module => createDefaultPermission(module.name));
  };

  // إعداد النموذج
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      active: initialData?.active ?? true,
      permissions: convertApiDataToFormData(initialData)
    }
  });

  const { watch, setValue } = form;
  const permissions = watch('permissions');

  // تصفية الموديولات حسب البحث والفئة
  const filteredModules = SYSTEM_MODULES.filter(module => {
    const matchesSearch = module.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory && module.active;
  });

  // الحصول على الفئات المتاحة
  const categories = ['all', ...Array.from(new Set(SYSTEM_MODULES.map(m => m.category)))];

  // دوال التحكم في الصلاحيات
  const updatePermission = (moduleId: string, action: ActionType, value: boolean) => {
    const updatedPermissions = permissions.map(permission => {
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
    setValue('permissions', updatedPermissions);
  };

  const toggleModuleAll = (moduleId: string, enable: boolean) => {
    const updatedPermissions = permissions.map(permission => {
      if (permission.module === moduleId) {
        const newActions = createDefaultActions();
        if (enable) {
          Object.keys(newActions).forEach(action => {
            newActions[action as ActionType] = true;
          });
        }
        return {
          ...permission,
          actions: newActions
        };
      }
      return permission;
    });
    setValue('permissions', updatedPermissions);
  };

  const isModuleFullySelected = (moduleId: string): boolean => {
    const permission = permissions.find(p => p.module === moduleId);
    if (!permission) return false;
    return Object.values(permission.actions).every(action => action === true);
  };

  const isModulePartiallySelected = (moduleId: string): boolean => {
    const permission = permissions.find(p => p.module === moduleId);
    if (!permission) return false;
    const actions = Object.values(permission.actions);
    return actions.some(action => action === true) && !actions.every(action => action === true);
  };

  const getPermissionValue = (moduleId: string, action: ActionType): boolean => {
    const permission = permissions.find(p => p.module === moduleId);
    return permission ? permission.actions[action] : false;
  };

  // معالج الإرسال
  const handleSubmit = async (data: RoleFormData) => {
    try {
      const submitData = {
        ...data,
        permissions: data.permissions.filter(p => 
          Object.values(p.actions).some(action => action === true)
        )
      };

      if (isEdit && initialData) {
        await onSubmit({ ...submitData, id: initialData.id } as UpdateRoleData);
      } else {
        await onSubmit(submitData as CreateRoleData);
      }
    } catch (error) {
      console.error('خطأ في حفظ الدور:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* معلومات الدور الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الدور</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الدور *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم الدور" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>حالة الدور</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'نشط' : 'غير نشط'}
                      </div>
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
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف الدور</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أدخل وصف للدور (اختياري)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* الصلاحيات */}
        <Card>
          <CardHeader>
            <CardTitle>صلاحيات الدور</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="البحث في الموديولات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md max-w-sm"
              >
                <option value="all">جميع الفئات</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* رأس الجدول */}
              <div className="grid grid-cols-8 gap-2 p-3 bg-muted rounded-lg font-medium text-sm">
                <div className="col-span-2">الموديول</div>
                {(Object.keys(ACTION_LABELS) as ActionType[]).map(action => (
                  <div key={action} className="text-center">{ACTION_LABELS[action]}</div>
                ))}
              </div>
              
              {/* صفوف الموديولات */}
              {filteredModules.map(module => {
                const isFullySelected = isModuleFullySelected(module.name);
                const isPartiallySelected = isModulePartiallySelected(module.name);
                
                return (
                  <div key={module.id} className="grid grid-cols-8 gap-2 p-3 border rounded-lg hover:bg-muted/50">
                    {/* معلومات الموديول */}
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isFullySelected}
                          ref={(ref) => {
                            if (ref) {
                              ref.indeterminate = isPartiallySelected && !isFullySelected;
                            }
                          }}
                          onCheckedChange={(checked) => 
                            toggleModuleAll(module.name, checked === true)
                          }
                        />
                        <span className="font-medium">{module.displayName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {module.description}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {module.category}
                      </Badge>
                    </div>
                    
                    {/* أعمدة الإجراءات */}
                    {(Object.keys(ACTION_LABELS) as ActionType[]).map(action => (
                      <div key={action} className="flex justify-center">
                        <Checkbox
                          checked={getPermissionValue(module.name, action)}
                          onCheckedChange={(checked) => 
                            updatePermission(module.name, action, checked === true)
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
              
              {filteredModules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد موديولات تطابق معايير البحث
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" disabled={loading}>
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث الدور' : 'إنشاء الدور')}
          </Button>
        </div>
      </form>
    </Form>
  );
}