"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 [LOGIN PAGE] Form submitted with email:', email);
    setLoading(true);
    setError("");

    try {
      console.log('📝 [LOGIN PAGE] Sending login request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📝 [LOGIN PAGE] Login response status:', response.status);
      const data = await response.json();
      console.log('📝 [LOGIN PAGE] Login response data:', data);

      if (!response.ok) {
        console.log('📝 [LOGIN PAGE] Login failed:', data.error);
        setError(data.error || "حدث خطأ أثناء تسجيل الدخول");
      } else {
        console.log('📝 [LOGIN PAGE] Login successful, refreshing auth...');
        // تحديث حالة المصادقة أولاً
        await refreshAuth();
        console.log('📝 [LOGIN PAGE] Auth refreshed, redirecting to dashboard...');
        // ثم إعادة التوجيه
        router.push("/erp/dashboard");
      }
    } catch (error) {
      console.log('📝 [LOGIN PAGE] Login error:', error);
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            تسجيل الدخول إلى نظام ERP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            أدخل بياناتك للوصول إلى النظام
          </p>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل بريدك الإلكتروني وكلمة المرور
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>بيانات تجريبية:</p>
              <p>البريد: admin@example.com</p>
              <p>كلمة المرور: password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}