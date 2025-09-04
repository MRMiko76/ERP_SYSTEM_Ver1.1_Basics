'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Edit, Trash2, Users, Copy, Check, Printer } from 'lucide-react';
import { Role, safePermissions } from '@/types/erp';
import { ActionType } from '@/types/roles-permissions';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface RoleTableProps {
  roles: Role[];
  loading?: boolean;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
  onView: (role: Role) => void;
  onDuplicate?: (role: Role) => void;
  onApprove?: (role: Role) => void;
  onPrint?: (role: Role) => void;
  rolePermissions?: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    duplicate: boolean;
    approve: boolean;
    print: boolean;
  };
}

export function RoleTable({ 
  roles, 
  loading, 
  onEdit, 
  onDelete, 
  onView,
  onDuplicate = () => {},
  onApprove = () => {},
  onPrint = () => {},
  rolePermissions = {
    view: true,
    edit: true,
    delete: true,
    duplicate: true,
    approve: true,
    print: true,
  }
}: RoleTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // ضمان أن roles مصفوفة آمنة
  const safeRoles = Array.isArray(roles) ? roles : [];

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      onDelete(roleToDelete.id);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy', { locale: ar });
    } catch {
      return 'غير محدد';
    }
  };

  const getPermissionsCount = (role: Role) => {
    // حساب العدد الإجمالي للإجراءات المتاحة (فقط التي لها قيم)
    const permissions = safePermissions(role.permissions);
    return permissions.reduce((total, permission) => {
      // عد فقط الإجراءات التي لها قيم (سواء true أو false)
      const actionsWithValues = Object.entries(permission.actions || {})
        .filter(([key, value]) => value !== undefined && value !== null).length;
      return total + actionsWithValues;
    }, 0);
  };

  const getActivePermissionsCount = (role: Role) => {
    // حساب عدد الإجراءات المفعلة فعلياً (التي قيمتها true)
    const permissions = safePermissions(role.permissions);
    return permissions.reduce((count, permission) => {
      const activeActions = Object.values(permission.actions || {})
        .filter(action => action === true).length;
      return count + activeActions;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل الأدوار...</p>
        </div>
      </div>
    );
  }

  if (safeRoles.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد أدوار</h3>
          <p className="text-muted-foreground mb-4">لم يتم العثور على أي أدوار في النظام</p>
          <Button onClick={() => window.location.reload()}>إعادة تحميل</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم الدور</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">الصلاحيات</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeRoles.map((role) => {
              const permissionsCount = getPermissionsCount(role);
              const activePermissionsCount = getActivePermissionsCount(role);
              
              return (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div>
                        <div className="font-semibold">{role.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {role.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm truncate">
                        {role.description || 'لا يوجد وصف'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant="outline">
                        {activePermissionsCount} من {permissionsCount}
                      </Badge>
                      {permissionsCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          صلاحية
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.active ? 'default' : 'secondary'}>
                      {role.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(role.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">فتح القائمة</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {rolePermissions.view && (
                          <DropdownMenuItem
                            onClick={() => onView(role)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                        )}
                        
                        {rolePermissions.edit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(role)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        
                        {rolePermissions.duplicate && (
                          <DropdownMenuItem
                            onClick={() => onDuplicate(role)}
                            className="cursor-pointer"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            نسخ
                          </DropdownMenuItem>
                        )}
                        
                        {rolePermissions.approve && (
                          <DropdownMenuItem
                            onClick={() => onApprove(role)}
                            className="cursor-pointer"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            إعتماد
                          </DropdownMenuItem>
                        )}
                        
                        {rolePermissions.print && (
                          <DropdownMenuItem
                            onClick={() => onPrint(role)}
                            className="cursor-pointer"
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة
                          </DropdownMenuItem>
                        )}
                        
                        {(rolePermissions.view || rolePermissions.edit || rolePermissions.duplicate || rolePermissions.approve || rolePermissions.print) && rolePermissions.delete && (
                          <DropdownMenuSeparator />
                        )}
                        
                        {rolePermissions.delete && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(role)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الدور "{roleToDelete?.name}"؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه وسيؤثر على جميع المستخدمين المرتبطين بهذا الدور.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}