'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { UserTableWithSuspense, UserFormWithSuspense, UserFormDebugWrapper } from '@/components/lazy';
import { preloadComponents } from '@/components/lazy';
import { User, Role, CreateUserData, UpdateUserData, safeRoles, defaultUser } from '@/types/erp';
import { ActionType } from '@/types/roles-permissions';
import { useModulePermissions, usePermissionCheck } from '@/hooks/use-permission-check';
import { PermissionDenied, PermissionAlert } from '@/components/ui/permission-denied';
import { PasswordResetModal } from '@/components/erp/users/password-reset-modal';
import { useToast } from '@/hooks/use-toast';

import { Plus, Users, Search, Filter, Download, RefreshCw, Upload } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function UsersPage() {
  // Component initialization
  
  // React Query hooks
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // صلاحيات المستخدم الحالي
  const userPermissions = useModulePermissions('users');
  const { requirePermission, showPermissionError } = usePermissionCheck();
  const { toast } = useToast();

  // Derived state
  const users = usersData?.users || [];
  const loading = usersLoading || rolesLoading;
  const error = usersError?.message || null;
  const submitting = createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending;

  // Users data loaded

  // Handle refresh
  const handleRefresh = () => {
    refetchUsers();
  };

  // إنشاء مستخدم جديد
  const handleCreateUser = async (data: CreateUserData) => {
    try {
      await createUserMutation.mutateAsync(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
    }
  };

  // تحديث مستخدم
  const handleUpdateUser = async (data: UpdateUserData) => {
    // Update user data
    
    if (!editingUser) {
      console.error('🚀 USERS PAGE: ❌ لا يوجد مستخدم محدد للتعديل');
      return;
    }

    console.log('🔥 USERS PAGE: بدء تحديث المستخدم');
    console.log('🔥 USERS PAGE: معرف المستخدم:', editingUser.id);
    console.log('🔥 USERS PAGE: البيانات المستلمة:', JSON.stringify(data, null, 2));

    try {
      // تنسيق البيانات بالشكل الصحيح لـ useUpdateUser
      const updatePayload = {
        id: editingUser.id,
        ...data
      };
      
      console.log('🔥 USERS PAGE: البيانات المرسلة للـ API:', JSON.stringify(updatePayload, null, 2));
      
      const result = await updateUserMutation.mutateAsync(updatePayload);
      
      console.log('✅ USERS PAGE: تم تحديث المستخدم بنجاح:', result);
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('🚀 USERS PAGE: ❌ خطأ في تحديث المستخدم:', error);
      
      // إضافة تفاصيل أكثر عن الخطأ
      if (error instanceof Error) {
        console.error('🚀 USERS PAGE: ❌ رسالة الخطأ:', error.message);
        console.error('🚀 USERS PAGE: ❌ تفاصيل الخطأ:', error.stack);
      }
      
      // إذا كان الخطأ من axios
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('🚀 USERS PAGE: ❌ استجابة الخادم:', axiosError.response?.data);
        console.error('🚀 USERS PAGE: ❌ حالة الاستجابة:', axiosError.response?.status);
      }
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
    }
  };

  // دالة نسخ المستخدم
  const handleDuplicateUser = (user: User) => {
    if (!requirePermission('users', 'duplicate')) {
      return;
    }
    
    // Copy user data
    const duplicatedUser = {
      ...defaultUser,
      name: `نسخة من ${user.name}`,
      email: `copy_${Date.now()}@${user.email.split('@')[1]}`,
      phone: user.phone,
      roles: user.roles,
    };
    setEditingUser(duplicatedUser);
    setIsEditDialogOpen(true);
  };

  // دالة إعادة تعيين كلمة المرور (للجدول)
  const handleResetPassword = async (user: User) => {
    if (!requirePermission('users', 'update')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إعادة تعيين كلمة المرور');
      }

      setPasswordResetUser(user);
      setNewPassword(data.newPassword);
      setIsPasswordResetModalOpen(true);
      
      toast({
        title: 'تم إعادة تعيين كلمة المرور',
        description: `تم إنشاء كلمة مرور جديدة للمستخدم ${user.name}`,
      });

    } catch (error) {
      toast({
        title: 'خطأ في إعادة تعيين كلمة المرور',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  // دالة إعادة تعيين كلمة المرور (للنموذج)
  const handleResetPasswordFromForm = async (userId: string) => {
    if (!requirePermission('users', 'update')) {
      return;
    }

    // البحث عن المستخدم في القائمة
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'لم يتم العثور على المستخدم',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إعادة تعيين كلمة المرور');
      }

      setPasswordResetUser(user);
      setNewPassword(data.newPassword);
      setIsPasswordResetModalOpen(true);
      
      // إغلاق نموذج التعديل
      setIsEditDialogOpen(false);
      setEditingUser(null);
      
      toast({
        title: 'تم إعادة تعيين كلمة المرور',
        description: `تم إنشاء كلمة مرور جديدة للمستخدم ${user.name}`,
      });

    } catch (error) {
      toast({
        title: 'خطأ في إعادة تعيين كلمة المرور',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  // دالة نسخ كلمة المرور
  const handleCopyPassword = () => {
    toast({
      title: 'تم نسخ كلمة المرور',
      description: 'تم نسخ كلمة المرور إلى الحافظة',
    });
  };

  // دالة إعتماد المستخدم
  const handleApproveUser = async (user: User) => {
    if (!requirePermission('users', 'approve')) {
      return;
    }
    
    // Approve user
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: { ...user, active: true }
      });
      // User approved successfully
    } catch (error) {
      console.error('❌ USERS PAGE: خطأ في إعتماد المستخدم:', error);
    }
  };

  // دالة طباعة المستخدم
  const handlePrintUser = (user: User) => {
    if (!requirePermission('users', 'print')) {
      return;
    }
    
    // Print user data
    // يمكن إضافة منطق الطباعة هنا
    window.print();
  };

  // عرض تفاصيل المستخدم
  const handleViewUser = (user: User) => {
    if (!requirePermission('users', 'view')) {
      return;
    }
    
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  // فتح نموذج التعديل
  const handleEditUser = (user: User) => {
    if (!requirePermission('users', 'edit')) {
      return;
    }
    
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  // تصفية المستخدمين
  const filteredUsers = (users || []).filter(user => {
    if (!user) return false;
    
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (user.name?.toLowerCase() || '').includes(searchTermLower) ||
      (user.email?.toLowerCase() || '').includes(searchTermLower) ||
      (user.phone?.toLowerCase() || '').includes(searchTermLower);
    
    const matchesRole = selectedRole === 'all' || 
      safeRoles(user.roles).some(role => role && role.id === selectedRole);
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && user.active) ||
      (selectedStatus === 'inactive' && !user.active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // إحصائيات المستخدمين
  const stats = {
    total: (users || []).length,
    active: (users || []).filter(user => user && user.active).length,
    inactive: (users || []).filter(user => user && !user.active).length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">جاري التحميل...</h3>
          <p className="text-muted-foreground">يتم تحميل بيانات المستخدمين</p>
        </div>
      </div>
    );
  }

  // التحقق من صلاحية الوصول للموديول
  if (!userPermissions.view) {
    return (
      <PermissionDenied 
        module="المستخدمين" 
        action="عرض" 
        description="ليس لديك صلاحية للوصول إلى إدارة المستخدمين"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-2">
            إدارة حسابات المستخدمين وصلاحياتهم في النظام
          </p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              استيراد Excel
            </Button>
            {userPermissions.create && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    إضافة مستخدم
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المستخدم الجديد وحدد الأدوار المناسبة له
                </DialogDescription>
              </DialogHeader>
              <UserFormWithSuspense
                roles={roles}
                onSubmit={handleCreateUser}
                loading={submitting}
              />
            </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* عرض الأخطاء */}
      {error && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="text-destructive font-medium">خطأ:</div>
            <div className="text-destructive">{error}</div>
          </div>
        </div>
      )}

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              جميع المستخدمين في النظام
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Badge variant="default" className="h-4 w-4 rounded-full p-0"></Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              المستخدمون الذين يمكنهم الوصول للنظام
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون غير النشطين</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 rounded-full p-0"></Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              المستخدمون المعطلون مؤقتاً
            </p>
          </CardContent>
        </Card>
      </div>

      {/* البحث والتصفية */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
          <CardDescription>
            استخدم الأدوات أدناه للبحث عن مستخدمين محددين أو تصفيتهم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني أو اسم المستخدم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="تصفية حسب الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                {roles && Array.isArray(roles) && roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة المستخدمين</CardTitle>
              <CardDescription>
                عرض وإدارة جميع المستخدمين في النظام
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              <Badge variant="outline">
                {filteredUsers.length} من {users.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserTableWithSuspense
            users={filteredUsers}
            roles={roles}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onDuplicate={handleDuplicateUser}
            onApprove={handleApproveUser}
            onPrint={handlePrintUser}
            onResetPassword={handleResetPassword}
            loading={loading}
            userPermissions={userPermissions}
          />
        </CardContent>
      </Card>

      {/* Dialog لاستيراد Excel */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>استيراد المستخدمين من Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>قم بتحميل ملف Excel يحتوي على بيانات المستخدمين</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر ملف Excel:</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  // تحميل النموذج
                  const link = document.createElement('a');
                  link.href = '/templates/users-template.xlsx';
                  link.download = 'نموذج-المستخدمين.xlsx';
                  link.click();
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                تحميل النموذج
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={async () => {
                    if (!importFile) return;
                    setIsImporting(true);
                    // منطق استيراد الملف
                    setTimeout(() => {
                      setIsImporting(false);
                      setIsImportDialogOpen(false);
                      setImportFile(null);
                    }, 2000);
                  }}
                  disabled={!importFile || isImporting}
                >
                  {isImporting ? 'جاري الاستيراد...' : 'استيراد'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نموذج التعديل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              تعديل بيانات المستخدم وأدواره في النظام
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserFormDebugWrapper
              initialData={editingUser}
              roles={roles}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                // Cancel user edit
                setIsEditDialogOpen(false);
                setEditingUser(null);
              }}
              loading={submitting}
              isEdit={true}
              onResetPassword={handleResetPasswordFromForm}
            />
          )}
        </DialogContent>
      </Dialog>

      {/*- By Eng-Mo Sef*/}
      {/* نموذج عرض تفاصيل المستخدم */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
            <DialogDescription>
              عرض معلومات المستخدم التفصيلية
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="font-semibold w-24">الاسم:</div>
                <div>{viewingUser.name}</div>
              </div>
              <Separator />
              <div className="flex items-center space-x-4">
                <div className="font-semibold w-24">البريد الإلكتروني:</div>
                <div>{viewingUser.email}</div>
              </div>
              <Separator />
              <div className="flex items-center space-x-4">
                <div className="font-semibold w-24">الهاتف:</div>
                <div>{viewingUser.phone || 'غير متوفر'}</div>
              </div>
              <Separator />
              <div className="flex items-center space-x-4">
                <div className="font-semibold w-24">الحالة:</div>
                <div>
                  {viewingUser.active ? (
                    <Badge variant="default">نشط</Badge>
                  ) : (
                    <Badge variant="destructive">غير نشط</Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-start space-x-4">
                <div className="font-semibold w-24 pt-1">الأدوار:</div>
                <div className="flex flex-wrap gap-2">
                  {viewingUser && viewingUser.roles && safeRoles(viewingUser.roles).length > 0 ? (
                    safeRoles(viewingUser.roles).map(role => (
                      <Badge key={role.id} variant="secondary">{role.name}</Badge>
                    ))
                  ) : (
                    <div className="text-muted-foreground">لا توجد أدوار</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة إعادة تعيين كلمة المرور */}
      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => {
          setIsPasswordResetModalOpen(false);
          setPasswordResetUser(null);
          setNewPassword('');
        }}
        user={passwordResetUser}
        newPassword={newPassword}
        onCopyPassword={handleCopyPassword}
      />

    </div>
  );
}