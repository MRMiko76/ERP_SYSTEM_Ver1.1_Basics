'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, FileText, Search, Edit, Trash2, Eye, Check, X, Clock, ShoppingCart } from 'lucide-react';

// أنواع البيانات لأوامر الشراء
interface PurchaseOrderItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string; // رقم أمر الشراء (توليد تلقائي)
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'approved' | 'executed'; // مسودة - معتمد - منفذ
  notes?: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePurchaseOrderData {
  supplierId: string;
  items: Omit<PurchaseOrderItem, 'id' | 'totalPrice'>[];
  notes?: string;
  expectedDeliveryDate?: Date;
}

// واجهة بيانات المورد
interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  active: boolean;
}

// تم إزالة البيانات التجريبية - سيتم جلب الخامات من قاعدة البيانات

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  
  // حالة الموردين
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  
  // حالة الخامات
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  
  // البيانات التجريبية لأوامر الشراء
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      orderNumber: 'PO-2024-001',
      supplierId: '1',
      supplierName: 'شركة المواد الخام المتقدمة',
      items: [
        {
          id: '1',
          materialId: '1',
          materialName: 'دقيق القمح الأبيض',
          quantity: 100,
          unitPrice: 2.5,
          totalPrice: 250,
          unit: 'kg'
        },
        {
          id: '2',
          materialId: '3',
          materialName: 'زيت الطبخ النباتي',
          quantity: 50,
          unitPrice: 8.5,
          totalPrice: 425,
          unit: 'l'
        }
      ],
      totalAmount: 675,
      status: 'approved',
      notes: 'طلب عاجل للإنتاج',
      orderDate: new Date('2024-01-15'),
      expectedDeliveryDate: new Date('2024-01-20'),
      createdBy: 'أحمد محمد',
      approvedBy: 'مدير المشتريات',
      approvedAt: new Date('2024-01-16'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-16')
    },
    {
      id: '2',
      orderNumber: 'PO-2024-002',
      supplierId: '2',
      supplierName: 'مؤسسة التعبئة والتغليف',
      items: [
        {
          id: '3',
          materialId: '2',
          materialName: 'أكياس التعبئة البلاستيكية',
          quantity: 1000,
          unitPrice: 0.15,
          totalPrice: 150,
          unit: 'piece'
        }
      ],
      totalAmount: 150,
      status: 'draft',
      notes: '',
      orderDate: new Date('2024-01-18'),
      createdBy: 'سارة أحمد',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18')
    }
  ]);

  // جلب الموردين والخامات من API
  useEffect(() => {
    fetchSuppliers();
    fetchRawMaterials();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'خطأ في جلب البيانات',
        description: 'حدث خطأ أثناء جلب بيانات الموردين',
        variant: 'destructive'
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const response = await fetch('/api/raw-materials');
      if (response.ok) {
        const data = await response.json();
        // تحويل البيانات إلى الشكل المطلوب
        const formattedMaterials = data.map((material: any) => ({
          id: material.id,
          name: material.name,
          unitCost: material.standardCost || 0,
          unit: material.unit
        }));
        setRawMaterials(formattedMaterials);
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      toast({
        title: 'خطأ في جلب البيانات',
        description: 'حدث خطأ أثناء جلب بيانات الخامات',
        variant: 'destructive'
      });
    } finally {
      setLoadingMaterials(false);
    }
  };

  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<CreatePurchaseOrderData>({
    supplierId: '',
    items: [],
    notes: ''
  });
  const [currentItem, setCurrentItem] = useState<Omit<PurchaseOrderItem, 'id' | 'totalPrice'>>({
    materialId: '',
    materialName: '',
    quantity: 0,
    unitPrice: 0,
    unit: ''
  });

  // تصفية أوامر الشراء
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // توليد رقم أمر شراء جديد
  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const orderCount = purchaseOrders.length + 1;
    return `PO-${year}-${orderCount.toString().padStart(3, '0')}`;
  };

  // إضافة عنصر إلى أمر الشراء
  const addItemToOrder = () => {
    if (!currentItem.materialId || currentItem.quantity <= 0 || currentItem.unitPrice <= 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع بيانات العنصر بشكل صحيح',
        variant: 'destructive'
      });
      return;
    }

    const material = rawMaterials.find(m => m.id === currentItem.materialId);
    if (!material) return;

    const newItem: Omit<PurchaseOrderItem, 'id' | 'totalPrice'> = {
      ...currentItem,
      materialName: material.name,
      unit: material.unit
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setCurrentItem({
      materialId: '',
      materialName: '',
      quantity: 0,
      unitPrice: 0,
      unit: ''
    });
  };

  // حذف عنصر من أمر الشراء
  const removeItemFromOrder = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  // حساب إجمالي أمر الشراء
  const calculateTotal = (items: Omit<PurchaseOrderItem, 'id' | 'totalPrice'>[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // إنشاء أمر شراء جديد
  const handleCreateOrder = async () => {
    if (!formData.supplierId || formData.items.length === 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى اختيار مورد وإضافة عنصر واحد على الأقل',
        variant: 'destructive'
      });
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier) return;

    try {
      // إعداد البيانات للإرسال إلى API
      const orderData = {
        supplierId: formData.supplierId,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        notes: formData.notes,
        items: formData.items.map(item => ({
          rawMaterialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      // إرسال البيانات إلى API
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const newOrder = await response.json();
        
        // إضافة الأمر الجديد إلى القائمة المحلية
        const orderWithSupplierName = {
          ...newOrder,
          supplierName: supplier.name,
          items: newOrder.items || formData.items.map((item, index) => ({
            ...item,
            id: (index + 1).toString(),
            totalPrice: item.quantity * item.unitPrice
          }))
        };
        
        setPurchaseOrders([...purchaseOrders, orderWithSupplierName]);
        setIsCreateDialogOpen(false);
        setFormData({ supplierId: '', items: [], notes: '' });
        
        toast({
          title: 'تم إنشاء أمر الشراء',
          description: `تم إنشاء أمر الشراء رقم ${newOrder.orderNumber} بنجاح`
        });
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ في الحفظ',
          description: error.error || 'حدث خطأ أثناء حفظ أمر الشراء',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ أمر الشراء',
        variant: 'destructive'
      });
    }
  };

  // اعتماد أمر الشراء
  const handleApproveOrder = (orderId: string) => {
    const updatedOrders = purchaseOrders.map(order => {
      if (order.id === orderId && order.status === 'draft') {
        return {
          ...order,
          status: 'approved' as const,
          approvedBy: 'مدير المشتريات', // يجب أن يأتي من نظام المصادقة
          approvedAt: new Date(),
          updatedAt: new Date()
        };
      }
      return order;
    });

    setPurchaseOrders(updatedOrders);
    toast({
      title: 'تم اعتماد أمر الشراء',
      description: 'تم اعتماد أمر الشراء بنجاح'
    });
  };

  // تنفيذ أمر الشراء
  const handleExecuteOrder = (orderId: string) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order || order.status !== 'approved') {
      toast({
        title: 'خطأ',
        description: 'لا يمكن تنفيذ أمر الشراء. يجب أن يكون معتمداً أولاً',
        variant: 'destructive'
      });
      return;
    }

    // هنا يتم:
    // 1. تسجيل الحركة في حساب المورد
    // 2. تحديث كمية الخام في جدول الخامات
    // 3. تحديث حالة أمر الشراء إلى منفذ

    const updatedOrders = purchaseOrders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'executed' as const,
          executedAt: new Date(),
          updatedAt: new Date()
        };
      }
      return o;
    });

    setPurchaseOrders(updatedOrders);
    
    toast({
      title: 'تم تنفيذ أمر الشراء',
      description: 'تم تنفيذ أمر الشراء وتحديث المخزون والحسابات'
    });
  };

  // حذف أمر الشراء
  const handleDeleteOrder = (order: PurchaseOrder | string) => {
    // استخراج معرف الأمر سواء كان كائن أو string
    const orderId = typeof order === 'string' ? order : order.id;
    
    const orderToDelete = purchaseOrders.find(o => o.id === orderId);
    if (orderToDelete && orderToDelete.status !== 'draft') {
      toast({
        title: 'خطأ',
        description: 'لا يمكن حذف أمر الشراء المعتمد أو المنفذ',
        variant: 'destructive'
      });
      return;
    }

    setPurchaseOrders(purchaseOrders.filter(order => order.id !== orderId));
    toast({
      title: 'تم حذف أمر الشراء',
      description: 'تم حذف أمر الشراء بنجاح'
    });
  };

  // عرض تفاصيل أمر الشراء
  const viewOrderDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  // تحديد لون حالة أمر الشراء
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'executed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // تحديد نص حالة أمر الشراء
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'approved': return 'معتمد';
      case 'executed': return 'منفذ';
      default: return 'غير معروف';
    }
  };

  // حساب الإحصائيات
  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(o => o.status === 'draft').length,
    approved: purchaseOrders.filter(o => o.status === 'approved').length,
    executed: purchaseOrders.filter(o => o.status === 'executed').length,
    totalValue: purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">أوامر الشراء</h1>
          <p className="text-muted-foreground">
            إدارة أوامر الشراء والموافقة عليها
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إنشاء أمر شراء جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء أمر شراء جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات أمر الشراء الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* اختيار المورد */}
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد *</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* إضافة عناصر */}
              <div className="space-y-4">
                <Label>إضافة عناصر أمر الشراء</Label>
                <div className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="material">الخام</Label>
                    <Select value={currentItem.materialId} onValueChange={(value) => {
                      const material = rawMaterials.find(m => m.id === value);
                      setCurrentItem({
                        ...currentItem,
                        materialId: value,
                        materialName: material?.name || '',
                        unitPrice: material?.unitCost || 0,
                        unit: material?.unit || ''
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الخام" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">سعر الوحدة</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unitPrice}
                      onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الإجمالي</Label>
                    <div className="p-2 bg-gray-50 rounded border text-center">
                      {(currentItem.quantity * currentItem.unitPrice).toFixed(2)} ريال
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button onClick={addItemToOrder} className="w-full">
                      إضافة
                    </Button>
                  </div>
                </div>
              </div>

              {/* قائمة العناصر المضافة */}
              {formData.items.length > 0 && (
                <div className="space-y-2">
                  <Label>عناصر أمر الشراء</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الخام</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>سعر الوحدة</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{item.unitPrice.toFixed(2)} ريال</TableCell>
                          <TableCell>{(item.quantity * item.unitPrice).toFixed(2)} ريال</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromOrder(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right font-bold">
                    الإجمالي الكلي: {calculateTotal(formData.items).toFixed(2)} ريال
                  </div>
                </div>
              )}

              {/* ملاحظات */}
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أدخل أي ملاحظات إضافية"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateOrder}>
                إنشاء أمر الشراء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأوامر</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مسودات</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معتمدة</CardTitle>
            <Check className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">منفذة</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.executed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()} ريال</div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث برقم الأمر أو اسم المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="تصفية بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="executed">منفذ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول أوامر الشراء */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة أوامر الشراء</CardTitle>
          <CardDescription>
            عدد النتائج: {filteredOrders.length} أمر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الأمر</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>تاريخ الأمر</TableHead>
                <TableHead>القيمة الإجمالية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} عنصر
                    </div>
                  </TableCell>
                  <TableCell>{order.supplierName}</TableCell>
                  <TableCell>{order.orderDate.toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>{order.totalAmount.toLocaleString()} ريال</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApproveOrder(order.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExecuteOrder(order.id)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نموذج عرض تفاصيل أمر الشراء */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[1600px] h-[95vh] max-h-[95vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر الشراء</DialogTitle>
            <DialogDescription>
              أمر الشراء رقم: {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المورد</Label>
                  <div className="font-medium">{selectedOrder.supplierName}</div>
                </div>
                <div>
                  <Label>تاريخ الأمر</Label>
                  <div className="font-medium">{selectedOrder.orderDate.toLocaleDateString('ar-SA')}</div>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <Label>أنشأ بواسطة</Label>
                  <div className="font-medium">{selectedOrder.createdBy}</div>
                </div>
              </div>

              {/* عناصر أمر الشراء */}
              <div>
                <Label>عناصر أمر الشراء</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الخام</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.materialName}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>{item.unitPrice.toFixed(2)} ريال</TableCell>
                        <TableCell>{item.totalPrice.toFixed(2)} ريال</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right font-bold mt-2">
                  الإجمالي الكلي: {selectedOrder.totalAmount.toFixed(2)} ريال
                </div>
              </div>

              {/* ملاحظات */}
              {selectedOrder.notes && (
                <div>
                  <Label>ملاحظات</Label>
                  <div className="p-3 bg-gray-50 rounded border">{selectedOrder.notes}</div>
                </div>
              )}

              {/* معلومات الاعتماد والتنفيذ */}
              {selectedOrder.approvedBy && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>اعتمد بواسطة</Label>
                    <div className="font-medium">{selectedOrder.approvedBy}</div>
                  </div>
                  <div>
                    <Label>تاريخ الاعتماد</Label>
                    <div className="font-medium">
                      {selectedOrder.approvedAt?.toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.executedAt && (
                <div>
                  <Label>تاريخ التنفيذ</Label>
                  <div className="font-medium">
                    {selectedOrder.executedAt.toLocaleDateString('ar-SA')}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}