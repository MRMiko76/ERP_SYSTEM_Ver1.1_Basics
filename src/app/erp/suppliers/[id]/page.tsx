'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, DollarSign, ShoppingCart, Calendar, FileText, Receipt, Plus, FileDown, Printer, Check, X, User, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  balance: number;
  totalPurchases: number;
  createdAt: Date;
  updatedAt: Date;
}

// بيانات وهمية للمشتريات
interface PurchaseHistory {
  id: string;
  date: Date;
  orderNumber: string;
  items: string;
  amount: number;
  status: 'DRAFT' | 'APPROVED' | 'EXECUTED' | 'CANCELLED'; // استخدام الحالات الفعلية من قاعدة البيانات
}

interface AccountStatement {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'purchase' | 'payment' | 'adjustment';
}

// سيتم جلب تاريخ المشتريات من قاعدة البيانات
const mockPurchaseHistory: PurchaseHistory[] = [];

// سيتم جلب كشف الحساب من قاعدة البيانات
const mockAccountStatement: AccountStatement[] = [];

// بيانات وهمية للموردين
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'شركة المواد الخام المتقدمة',
    contactPerson: 'أحمد محمد سمير',
    phone: '01212312313',
    address: 'القاهرة، مصر',
    status: 'active',
    balance: 15000,
    totalPurchases: 125000,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-05')
  },
  {
    id: '2',
    name: 'شركة النيل للتجارة',
    contactPerson: 'محمد أحمد حسن',
    phone: '01098765432',
    address: 'الجيزة، مصر',
    status: 'active',
    balance: -5000,
    totalPurchases: 89000,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-04')
  },
  {
    id: '3',
    name: 'محمد علي للمواد الخام',
    contactPerson: 'علي محمود سالم',
    phone: '01156789012',
    address: 'الإسكندرية، مصر',
    status: 'inactive',
    balance: 0,
    totalPurchases: 45000,
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2025-01-03')
  }
];

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseHistory[]>([]);
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseHistory | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<AccountStatement | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const supplierId = params.id as string;
        
        console.log('🔍 [SUPPLIER DETAILS] Fetching supplier with ID:', supplierId);
        
        const response = await fetch(`/api/suppliers/${supplierId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [SUPPLIER DETAILS] Supplier data received:', data);
          
          // تحويل البيانات لتتوافق مع النوع المطلوب
          const formattedSupplier: Supplier = {
            ...data,
            email: data.contactPerson || '', // استخدام contactPerson كبديل للـ email
            status: data.active ? 'active' : 'inactive',
            balance: Number(data.accountBalance) || 0,
            totalPurchases: data.totalPurchases || 0,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          };
          
          setSupplier(formattedSupplier);
        } else {
          console.error('❌ [SUPPLIER DETAILS] Failed to fetch supplier:', response.status);
          toast({
            title: 'خطأ',
            description: 'لم يتم العثور على المورد',
            variant: 'destructive'
          });
          router.push('/erp/suppliers');
        }
      } catch (error) {
        console.error('💥 [SUPPLIER DETAILS] Error fetching supplier:', error);
        toast({
          title: 'خطأ في الشبكة',
          description: 'حدث خطأ أثناء جلب بيانات المورد',
          variant: 'destructive'
        });
        router.push('/erp/suppliers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupplier();
   }, [params.id, router, toast]);

  // جلب أوامر الشراء المرتبطة بالمورد
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      if (!supplier?.id) return;
      
      try {
        setLoadingPurchaseOrders(true);
        console.log('🔍 [SUPPLIER DETAILS] Fetching purchase orders for supplier:', supplier.id);
        
        const response = await fetch(`/api/suppliers/${supplier.id}/purchase-orders`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [SUPPLIER DETAILS] Purchase orders received:', data);
          
          // تحويل البيانات لتتوافق مع النوع المطلوب
          const formattedOrders: PurchaseHistory[] = data.map((order: any) => ({
            id: order.id,
            date: new Date(order.createdAt),
            orderNumber: order.orderNumber,
            items: order.items?.map((item: any) => item.material?.name || 'غير محدد').join(', ') || 'غير محدد',
            amount: Number(order.totalAmount) || 0,
            status: order.status // استخدام الحالة الفعلية من قاعدة البيانات
          }));
          
          setPurchaseOrders(formattedOrders);
          
          // حساب إجمالي المشتريات من أوامر الشراء المعتمدة والمنفذة فقط
          const calculatedTotalPurchases = formattedOrders
            .filter(order => order.status === 'APPROVED' || order.status === 'EXECUTED')
            .reduce((sum, order) => sum + order.amount, 0);
          
          // تحديث بيانات المورد مع إجمالي المشتريات المحسوب
          if (supplier) {
            setSupplier(prev => prev ? {
              ...prev,
              totalPurchases: calculatedTotalPurchases
            } : null);
          }
        } else {
          console.error('❌ [SUPPLIER DETAILS] Failed to fetch purchase orders:', response.status);
        }
      } catch (error) {
        console.error('💥 [SUPPLIER DETAILS] Error fetching purchase orders:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء جلب أوامر الشراء',
          variant: 'destructive'
        });
      } finally {
        setLoadingPurchaseOrders(false);
      }
    };
    
    fetchPurchaseOrders();
  }, [supplier?.id, toast]);

  // إعادة جلب أوامر الشراء عند التركيز على النافذة (للتأكد من ظهور الأوامر الجديدة)
  useEffect(() => {
    const handleFocus = () => {
      if (supplier?.id) {
        // إعادة جلب أوامر الشراء عند العودة للصفحة
        const fetchPurchaseOrders = async () => {
          try {
            const response = await fetch(`/api/suppliers/${supplier.id}/purchase-orders`);
            if (response.ok) {
              const data = await response.json();
              const formattedOrders: PurchaseHistory[] = data.map((order: any) => ({
                id: order.id,
                date: new Date(order.createdAt),
                orderNumber: order.orderNumber,
                items: order.items?.map((item: any) => item.material?.name || 'غير محدد').join(', ') || 'غير محدد',
                amount: Number(order.totalAmount) || 0,
                status: order.status // استخدام الحالة الفعلية من قاعدة البيانات
              }));
              
              setPurchaseOrders(formattedOrders);
              
              // تحديث إجمالي المشتريات من الأوامر المعتمدة والمنفذة فقط
              const calculatedTotalPurchases = formattedOrders
                .filter(order => order.status === 'APPROVED' || order.status === 'EXECUTED')
                .reduce((sum, order) => sum + order.amount, 0);
              setSupplier(prev => prev ? {
                ...prev,
                totalPurchases: calculatedTotalPurchases
              } : null);
            }
          } catch (error) {
            console.error('Error refreshing purchase orders:', error);
          }
        };
        
        fetchPurchaseOrders();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [supplier?.id]);

  // دالة لإعادة تحديث أوامر الشراء يدوياً
  const refreshPurchaseOrders = async () => {
    if (!supplier?.id) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 [SUPPLIER DETAILS] Manually refreshing purchase orders for supplier:', supplier.id);
      
      const response = await fetch(`/api/suppliers/${supplier.id}/purchase-orders`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [SUPPLIER DETAILS] Purchase orders refreshed:', data);
        
        const formattedOrders: PurchaseHistory[] = data.map((order: any) => ({
          id: order.id,
          date: new Date(order.createdAt),
          orderNumber: order.orderNumber,
          items: order.items?.map((item: any) => item.material?.name || 'غير محدد').join(', ') || 'غير محدد',
          amount: Number(order.totalAmount) || 0,
          status: order.status // استخدام الحالة الفعلية من قاعدة البيانات
        }));
        
        setPurchaseOrders(formattedOrders);
        
        // تحديث إجمالي المشتريات من الأوامر المعتمدة والمنفذة فقط
        const calculatedTotalPurchases = formattedOrders
          .filter(order => order.status === 'APPROVED' || order.status === 'EXECUTED')
          .reduce((sum, order) => sum + order.amount, 0);
        setSupplier(prev => prev ? {
          ...prev,
          totalPurchases: calculatedTotalPurchases
        } : null);
        
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث أوامر الشراء بنجاح',
        });
      } else {
        console.error('❌ [SUPPLIER DETAILS] Failed to refresh purchase orders:', response.status);
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث أوامر الشراء',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('💥 [SUPPLIER DETAILS] Error refreshing purchase orders:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث أوامر الشراء',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };
 
    const formatBalance = (balance: number) => {
    const absBalance = Math.abs(balance);
    const formatted = new Intl.NumberFormat('ar-EG').format(absBalance);
    
    if (balance > 0) {
      return `${formatted} جنيه (دائن)`;
    } else if (balance < 0) {
      return `${formatted} جنيه (مدين)`;
    } else {
      return '0 جنيه (متوازن)';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG').format(amount) + ' جنيه';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">معتمد</Badge>;
      case 'EXECUTED':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">منفذ</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ملغى</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">مسودة</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">غير محدد</Badge>;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'adjustment':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleEdit = () => {
    if (supplier) {
      setEditedSupplier({ ...supplier })
      setIsEditMode(true)
    }
  }

  const handleSave = () => {
    if (editedSupplier) {
      // تحديث البيانات في المصفوفة الأساسية
      const supplierIndex = mockSuppliers.findIndex(s => s.id === editedSupplier.id)
      if (supplierIndex !== -1) {
        mockSuppliers[supplierIndex] = { ...editedSupplier, updatedAt: new Date() }
      }
      
      // تحديث البيانات المحلية
      setSupplier({ ...editedSupplier, updatedAt: new Date() })
      setIsEditMode(false)
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث بيانات المورد بنجاح',
      })
    }
  }

  const handleCancel = () => {
    setEditedSupplier(null)
    setIsEditMode(false)
  }

  const handleDelete = () => {
    if (supplier) {
      if (confirm('هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.')) {
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف المورد بنجاح',
        })
        router.push('/erp/suppliers')
      }
    }
  }

  const handlePurchaseRowClick = (purchase: PurchaseHistory) => {
    setSelectedPurchase(purchase)
    setIsPurchaseDialogOpen(true)
  }

  const handleTransactionRowClick = (transaction: AccountStatement) => {
    setSelectedTransaction(transaction)
    setIsTransactionDialogOpen(true)
  }

  const handleCreatePurchaseOrder = () => {
    router.push(`/erp/purchase/purchase-orders/new?supplierId=${params.id}`)
  }

  const exportToExcel = () => {
    if (!supplier) return

    // إعداد بيانات تاريخ المشتريات
    const purchaseData = purchaseOrders.map(purchase => ({
      'رقم الطلب': purchase.orderNumber,
      'التاريخ': formatShortDate(purchase.date),
      'المبلغ الإجمالي': purchase.amount,
      'الحالة': purchase.status,
      'الأصناف': purchase.items
    }))

    // إعداد بيانات كشف الحساب
    const accountData = mockAccountStatement.map(statement => ({
      'التاريخ': formatShortDate(statement.date),
      'نوع المعاملة': statement.type === 'purchase' ? 'شراء' : statement.type === 'payment' ? 'دفع' : 'تعديل',
      'مدين': statement.debit || 0,
      'دائن': statement.credit || 0,
      'الرصيد': statement.balance,
      'البيان': statement.description
    }))

    // إنشاء ملف Excel
    const workbook = XLSX.utils.book_new()
    
    // إضافة صفحة تاريخ المشتريات
    const purchaseSheet = XLSX.utils.json_to_sheet(purchaseData)
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'تاريخ المشتريات')
    
    // إضافة صفحة كشف الحساب
    const accountSheet = XLSX.utils.json_to_sheet(accountData)
    XLSX.utils.book_append_sheet(workbook, accountSheet, 'كشف الحساب')
    
    // تصدير الملف
    const fileName = `تقرير_المورد_${supplier.name}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast({
      title: 'تم التصدير بنجاح',
      description: 'تم تصدير البيانات إلى ملف Excel بنجاح',
    })
  }

  const generateSupplierReport = () => {
    if (!supplier) return

    // حساب إجمالي المشتريات
    const totalPurchases = purchaseOrders.reduce((sum, purchase) => sum + purchase.amount, 0)
    
    // حساب الرصيد الحالي
    const currentBalance = supplier.balance || 0
    
    // حساب عدد الطلبات
    const totalOrders = purchaseOrders.length
    
    // حساب متوسط قيمة الطلب
    const averageOrderValue = totalOrders > 0 ? totalPurchases / totalOrders : 0

    const reportData = {
      supplierInfo: {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      },
      summary: {
        totalPurchases,
        currentBalance,
        totalOrders,
        averageOrderValue,
        reportDate: new Date().toLocaleDateString('ar-EG')
      },
      purchases: purchaseOrders,
      accountStatement: mockAccountStatement
    }

    // يمكن هنا إضافة منطق لحفظ التقرير أو إرساله
    console.log('تقرير المورد:', reportData)
    
    toast({
      title: 'تم إنشاء التقرير',
      description: 'تم إنشاء تقرير شامل للمورد بنجاح',
    })

    return reportData
  }

  const printAccountStatement = () => {
    const reportData = generateSupplierReport()
    
    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب المورد - ${supplier?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .supplier-info { margin-bottom: 20px; }
          .summary { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f5f5f5; }
          .total { font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>كشف حساب المورد</h1>
          <h2>${supplier?.name}</h2>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        
        <div class="supplier-info">
          <h3>بيانات المورد:</h3>
          <p><strong>الاسم:</strong> ${supplier?.name}</p>
          <p><strong>البريد الإلكتروني:</strong> ${supplier?.email}</p>
          <p><strong>الهاتف:</strong> ${supplier?.phone}</p>
          <p><strong>العنوان:</strong> ${supplier?.address}</p>
        </div>
        
        <div class="summary">
          <h3>ملخص الحساب:</h3>
          <p><strong>إجمالي المشتريات:</strong> ${reportData?.summary.totalPurchases.toLocaleString()} ج.م</p>
          <p><strong>الرصيد الحالي:</strong> ${reportData?.summary.currentBalance.toLocaleString()} ج.م</p>
          <p><strong>عدد الطلبات:</strong> ${reportData?.summary.totalOrders}</p>
          <p><strong>متوسط قيمة الطلب:</strong> ${reportData?.summary.averageOrderValue.toLocaleString()} ج.م</p>
        </div>
        
        <h3>كشف الحساب التفصيلي:</h3>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${mockAccountStatement.map(statement => `
              <tr>
                <td>${formatShortDate(statement.date)}</td>
                <td>${statement.description}</td>
                <td>${statement.debit > 0 ? statement.debit.toLocaleString() : '-'}</td>
                <td>${statement.credit > 0 ? statement.credit.toLocaleString() : '-'}</td>
                <td class="total">${statement.balance.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <p className="text-muted-foreground">تفاصيل المورد</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
            {supplier.status === 'active' ? 'نشط' : 'غير نشط'}
          </Badge>
          {isEditMode ? (
            <>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 ml-2" />
                حفظ
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* المعلومات الأساسية */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>بيانات المورد الشخصية والتواصل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">اسم الشخص المسؤول</p>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editedSupplier?.contactPerson || ''}
                          onChange={(e) => setEditedSupplier(prev => prev ? {...prev, contactPerson: e.target.value} : null)}
                          className="font-medium bg-white border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <p className="font-medium">{supplier.contactPerson}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editedSupplier?.phone || ''}
                          onChange={(e) => setEditedSupplier(prev => prev ? {...prev, phone: e.target.value} : null)}
                          className="font-medium bg-white border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <p className="font-medium">{supplier.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editedSupplier?.address || ''}
                          onChange={(e) => setEditedSupplier(prev => prev ? {...prev, address: e.target.value} : null)}
                          className="font-medium bg-white border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <p className="font-medium">{supplier.address}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                      <p className="font-medium">{formatDate(supplier.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">آخر تحديث</p>
                <p className="font-medium">{formatDate(supplier.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* تبويب تاريخ المشتريات وكشف الحساب */}
          <Card>
            <CardHeader>
              <CardTitle>السجلات والتقارير</CardTitle>
              <CardDescription>تاريخ المشتريات وكشف الحساب التفصيلي</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="purchases" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="purchases" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    تاريخ المشتريات
                  </TabsTrigger>
                  <TabsTrigger value="statement" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    كشف الحساب
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="purchases" className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">تاريخ المشتريات</h3>
                    <Button
                      onClick={refreshPurchaseOrders}
                      disabled={refreshing}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'جاري التحديث...' : 'تحديث'}
                    </Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>رقم الطلب</TableHead>
                          <TableHead>الأصناف</TableHead>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingPurchaseOrders ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              جاري تحميل أوامر الشراء...
                            </TableCell>
                          </TableRow>
                        ) : purchaseOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              لا توجد أوامر شراء مسجلة لهذا المورد
                            </TableCell>
                          </TableRow>
                        ) : (
                          purchaseOrders.map((purchase) => (
                            <TableRow 
                              key={purchase.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handlePurchaseRowClick(purchase)}
                            >
                              <TableCell>{formatShortDate(purchase.date)}</TableCell>
                              <TableCell className="font-medium">{purchase.orderNumber}</TableCell>
                              <TableCell>{purchase.items}</TableCell>
                              <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                              <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="statement" className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>البيان</TableHead>
                          <TableHead>مدين</TableHead>
                          <TableHead>دائن</TableHead>
                          <TableHead>الرصيد</TableHead>
                          <TableHead>النوع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockAccountStatement.map((statement) => (
                          <TableRow 
                            key={statement.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleTransactionRowClick(statement)}
                          >
                            <TableCell>{formatShortDate(statement.date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionTypeIcon(statement.type)}
                                {statement.description}
                              </div>
                            </TableCell>
                            <TableCell className={statement.debit > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                              {statement.debit > 0 ? formatCurrency(statement.debit) : '-'}
                            </TableCell>
                            <TableCell className={statement.credit > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                              {statement.credit > 0 ? formatCurrency(statement.credit) : '-'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(statement.balance)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {statement.type === 'purchase' ? 'شراء' : statement.type === 'payment' ? 'دفع' : 'تعديل'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* الملخص المالي */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الملخص المالي</CardTitle>
              <CardDescription>الرصيد الحالي وإجمالي المشتريات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  supplier.balance > 0 
                    ? 'bg-green-100' 
                    : supplier.balance < 0 
                    ? 'bg-red-100' 
                    : 'bg-gray-100'
                }`}>
                  <DollarSign className={`h-4 w-4 ${
                    supplier.balance > 0 
                      ? 'text-green-600' 
                      : supplier.balance < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                  <p className={`font-bold ${
                    supplier.balance > 0 
                      ? 'text-green-600' 
                      : supplier.balance < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {formatBalance(supplier.balance)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                  <p className="font-bold text-blue-600">
                    {formatCurrency(supplier.totalPurchases)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* إجراءات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" onClick={handleCreatePurchaseOrder}>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء أمر شراء جديد
              </Button>
              <Button className="w-full" variant="outline" onClick={exportToExcel}>
                <FileDown className="h-4 w-4 ml-2" />
                تصدير إلى Excel
              </Button>
              <Button className="w-full" variant="outline" onClick={generateSupplierReport}>
                <FileText className="h-4 w-4 ml-2" />
                إنشاء تقرير
              </Button>
              <Button className="w-full" variant="outline" onClick={printAccountStatement}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة كشف الحساب
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* نافذة تفاصيل المشتريات */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الشراء</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">رقم الطلب</label>
                  <p className="text-lg font-semibold">{selectedPurchase.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">التاريخ</label>
                  <p className="text-lg">{formatShortDate(selectedPurchase.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ الإجمالي</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedPurchase.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الحالة</label>
                  <div className="mt-1">{getStatusBadge(selectedPurchase.status)}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">الأصناف:</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedPurchase.items}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة تفاصيل كشف الحساب */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحركة المالية</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">نوع المعاملة</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTransactionTypeIcon(selectedTransaction.type)}
                    <span className="text-lg font-semibold">
                      {selectedTransaction.type === 'purchase' ? 'شراء' : selectedTransaction.type === 'payment' ? 'دفع' : 'تعديل'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">التاريخ</label>
                  <p className="text-lg">{formatShortDate(selectedTransaction.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">مدين</label>
                  <p className={`text-lg font-semibold ${
                    selectedTransaction.debit > 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {selectedTransaction.debit > 0 ? formatCurrency(selectedTransaction.debit) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">دائن</label>
                  <p className={`text-lg font-semibold ${
                    selectedTransaction.credit > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {selectedTransaction.credit > 0 ? formatCurrency(selectedTransaction.credit) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الرصيد بعد المعاملة</label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedTransaction.balance)}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">البيان:</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedTransaction.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}