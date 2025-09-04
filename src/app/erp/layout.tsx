"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/erp/sidebar";
import { Topbar } from "@/components/erp/topbar";

export default function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ERP Layout rendering

  // useEffect للتعامل مع إعادة التوجيه بعد انتهاء التحميل
  useEffect(() => {
    if (!loading && !user) {
      // إعادة توجيه إلى صفحة تسجيل الدخول
      router.push('/auth/login');
      return;
    }
  }, [loading, user, router]);

  // التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // User authenticated, rendering children

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}