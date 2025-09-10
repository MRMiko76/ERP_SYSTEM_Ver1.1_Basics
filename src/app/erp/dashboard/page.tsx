"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

import { 
  Package, 
  ShoppingCart, 
  Factory, 
  Box, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Truck,
  FileText
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  lowStock: number;
  pendingOrders: number;
  activeUsers: number;
  todaySales: number;
  monthlyRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'purchase' | 'manufacturing' | 'packaging' | 'sale';
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'in_progress';
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStock: 0,
    pendingOrders: 0,
    activeUsers: 0,
    todaySales: 0,
    monthlyRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // تم حذف useEffect للمصادقة لأن layout.tsx يتولى هذه المهمة

  useEffect(() => {
    // Mock data for demonstration
    setStats({
      totalProducts: 156,
      lowStock: 12,
      pendingOrders: 8,
      activeUsers: 24,
      todaySales: 15420,
      monthlyRevenue: 485000,
    });

    setRecentActivity([
      {
        id: "1",
        type: "purchase",
        description: "شراء مواد خام من المورد أ",
        timestamp: "2024-01-15 10:30",
        status: "completed"
      },
      {
        id: "2",
        type: "manufacturing",
        description: "بدء إنتاج منتج جديد",
        timestamp: "2024-01-15 09:15",
        status: "in_progress"
      },
      {
        id: "3",
        type: "packaging",
        description: "تعبئة المنتجات للشحن",
        timestamp: "2024-01-15 08:45",
        status: "pending"
      },
      {
        id: "4",
        type: "sale",
        description: "بيع دفعة للعميل ب",
        timestamp: "2024-01-15 08:30",
        status: "completed"
      }
    ]);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "purchase": return <ShoppingCart className="h-4 w-4" />;
      case "manufacturing": return <Factory className="h-4 w-4" />;
      case "packaging": return <Box className="h-4 w-4" />;
      case "sale": return <DollarSign className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />مكتمل</Badge>;
      case "in_progress":
        return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />قيد التنفيذ</Badge>;
      case "pending":
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 ml-1" />في الانتظار</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة التحكم
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مرحباً {user?.name || user?.email || 'المستخدم'}، آخر تسجيل دخول: {new Date().toLocaleDateString('ar-SA')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {getStatCard("إجمالي المنتجات", stats.totalProducts, <Package className="h-6 w-6 text-white" />, "bg-blue-500")}
        {getStatCard("منخفض المخزون", stats.lowStock, <AlertTriangle className="h-6 w-6 text-white" />, "bg-red-500")}
        {getStatCard("طلبات معلقة", stats.pendingOrders, <Clock className="h-6 w-6 text-white" />, "bg-yellow-500")}
        {getStatCard("المستخدمين النشطين", stats.activeUsers, <Users className="h-6 w-6 text-white" />, "bg-green-500")}
        {getStatCard("مبيعات اليوم", `${stats.todaySales.toLocaleString()} ريال`, <TrendingUp className="h-6 w-6 text-white" />, "bg-purple-500")}
        {getStatCard("إيرادات الشهر", `${stats.monthlyRevenue.toLocaleString()} ريال`, <DollarSign className="h-6 w-6 text-white" />, "bg-indigo-500")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-5 w-5" />
                  <span>النشاط الأخير</span>
                </CardTitle>
                <CardDescription>
                  آخر العمليات في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-5 w-5" />
                  <span>إجراءات سريعة</span>
                </CardTitle>
                <CardDescription>
                  الوصول السريع للوظائف الشائعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <ShoppingCart className="h-6 w-6" />
                    <span>شراء مواد</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Factory className="h-6 w-6" />
                    <span>التصنيع</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Box className="h-6 w-6" />
                    <span>التعبئة</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Truck className="h-6 w-6" />
                    <span>المبيعات</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
    </main>
  );
}