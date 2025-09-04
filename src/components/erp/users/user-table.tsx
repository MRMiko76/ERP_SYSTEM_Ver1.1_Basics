'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { User, Role, safeRoles } from '@/types/erp';
import { ActionType } from '@/types/roles-permissions';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  UserX,
  Copy,
  Check,
  Printer,
  KeyRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserTableProps {
  users: User[]; // دائماً مصفوفة
  roles: Role[]; // دائماً مصفوفة
  onView?: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onDuplicate?: (user: User) => void;
  onApprove?: (user: User) => void;
  onPrint?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  loading?: boolean;
  userPermissions?: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    duplicate: boolean;
    approve: boolean;
    print: boolean;
    resetPassword: boolean;
  };
}

export function UserTable({
  users = [], // قيمة افتراضية آمنة
  roles = [], // قيمة افتراضية آمنة
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onApprove,
  onPrint,
  onResetPassword,
  loading = false,
  userPermissions = {
    view: true,
    edit: true,
    delete: true,
    duplicate: true,
    approve: true,
    print: true,
    resetPassword: true,
  },
}: UserTableProps) {
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ضمان أن users و roles مصفوفات آمنة
  const safeUsers = Array.isArray(users) ? users : [];
  const safeRolesArray = Array.isArray(roles) ? roles : [];

  // دالة للحصول على اسم الدور من ID
  const getRoleName = (roleId: string): string => {
    const role = safeRolesArray.find(r => r.id === roleId);
    return role ? role.name : 'دور غير معروف';
  };

  // دالة للحصول على الأحرف الأولى من الاسم
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  // دالة الترتيب
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ترتيب المستخدمين
  const sortedUsers = [...safeUsers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // دالة تأكيد الحذف
  const handleDeleteConfirm = () => {
    if (deleteUserId) {
      onDelete(deleteUserId);
      setDeleteUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  if (safeUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">لا يوجد مستخدمون</h3>
        <p className="text-muted-foreground mb-4">
          لم يتم العثور على أي مستخدمين في النظام
        </p>
        <Button onClick={() => window.location.reload()}>
          تحديث الصفحة
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">الصورة</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span>الاسم</span>
                  {sortField === 'name' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Mail className="h-4 w-4" />
                  <span>البريد الإلكتروني</span>
                  {sortField === 'email' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>الأدوار</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('active')}
              >
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span>الحالة</span>
                  {sortField === 'active' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>آخر دخول</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => {
              // ضمان أن أدوار المستخدم مصفوفة آمنة
              const userRoles = safeRoles(user.roles);
              
              return (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{user.name}</div>
                      {user.username && (
                        <div className="text-sm text-muted-foreground">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length > 0 ? (
                        userRoles.map((role) => (
                          <Badge key={role.id} variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <UserX className="h-3 w-3 mr-1" />
                          بدون دور
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.active ? 'default' : 'secondary'}
                      className={user.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                    >
                      {user.active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(user.lastLogin)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">لم يسجل دخول</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
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
                        
                        {/* عرض التفاصيل */}
                        {userPermissions.view && (
                          <DropdownMenuItem
                            onClick={() => onView?.(user)}
                            disabled={!onView}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                        )}
                        
                        {/* تعديل */}
                        {userPermissions.edit && (
                          <DropdownMenuItem onClick={() => {
                            console.log('🔧 USER TABLE: تم النقر على زر التعديل للمستخدم:', user);
                            onEdit(user);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        
                        {/* نسخ */}
                        {userPermissions.duplicate && onDuplicate && (
                          <DropdownMenuItem onClick={() => onDuplicate(user)}>
                            <Copy className="mr-2 h-4 w-4" />
                            نسخ
                          </DropdownMenuItem>
                        )}
                        
                        {/* إعتماد */}
                        {userPermissions.approve && onApprove && (
                          <DropdownMenuItem onClick={() => onApprove(user)}>
                            <Check className="mr-2 h-4 w-4" />
                            إعتماد
                          </DropdownMenuItem>
                        )}
                        
                        {/* طباعة */}
                        {userPermissions.print && onPrint && (
                          <DropdownMenuItem onClick={() => onPrint(user)}>
                            <Printer className="mr-2 h-4 w-4" />
                            طباعة
                          </DropdownMenuItem>
                        )}
                        

                        
                        {/* فاصل قبل الحذف */}
                        {userPermissions.delete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteUserId(user.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </>
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

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
              سيتم حذف جميع بيانات المستخدم نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}