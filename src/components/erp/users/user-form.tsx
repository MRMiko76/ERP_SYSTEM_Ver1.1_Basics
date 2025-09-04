'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Role, CreateUserData, safeRoles, defaultUser } from '@/types/erp';
import { Search, Shield, Users, Mail, Phone, User as UserIcon, Eye, EyeOff, RotateCcw } from 'lucide-react';

// Schema للتحقق من صحة البيانات - يتم إنشاؤه ديناميكياً
const createUserFormSchema = (isEdit: boolean) => {
  const baseSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون على الأقل حرفين'),
    username: z.string().min(3, 'اسم المستخدم يجب أن يكون على الأقل 3 أحرف').optional().or(z.literal('')),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    phone: z.string().optional(),
    password: isEdit ? 
      z.string().optional().or(z.literal('')) :
      z.string().min(6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
    confirmPassword: isEdit ? z.string().optional() : z.string(),
    active: z.boolean().default(true),
    roles: z.array(z.string()).default([]), // دائماً مصفوفة
    avatar: z.string().optional(),
    bio: z.string().optional(),
  });

  return baseSchema.refine((data) => {
    // في حالة الإنشاء، كلمة المرور مطلوبة
    if (!isEdit && !data.password) {
      return false;
    }
    // التحقق من تطابق كلمة المرور فقط إذا تم إدخالها
    if (data.password && data.password.length > 0) {
      if (!data.confirmPassword || data.password !== data.confirmPassword) {
        return false;
      }
    }
    return true;
  }, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });
}

type UserFormData = z.infer<ReturnType<typeof createUserFormSchema>>;

interface UserFormProps {
  initialData?: User;
  roles: Role[]; // مطلوب ودائماً مصفوفة
  onSubmit: (data: CreateUserData) => void;
  onCancel?: () => void;
  loading?: boolean;
  isEdit?: boolean;
  onResetPassword?: (userId: string) => void;
}

export function UserForm({
  initialData,
  roles = [], // قيمة افتراضية آمنة
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
  onResetPassword,
}: UserFormProps) {
  console.log('🎯 USER FORM: تم تحميل المكون');
  console.log('🎯 USER FORM: initialData:', initialData);
  console.log('🎯 USER FORM: isEdit:', isEdit);
  console.log('🎯 USER FORM: loading:', loading);
  console.log('🎯 USER FORM: roles:', roles);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ضمان أن roles مصفوفة آمنة
  const safeRolesArray = Array.isArray(roles) ? roles : [];

  // تهيئة النموذج مع قيم افتراضية آمنة
  const form = useForm<UserFormData>({
    resolver: zodResolver(createUserFormSchema(isEdit)),
    defaultValues: {
      name: initialData?.name || defaultUser.name,
      username: initialData?.username || '',
      email: initialData?.email || defaultUser.email,
      phone: initialData?.phone || '',
      password: '', // دائماً فارغة في التعديل
      confirmPassword: '',
      active: initialData?.active ?? true,
      // تهيئة آمنة للأدوار
      roles: initialData ? 
        safeRoles(initialData.roles).map(r => r.id) : 
        [],
      avatar: initialData?.avatar || '',
      bio: initialData?.bio || '',
    },
  });

  // مرجع لتتبع آخر بيانات تم تحديث النموذج بها
  const lastInitialDataRef = useRef<User | undefined>(undefined);

  // تحديث النموذج عند تغيير البيانات الأولية
  useEffect(() => {
    if (initialData && initialData !== lastInitialDataRef.current) {
      lastInitialDataRef.current = initialData;
      form.reset({
        name: initialData.name || defaultUser.name,
        username: initialData.username || '',
        email: initialData.email || defaultUser.email,
        phone: initialData.phone || '',
        password: '', // دائماً فارغة في التعديل
        confirmPassword: '',
        active: initialData.active ?? true,
        // تهيئة آمنة للأدوار
        roles: safeRoles(initialData.roles).map(r => r.id),
        avatar: initialData.avatar || '',
        bio: initialData.bio || '',
      });
    }
  }, [initialData]);

  // تصفية الأدوار بناءً على البحث
  const filteredRoles = safeRolesArray.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // دالة للتعامل مع تحديد/إلغاء تحديد دور
  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = form.getValues('roles') || [];
    let newRoles: string[];
    
    if (checked) {
      newRoles = [...currentRoles, roleId];
    } else {
      newRoles = currentRoles.filter(id => id !== roleId);
    }
    
    form.setValue('roles', newRoles, { shouldDirty: true, shouldTouch: true });
    form.trigger('roles'); // إعادة تشغيل التحقق من الصحة
  };

  // دالة للحصول على اسم الدور من ID
  const getRoleName = (roleId: string): string => {
    const role = safeRolesArray.find(r => r.id === roleId);
    return role ? role.name : 'دور غير معروف';
  };

  // دالة للحصول على الأحرف الأولى من الاسم
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // دالة تحديد/إلغاء تحديد جميع الأدوار
  const handleSelectAllRoles = (checked: boolean) => {
    if (checked) {
      const allRoleIds = safeRolesArray.map(role => role.id);
      form.setValue('roles', allRoleIds, { shouldDirty: true, shouldTouch: true });
    } else {
      form.setValue('roles', [], { shouldDirty: true, shouldTouch: true });
    }
    form.trigger('roles'); // إعادة تشغيل التحقق من الصحة
  };

  // مراقبة تغييرات الأدوار لإعادة الرسم
  const watchedRoles = form.watch('roles') || [];
  
  // دالة للتحقق من تحديد جميع الأدوار
  const getCurrentRoles = () => watchedRoles;
  const isAllRolesSelected = safeRolesArray.length > 0 && 
    safeRolesArray.every(role => getCurrentRoles().includes(role.id));

  // دالة للتحقق من تحديد بعض الأدوار
  const isSomeRolesSelected = getCurrentRoles().length > 0 && !isAllRolesSelected;

  const handleSubmit = (data: UserFormData) => {
    console.log('📝 بدء إرسال النموذج...');
    console.log('📝 بيانات النموذج الخام:', JSON.stringify(data, null, 2));
    console.log('📝 نوع العملية:', isEdit ? 'تعديل' : 'إنشاء');
    
    // ضمان أن البيانات المرسلة آمنة
    const submitData = {
      name: data.name,
      username: data.username || undefined,
      email: data.email,
      phone: data.phone || undefined,
      password: isEdit ? (data.password || undefined) : data.password!, // مطلوبة عند الإنشاء
      active: data.active,
      roles: Array.isArray(data.roles) ? data.roles : [], // ضمان الأمان
      avatar: data.avatar || undefined,
      bio: data.bio || undefined,
    };
    
    console.log('📤 البيانات المعالجة للإرسال:', JSON.stringify(submitData, null, 2));
    console.log('📤 استدعاء دالة onSubmit...');
    
    try {
      onSubmit(submitData);
      console.log('✅ تم استدعاء onSubmit بنجاح');
    } catch (error) {
      console.error('❌ خطأ في استدعاء onSubmit:', error);
    }
  };

  // عرض شاشة التحميل إذا لم تكن الأدوار محملة
  if (safeRolesArray.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل الأدوار...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        console.log('🚀 FORM: تم إرسال النموذج - بداية onSubmit');
        console.log('🚀 FORM: event:', e);
        console.log('🚀 FORM: حالة النموذج:', form.formState);
        console.log('🚀 FORM: أخطاء النموذج:', form.formState.errors);
        console.log('🚀 FORM: هل النموذج صحيح؟', form.formState.isValid);
        
        // استدعاء handleSubmit من react-hook-form
        form.handleSubmit((data) => {
          console.log('🚀 FORM: تم تمرير التحقق - البيانات:', data);
          handleSubmit(data);
        }, (errors) => {
          console.log('❌ FORM: فشل التحقق - الأخطاء:', errors);
        })(e);
      }} className="space-y-6">
        {/* معلومات المستخدم الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
            <CardDescription>
              أدخل المعلومات الأساسية للمستخدم
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* الصورة الشخصية */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <Avatar className="h-20 w-20">
                <AvatarImage src={form.watch('avatar')} alt={form.watch('name')} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                  {getInitials(form.watch('name') || 'مستخدم')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الصورة الشخصية</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        رابط اختياري للصورة الشخصية للمستخدم
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: أحمد محمد علي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: ahmed.mohamed" {...field} />
                    </FormControl>
                    <FormDescription>
                      اسم فريد للمستخدم (اختياري)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          placeholder="مثال: ahmed@company.com" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          placeholder="مثال: +966501234567" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* كلمة المرور - فقط في حالة الإنشاء أو إذا أراد المستخدم تغييرها */}
            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="أدخل كلمة مرور قوية" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="أعد إدخال كلمة المرور" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نبذة شخصية</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="نبذة مختصرة عن المستخدم ومهامه"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">تفعيل المستخدم</FormLabel>
                    <FormDescription>
                      تحديد ما إذا كان المستخدم نشطاً ويمكنه الوصول للنظام
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* الأدوار والصلاحيات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Shield className="h-5 w-5" />
              <span>الأدوار والصلاحيات</span>
              <Badge variant="outline">
                {getCurrentRoles().length} من {safeRolesArray.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              اختر الأدوار التي يمتلكها هذا المستخدم
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* البحث والتحكم */}
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في الأدوار..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  checked={isAllRolesSelected}
                  ref={(ref) => {
                    if (ref) {
                      ref.indeterminate = isSomeRolesSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAllRoles}
                />
                <span className="text-sm font-medium">تحديد الكل</span>
              </div>
            </div>

            <Separator />

            {/* عرض الأدوار */}
            {filteredRoles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoles.map(role => {
                  const isSelected = getCurrentRoles().includes(role.id);
                  
                  return (
                    <div
                      key={role.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleRoleToggle(role.id, !isSelected)}
                    >
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="font-medium">{role.name}</span>
                            <Badge variant={role.active ? 'default' : 'secondary'} className="text-xs">
                              {role.active ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>
                          {role.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {role.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>
                              {safeRoles(role.permissions).length} صلاحية
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد أدوار</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'لم يتم العثور على أدوار تطابق البحث' : 'لم يتم العثور على أي أدوار في النظام'}
                </p>
              </div>
            )}

            {/* عرض الأدوار المحددة */}
            {getCurrentRoles().length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">الأدوار المحددة:</h4>
                <div className="flex flex-wrap gap-2">
                  {getCurrentRoles().map(roleId => (
                    <Badge key={roleId} variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleName(roleId)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1 hover:bg-transparent"
                        onClick={() => handleRoleToggle(roleId, false)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex items-center justify-between">
          {/* زر إعادة تعيين كلمة المرور - يظهر فقط في وضع التعديل */}
          {isEdit && initialData && onResetPassword && (
            <Button 
              type="button" 
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={() => {
                console.log('🔄 تم الضغط على زر إعادة تعيين كلمة المرور');
                onResetPassword(initialData.id);
              }}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <RotateCcw className="h-4 w-4" />
              <span>إعادة تعيين كلمة المرور</span>
            </Button>
          )}
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button 
              type="button" 
              variant="outline" 
              disabled={loading}
              onClick={() => {
                console.log('🚫 تم الضغط على زر الإلغاء');
                onCancel?.();
              }}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={() => {
                console.log('🔥 USER FORM: تم الضغط على زر الإرسال');
                console.log('🔥 USER FORM: حالة loading:', loading);
                console.log('🔥 USER FORM: نوع العملية:', isEdit ? 'تعديل' : 'إنشاء');
                console.log('🔥 USER FORM: صحة النموذج:', form.formState.isValid);
                console.log('🔥 USER FORM: أخطاء النموذج:', form.formState.errors);
                console.log('🔥 USER FORM: قيم النموذج الحالية:', form.getValues());
                console.log('🔥 USER FORM: حالة النموذج:', form.formState);
              }}
            >
              {loading ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </div>
              ) : (
                isEdit ? 'تحديث المستخدم' : 'إنشاء المستخدم'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}