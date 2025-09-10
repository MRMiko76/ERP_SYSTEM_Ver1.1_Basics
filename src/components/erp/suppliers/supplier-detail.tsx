'use client';

import { useState } from 'react';
import { Supplier } from '@/types/erp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SupplierDetailProps {
  supplier: Supplier;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreatePurchaseOrder?: () => void;
}

export function SupplierDetail({
  supplier,
  onEdit,
  onDelete,
  onCreatePurchaseOrder,
}: SupplierDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getPaymentTermsLabel = (terms: string) => {
    const labels: Record<string, string> = {
      CASH: 'نقداً',
      NET_30: '30 يوم',
      NET_60: '60 يوم',
      NET_90: '90 يوم',
    };
    return labels[terms] || terms;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  // Mock data for statistics - in real app, this would come from API
  const stats = {
    totalOrders: 45,
    totalValue: 125000,
    pendingOrders: 3,
    lastOrderDate: '2024-01-15',
    averageOrderValue: 2777.78,
    onTimeDeliveryRate: 95,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h2 className="text-2xl font-bold">{supplier.name}</h2>
            {getStatusBadge(supplier.isActive)}
          </div>
          <p className="text-muted-foreground">كود المورد: {supplier.code}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="ml-2 h-4 w-4" />
                تعديل المورد
              </DropdownMenuItem>
            )}
            {onCreatePurchaseOrder && (
              <DropdownMenuItem onClick={onCreatePurchaseOrder}>
                <ShoppingCart className="ml-2 h-4 w-4" />
                إنشاء أمر شراء
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف المورد
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="contact">معلومات التواصل</TabsTrigger>
          <TabsTrigger value="business">المعلومات التجارية</TabsTrigger>
          <TabsTrigger value="statistics">الإحصائيات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                    <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Package className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                    <p className="text-xs text-muted-foreground">طلبات معلقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.onTimeDeliveryRate}%</p>
                    <p className="text-xs text-muted-foreground">التسليم في الوقت</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Building className="h-5 w-5" />
                <span>المعلومات الأساسية</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">اسم المورد</label>
                  <p className="text-sm">{supplier.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">كود المورد</label>
                  <p className="text-sm font-mono">{supplier.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</label>
                  <p className="text-sm">{formatDate(supplier.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">آخر تحديث</label>
                  <p className="text-sm">{formatDate(supplier.updatedAt)}</p>
                </div>
              </div>
              {supplier.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                  <p className="text-sm mt-1">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Phone className="h-5 w-5" />
                  <span>معلومات التواصل</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.email && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">البريد الإلكتروني</p>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">رقم الهاتف</p>
                      <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="h-5 w-5" />
                  <span>العنوان</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.address && (
                  <p className="text-sm">{supplier.address}</p>
                )}
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {supplier.city && <span>{supplier.city}</span>}
                  {supplier.city && supplier.postalCode && <span>•</span>}
                  {supplier.postalCode && <span>{supplier.postalCode}</span>}
                </div>
                {supplier.country && (
                  <p className="text-sm text-muted-foreground">{supplier.country}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Person */}
          {(supplier.contactPerson || supplier.contactPersonPhone || supplier.contactPersonEmail) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <User className="h-5 w-5" />
                  <span>الشخص المسؤول</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {supplier.contactPerson && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">الاسم</label>
                      <p className="text-sm">{supplier.contactPerson}</p>
                    </div>
                  )}
                  {supplier.contactPersonPhone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">الهاتف</label>
                      <p className="text-sm">{supplier.contactPersonPhone}</p>
                    </div>
                  )}
                  {supplier.contactPersonEmail && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                      <p className="text-sm">{supplier.contactPersonEmail}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-5 w-5" />
                  <span>الوثائق التجارية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.taxNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الرقم الضريبي</label>
                    <p className="text-sm font-mono">{supplier.taxNumber}</p>
                  </div>
                )}
                {supplier.commercialRegister && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">السجل التجاري</label>
                    <p className="text-sm font-mono">{supplier.commercialRegister}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <CreditCard className="h-5 w-5" />
                  <span>شروط الدفع</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">شروط الدفع</label>
                  <p className="text-sm">{getPaymentTermsLabel(supplier.paymentTerms)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">حد الائتمان</label>
                  <p className="text-sm">{formatCurrency(supplier.creditLimit)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الرصيد الحالي</label>
                  <p className="text-sm">{formatCurrency(supplier.currentBalance || 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات الطلبات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي الطلبات</span>
                  <span className="text-sm font-medium">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي القيمة</span>
                  <span className="text-sm font-medium">{formatCurrency(stats.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">متوسط قيمة الطلب</span>
                  <span className="text-sm font-medium">{formatCurrency(stats.averageOrderValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">آخر طلب</span>
                  <span className="text-sm font-medium">{formatDate(stats.lastOrderDate)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الأداء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">معدل التسليم في الوقت</span>
                  <span className="text-sm font-medium">{stats.onTimeDeliveryRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الطلبات المعلقة</span>
                  <span className="text-sm font-medium">{stats.pendingOrders}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المالية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">حد الائتمان</span>
                  <span className="text-sm font-medium">{formatCurrency(supplier.creditLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الرصيد المستخدم</span>
                  <span className="text-sm font-medium">{formatCurrency(supplier.currentBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الرصيد المتاح</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(supplier.creditLimit - (supplier.currentBalance || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}