'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Search, Filter, Download, Printer, MoreHorizontal, Eye, Edit, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RoleTableWithSuspense, RoleFormWithSuspense } from '@/components/lazy';
import { preloadComponents } from '@/components/lazy';
import { RoleDetail } from '@/components/erp/roles/role-detail';
import { Role, Permission, SYSTEM_MODULES, createDefaultPermission } from '@/types/roles-permissions';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/use-roles';
import { usePermissions } from '@/hooks/use-permissions';
import { useModulePermissions, usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionDenied, PermissionAlert } from '@/components/ui/permission-denied';

export default function RolesPage() {
  // React Query hooks
  const { data: roles = [], isLoading, error, refetch: refetchRoles } = useRoles();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  
  // Local state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  
  // صلاحيات المستخدم الحالي
  const rolePermissions = useModulePermissions('roles');
  const { requirePermission, showPermissionError } = usePermissionCheck();

  // دالة تحديث البيانات
  const handleRefresh = () => {
    refetchRoles();
  };

  // معالجة الأخطاء
  if (error) {
    toast({
      title: 'خطأ',
      description: 'فشل في تحميل الأدوار',
      variant: 'destructive',
    });
  }

  // الحصول على الصلاحيات
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();

  // حالة التحميل
  if (isLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // إنشاء دور جديد
  const handleCreateRole = async (data: any) => {
    if (!requirePermission('roles', 'edit')) {
      return;
    }
    
    try {
      await createRoleMutation.mutateAsync({
        ...data,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
      });
      toast({
        title: 'نجح',
        description: 'تم إنشاء الدور بنجاح',
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الدور',
        variant: 'destructive',
      });
    }
  };

  // تحديث دور
  const handleUpdateRole = async (data: any) => {
    if (!selectedRole) return;
    
    if (!requirePermission('roles', 'edit')) {
      return;
    }
    
    console.log('📝 handleUpdateRole - البيانات المستلمة:', JSON.stringify(data, null, 2));
    console.log('📝 الدور المحدد:', JSON.stringify(selectedRole, null, 2));
    
    const updateData = {
      id: selectedRole.id,
      ...data,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
    
    console.log('📤 البيانات المرسلة للـ API:', JSON.stringify(updateData, null, 2));
    
    try {
      await updateRoleMutation.mutateAsync(updateData);
      toast({
        title: 'نجح',
        description: 'تم تحديث الدور بنجاح',
      });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('❌ Error updating role:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الدور',
        variant: 'destructive',
      });
    }
  };

  // حذف دور
  const handleDeleteRole = async (roleId: string) => {
    if (!requirePermission('roles', 'delete')) {
      return;
    }
    
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      toast({
        title: 'نجح',
        description: 'تم حذف الدور بنجاح',
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الدور',
        variant: 'destructive',
      });
    }
  };

  // دالة نسخ الدور
  const handleDuplicateRole = (role: Role) => {
    if (!requirePermission('roles', 'duplicate')) {
      return;
    }
    
    console.log('📋 ROLES PAGE: نسخ الدور:', role);
    const duplicatedRole = {
      ...role,
      id: '', // سيتم إنشاء ID جديد
      name: `نسخة من ${role.name}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedRole(duplicatedRole);
    setIsCreateDialogOpen(true);
  };

  // دالة إعتماد الدور
  const handleApproveRole = async (role: Role) => {
    if (!requirePermission('roles', 'approve')) {
      return;
    }
    
    console.log('✅ ROLES PAGE: إعتماد الدور:', role);
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        ...role,
        active: true
      });
      toast({
        title: 'نجح',
        description: 'تم إعتماد الدور بنجاح',
      });
    } catch (error) {
      console.error('❌ ROLES PAGE: خطأ في إعتماد الدور:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إعتماد الدور',
        variant: 'destructive',
      });
    }
  };

  // دالة طباعة الدور
  const handlePrintRole = (role: Role) => {
    if (!requirePermission('roles', 'print')) {
      return;
    }
    
    console.log('🖨️ ROLES PAGE: طباعة الدور:', role);
    // يمكن إضافة منطق الطباعة هنا
    window.print();
  };

  // دالة تصدير جميع الأدوار
  const handleExportRoles = () => {
    if (!requirePermission('roles', 'view')) {
      return;
    }

    try {
      // تحضير البيانات للتصدير
      const exportData = filteredRoles.map(role => ({
        'اسم الدور': role.name,
        'الوصف': role.description || '',
        'الحالة': role.active ? 'نشط' : 'غير نشط',
        'عدد الصلاحيات': role.permissions?.length || 0,
        'تاريخ الإنشاء': role.createdAt ? format(new Date(role.createdAt), 'dd/MM/yyyy', { locale: ar }) : '',
        'آخر تحديث': role.updatedAt ? format(new Date(role.updatedAt), 'dd/MM/yyyy', { locale: ar }) : ''
      }));

      // تحويل إلى CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // تحميل الملف
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `الأدوار_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'نجح',
        description: 'تم تصدير الأدوار بنجاح',
      });
    } catch (error) {
      console.error('❌ خطأ في تصدير الأدوار:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير الأدوار',
        variant: 'destructive',
      });
    }
  };

  // دالة طباعة جميع الأدوار
  const handlePrintAllRoles = () => {
    if (!requirePermission('roles', 'print')) {
      return;
    }

    try {
      // إنشاء محتوى الطباعة
      const printContent = `
        <html>
          <head>
            <title>قائمة الأدوار</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: #f2f2f2; }
              h1 { text-align: center; color: #333; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>قائمة الأدوار</h1>
              <p>تاريخ الطباعة: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>اسم الدور</th>
                  <th>الوصف</th>
                  <th>الحالة</th>
                  <th>عدد الصلاحيات</th>
                  <th>تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRoles.map(role => `
                  <tr>
                    <td>${role.name}</td>
                    <td>${role.description || '-'}</td>
                    <td>${role.active ? 'نشط' : 'غير نشط'}</td>
                    <td>${role.permissions?.length || 0}</td>
                    <td>${role.createdAt ? format(new Date(role.createdAt), 'dd/MM/yyyy', { locale: ar }) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // فتح نافذة طباعة جديدة
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      toast({
        title: 'نجح',
        description: 'تم إعداد الطباعة بنجاح',
      });
    } catch (error) {
      console.error('❌ خطأ في طباعة الأدوار:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في طباعة الأدوار',
        variant: 'destructive',
      });
    }
  };

  // تصفية الأدوار بناءً على البحث
  const filteredRoles = (roles || []).filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // التحقق من صلاحية الوصول للموديول
  if (!rolePermissions.view) {
    return (
      <PermissionDenied 
        module="الأدوار" 
        action="عرض" 
        description="ليس لديك صلاحية للوصول إلى إدارة الأدوار"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الأدوار</h1>
          <p className="text-muted-foreground">إدارة أدوار المستخدمين والصلاحيات</p>
        </div>
        {rolePermissions.create && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                إضافة دور جديد
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة دور جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الدور الجديد واختر الصلاحيات المناسبة
              </DialogDescription>
            </DialogHeader>
            <RoleFormWithSuspense
              permissions={permissions || []}
              onSubmit={handleCreateRole}
              loading={isLoading}
            />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
          <CardDescription>ابحث عن الأدوار أو قم بتصفيتها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الأدوار..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              تصفية
            </Button>
            <Button variant="outline" onClick={handleExportRoles}>
              <Download className="mr-2 h-4 w-4" />
              تصدير
            </Button>
            <Button variant="outline" onClick={handlePrintAllRoles}>
              <Printer className="mr-2 h-4 w-4" />
              طباعة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => {
          // حساب العدد الإجمالي للإجراءات المتاحة (فقط التي لها قيم)
          const totalActionsCount = role.permissions?.reduce((total, permission) => {
            // عد فقط الإجراءات التي لها قيم (سواء true أو false)
            const actionsWithValues = Object.entries(permission.actions || {})
              .filter(([key, value]) => value !== undefined && value !== null).length;
            return total + actionsWithValues;
          }, 0) || 0;
          
          // حساب عدد الإجراءات المفعلة فعلياً (التي قيمتها true)
          const activePermissionsCount = role.permissions?.reduce((count, permission) => {
            const activeActions = Object.values(permission.actions || {})
              .filter(action => action === true).length;
            return count + activeActions;
          }, 0) || 0;
          
          return (
            <Card key={role.id} className="relative hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-right mb-2">
                      {role.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground text-right">
                      {role.description || 'لا يوجد وصف'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {rolePermissions.view && (
                        <DropdownMenuItem onClick={() => {
                          setSelectedRole(role);
                          setIsDetailDialogOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                      )}
                      {rolePermissions.edit && (
                        <DropdownMenuItem onClick={() => {
                          setSelectedRole(role);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                      )}
                      {rolePermissions.duplicate && (
                        <DropdownMenuItem onClick={() => handleDuplicateRole(role)}>
                          <Copy className="mr-2 h-4 w-4" />
                          نسخ
                        </DropdownMenuItem>
                      )}
                      {rolePermissions.approve && (
                        <DropdownMenuItem onClick={() => handleApproveRole(role)}>
                          <Check className="mr-2 h-4 w-4" />
                          اعتماد
                        </DropdownMenuItem>
                      )}
                      {rolePermissions.print && (
                        <DropdownMenuItem onClick={() => handlePrintRole(role)}>
                          <Printer className="mr-2 h-4 w-4" />
                          طباعة
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {rolePermissions.delete && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* حالة الدور */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الحالة:</span>
                    <Badge variant={role.active ? "default" : "secondary"}>
                      {role.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  
                  {/* عدد الصلاحيات */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الصلاحيات:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {activePermissionsCount}/{totalActionsCount}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => {
                          const percentage = totalActionsCount > 0 ? (activePermissionsCount / totalActionsCount) * 10 : 0;
                          return (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < Math.floor(percentage)
                                  ? 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* تاريخ الإنشاء */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
                    <span className="text-sm">
                      {role.createdAt ? format(new Date(role.createdAt), 'dd/MM/yyyy', { locale: ar }) : 'غير محدد'}
                    </span>
                  </div>
                  
                  {/* آخر تحديث */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">آخر تحديث:</span>
                    <span className="text-sm">
                      {role.updatedAt ? format(new Date(role.updatedAt), 'dd/MM/yyyy', { locale: ar }) : 'غير محدد'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* رسالة عدم وجود أدوار */}
      {filteredRoles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد أدوار</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'لم يتم العثور على أدوار تطابق البحث' : 'لم يتم إنشاء أي أدوار بعد'}
              </p>
              {!searchTerm && rolePermissions.create && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة دور جديد
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الدور</DialogTitle>
            <DialogDescription>
              تعديل بيانات الدور وصلاحياته
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <RoleFormWithSuspense
              initialData={selectedRole}
              permissions={permissions || []}
              onSubmit={handleUpdateRole}
              loading={isLoading}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الدور</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الدور وصلاحياته
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <RoleDetail
              role={selectedRole}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}