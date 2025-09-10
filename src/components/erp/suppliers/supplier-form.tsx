'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Supplier, CreateSupplierData } from '@/types/erp';
import { Building, Mail, Phone, MapPin, CreditCard, FileText, Save, X } from 'lucide-react';

// Schema for supplier form validation
const createSupplierFormSchema = (isEdit: boolean = false) => {
  return z.object({
    name: z.string().min(2, 'اسم المورد يجب أن يكون على الأقل حرفين'),
    code: z.string().min(2, 'كود المورد يجب أن يكون على الأقل حرفين'),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    taxNumber: z.string().optional(),
    commercialRegister: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPersonPhone: z.string().optional(),
    contactPersonEmail: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    paymentTerms: z.enum(['CASH', 'NET_30', 'NET_60', 'NET_90']),
    creditLimit: z.number().min(0, 'حد الائتمان يجب أن يكون أكبر من أو يساوي صفر'),
    notes: z.string().optional(),
    isActive: z.boolean().default(true),
  });
};

type SupplierFormData = z.infer<ReturnType<typeof createSupplierFormSchema>>;

interface SupplierFormProps {
  initialData?: Supplier;
  onSubmit: (data: CreateSupplierData) => void;
  onCancel?: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

const defaultSupplier: Partial<Supplier> = {
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'المملكة العربية السعودية',
  postalCode: '',
  taxNumber: '',
  commercialRegister: '',
  contactPerson: '',
  contactPersonPhone: '',
  contactPersonEmail: '',
  paymentTerms: 'NET_30',
  creditLimit: 0,
  notes: '',
  isActive: true,
};

export function SupplierForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}: SupplierFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(createSupplierFormSchema(isEdit)),
    defaultValues: {
      name: initialData?.name || defaultSupplier.name,
      code: initialData?.code || defaultSupplier.code,
      email: initialData?.email || defaultSupplier.email,
      phone: initialData?.phone || defaultSupplier.phone,
      address: initialData?.address || defaultSupplier.address,
      city: initialData?.city || defaultSupplier.city,
      country: initialData?.country || defaultSupplier.country,
      postalCode: initialData?.postalCode || defaultSupplier.postalCode,
      taxNumber: initialData?.taxNumber || defaultSupplier.taxNumber,
      commercialRegister: initialData?.commercialRegister || defaultSupplier.commercialRegister,
      contactPerson: initialData?.contactPerson || defaultSupplier.contactPerson,
      contactPersonPhone: initialData?.contactPersonPhone || defaultSupplier.contactPersonPhone,
      contactPersonEmail: initialData?.contactPersonEmail || defaultSupplier.contactPersonEmail,
      paymentTerms: (initialData?.paymentTerms as any) || defaultSupplier.paymentTerms,
      creditLimit: initialData?.creditLimit || defaultSupplier.creditLimit,
      notes: initialData?.notes || defaultSupplier.notes,
      isActive: initialData?.isActive ?? defaultSupplier.isActive,
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        code: initialData.code || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        country: initialData.country || 'المملكة العربية السعودية',
        postalCode: initialData.postalCode || '',
        taxNumber: initialData.taxNumber || '',
        commercialRegister: initialData.commercialRegister || '',
        contactPerson: initialData.contactPerson || '',
        contactPersonPhone: initialData.contactPersonPhone || '',
        contactPersonEmail: initialData.contactPersonEmail || '',
        paymentTerms: (initialData.paymentTerms as any) || 'NET_30',
        creditLimit: initialData.creditLimit || 0,
        notes: initialData.notes || '',
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: SupplierFormData) => {
    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      postalCode: data.postalCode || undefined,
      taxNumber: data.taxNumber || undefined,
      commercialRegister: data.commercialRegister || undefined,
      contactPerson: data.contactPerson || undefined,
      contactPersonPhone: data.contactPersonPhone || undefined,
      contactPersonEmail: data.contactPersonEmail || undefined,
      notes: data.notes || undefined,
    };
    onSubmit(cleanedData);
  };

  const paymentTermsOptions = [
    { value: 'CASH', label: 'نقداً' },
    { value: 'NET_30', label: '30 يوم' },
    { value: 'NET_60', label: '60 يوم' },
    { value: 'NET_90', label: '90 يوم' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Building className="h-5 w-5" />
              <span>المعلومات الأساسية</span>
            </CardTitle>
            <CardDescription>
              أدخل المعلومات الأساسية للمورد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المورد *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المورد" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كود المورد *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل كود المورد" {...field} />
                    </FormControl>
                    <FormDescription>
                      كود فريد لتمييز المورد
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
                    <FormLabel className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="h-4 w-4" />
                      <span>البريد الإلكتروني</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="supplier@example.com" 
                        {...field} 
                      />
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
                    <FormLabel className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="h-4 w-4" />
                      <span>رقم الهاتف</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+966 50 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">حالة المورد</FormLabel>
                    <FormDescription>
                      تحديد ما إذا كان المورد نشطاً أم لا
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

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <MapPin className="h-5 w-5" />
              <span>معلومات العنوان</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أدخل العنوان التفصيلي" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدينة</FormLabel>
                    <FormControl>
                      <Input placeholder="الرياض" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدولة</FormLabel>
                    <FormControl>
                      <Input placeholder="المملكة العربية السعودية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرمز البريدي</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-5 w-5" />
              <span>المعلومات التجارية</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرقم الضريبي</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commercialRegister"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السجل التجاري</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2 space-x-reverse">
                      <CreditCard className="h-4 w-4" />
                      <span>شروط الدفع</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر شروط الدفع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentTermsOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حد الائتمان (ريال)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      الحد الأقصى للمبلغ المسموح به
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Person Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الشخص المسؤول</CardTitle>
            <CardDescription>
              معلومات الشخص المسؤول عن التواصل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الشخص المسؤول</FormLabel>
                  <FormControl>
                    <Input placeholder="أحمد محمد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPersonPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>هاتف الشخص المسؤول</FormLabel>
                    <FormControl>
                      <Input placeholder="+966 50 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPersonEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بريد الشخص المسؤول</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="contact@supplier.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أي ملاحظات إضافية حول المورد..."
                      className="resize-none"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 space-x-reverse">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="ml-2 h-4 w-4" />
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            <Save className="ml-2 h-4 w-4" />
            {loading ? 'جاري الحفظ...' : isEdit ? 'تحديث المورد' : 'إضافة المورد'}
          </Button>
        </div>
      </form>
    </Form>
  );
}