"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  LogOut,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Palette,
  Type,
  RefreshCw,
} from 'lucide-react';

interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontSize: string;
  theme: string;
  language: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, loading: isLoading, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Personal Info State
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  
  // Security State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Appearance Settings State
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#ef4444',
    fontSize: 'medium',
    theme: 'light',
    language: 'ar',
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedAppearanceSettings = localStorage.getItem('appearanceSettings');
    if (savedAppearanceSettings) {
      setAppearanceSettings(JSON.parse(savedAppearanceSettings));
    }
    
    if (user) {
      setEditedUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  // Apply appearance settings to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Convert hex colors to oklch format for Tailwind CSS variables
    const hexToOklch = (hex: string) => {
      // Convert hex to RGB
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      // Calculate relative luminance
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // Calculate chroma and hue (simplified)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const c = max - min;
      
      let h = 0;
      if (c !== 0) {
        if (max === r) h = ((g - b) / c) % 6;
        else if (max === g) h = (b - r) / c + 2;
        else h = (r - g) / c + 4;
        h *= 60;
        if (h < 0) h += 360;
      }
      
      // Return oklch format
      return `${l.toFixed(3)} ${(c * 0.4).toFixed(3)} ${h.toFixed(1)}`;
    };
    
    // Apply colors to both custom variables and Tailwind variables
    root.style.setProperty('--primary-color', appearanceSettings.primaryColor);
    root.style.setProperty('--secondary-color', appearanceSettings.secondaryColor);
    root.style.setProperty('--accent-color', appearanceSettings.accentColor);
    
    // Apply to custom button variables used in custom-buttons.css
    root.style.setProperty('--btn-primary', appearanceSettings.primaryColor);
    root.style.setProperty('--btn-secondary', appearanceSettings.secondaryColor);
    root.style.setProperty('--btn-accent', appearanceSettings.accentColor);
    
    // Apply to Tailwind CSS variables
    root.style.setProperty('--primary', hexToOklch(appearanceSettings.primaryColor));
    root.style.setProperty('--secondary', hexToOklch(appearanceSettings.secondaryColor));
    root.style.setProperty('--accent', hexToOklch(appearanceSettings.accentColor));
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[appearanceSettings.fontSize as keyof typeof fontSizeMap]);
    
    // Apply theme
    if (appearanceSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appearanceSettings]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث بيانات الملف الشخصي بنجاح",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات المظهر بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAppearanceToDefaults = () => {
    setAppearanceSettings({
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      accentColor: '#ef4444',
      fontSize: 'medium',
      theme: 'light',
      language: 'ar',
    });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }



  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">يجب تسجيل الدخول لعرض الملف الشخصي</p>
        </div>
      </div>
    );
  }



  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          الملف الشخصي
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة معلوماتك الشخصية وإعدادات الحساب والمظهر
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center space-x-2 space-x-reverse">
            <User className="h-4 w-4" />
            <span>المعلومات الشخصية</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2 space-x-reverse">
            <Shield className="h-4 w-4" />
            <span>الأمان</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2 space-x-reverse">
            <Palette className="h-4 w-4" />
            <span>المظهر</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <CardTitle className="text-xl">
                    {user?.name || "مستخدم"}
                  </CardTitle>
                  <div className="flex justify-center mt-2">
                    {user?.roles && user.roles.length > 0 ? (
                      <Badge variant="destructive">{user.roles[0].name}</Badge>
                    ) : (
                      <Badge variant="outline">غير محدد</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      عضو منذ {new Date().toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 space-x-reverse">
                      <User className="h-5 w-5" />
                      <span>المعلومات الشخصية</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      {isEditing ? "إلغاء" : "تعديل"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedUser.name}
                          onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                          placeholder="أدخل الاسم الكامل"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user?.name || "غير محدد"}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                          placeholder="أدخل البريد الإلكتروني"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user?.email || "غير محدد"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedUser.phone}
                          onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                          placeholder="أدخل رقم الهاتف"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-medium">
                          {editedUser.phone || "غير محدد"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">العنوان</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={editedUser.address}
                          onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                          placeholder="أدخل العنوان"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-medium">
                          {editedUser.address || "غير محدد"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الصلاحيات</Label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {user?.roles && user.roles.length > 0 ? (
                          `${user.roles[0].name} - ${user.roles[0].description || 'صلاحيات النظام'}`
                        ) : "مستخدم - صلاحيات محدودة"}
                      </span>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-4 space-x-reverse pt-4">
                      <Button onClick={handleSaveProfile} disabled={loading}>
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Save className="h-4 w-4 ml-2" />
                        )}
                        حفظ التغييرات
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Shield className="h-5 w-5" />
                <span>إعدادات الأمان</span>
              </CardTitle>
              <CardDescription>
                إدارة كلمة المرور وإعدادات الأمان الخاصة بحسابك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Change Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">تغيير كلمة المرور</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    <Key className="h-4 w-4 ml-2" />
                    {showPasswordForm ? 'إلغاء' : 'تغيير كلمة المرور'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="أدخل كلمة المرور الحالية"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="أدخل كلمة المرور الجديدة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Button onClick={handlePasswordChange} disabled={loading}>
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                          <Save className="h-4 w-4 ml-2" />
                        )}
                        حفظ كلمة المرور الجديدة
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Two Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">المصادقة الثنائية</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    حماية إضافية لحسابك باستخدام تطبيق المصادقة
                  </p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                  <span className="text-sm">
                    {twoFactorEnabled ? 'مفعل' : 'غير مفعل'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Logout Section */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <h3 className="font-medium text-red-600 dark:text-red-400">تسجيل الخروج</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    إنهاء الجلسة الحالية وتسجيل الخروج من النظام
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Palette className="h-5 w-5" />
                <span>إعدادات المظهر</span>
              </CardTitle>
              <CardDescription>
                تخصيص مظهر التطبيق وفقاً لتفضيلاتك الشخصية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">نمط العرض</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">اختر بين النمط الفاتح والداكن</p>
                </div>
                <Select 
                  value={appearanceSettings.theme} 
                  onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, theme: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر نمط العرض" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Color Customization */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">الألوان</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تخصيص ألوان واجهة التطبيق</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">اللون الأساسي</Label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={appearanceSettings.secondaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={appearanceSettings.secondaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">لون التمييز</Label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Input
                        id="accentColor"
                        type="color"
                        value={appearanceSettings.accentColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={appearanceSettings.accentColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                        placeholder="#ef4444"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Font Size */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium flex items-center space-x-2 space-x-reverse">
                    <Type className="h-4 w-4" />
                    <span>حجم الخط</span>
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">اختر حجم الخط المناسب لك</p>
                </div>
                <Select 
                  value={appearanceSettings.fontSize} 
                  onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, fontSize: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر حجم الخط" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">صغير</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="large">كبير</SelectItem>
                    <SelectItem value="xlarge">كبير جداً</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Language */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">اللغة</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">اختر لغة واجهة التطبيق</p>
                </div>
                <Select 
                  value={appearanceSettings.language} 
                  onValueChange={(value) => setAppearanceSettings({ ...appearanceSettings, language: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر اللغة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex space-x-4 space-x-reverse pt-4">
                <Button onClick={handleSaveAppearance} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  حفظ الإعدادات
                </Button>
                <Button variant="outline" onClick={resetAppearanceToDefaults}>
                  <RefreshCw className="h-4 w-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}