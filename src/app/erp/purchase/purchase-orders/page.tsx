'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, FileText, TrendingUp, Trash2, Clock, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrdersTable } from '@/components/erp/purchase-orders/purchase-orders-table';
import { PurchaseOrderForm } from '@/components/erp/purchase-orders/purchase-order-form';
import { PurchaseOrderDetail } from '@/components/erp/purchase-orders/purchase-order-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchaseOrder, Supplier, RawMaterial } from '@/types/erp';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const { toast } = useToast();

  // Mock data - in real app, this would come from API
  const mockSuppliers: Supplier[] = [
    {
      id: '1',
      code: 'SUP001',
      name: 'شركة الخليج للمواد الخام',
      email: 'info@gulf-materials.com',
      phone: '+966501234567',
      isActive: true,
      paymentTerms: 'نقدي خلال 30 يوم',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
    },
    {
      id: '2',
      code: 'SUP002',
      name: 'مؤسسة النجاح التجارية',
      email: 'sales@najah-trading.com',
      phone: '+966502345678',
      isActive: true,
      paymentTerms: 'نقدي خلال 15 يوم',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
    },
  ];

  // تم إزالة البيانات التجريبية للخامات - سيتم استخدام البيانات الفعلية من قاعدة البيانات فقط

  const mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: '1',
      orderNumber: 'PO-2024-001',
      supplierId: '1',
      supplier: mockSuppliers[0],
      orderDate: '2024-01-20T10:00:00Z',
      expectedDeliveryDate: '2024-02-05T10:00:00Z',
      status: 'PENDING',
      priority: 'HIGH',
      paymentTerms: 'نقدي خلال 30 يوم',
      deliveryAddress: 'المستودع الرئيسي - الرياض',
      notes: 'طلب عاجل للإنتاج',
      subtotalAmount: 10000,
      taxAmount: 1500,
      totalAmount: 11500,
      items: [
        {
          id: '1',
          rawMaterialId: '1',
          rawMaterial: {
            id: '1',
            code: 'RM001',
            name: 'خامة تجريبية 1',
            category: 'عام',
            unit: 'كيلو',
            isActive: true,
            currentStock: 0,
            minStock: 0,
            maxStock: 0,
            reorderPoint: 0,
            standardCost: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 4,
          unitPrice: 2500,
          totalPrice: 10000,
          notes: 'جودة عالية مطلوبة',
        },
      ],
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: '2',
      orderNumber: 'PO-2024-002',
      supplierId: '2',
      supplier: mockSuppliers[1],
      orderDate: '2024-01-18T14:30:00Z',
      expectedDeliveryDate: '2024-01-30T14:30:00Z',
      status: 'APPROVED',
      priority: 'MEDIUM',
      paymentTerms: 'نقدي خلال 15 يوم',
      deliveryAddress: 'المستودع الفرعي - جدة',
      subtotalAmount: 1500,
      taxAmount: 225,
      totalAmount: 1725,
      items: [
        {
          id: '2',
          rawMaterialId: '2',
          rawMaterial: {
            id: '2',
            code: 'RM002',
            name: 'خامة تجريبية 2',
            category: 'عام',
            unit: 'كيلو',
            isActive: true,
            currentStock: 0,
            minStock: 0,
            maxStock: 0,
            reorderPoint: 0,
            standardCost: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 100,
          unitPrice: 15,
          totalPrice: 1500,
        },
      ],
      createdAt: '2024-01-18T14:30:00Z',
      updatedAt: '2024-01-19T09:15:00Z',
    },
    {
      id: '3',
      orderNumber: 'PO-2024-003',
      supplierId: '1',
      supplier: mockSuppliers[0],
      orderDate: '2024-01-15T09:00:00Z',
      expectedDeliveryDate: '2024-01-25T09:00:00Z',
      status: 'EXECUTED',
      priority: 'LOW',
      paymentTerms: 'نقدي خلال 30 يوم',
      deliveryAddress: 'المستودع الرئيسي - الرياض',
      subtotalAmount: 5000,
      taxAmount: 750,
      totalAmount: 5750,
      items: [
        {
          id: '3',
          rawMaterialId: '1',
          rawMaterial: {
            id: '1',
            code: 'RM001',
            name: 'خامة تجريبية 1',
            category: 'عام',
            unit: 'كيلو',
            isActive: true,
            currentStock: 0,
            minStock: 0,
            maxStock: 0,
            reorderPoint: 0,
            standardCost: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 2,
          unitPrice: 2500,
          totalPrice: 5000,
        },
      ],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-25T11:30:00Z',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, suppliersRes, materialsRes] = await Promise.all([
          fetch('/api/purchase-orders'),
          fetch('/api/suppliers'),
          fetch('/api/raw-materials')
        ]);
        
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json();
          // API يُرجع البيانات مباشرة كمصفوفة وليس كخاصية suppliers
          setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        } else {
          // Use mock data as fallback for suppliers
          setSuppliers(mockSuppliers);
        }
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setPurchaseOrders(ordersData.purchaseOrders || []);
        } else {
          // Use mock data as fallback for purchase orders
          setPurchaseOrders(mockPurchaseOrders);
        }
        
        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          // تحويل البيانات من API إلى التنسيق المطلوب للنموذج
          const formattedMaterials = (materialsData.rawMaterials || []).map((material: any) => ({
            id: material.id,
            code: material.id, // استخدام ID كرمز مؤقت
            name: material.name,
            category: material.materialType === 'production' ? 'إنتاج' : 'تعبئة',
            unit: material.unit,
            isActive: true,
            currentStock: parseFloat(material.availableQuantity || '0'),
            minStock: parseFloat(material.minimumStock || '0'),
            maxStock: parseFloat(material.maximumStock || '0'),
            reorderPoint: parseFloat(material.reorderPoint || '0'),
            standardCost: parseFloat(material.unitCost || '0'),
            createdAt: material.createdAt,
            updatedAt: material.updatedAt,
          }));
          setRawMaterials(formattedMaterials);
        } else {
          // في حالة فشل الاتصال، استخدم مصفوفة فارغة
          setRawMaterials([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use mock data as fallback
        setSuppliers(mockSuppliers);
        setPurchaseOrders(mockPurchaseOrders);
        setRawMaterials([]); // استخدام مصفوفة فارغة للخامات في حالة الخطأ
        toast({
          title: 'تحذير',
          description: 'تم تحميل البيانات التجريبية بسبب خطأ في الاتصال',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      order.status === statusFilter;
    
    const matchesSupplier = 
      supplierFilter === 'all' ||
      order.supplierId === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    // التوجه إلى صفحة التعديل المنفصلة
    window.location.href = `/erp/purchase/purchase-orders/${order.id}`;
  };

  const handleDuplicateOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setFormMode('duplicate');
    setShowForm(true);
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleDeleteOrder = async (order: PurchaseOrder | string) => {
    // استخراج معرف الأمر سواء كان كائن أو string
    const orderId = typeof order === 'string' ? order : order.id;
    
    // إضافة تأكيد الحذف
    if (!confirm('هل أنت متأكد من حذف أمر الشراء هذا؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حذف أمر الشراء');
      }

      // تحديث القائمة المحلية بعد الحذف الناجح
      setPurchaseOrders(prev => prev.filter(o => o.id !== orderId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف أمر الشراء بنجاح',
      });
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في حذف أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  const handleApproveOrder = async (order: PurchaseOrder | string) => {
    const orderId = typeof order === 'string' ? order : order.id;
    try {
      // In real app: await fetch(`/api/purchase-orders/${orderId}/approve`, { method: 'POST' });
      setPurchaseOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: 'APPROVED', updatedAt: new Date().toISOString() }
          : o
      ));
      toast({
        title: 'تم الاعتماد',
        description: 'تم اعتماد أمر الشراء بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في اعتماد أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  const handleRejectOrder = async (order: PurchaseOrder | string) => {
    const orderId = typeof order === 'string' ? order : order.id;
    try {
      // In real app: await fetch(`/api/purchase-orders/${orderId}/reject`, { method: 'POST' });
      setPurchaseOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: 'REJECTED', updatedAt: new Date().toISOString() }
          : o
      ));
      toast({
        title: 'تم الرفض',
        description: 'تم رفض أمر الشراء',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في رفض أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteOrder = async (order: PurchaseOrder | string) => {
    const orderId = typeof order === 'string' ? order : order.id;
    try {
      // In real app: await fetch(`/api/purchase-orders/${orderId}/execute`, { method: 'POST' });
      setPurchaseOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: 'EXECUTED', updatedAt: new Date().toISOString() }
          : o
      ));
      toast({
        title: 'تم التنفيذ',
        description: 'تم تنفيذ أمر الشراء بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تنفيذ أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  const handleCancelOrder = async (order: PurchaseOrder | string) => {
    const orderId = typeof order === 'string' ? order : order.id;
    try {
      // In real app: await fetch(`/api/purchase-orders/${orderId}/cancel`, { method: 'POST' });
      setPurchaseOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: 'CANCELLED', updatedAt: new Date().toISOString() }
          : o
      ));
      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء أمر الشراء',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إلغاء أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  // Generate automatic order number based on existing orders
  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Find the highest order number for current year
    const currentYearOrders = purchaseOrders.filter(order => 
      order.orderNumber.startsWith(`PO-${year}-`)
    );
    
    let maxOrderNumber = 0;
    currentYearOrders.forEach(order => {
      const orderNumberParts = order.orderNumber.split('-');
      if (orderNumberParts.length >= 3) {
        const orderNum = parseInt(orderNumberParts[2]);
        if (!isNaN(orderNum) && orderNum > maxOrderNumber) {
          maxOrderNumber = orderNum;
        }
      }
    });
    
    const nextOrderNumber = (maxOrderNumber + 1).toString().padStart(3, '0');
    return `PO-${year}-${nextOrderNumber}`;
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (formMode === 'create') {
        // Generate automatic order number if not provided
        const orderData = {
          ...data,
          orderNumber: data.orderNumber || generateOrderNumber(),
        };
        
        const response = await fetch('/api/purchase-orders', { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData) 
        });
        
        if (response.ok) {
          const newOrder = await response.json();
          // إعادة تحميل قائمة أوامر الشراء من الخادم
          const ordersRes = await fetch('/api/purchase-orders');
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setPurchaseOrders(ordersData.purchaseOrders || []);
          } else {
            // Fallback: add to local state if API fails
            setPurchaseOrders(prev => [...prev, { ...orderData, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
          }
          toast({
            title: 'تم الإنشاء',
            description: `تم إنشاء أمر الشراء ${orderData.orderNumber} بنجاح`,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل في إنشاء أمر الشراء');
        }
      } else if (formMode === 'edit') {
        const response = await fetch(`/api/purchase-orders/${selectedOrder?.id}`, { 
          method: 'PUT', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data) 
        });
        
        if (response.ok) {
          // إعادة تحميل قائمة أوامر الشراء من الخادم
          const ordersRes = await fetch('/api/purchase-orders');
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setPurchaseOrders(ordersData.purchaseOrders || []);
          }
          toast({
            title: 'تم التحديث',
            description: 'تم تحديث أمر الشراء بنجاح',
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل في تحديث أمر الشراء');
        }
      } else if (formMode === 'duplicate') {
        // Generate new order number for duplicate
        const duplicateData = {
          ...data,
          orderNumber: generateOrderNumber(),
        };
        
        const response = await fetch(`/api/purchase-orders/${selectedOrder?.id}/duplicate`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(duplicateData) 
        });
        
        if (response.ok) {
          // إعادة تحميل قائمة أوامر الشراء من الخادم
          const ordersRes = await fetch('/api/purchase-orders');
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setPurchaseOrders(ordersData.purchaseOrders || []);
          }
          toast({
            title: 'تم النسخ',
            description: 'تم نسخ أمر الشراء بنجاح',
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل في نسخ أمر الشراء');
        }
      }
      setShowForm(false);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    // In real app, this would generate and download a file
    toast({
      title: 'تصدير البيانات',
      description: 'سيتم تحميل ملف Excel قريباً',
    });
  };



  // Statistics
  const totalOrders = purchaseOrders.length;
  const pendingOrders = purchaseOrders.filter(o => o.status === 'PENDING').length;
  const approvedOrders = purchaseOrders.filter(o => o.status === 'APPROVED').length;
  const executedOrders = purchaseOrders.filter(o => o.status === 'EXECUTED').length;
  const totalValue = purchaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const overdueOrders = purchaseOrders.filter(o => 
    new Date(o.expectedDeliveryDate) < new Date() && 
    o.status !== 'EXECUTED' && 
    o.status !== 'CANCELLED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">أوامر الشراء</h1>
          <p className="text-muted-foreground">إدارة أوامر الشراء ومتابعة حالة الطلبات</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
          <Button onClick={handleCreateOrder}>
            <Plus className="ml-2 h-4 w-4" />
            أمر شراء جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-muted-foreground">إجمالي الأوامر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders}</p>
                <p className="text-xs text-muted-foreground">في الانتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedOrders}</p>
                <p className="text-xs text-muted-foreground">معتمدة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{executedOrders}</p>
                <p className="text-xs text-muted-foreground">منفذة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueOrders}</p>
                <p className="text-xs text-muted-foreground">متأخرة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث برقم الأمر أو اسم المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="DRAFT">مسودة</SelectItem>
                <SelectItem value="PENDING">في الانتظار</SelectItem>
                <SelectItem value="APPROVED">معتمد</SelectItem>
                <SelectItem value="EXECUTED">منفذ</SelectItem>
                <SelectItem value="CANCELLED">ملغي</SelectItem>
                <SelectItem value="REJECTED">مرفوض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="تصفية حسب المورد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموردين</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة أوامر الشراء</CardTitle>
          <CardDescription>
            {filteredOrders.length} من أصل {purchaseOrders.length} أمر شراء
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseOrdersTable
            purchaseOrders={filteredOrders}
            loading={loading}
            onView={handleViewOrder}
            onEdit={handleEditOrder}
            onDuplicate={handleDuplicateOrder}
            onDelete={handleDeleteOrder}
            onApprove={handleApproveOrder}
            onReject={handleRejectOrder}
            onExecute={handleExecuteOrder}
            onCancel={handleCancelOrder}
          />
        </CardContent>
      </Card>

      {/* Purchase Order Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[95vw] max-w-[1600px] h-[95vh] max-h-[95vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              {formMode === 'create' && 'إنشاء أمر شراء جديد'}
              {formMode === 'edit' && 'تعديل أمر الشراء'}
              {formMode === 'duplicate' && 'نسخ أمر الشراء'}
            </DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm
            order={selectedOrder}
            suppliers={suppliers}
            rawMaterials={rawMaterials}
            mode={formMode}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Purchase Order Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="w-[90vw] max-w-[1400px] h-[90vh] max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">تفاصيل أمر الشراء</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <PurchaseOrderDetail
              order={selectedOrder}
              onEdit={() => {
                setShowDetail(false);
                handleEditOrder(selectedOrder);
              }}
              onDuplicate={() => {
                setShowDetail(false);
                handleDuplicateOrder(selectedOrder);
              }}
              onDelete={() => {
                setShowDetail(false);
                handleDeleteOrder(selectedOrder.id);
              }}
              onApprove={() => {
                handleApproveOrder(selectedOrder.id);
                setShowDetail(false);
              }}
              onReject={() => {
                handleRejectOrder(selectedOrder.id);
                setShowDetail(false);
              }}
              onExecute={() => {
                handleExecuteOrder(selectedOrder.id);
                setShowDetail(false);
              }}
              onCancel={() => {
                handleCancelOrder(selectedOrder.id);
                setShowDetail(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}