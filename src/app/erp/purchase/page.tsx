'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Package,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Truck,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PurchaseDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Mock data - in real app, this would come from API
  const mockDashboardData = {
    stats: {
      totalSuppliers: 25,
      activeSuppliers: 22,
      totalRawMaterials: 150,
      lowStockMaterials: 8,
      outOfStockMaterials: 3,
      totalPurchaseOrders: 45,
      pendingOrders: 12,
      approvedOrders: 8,
      executedOrders: 20,
      overdueOrders: 5,
      totalPurchaseValue: 2500000,
      monthlyPurchaseValue: 450000,
      averageOrderValue: 55555,
      supplierPerformance: 85,
    },
    recentOrders: [
      {
        id: '1',
        orderNumber: 'PO-2024-001',
        supplier: 'شركة الخليج للمواد الخام',
        amount: 11500,
        status: 'PENDING',
        date: '2024-01-20T10:00:00Z',
        expectedDelivery: '2024-02-05T10:00:00Z',
      },
      {
        id: '2',
        orderNumber: 'PO-2024-002',
        supplier: 'مؤسسة النجاح التجارية',
        amount: 1725,
        status: 'APPROVED',
        date: '2024-01-18T14:30:00Z',
        expectedDelivery: '2024-01-30T14:30:00Z',
      },
      {
        id: '3',
        orderNumber: 'PO-2024-003',
        supplier: 'شركة الخليج للمواد الخام',
        amount: 5750,
        status: 'EXECUTED',
        date: '2024-01-15T09:00:00Z',
        expectedDelivery: '2024-01-25T09:00:00Z',
      },
    ],
    lowStockMaterials: [
      {
        id: '1',
        name: 'بلاستيك PVC',
        code: 'RM002',
        currentStock: 25,
        minStock: 100,
        reorderPoint: 150,
        unit: 'كيلو',
        category: 'بلاستيك',
      },
      {
        id: '2',
        name: 'مادة كيميائية A',
        code: 'RM003',
        currentStock: 0,
        minStock: 20,
        reorderPoint: 30,
        unit: 'لتر',
        category: 'كيماويات',
      },
      {
        id: '3',
        name: 'خشب صنوبر',
        code: 'RM004',
        currentStock: 5,
        minStock: 8,
        reorderPoint: 12,
        unit: 'متر مكعب',
        category: 'أخشاب',
      },
    ],
    topSuppliers: [
      {
        id: '1',
        name: 'شركة الخليج للمواد الخام',
        totalOrders: 15,
        totalValue: 850000,
        performance: 92,
      },
      {
        id: '2',
        name: 'مؤسسة النجاح التجارية',
        totalOrders: 12,
        totalValue: 650000,
        performance: 88,
      },
      {
        id: '3',
        name: 'شركة الشرق الأوسط للتوريدات',
        totalOrders: 8,
        totalValue: 420000,
        performance: 75,
      },
    ],
    monthlyTrend: [
      { month: 'يناير', orders: 12, value: 450000 },
      { month: 'فبراير', orders: 15, value: 520000 },
      { month: 'مارس', orders: 18, value: 680000 },
      { month: 'أبريل', orders: 14, value: 580000 },
      { month: 'مايو', orders: 20, value: 750000 },
      { month: 'يونيو', orders: 16, value: 620000 },
    ],
    categoryDistribution: [
      { name: 'معادن', value: 35, color: '#8884d8' },
      { name: 'بلاستيك', value: 25, color: '#82ca9d' },
      { name: 'كيماويات', value: 20, color: '#ffc658' },
      { name: 'أخشاب', value: 15, color: '#ff7300' },
      { name: 'أخرى', value: 5, color: '#00ff00' },
    ],
  };

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In real app: const response = await fetch('/api/purchase/dashboard');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        setDashboardData(mockDashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'مسودة', variant: 'secondary' as const },
      PENDING: { label: 'في الانتظار', variant: 'outline' as const },
      APPROVED: { label: 'معتمد', variant: 'default' as const },
      EXECUTED: { label: 'منفذ', variant: 'default' as const },
      CANCELLED: { label: 'ملغي', variant: 'destructive' as const },
      REJECTED: { label: 'مرفوض', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'secondary' as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStockStatus = (material: any) => {
    if (material.currentStock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 space-x-reverse">
          <AlertTriangle className="h-3 w-3" />
          <span>نفد المخزون</span>
        </Badge>
      );
    } else if (material.currentStock <= material.reorderPoint) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 space-x-reverse">
          <AlertTriangle className="h-3 w-3" />
          <span>مخزون منخفض</span>
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center space-x-1 space-x-reverse">
        <CheckCircle className="h-3 w-3" />
        <span>متوفر</span>
      </Badge>
    );
  };

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { stats } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم المشتريات</h1>
          <p className="text-muted-foreground">نظرة شاملة على أنشطة المشتريات والمخزون</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" asChild>
            <Link href="/erp/purchase/purchase-orders">
              <ShoppingCart className="ml-2 h-4 w-4" />
              أوامر الشراء
            </Link>
          </Button>
          <Button asChild>
            <Link href="/erp/purchase/purchase-orders">
              <FileText className="ml-2 h-4 w-4" />
              أمر شراء جديد
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                <p className="text-xs text-muted-foreground">إجمالي الموردين</p>
                <p className="text-xs text-green-600">{stats.activeSuppliers} نشط</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRawMaterials}</p>
                <p className="text-xs text-muted-foreground">إجمالي الخامات</p>
                <p className="text-xs text-red-600">{stats.lowStockMaterials} مخزون منخفض</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPurchaseOrders}</p>
                <p className="text-xs text-muted-foreground">إجمالي أوامر الشراء</p>
                <p className="text-xs text-yellow-600">{stats.pendingOrders} في الانتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPurchaseValue)}</p>
                <p className="text-xs text-muted-foreground">إجمالي قيمة المشتريات</p>
                <div className="flex items-center space-x-1 space-x-reverse text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12% هذا الشهر</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockMaterials}</p>
                <p className="text-sm text-red-700">خامات نفد مخزونها</p>
                <Button variant="link" className="p-0 h-auto text-red-600" asChild>
                  <Link href="/erp/raw-materials">
                    عرض التفاصيل <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.overdueOrders}</p>
                <p className="text-sm text-yellow-700">أوامر متأخرة</p>
                <Button variant="link" className="p-0 h-auto text-yellow-600" asChild>
                  <Link href="/erp/purchase/purchase-orders">
                    متابعة الأوامر <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.approvedOrders}</p>
                <p className="text-sm text-blue-700">أوامر جاهزة للتنفيذ</p>
                <Button variant="link" className="p-0 h-auto text-blue-600" asChild>
                  <Link href="/erp/purchase/purchase-orders">
                    تنفيذ الأوامر <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="orders">الأوامر الحديثة</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="suppliers">الموردين</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاه المشتريات الشهرية</CardTitle>
                <CardDescription>قيمة وعدد أوامر الشراء خلال الأشهر الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'value' ? formatCurrency(value as number) : value,
                      name === 'value' ? 'القيمة' : 'عدد الأوامر'
                    ]} />
                    <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="value" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="orders" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الخامات حسب الفئة</CardTitle>
                <CardDescription>نسبة الخامات في كل فئة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.categoryDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أوامر الشراء الحديثة</CardTitle>
              <CardDescription>آخر أوامر الشراء المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الأمر</TableHead>
                      <TableHead>التسليم المتوقع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.recentOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link href={`/erp/purchase/purchase-orders`} className="text-blue-600 hover:underline">
                            {order.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{order.supplier}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.amount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell>{formatDate(order.expectedDelivery)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/erp/purchase/purchase-orders">
                    عرض جميع الأوامر <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الخامات التي تحتاج إعادة طلب</CardTitle>
              <CardDescription>خامات وصلت لنقطة إعادة الطلب أو نفد مخزونها</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الخامة</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>المخزون الحالي</TableHead>
                      <TableHead>الحد الأدنى</TableHead>
                      <TableHead>نقطة إعادة الطلب</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.lowStockMaterials.map((material: any) => (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-sm text-muted-foreground">{material.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>{material.category}</TableCell>
                        <TableCell>
                          <span className="font-medium">{material.currentStock}</span>
                          <span className="text-sm text-muted-foreground ml-1">{material.unit}</span>
                        </TableCell>
                        <TableCell>
                          <span>{material.minStock}</span>
                          <span className="text-sm text-muted-foreground ml-1">{material.unit}</span>
                        </TableCell>
                        <TableCell>
                          <span>{material.reorderPoint}</span>
                          <span className="text-sm text-muted-foreground ml-1">{material.unit}</span>
                        </TableCell>
                        <TableCell>{getStockStatus(material)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/erp/raw-materials">
                    عرض جميع الخامات <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أفضل الموردين</CardTitle>
              <CardDescription>الموردين الأكثر تعاملاً وأداءً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المورد</TableHead>
                      <TableHead>عدد الأوامر</TableHead>
                      <TableHead>إجمالي القيمة</TableHead>
                      <TableHead>تقييم الأداء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.topSuppliers.map((supplier: any) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          <Link href={`/erp/purchase/suppliers`} className="text-blue-600 hover:underline">
                            {supplier.name}
                          </Link>
                        </TableCell>
                        <TableCell>{supplier.totalOrders}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(supplier.totalValue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Progress value={supplier.performance} className="w-20" />
                            <span className="text-sm font-medium">{supplier.performance}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/erp/purchase/suppliers">
                    عرض جميع الموردين <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}