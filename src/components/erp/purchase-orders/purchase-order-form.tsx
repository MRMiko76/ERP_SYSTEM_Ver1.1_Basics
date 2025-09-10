'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PurchaseOrder, Supplier, RawMaterial } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Search,
  Calculator,
  Save,
  Send,
  FileText,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const purchaseOrderItemSchema = z.object({
  rawMaterialId: z.string().min(1, 'يجب اختيار الخامة'),
  quantity: z.union([
    z.number().min(0.001, 'الكمية يجب أن تكون أكبر من صفر'),
    z.string().min(1, 'الكمية مطلوبة').transform((val) => {
      // Remove any non-numeric characters except dots and commas
      const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      if (isNaN(num) || num <= 0) throw new Error('الكمية يجب أن تكون رقماً صحيحاً أكبر من صفر (تنسيق: 000.000)');
      // Validate format: should have exactly 3 decimal places
      const formatted = num.toFixed(3);
      return parseFloat(formatted);
    })
  ]),
  unitPrice: z.union([
    z.number().min(0, 'سعر الوحدة يجب أن يكون أكبر من أو يساوي صفر'),
    z.string().min(1, 'سعر الوحدة مطلوب').transform((val) => {
      // Remove any non-numeric characters except dots and commas
      const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      if (isNaN(num) || num < 0) throw new Error('سعر الوحدة يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر (تنسيق: 000.000)');
      // Validate format: should have exactly 3 decimal places
      const formatted = num.toFixed(3);
      return parseFloat(formatted);
    })
  ]),
  totalPrice: z.number().min(0, 'إجمالي التكلفة يجب أن يكون أكبر من أو يساوي صفر'),
  notes: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, 'رقم الأمر مطلوب'),
  supplierId: z.string().min(1, 'يجب اختيار المورد'),
  orderDate: z.string().min(1, 'تاريخ الأمر مطلوب'),
  expectedDeliveryDate: z.string().min(1, 'تاريخ التسليم المتوقع مطلوب'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['DRAFT', 'APPROVED', 'EXECUTED', 'CANCELLED']).default('DRAFT'),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  order?: PurchaseOrder;
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  onSubmit: (data: PurchaseOrderFormData) => void;
  onSaveDraft?: (data: PurchaseOrderFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit' | 'duplicate';
}

export function PurchaseOrderForm({
  order,
  suppliers,
  rawMaterials,
  onSubmit,
  onSaveDraft,
  onCancel,
  loading = false,
  mode = 'create',
}: PurchaseOrderFormProps) {
  console.log('🔥 PurchaseOrderForm rendered with:', { order, mode, loading });
  console.log('🔥 onSubmit function:', onSubmit);
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Generate automatic order number
  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `PO-${year}-${month}${timestamp}`;
  };

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      orderNumber: order?.orderNumber || (mode === 'create' ? generateOrderNumber() : ''),
      supplierId: order?.supplierId || '',
      orderDate: order?.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDeliveryDate: order?.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
      priority: order?.priority || 'MEDIUM',
      status: order?.status || 'DRAFT',
      paymentTerms: order?.paymentTerms || '',
      deliveryAddress: order?.deliveryAddress || '',
      notes: order?.notes || '',
      items: order?.items?.map(item => ({
        rawMaterialId: item.rawMaterialId || item.materialId || '',
        quantity: item.quantity ? item.quantity.toString() : '',
        unitPrice: item.unitPrice ? item.unitPrice.toString() : '',
        totalPrice: item.totalPrice || (item.quantity * item.unitPrice) || 0,
        notes: item.notes || '',
      })) || [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedSupplierId = form.watch('supplierId');

  // Update selected supplier when supplier changes
  useEffect(() => {
    if (watchedSupplierId) {
      const supplier = suppliers.find(s => s.id === watchedSupplierId);
      setSelectedSupplier(supplier || null);
      
      // Update payment terms if supplier has default terms
      if (supplier?.paymentTerms && !form.getValues('paymentTerms')) {
        form.setValue('paymentTerms', supplier.paymentTerms);
      }
    }
  }, [watchedSupplierId, suppliers, form]);

  // Effect to set selected supplier when order changes
  useEffect(() => {
    if (order?.supplierId) {
      // First try to find supplier from the order's supplier object
      if (order.supplier) {
        setSelectedSupplier(order.supplier);
        form.setValue('supplierId', order.supplierId);
      } else {
        // Fallback to finding supplier from suppliers list
        const supplier = suppliers.find(s => s.id === order.supplierId);
        setSelectedSupplier(supplier || null);
        form.setValue('supplierId', order.supplierId);
      }
    }
  }, [order, suppliers, form]);

  // Helper function to format number to 000.000 format
  const formatNumberInput = (value: number | string | null | undefined): string => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return numValue.toFixed(3);
  };

  // Helper function to parse formatted number
  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Effect to populate form with order data when editing
  useEffect(() => {
    if (order && mode === 'edit') {
      const formattedItems = order.items?.map(item => ({
        rawMaterialId: item.materialId || item.rawMaterialId || item.material?.id || '',
        quantity: formatNumberInput(item.quantity || 0),
        unitPrice: formatNumberInput(item.unitPrice || item.unitCost || 0),
        totalPrice: item.totalPrice || item.totalCost || (item.quantity * (item.unitPrice || item.unitCost || 0)) || 0,
        notes: item.notes || '',
      })) || [];
      
      // Set selected supplier from order data
      if (order.supplier) {
        setSelectedSupplier(order.supplier);
      } else if (order.supplierId) {
        const supplier = suppliers.find(s => s.id === order.supplierId);
        setSelectedSupplier(supplier || null);
      }
      
      form.reset({
        orderNumber: order.orderNumber || '',
        supplierId: order.supplierId || '',
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
        priority: order.priority || 'MEDIUM',
        status: order.status || 'DRAFT',
        paymentTerms: order.paymentTerms || '',
        deliveryAddress: order.deliveryAddress || '',
        notes: order.notes || '',
        items: formattedItems,
      });
    }
  }, [order, mode, form, suppliers]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const quantity = typeof item.quantity === 'string' ? parseFormattedNumber(item.quantity) : (item.quantity || 0);
      const unitPrice = typeof item.unitPrice === 'string' ? parseFormattedNumber(item.unitPrice) : (item.unitPrice || 0);
      return sum + (quantity * unitPrice);
    }, 0);
    const taxRate = 0.15; // 15% VAT
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  // Add new item
  const addItem = (material?: RawMaterial) => {
    const newItem = {
      rawMaterialId: material?.id || '',
      quantity: formatNumberInput(1),
      unitPrice: formatNumberInput(material?.standardCost || 0),
      totalPrice: material?.standardCost || 0,
      notes: '',
    };
    append(newItem);
    setMaterialSearchOpen(false);
  };

  // Update item calculations
  const updateItemCalculations = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const currentItem = watchedItems[index];
    const quantity = field === 'quantity' ? value : parseFormattedNumber(currentItem.quantity?.toString() || '0');
    const unitPrice = field === 'unitPrice' ? value : parseFormattedNumber(currentItem.unitPrice?.toString() || '0');
    const totalPrice = quantity * unitPrice;
    
    update(index, {
      ...currentItem,
      [field]: field === 'quantity' ? formatNumberInput(value) : field === 'unitPrice' ? formatNumberInput(value) : currentItem[field],
      totalPrice,
    });
  };

  // Filter materials based on search
  const filteredMaterials = (rawMaterials || []).filter(material =>
    material.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
    material.code.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Get material by ID
  const getMaterial = (id: string) => (rawMaterials || []).find(m => m.id === id);

  const handleSubmit = (data: PurchaseOrderFormData) => {
    console.log('🔥 Form handleSubmit called with data:', data);
    console.log('🔥 Form validation state:', form.formState.isValid);
    console.log('🔥 Form errors:', form.formState.errors);
    // Prepare items for API with correct field names
    const itemsForAPI = data.items.map(item => {
      const material = getMaterial(item.rawMaterialId);
      const quantity = typeof item.quantity === 'string' ? parseFormattedNumber(item.quantity) : item.quantity;
      const unitPrice = typeof item.unitPrice === 'string' ? parseFormattedNumber(item.unitPrice) : item.unitPrice;
      const totalPrice = quantity * unitPrice;
      
      return {
        rawMaterialId: item.rawMaterialId, // API expects rawMaterialId, not materialId
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        notes: item.notes,
        rawMaterial: material,
      };
    });
    
    const formData = {
      ...data,
      items: itemsForAPI,
      totalAmount: total,
      subtotalAmount: subtotal,
      taxAmount,
    };
    onSubmit(formData);
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    // Prepare items for API with correct field names
    const itemsForAPI = data.items.map(item => {
      const material = getMaterial(item.rawMaterialId);
      const quantity = typeof item.quantity === 'string' ? parseFormattedNumber(item.quantity) : item.quantity;
      const unitPrice = typeof item.unitPrice === 'string' ? parseFormattedNumber(item.unitPrice) : item.unitPrice;
      const totalPrice = quantity * unitPrice;
      
      return {
        rawMaterialId: item.rawMaterialId, // API expects rawMaterialId, not materialId
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        notes: item.notes,
        rawMaterial: material,
      };
    });
    
    const formData = {
      ...data,
      items: itemsForAPI,
      totalAmount: total,
      subtotalAmount: subtotal,
      taxAmount,
    };
    onSaveDraft?.(formData);
  };

  return (
    <div className="space-y-6 max-h-[calc(95vh-120px)] overflow-y-auto">
      <div className="sticky top-0 bg-background z-10 pb-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'create' ? 'إنشاء أمر شراء جديد' : 
               mode === 'edit' ? 'تعديل أمر الشراء' : 
               'نسخ أمر الشراء'}
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              {mode === 'create' ? 'إنشاء أمر شراء جديد للموردين' : 
               mode === 'edit' ? 'تعديل بيانات أمر الشراء' : 
               'إنشاء نسخة من أمر الشراء الحالي'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onSaveDraft && (
              <Button type="button" variant="outline" size="default" onClick={handleSaveDraft} disabled={loading} className="px-8 py-3 hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 font-semibold">
                <Save className="ml-2 h-4 w-4" />
                حفظ كمسودة
              </Button>
            )}
            <Button 
              type="button" 
              size="default" 
              disabled={loading} 
              onClick={() => {
                 alert('🔥 زر الاختبار المباشر تم الضغط عليه!');
                 console.log('🔥 Direct button clicked!');
                 console.log('🔥 Form state:', form.formState);
                 console.log('🔥 Form values:', form.getValues());
                 console.log('🔥 Form errors:', form.formState.errors);
                 
                 // Try to submit manually
                 const formData = form.getValues();
                 console.log('🔥 Calling onSubmit directly with:', formData);
                 try {
                   onSubmit(formData);
                   alert('✅ تم استدعاء onSubmit بنجاح!');
                 } catch (error) {
                   alert('❌ خطأ في استدعاء onSubmit: ' + error);
                 }
               }}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Send className="ml-2 h-4 w-4" />
              🔥 اختبار مباشر
            </Button>
            <Button 
              type="submit" 
              form="purchase-order-form" 
              size="default" 
              disabled={loading} 
              onClick={() => {
                console.log('🔥 Submit button clicked!');
                console.log('🔥 Form state:', form.formState);
                console.log('🔥 Form values:', form.getValues());
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Send className="ml-2 h-4 w-4" />
              {mode === 'create' ? 'إنشاء الأمر' : 'حفظ التغييرات'}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
          <form id="purchase-order-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
            <Card className="shadow-md border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span className="text-gray-800">المعلومات الأساسية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 bg-white rounded-lg mx-4 mb-4 p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الأمر *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="PO-2024-001" 
                          readOnly={mode === 'create' || mode === 'edit'}
                          className={(mode === 'create' || mode === 'edit') ? 'bg-gray-50' : ''}
                        />
                      </FormControl>
                      {mode === 'create' && (
                        <FormDescription className="text-xs text-green-600">
                          سيتم إنشاء رقم الأمر تلقائياً
                        </FormDescription>
                      )}
                      {mode === 'edit' && (
                        <FormDescription className="text-xs text-blue-600">
                          رقم الأمر لا يمكن تعديله
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الأمر *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ التسليم المتوقع *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المورد *</FormLabel>
                      <div className="space-y-2">
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المورد">
                                {field.value && selectedSupplier ? selectedSupplier.name : "اختر المورد"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <span>{supplier.name}</span>
                                  <Badge variant="outline" className="text-xs">{supplier.code}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedSupplier && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{selectedSupplier.name}</span>
                              <Badge variant="outline" className="text-xs">{selectedSupplier.code}</Badge>
                            </div>
                            {selectedSupplier.contactPerson && (
                              <div className="text-xs text-gray-500 mt-1">
                                جهة الاتصال: {selectedSupplier.contactPerson}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأولوية</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الأولوية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">منخفضة</SelectItem>
                          <SelectItem value="MEDIUM">متوسطة</SelectItem>
                          <SelectItem value="HIGH">عالية</SelectItem>
                          <SelectItem value="URGENT">عاجلة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <span>مسودة</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="APPROVED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span>معتمد</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="EXECUTED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span>منفذ</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span>ملغى</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شروط الدفع</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="30 يوم" />
                      </FormControl>
                      <FormDescription>
                        {selectedSupplier?.paymentTerms && (
                          <span className="text-xs">افتراضي: {selectedSupplier.paymentTerms}</span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان التسليم</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="عنوان التسليم..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="ملاحظات إضافية..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {selectedSupplier && (
            <Card className="shadow-md border-0 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <Package className="h-6 w-6 text-green-600" />
                  <span className="text-gray-800">معلومات المورد</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white rounded-lg mx-4 mb-4 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">اسم المورد</Label>
                    <p className="text-sm">{selectedSupplier.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">كود المورد</Label>
                    <p className="text-sm font-mono">{selectedSupplier.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</Label>
                    <p className="text-sm">{selectedSupplier.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الهاتف</Label>
                    <p className="text-sm">{selectedSupplier.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="shadow-md border-0 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xl font-semibold">
                  <Package className="h-6 w-6 text-purple-600" />
                  <span className="text-gray-800">عناصر الأمر</span>
                </div>
                <Dialog open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" size="default" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
                      <Plus className="h-4 w-4" />
                      إضافة عنصر
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[1400px] max-h-[85vh]">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="flex items-center gap-2 text-xl">
                        <Package className="h-5 w-5 text-green-600" />
                        اختيار الخامة
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        اختر الخامة المطلوبة لإضافتها إلى أمر الشراء
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="البحث بالاسم أو الكود..."
                          value={materialSearch}
                          onChange={(e) => setMaterialSearch(e.target.value)}
                          className="pr-10 h-10"
                        />
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 shadow-sm">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-700">الاسم</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-center">الكود</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-center">الوحدة</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-center">التكلفة المعيارية</TableHead>
                              <TableHead className="font-semibold text-gray-700 text-center">المخزون الحالي</TableHead>
                              <TableHead className="w-[80px] font-semibold text-gray-700 text-center">إجراء</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredMaterials.map((material) => (
                              <TableRow key={material.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="p-3 font-medium">{material.name}</TableCell>
                                <TableCell className="p-3 text-center font-mono text-sm">{material.code}</TableCell>
                                <TableCell className="p-4 text-center bg-white">{material.unit}</TableCell>
                                <TableCell className="p-3 text-center font-medium">{formatCurrency(material.standardCost || 0)}</TableCell>
                                <TableCell className="p-4 text-center bg-gray-50">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    (material.currentStock || 0) > 0 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {material.currentStock || 0}
                                  </span>
                                </TableCell>
                                <TableCell className="p-4 text-center bg-gray-50">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addItem(material)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    إضافة
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white rounded-lg mx-4 mb-4 p-6 shadow-sm">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم إضافة أي عناصر بعد</p>
                  <p className="text-sm">انقر على "إضافة عنصر" لبدء إضافة الخامات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <TableHead className="font-bold text-gray-800 text-lg">الخامة</TableHead>
                          <TableHead className="w-32 text-center font-bold text-gray-800 text-lg">الكمية</TableHead>
                          <TableHead className="w-36 text-center font-bold text-gray-800 text-lg">سعر الوحدة</TableHead>
                          <TableHead className="w-36 text-center font-bold text-gray-800 text-lg">الإجمالي</TableHead>
                          <TableHead className="w-40 text-center font-bold text-gray-800 text-lg">ملاحظات</TableHead>
                          <TableHead className="w-24 text-center font-bold text-gray-800 text-lg">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                          {fields.map((field, index) => {
                            const material = rawMaterials.find(m => m.id === field.rawMaterialId);
                            return (
                              <TableRow key={field.id} className="hover:bg-blue-50 transition-all duration-200 border-b border-gray-100">
                              <TableCell className="p-4 bg-gray-50">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.rawMaterialId`}
                                  render={({ field: materialField }) => (
                                    <div className="space-y-2">
                                      <Select onValueChange={materialField.onChange} value={materialField.value}>
                                        <FormControl>
                                          <SelectTrigger className="w-full min-w-[200px]">
                                            <SelectValue placeholder="اختر الخامة">
                                              {material ? material.name : "اختر الخامة"}
                                            </SelectValue>
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {rawMaterials.map((mat) => (
                                            <SelectItem key={mat.id} value={mat.id}>
                                              <div className="flex flex-col">
                                                <span>{mat.name}</span>
                                                <span className="text-xs text-muted-foreground">{mat.code}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {material && (
                                        <div className="text-sm text-muted-foreground">
                                          <div className="font-medium">{material.name}</div>
                                          <div className="text-xs">{material.code}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="p-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field: quantityField }) => (
                                    <div className="flex items-center justify-center">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        pattern="[0-9]*[.,]?[0-9]*"
                                        placeholder="0.000"
                                        value={quantityField.value || ''}
                                        onChange={(e) => {
                                          const value = parseFormattedNumber(e.target.value);
                                          quantityField.onChange(formatNumberInput(value));
                                          updateItemCalculations(index, 'quantity', value);
                                        }}
                                        onBlur={(e) => {
                                          const value = parseFormattedNumber(e.target.value);
                                          quantityField.onChange(formatNumberInput(value));
                                        }}
                                        className="w-28 text-center border-2 border-gray-200 focus:border-blue-400 rounded-md"
                                      />
                                      <span className="text-xs text-muted-foreground ml-1">{material?.unit}</span>
                                    </div>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="p-3 text-center">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unitPrice`}
                                  render={({ field: priceField }) => (
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      pattern="[0-9]*[.,]?[0-9]*"
                                      placeholder="0.000"
                                      value={priceField.value || ''}
                                      onChange={(e) => {
                                        const value = parseFormattedNumber(e.target.value);
                                        priceField.onChange(formatNumberInput(value));
                                        updateItemCalculations(index, 'unitPrice', value);
                                      }}
                                      onBlur={(e) => {
                                        const value = parseFormattedNumber(e.target.value);
                                        priceField.onChange(formatNumberInput(value));
                                      }}
                                      className="w-36 text-center border-2 border-gray-200 focus:border-blue-400 rounded-md"
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="p-4 text-center font-bold text-green-700 bg-green-50">
                                {formatCurrency(watchedItems[index]?.totalPrice || 0)}
                              </TableCell>
                              <TableCell className="p-4 bg-white">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.notes`}
                                  render={({ field: notesField }) => (
                                    <Input
                                      {...notesField}
                                      placeholder="ملاحظات..."
                                      className="w-full min-w-[140px] border-2 border-gray-200 focus:border-blue-400 rounded-md"
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="p-3 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-100 transition-all duration-200 rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          {fields.length > 0 && (
            <Card className="shadow-md border-0 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <Calculator className="h-6 w-6 text-purple-600" />
                  <span className="text-gray-800">ملخص الأمر</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 bg-white rounded-lg mx-4 mb-4 p-6 shadow-sm">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">المجموع الفرعي:</span>
                        <span className="font-bold text-blue-700">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">ضريبة القيمة المضافة (15%):</span>
                        <span className="font-bold text-orange-600">{formatCurrency(taxAmount)}</span>
                      </div>
                      <Separator className="bg-gray-300" />
                      <div className="flex justify-between items-center text-xl font-bold bg-green-100 p-3 rounded-md">
                        <span className="text-green-800">الإجمالي:</span>
                        <span className="text-green-700">{formatCurrency(total)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">عدد العناصر:</span>
                        <span className="font-bold text-purple-700 text-lg">{fields.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">إجمالي الكمية:</span>
                        <span className="font-bold text-indigo-700 text-lg">
                          {watchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">متوسط سعر الوحدة:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            watchedItems.length > 0 
                              ? watchedItems.reduce((sum, item) => sum + (item.unitPrice || 0), 0) / watchedItems.length
                              : 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}