"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  Settings,
  Building2,
  Palette,
  Type,
  Image,
  Bell,
  Globe,
  Shield,
  Save,
  Upload,
  Download,
  RefreshCw,
} from 'lucide-react';

interface CompanySettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
}



interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  systemAlerts: boolean;
}

interface SystemSettings {
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: string;
  maxLoginAttempts: string;
  autoSave: boolean;
  backupEnabled: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
  apiTimeout: string;
  maxFileSize: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'شركة الأنظمة المتقدمة',
    description: 'شركة رائدة في مجال تطوير الأنظمة وإدارة الموارد',
    address: 'الرياض، المملكة العربية السعودية',
    phone: '+966 11 123 4567',
    email: 'info@company.com',
    website: 'https://www.company.com',
    logo: '/logo.svg',
  });



  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    systemAlerts: true,
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    autoSave: true,
    backupEnabled: true,
    maintenanceMode: false,
    debugMode: false,
    apiTimeout: '30',
    maxFileSize: '10',
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedCompanySettings = localStorage.getItem('companySettings');
    const savedNotificationSettings = localStorage.getItem('notificationSettings');
    const savedSystemSettings = localStorage.getItem('systemSettings');

    if (savedCompanySettings) {
      setCompanySettings(JSON.parse(savedCompanySettings));
    }
    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }
    if (savedSystemSettings) {
      setSystemSettings(JSON.parse(savedSystemSettings));
    }
  }, []);



  const handleSaveSettings = async (settingsType: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      switch (settingsType) {
        case 'company':
          localStorage.setItem('companySettings', JSON.stringify(companySettings));
          break;
        case 'notifications':
          localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
          break;
        case 'system':
          localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
          break;
      }

      toast({
        title: 'نجح',
        description: 'تم حفظ الإعدادات بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCompanySettings(prev => ({ ...prev, logo: result }));
        toast({
          title: 'نجح',
          description: 'تم رفع الشعار بنجاح',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportSettings = () => {
    try {
      const allSettings = {
        company: companySettings,
        notifications: notificationSettings,
        system: systemSettings,
        exportDate: new Date().toISOString(),
      };
      
      const dataStr = JSON.stringify(allSettings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: 'تم تصدير الإعدادات',
        description: 'تم تصدير الإعدادات بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير الإعدادات',
        variant: 'destructive',
      });
    }
  };

  const resetToDefaults = (settingsType: string) => {
    switch (settingsType) {
      case 'company':
        setCompanySettings({
          name: 'شركة الأنظمة المتقدمة',
          description: 'شركة رائدة في مجال تطوير الأنظمة وإدارة الموارد',
          address: 'الرياض، المملكة العربية السعودية',
          phone: '+966 11 123 4567',
          email: 'info@company.com',
          website: 'https://www.company.com',
          logo: '/logo.svg',
        });
        break;

      case 'system':
        setSystemSettings({
          autoBackup: true,
          backupFrequency: 'daily',
          sessionTimeout: '30',
          maxLoginAttempts: '5',
          autoSave: true,
          backupEnabled: true,
          maintenanceMode: false,
          debugMode: false,
          apiTimeout: '30',
          maxFileSize: '10',
        });
        break;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات النظام</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة إعدادات النظام والشركة والمظهر والإشعارات
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center space-x-2 space-x-reverse">
            <Building2 className="h-4 w-4" />
            <span>معلومات الشركة</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2 space-x-reverse">
            <Bell className="h-4 w-4" />
            <span>الإشعارات</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2 space-x-reverse">
            <Shield className="h-4 w-4" />
            <span>النظام</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Building2 className="h-5 w-5" />
                <span>معلومات الشركة</span>
              </CardTitle>
              <CardDescription>
                إدارة المعلومات الأساسية للشركة واللوجو
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم الشركة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">رقم الهاتف</Label>
                  <Input
                    id="companyPhone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966 11 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">الموقع الإلكتروني</Label>
                  <Input
                    id="companyWebsite"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyAddress">العنوان</Label>
                <Input
                  id="companyAddress"
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="العنوان الكامل للشركة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyDescription">وصف الشركة</Label>
                <Textarea
                  id="companyDescription"
                  value={companySettings.description}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر عن الشركة وأنشطتها"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>شعار الشركة</Label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {companySettings.logo ? (
                      <img src={companySettings.logo} alt="شعار الشركة" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Image className="h-8 w-8 text-gray-400 mx-auto mb-1" alt="" />
                        <span className="text-xs text-gray-400">لا يوجد شعار</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex space-x-2 space-x-reverse">
                      <Button variant="outline" onClick={() => document.getElementById('logoUpload')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        رفع شعار جديد
                      </Button>
                      {companySettings.logo && (
                        <Button 
                          variant="outline" 
                          onClick={() => setCompanySettings(prev => ({ ...prev, logo: '' }))}
                        >
                          حذف الشعار
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => resetToDefaults('company')}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        استعادة الافتراضي
                      </Button>
                    </div>
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*,.svg"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-gray-500">
                      يُفضل استخدام ملفات SVG أو PNG بحجم 64x64 بكسل. الحد الأقصى للحجم 5 ميجابايت.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button onClick={() => handleSaveSettings('company')} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Bell className="h-5 w-5" />
                <span>إعدادات الإشعارات</span>
              </CardTitle>
              <CardDescription>
                إدارة أنواع الإشعارات وطرق التنبيه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-gray-500">تلقي الإشعارات عبر البريد الإلكتروني</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">الإشعارات الفورية</Label>
                    <p className="text-sm text-gray-500">تلقي الإشعارات الفورية في المتصفح</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smsNotifications">إشعارات الرسائل النصية</Label>
                    <p className="text-sm text-gray-500">تلقي الإشعارات عبر الرسائل النصية</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="systemAlerts">تنبيهات النظام</Label>
                    <p className="text-sm text-gray-500">تلقي تنبيهات النظام والأخطاء</p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemAlerts: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('notifications')} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Shield className="h-5 w-5" />
                <span>إعدادات النظام</span>
              </CardTitle>
              <CardDescription>
                إدارة إعدادات الأمان والنسخ الاحتياطي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات عامة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoSave">الحفظ التلقائي</Label>
                      <p className="text-sm text-gray-500">حفظ التغييرات تلقائياً</p>
                    </div>
                    <Switch
                      id="autoSave"
                      checked={systemSettings.autoSave}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoSave: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="backupEnabled">النسخ الاحتياطي</Label>
                      <p className="text-sm text-gray-500">تفعيل النسخ الاحتياطي التلقائي</p>
                    </div>
                    <Switch
                      id="backupEnabled"
                      checked={systemSettings.backupEnabled}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, backupEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
                      <p className="text-sm text-gray-500">تفعيل وضع الصيانة للنظام</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="debugMode">وضع التطوير</Label>
                      <p className="text-sm text-gray-500">تفعيل وضع التطوير والتشخيص</p>
                    </div>
                    <Switch
                      id="debugMode"
                      checked={systemSettings.debugMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, debugMode: checked }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoBackup">النسخ الاحتياطي التلقائي</Label>
                    <p className="text-sm text-gray-500">تفعيل النسخ الاحتياطي التلقائي للبيانات</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">تكرار النسخ الاحتياطي</Label>
                    <Select
                      value={systemSettings.backupFrequency}
                      onValueChange={(value) => setSystemSettings(prev => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التكرار" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">كل ساعة</SelectItem>
                        <SelectItem value="daily">يومياً</SelectItem>
                        <SelectItem value="weekly">أسبوعياً</SelectItem>
                        <SelectItem value="monthly">شهرياً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">انتهاء الجلسة (بالدقائق)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">الحد الأقصى لمحاولات تسجيل الدخول</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={systemSettings.maxLoginAttempts}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                    placeholder="5"
                    className="w-full md:w-1/2"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات الأداء</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiTimeout">مهلة API (ثانية)</Label>
                    <Input
                      id="apiTimeout"
                      type="number"
                      value={systemSettings.apiTimeout}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, apiTimeout: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">الحد الأقصى لحجم الملف (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={systemSettings.maxFileSize}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">إدارة البيانات</h3>
                <div className="flex space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    تصدير البيانات
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    استيراد البيانات
                  </Button>
                  <Button variant="destructive" onClick={() => resetToDefaults('system')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة تعيين النظام
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('system')} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}