'use client';

import { AlertTriangle, Lock, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionDeniedProps {
  action?: string;
  module?: string;
  message?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function PermissionDenied({
  action = 'هذا الإجراء',
  module = 'هذا القسم',
  message,
  showBackButton = true,
  onBack,
}: PermissionDeniedProps) {
  const defaultMessage = `ليس لديك صلاحية للوصول إلى ${module} أو تنفيذ ${action}.`;
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-600">
            غير مخول للوصول
          </CardTitle>
          <CardDescription className="text-center">
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تنبيه أمني</AlertTitle>
            <AlertDescription>
              يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
            </AlertDescription>
          </Alert>
          
          {showBackButton && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={onBack || (() => window.history.back())}
                className="w-full"
              >
                <Shield className="mr-2 h-4 w-4" />
                العودة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// مكون مبسط لعرض رسالة سريعة
export function PermissionAlert({ action, module }: { action?: string; module?: string }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <Lock className="h-4 w-4" />
      <AlertTitle>غير مخول</AlertTitle>
      <AlertDescription>
        ليس لديك صلاحية لتنفيذ {action || 'هذا الإجراء'} في {module || 'هذا القسم'}.
      </AlertDescription>
    </Alert>
  );
}