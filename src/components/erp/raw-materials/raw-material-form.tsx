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
import { RawMaterial, CreateRawMaterialData } from '@/types/erp';
import { Package, FileText, Save, X, AlertTriangle } from 'lucide-react';

// Schema for raw material form validation
const createRawMaterialFormSchema = (isEdit: boolean = false) => {
  return z.object({
    name: z.string().min(2, 'اسم الخامة يجب أن يكون على الأقل حرفين'),
    code: z.string().min(2, 'كود الخامة يجب أن يكون على الأقل حرفين'),
    description: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().min(1, 'وحدة القياس مطلوبة'),
    minStock: z.number().min(0, 'الحد الأدنى للمخزون يجب أن يكون أكبر من أو يساوي صفر'),
    maxStock: z.number().min(0, 'الحد الأقصى للمخزون يجب أن يكون أكبر من أو يساوي صفر').optional(),
    reorderPoint: z.number().min(0, 'نقطة إعادة الطلب يجب أن تكون أكبر من أو يساوي صفر').optional(),
    standardCost: z.number().min(0, 'التكلفة المعيارية يجب أن تكون أكبر من أو يساوي صفر').optional(),
    notes: z.string().optional(),
    isActive: z.boolean().default(true),
  }).refine((data) => {
    if (data.maxStock && data.minStock && data.maxStock < data.minStock) {
      return false;
    }
    return true;
  }, {
    message: 'الحد الأقصى للمخزون يجب أن يكون أكبر من الحد الأدنى',
    path: ['maxStock'],
  });
};

type RawMaterialFormData = z.infer<ReturnType<typeof createRawMaterialFormSchema>>;

interface RawMaterialFormProps {
  initialData?: RawMaterial;
  onSubmit: (data: CreateRawMaterialData) => void;
  onCancel?: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

const defaultRawMaterial: Partial<RawMaterial> = {
  name: '',
  code: '',
  description: '',
  category: '',
  unit: 'كيلو',
  minStock: 0,
  maxStock: undefined,
  reorderPoint: undefined,
  standardCost: undefined,
  notes: '',
  isActive: true,
};

// Common units for raw materials
const commonUnits = [
  'كيلو',
  'جرام',
  'طن',
  'لتر',
  'متر',
  'متر مربع',
  'متر مكعب',
  'قطعة',
  'عبوة',
  'كرتون',
  'صندوق',
];

// Common categories
const commonCategories = [
  'مواد خام أساسية',
  'مواد كيميائية',
  'مواد تعبئة وتغليف',
  'قطع غيار',
  'أدوات ومعدات',
  'مواد استهلاكية',
  'مواد أمان وحماية',
];

export function RawMaterialForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}: RawMaterialFormProps) {
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const form = useForm<RawMaterialFormData>({
    resolver: zodResolver(createRawMaterialFormSchema(isEdit)),
    defaultValues: {
      name: initialData?.name || defaultRawMaterial.name,
      code: initialData?.code || defaultRawMaterial.code,
      description: initialData?.description || defaultRawMaterial.description,
      category: initialData?.category || defaultRawMaterial.category,
      unit: initialData?.unit || defaultRawMaterial.unit,
      minStock: initialData?.minStock || defaultRawMaterial.minStock,
      maxStock: initialData?.maxStock || defaultRawMaterial.maxStock,
      reorderPoint: initialData?.reorderPoint || defaultRawMaterial.reorderPoint,
      standardCost: initialData?.standardCost || defaultRawMaterial.standardCost,
      notes: initialData?.notes || defaultRawMaterial.notes,
      isActive: initialData?.isActive ?? defaultRawMaterial.isActive,
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        category: initialData.category || '',
        unit: initialData.unit || 'كيلو',
        minStock: initialData.minStock || 0,
        maxStock: initialData.maxStock || undefined,
        reorderPoint: initialData.reorderPoint || undefined,
        standardCost: initialData.standardCost || undefined,
        notes: initialData.notes || '',
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: RawMaterialFormData) => {
    // Convert empty strings to undefined for optional fields
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      category: data.category || undefined,
      maxStock: data.maxStock || undefined,
      reorderPoint: data.reorderPoint || undefined,
      standardCost: data.standardCost || undefined,
      notes: data.notes || undefined,
    };
    onSubmit(cleanedData);
  };

  const handleUnitChange = (value: string) => {
    if (value === 'custom') {
      setCustomUnit('');
    } else {
      form.setValue('unit', value);
      setCustomUnit('');
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setCustomCategory('');
    } else {
      form.setValue('category', value);
      setCustomCategory('');
    }
  };

  const handleCustomUnitSubmit = () => {
    if (customUnit.trim()) {
      form.setValue('unit', customUnit.trim());
      setCustomUnit('');
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      form.setValue('category', customCategory.trim());
      setCustomCategory('');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Package className="h-5 w-5" />
              <span>المعلومات الأساسية</span>
            </CardTitle>
            <CardDescription>
              أدخل المعلومات الأساسية للخامة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الخامة *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم الخامة" {...field} />
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
                    <FormLabel>كود الخامة *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل كود الخامة" {...field} />
                    </FormControl>
                    <FormDescription>
                      كود فريد لتمييز الخامة
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="وصف تفصيلي للخامة..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة</FormLabel>
                    <div className="space-y-2">
                      <Select 
                        onValueChange={handleCategoryChange} 
                        value={customCategory ? 'custom' : field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر فئة الخامة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">فئة مخصصة...</SelectItem>
                        </SelectContent>
                      </Select>
                      {customCategory !== '' && (
                        <div className="flex space-x-2 space-x-reverse">
                          <Input
                            placeholder="أدخل فئة مخصصة"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCustomCategorySubmit();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={handleCustomCategorySubmit}
                          >
                            إضافة
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وحدة القياس *</FormLabel>
                    <div className="space-y-2">
                      <Select 
                        onValueChange={handleUnitChange} 
                        value={customUnit ? 'custom' : field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر وحدة القياس" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">وحدة مخصصة...</SelectItem>
                        </SelectContent>
                      </Select>
                      {customUnit !== '' && (
                        <div className="flex space-x-2 space-x-reverse">
                          <Input
                            placeholder="أدخل وحدة مخصصة"
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCustomUnitSubmit();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={handleCustomUnitSubmit}
                          >
                            إضافة
                          </Button>
                        </div>
                      )}
                    </div>
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
                    <FormLabel className="text-base">حالة الخامة</FormLabel>
                    <FormDescription>
                      تحديد ما إذا كانت الخامة نشطة أم لا
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

        {/* Stock Management */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة المخزون</CardTitle>
            <CardDescription>
              إعدادات المخزون والحدود المسموحة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد الأدنى للمخزون *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      الحد الأدنى المسموح به في المخزون
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد الأقصى للمخزون</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="اختياري" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      الحد الأقصى المسموح به في المخزون
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نقطة إعادة الطلب</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="اختياري" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      النقطة التي يجب عندها إعادة طلب الخامة
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock Level Warning */}
            <div className="flex items-start space-x-3 space-x-reverse p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">ملاحظة مهمة</p>
                <p className="text-amber-700">
                  سيتم تنبيهك تلقائياً عندما ينخفض المخزون عن الحد الأدنى أو نقطة إعادة الطلب.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات التكلفة</CardTitle>
            <CardDescription>
              التكلفة المعيارية والمعلومات المالية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="standardCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التكلفة المعيارية (ريال)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    التكلفة المعيارية لوحدة واحدة من الخامة
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-5 w-5" />
              <span>ملاحظات إضافية</span>
            </CardTitle>
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
                      placeholder="أي ملاحظات إضافية حول الخامة..."
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
            {loading ? 'جاري الحفظ...' : isEdit ? 'تحديث الخامة' : 'إضافة الخامة'}
          </Button>
        </div>
      </form>
    </Form>
  );
}