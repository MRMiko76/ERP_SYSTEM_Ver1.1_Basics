'use client';

import { useState } from 'react';
import { RawMaterial } from '@/types/erp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  BarChart3,
  Edit,
  Trash2,
  MoreHorizontal,
  ShoppingCart,
  History,
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

interface RawMaterialDetailProps {
  material: RawMaterial;
  onEdit?: () => void;
  onDelete?: () => void;
  onCreatePurchaseOrder?: () => void;
  onViewHistory?: () => void;
}

export function RawMaterialDetail({
  material,
  onEdit,
  onDelete,
  onCreatePurchaseOrder,
  onViewHistory,
}: RawMaterialDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  const getStockStatusBadge = (currentStock: number, minStock: number) => {
    if (currentStock <= 0) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 space-x-reverse">
          <AlertTriangle className="h-3 w-3" />
          <span>نفد المخزون</span>
        </Badge>
      );
    } else if (currentStock <= minStock) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-600 flex items-center space-x-1 space-x-reverse">
          <TrendingDown className="h-3 w-3" />
          <span>مخزون منخفض</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-green-500 text-green-600 flex items-center space-x-1 space-x-reverse">
          <CheckCircle className="h-3 w-3" />
          <span>متوفر</span>
        </Badge>
      );
    }
  };

  const getStockLevel = () => {
    const currentStock = material.currentStock || 0;
    const maxStock = material.maxStock || material.minStock * 10; // Default max if not set
    return Math.min((currentStock / maxStock) * 100, 100);
  };

  const getStockLevelColor = () => {
    const currentStock = material.currentStock || 0;
    const minStock = material.minStock || 0;
    
    if (currentStock <= 0) return 'bg-red-500';
    if (currentStock <= minStock) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Mock data for statistics - in real app, this would come from API
  const stats = {
    totalPurchases: 25,
    totalValue: 45000,
    lastPurchaseDate: '2024-01-10',
    averagePurchasePrice: 1800,
    totalConsumption: 150,
    monthlyConsumption: 12,
    stockTurnover: 8.5,
    daysInStock: 43,
  };

  const recentMovements = [
    {
      id: '1',
      type: 'IN',
      quantity: 50,
      date: '2024-01-15',
      reference: 'PO-2024-01-001',
      unitCost: 1850,
    },
    {
      id: '2',
      type: 'OUT',
      quantity: -25,
      date: '2024-01-12',
      reference: 'PROD-2024-001',
      unitCost: 1800,
    },
    {
      id: '3',
      type: 'IN',
      quantity: 30,
      date: '2024-01-08',
      reference: 'PO-2024-01-002',
      unitCost: 1750,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h2 className="text-2xl font-bold">{material.name}</h2>
            {getStatusBadge(material.isActive)}
            {getStockStatusBadge(material.currentStock || 0, material.minStock || 0)}
          </div>
          <p className="text-muted-foreground">كود الخامة: {material.code}</p>
          {material.category && (
            <Badge variant="outline">{material.category}</Badge>
          )}
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
                تعديل الخامة
              </DropdownMenuItem>
            )}
            {onCreatePurchaseOrder && (
              <DropdownMenuItem onClick={onCreatePurchaseOrder}>
                <ShoppingCart className="ml-2 h-4 w-4" />
                إنشاء أمر شراء
              </DropdownMenuItem>
            )}
            {onViewHistory && (
              <DropdownMenuItem onClick={onViewHistory}>
                <History className="ml-2 h-4 w-4" />
                عرض السجل
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف الخامة
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="stock">المخزون</TabsTrigger>
          <TabsTrigger value="cost">التكلفة</TabsTrigger>
          <TabsTrigger value="movements">الحركات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{material.currentStock || 0}</p>
                    <p className="text-xs text-muted-foreground">المخزون الحالي</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(material.averageCost || 0)}</p>
                    <p className="text-xs text-muted-foreground">متوسط التكلفة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPurchases}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المشتريات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.stockTurnover}</p>
                    <p className="text-xs text-muted-foreground">معدل دوران المخزون</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Package className="h-5 w-5" />
                <span>المعلومات الأساسية</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">اسم الخامة</label>
                  <p className="text-sm">{material.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">كود الخامة</label>
                  <p className="text-sm font-mono">{material.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">وحدة القياس</label>
                  <p className="text-sm">{material.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الفئة</label>
                  <p className="text-sm">{material.category || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</label>
                  <p className="text-sm">{formatDate(material.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">آخر تحديث</label>
                  <p className="text-sm">{formatDate(material.updatedAt)}</p>
                </div>
              </div>
              {material.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الوصف</label>
                  <p className="text-sm mt-1">{material.description}</p>
                </div>
              )}
              {material.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                  <p className="text-sm mt-1">{material.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock Levels */}
            <Card>
              <CardHeader>
                <CardTitle>مستويات المخزون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>المخزون الحالي</span>
                    <span className="font-mono">{(material.currentStock || 0).toLocaleString()} {material.unit}</span>
                  </div>
                  <Progress value={getStockLevel()} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{(material.maxStock || material.minStock * 10).toLocaleString()}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">الحد الأدنى</span>
                    <span className="text-sm font-mono">{(material.minStock || 0).toLocaleString()} {material.unit}</span>
                  </div>
                  {material.maxStock && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">الحد الأقصى</span>
                      <span className="text-sm font-mono">{material.maxStock.toLocaleString()} {material.unit}</span>
                    </div>
                  )}
                  {material.reorderPoint && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">نقطة إعادة الطلب</span>
                      <span className="text-sm font-mono">{material.reorderPoint.toLocaleString()} {material.unit}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <Card>
              <CardHeader>
                <CardTitle>حالة المخزون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center p-6">
                  {getStockStatusBadge(material.currentStock || 0, material.minStock || 0)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">الاستهلاك الشهري</span>
                    <span className="text-sm font-mono">{stats.monthlyConsumption} {material.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">أيام التغطية المتبقية</span>
                    <span className="text-sm font-mono">{stats.daysInStock} يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">معدل الدوران</span>
                    <span className="text-sm font-mono">{stats.stockTurnover} مرة/سنة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Tab */}
        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معلومات التكلفة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">التكلفة المعيارية</span>
                  <span className="text-sm font-medium">{formatCurrency(material.standardCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">متوسط التكلفة</span>
                  <span className="text-sm font-medium">{formatCurrency(material.averageCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">آخر سعر شراء</span>
                  <span className="text-sm font-medium">{formatCurrency(stats.averagePurchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">قيمة المخزون</span>
                  <span className="text-sm font-medium">
                    {formatCurrency((material.currentStock || 0) * (material.averageCost || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات الشراء</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي المشتريات</span>
                  <span className="text-sm font-medium">{stats.totalPurchases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي القيمة</span>
                  <span className="text-sm font-medium">{formatCurrency(stats.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">متوسط سعر الشراء</span>
                  <span className="text-sm font-medium">{formatCurrency(stats.averagePurchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">آخر شراء</span>
                  <span className="text-sm font-medium">{formatDate(stats.lastPurchaseDate)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الاستهلاك</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">إجمالي الاستهلاك</span>
                  <span className="text-sm font-medium">{stats.totalConsumption} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الاستهلاك الشهري</span>
                  <span className="text-sm font-medium">{stats.monthlyConsumption} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">معدل الاستهلاك اليومي</span>
                  <span className="text-sm font-medium">{(stats.monthlyConsumption / 30).toFixed(1)} {material.unit}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>آخر الحركات</CardTitle>
              <CardDescription>
                آخر حركات المخزون للخامة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-full ${
                        movement.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {movement.type === 'IN' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {movement.type === 'IN' ? 'وارد' : 'صادر'}: {Math.abs(movement.quantity)} {material.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">{movement.reference}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{formatCurrency(movement.unitCost)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(movement.date)}</p>
                    </div>
                  </div>
                ))}
                
                {onViewHistory && (
                  <Button variant="outline" className="w-full" onClick={onViewHistory}>
                    <History className="ml-2 h-4 w-4" />
                    عرض جميع الحركات
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}