'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Role, Permission, safePermissions } from '@/types/erp';
import { Shield, Users, Calendar, CheckCircle, XCircle, Home, ShoppingCart, Factory, Package, Warehouse, TrendingUp, Settings, FileText, Database } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface RoleDetailProps {
  role: Role;
}

export function RoleDetail({ role }: RoleDetailProps) {
  const permissions = safePermissions(role.permissions);
  
  // تجميع الصلاحيات حسب الوحدة
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const moduleKey = permission.module || 'other';
    if (!acc[moduleKey]) {
      acc[moduleKey] = [];
    }
    acc[moduleKey].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ar });
    } catch {
      return 'غير محدد';
    }
  };

  // ترجمة أسماء الوحدات
  const getModuleDisplayName = (module: string) => {
    const moduleNames: Record<string, string> = {
      'dashboard': 'لوحة التحكم',
      'users': 'المستخدمون',
      'roles': 'الأدوار والصلاحيات',
      'purchasing': 'المشتريات',
      'manufacturing': 'التصنيع',
      'packaging': 'التعبئة',
      'warehouses': 'المستودعات',
      'sales': 'المبيعات',
      'reports': 'التقارير',
      'settings': 'الإعدادات',
      'system': 'النظام'
    };
    return moduleNames[module.toLowerCase()] || module;
  };

  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case 'dashboard':
        return <Home className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'roles':
        return <Shield className="h-4 w-4" />;
      case 'purchasing':
        return <ShoppingCart className="h-4 w-4" />;
      case 'manufacturing':
        return <Factory className="h-4 w-4" />;
      case 'packaging':
        return <Package className="h-4 w-4" />;
      case 'warehouses':
        return <Warehouse className="h-4 w-4" />;
      case 'sales':
        return <TrendingUp className="h-4 w-4" />;
      case 'reports':
        return <FileText className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      case 'system':
        return <Database className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* معلومات أساسية */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {role.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {role.description || 'لا يوجد وصف'}
              </CardDescription>
            </div>
            <Badge variant={role.active ? 'default' : 'secondary'}>
              {role.active ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  نشط
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  غير نشط
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">تاريخ الإنشاء:</span>
              <span>{formatDate(role.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">آخر تحديث:</span>
              <span>{formatDate(role.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الصلاحيات */}
      <Card>
        <CardHeader>
          <CardTitle>الصلاحيات ({permissions.length})</CardTitle>
          <CardDescription>
            قائمة بجميع الصلاحيات المخصصة لهذا الدور
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد صلاحيات مخصصة لهذا الدور</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, modulePermissions], index, array) => (
                <div key={module}>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      {getModuleIcon(module)}
                    </div>
                    <h4 className="font-semibold text-blue-900">{getModuleDisplayName(module)}</h4>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {modulePermissions.length} صلاحية
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mr-2">
                    {modulePermissions.map((permission, permIndex) => (
                      <div
                        key={`${module}-${permission.id || permission.name || permIndex}`}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <Badge 
                          variant={permission.active ? 'default' : 'secondary'}
                          className={`text-xs font-medium ${permission.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          {permission.action}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{permission.name}</p>
                          {permission.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {index < array.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}