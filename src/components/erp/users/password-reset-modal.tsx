'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check, Eye, EyeOff, KeyRound, User, Mail } from 'lucide-react';
import { User as UserType } from '@/types/erp';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  newPassword: string;
  onCopyPassword: () => void;
}

export function PasswordResetModal({
  isOpen,
  onClose,
  user,
  newPassword,
  onCopyPassword,
}: PasswordResetModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      onCopyPassword();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('فشل في نسخ كلمة المرور:', error);
    }
  };

  const handleClose = () => {
    setShowPassword(false);
    setCopied(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            تم إعادة تعيين كلمة المرور بنجاح
          </DialogTitle>
          <DialogDescription>
            تم إنشاء كلمة مرور جديدة للمستخدم. يرجى نسخها وإرسالها للمستخدم بشكل آمن.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات المستخدم */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* كلمة المرور الجديدة */}
          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  readOnly
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* تحذير أمني */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">تنبيه أمني مهم:</p>
                <ul className="space-y-1 text-xs">
                  <li>• يرجى إرسال كلمة المرور للمستخدم عبر قناة آمنة</li>
                  <li>• تأكد من حذف كلمة المرور من أي مكان بعد إرسالها</li>
                  <li>• انصح المستخدم بتغيير كلمة المرور عند أول تسجيل دخول</li>
                </ul>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              إغلاق
            </Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  نسخ كلمة المرور
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}