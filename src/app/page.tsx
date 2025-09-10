"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Users, Settings, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary rounded-2xl flex items-center justify-center">
            <Factory className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            نظام إدارة المصنع
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            نظام متكامل لإدارة المصانع الغذائية - يدعم المشتريات والتصنيع والتعبئة والمستودعات والمبيعات
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">التصنيع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إدارة عمليات التصنيع والإنتاج
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">المستخدمون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                إدارة المستخدمين والصلاحيات
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">التقارير</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تقارير وإحصائيات شاملة
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 mx-auto bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">الإعدادات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تخصيص النظام حسب الاحتياجات
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => router.push("/auth/login")}
            className="px-8 py-3 text-lg"
          >
            تسجيل الدخول إلى النظام
          </Button>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">معلومات الدخول التجريبية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="font-medium">مدير النظام</p>
                <p className="text-gray-600 dark:text-gray-400">admin@example.com</p>
                <p className="text-gray-600 dark:text-gray-400">password123</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="font-medium">مدير</p>
                <p className="text-gray-600 dark:text-gray-400">manager@example.com</p>
                <p className="text-gray-600 dark:text-gray-400">password123</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="font-medium">موظف</p>
                <p className="text-gray-600 dark:text-gray-400">user@example.com</p>
                <p className="text-gray-600 dark:text-gray-400">password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}