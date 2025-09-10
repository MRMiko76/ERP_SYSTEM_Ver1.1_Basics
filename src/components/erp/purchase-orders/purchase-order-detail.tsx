'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Download,
  Mail,
  Printer,
  History,
  User,
  Phone,
  MapPin,
  Building,
  Calculator,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PurchaseOrderDetailProps {
  order: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onExecute?: () => void;
  onCancel?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onSendEmail?: () => void;
  onViewHistory?: () => void;
}

export function PurchaseOrderDetail({
  order,
  onEdit,
  onDelete,
  onDuplicate,
  onApprove,
  onReject,
  onExecute,
  onCancel,
  onPrint,
  onDownload,
  onSendEmail,
  onViewHistory,
}: PurchaseOrderDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [orderDetails, setOrderDetails] = useState<any>(order);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(orderDetails?.status || 'DRAFT');

  // جلب تفاصيل أمر الشراء من API
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order?.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/purchase-orders/${order.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);
        } else {
          console.error('Failed to fetch order details');
          // استخدام البيانات المُمررة كـ fallback
          setOrderDetails(order);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        // استخدام البيانات المُمررة كـ fallback
        setOrderDetails(order);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [order?.id]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'مسودة', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: FileText },
      APPROVED: { label: 'معتمد', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      EXECUTED: { label: 'منفذ', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
      CANCELLED: { label: 'ملغى', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      PENDING: { label: 'في الانتظار', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
      REJECTED: { label: 'مرفوض', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: FileText,
    };

    const IconComponent = config.icon;
    return (
      <Badge className={`flex items-center space-x-1 space-x-reverse ${config.className}`}>
        <IconComponent className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${orderDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        setOrderDetails(prev => ({ ...prev, status: newStatus }));
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'منخفضة', variant: 'secondary' as const },
      MEDIUM: { label: 'متوسطة', variant: 'outline' as const },
      HIGH: { label: 'عالية', variant: 'destructive' as const },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      variant: 'secondary' as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = () => {
    const today = new Date();
    const expectedDate = new Date(orderDetails.expectedDeliveryDate);
    return expectedDate < today && orderDetails.status !== 'EXECUTED' && orderDetails.status !== 'CANCELLED';
  };

  const getDeliveryStatus = () => {
    if (orderDetails.status === 'EXECUTED') {
      return (
        <Badge variant="default" className="flex items-center space-x-1 space-x-reverse">
          <CheckCircle className="h-3 w-3" />
          <span>تم التسليم</span>
        </Badge>
      );
    } else if (isOverdue()) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 space-x-reverse">
          <AlertTriangle className="h-3 w-3" />
          <span>متأخر</span>
        </Badge>
      );
    } else if (orderDetails.status === 'APPROVED') {
      return (
        <Badge variant="outline" className="flex items-center space-x-1 space-x-reverse">
          <Clock className="h-3 w-3" />
          <span>في الانتظار</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          غير محدد
        </Badge>
      );
    }
  };

  // Mock approval history - in real app, this would come from API
  const getApprovalHistory = () => {
    const history = [
      {
        id: '1',
        action: 'CREATED',
        user: 'أحمد محمد',
        date: orderDetails.createdAt,
        notes: 'تم إنشاء أمر الشراء',
      },
      {
        id: '2',
        action: 'SUBMITTED',
        user: 'أحمد محمد',
        date: orderDetails.createdAt,
        notes: 'تم إرسال الأمر للاعتماد',
      },
    ];

    if (orderDetails.status === 'APPROVED' || orderDetails.status === 'EXECUTED') {
      history.push({
        id: '3',
        action: 'APPROVED',
        user: 'مدير المشتريات',
        date: orderDetails.updatedAt,
        notes: 'تم اعتماد أمر الشراء',
      });
    }

    if (orderDetails.status === 'EXECUTED') {
      history.push({
        id: '4',
        action: 'EXECUTED',
        user: 'موظف المخزن',
        date: orderDetails.updatedAt,
        notes: 'تم تنفيذ أمر الشراء واستلام البضائع',
      });
    }

    return history;
  };

  const approvalHistory = getApprovalHistory();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">أمر الشراء #{orderDetails.orderNumber}</h1>
            {getStatusBadge(orderDetails.status)}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onPrint && (
                  <DropdownMenuItem onClick={onPrint}>
                    <Printer className="h-4 w-4 ml-2" />
                    طباعة
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="h-4 w-4 ml-2" />
                    تحميل PDF
                  </DropdownMenuItem>
                )}
                {onSendEmail && (
                  <DropdownMenuItem onClick={onSendEmail}>
                    <Mail className="h-4 w-4 ml-2" />
                    إرسال بريد إلكتروني
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-muted-foreground">تاريخ الإنشاء: {formatDate(orderDetails.createdAt)}</p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">المورد</span>
            </div>
            <p className="text-sm font-semibold mt-1">{orderDetails.supplier?.name || 'غير محدد'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">القيمة الإجمالية</span>
            </div>
            <p className="text-sm font-semibold mt-1">
              {formatCurrency(orderDetails.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0) || 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">تاريخ التسليم المتوقع</span>
            </div>
            <p className="text-sm font-semibold mt-1">{formatDate(orderDetails.expectedDeliveryDate)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">حالة التسليم</span>
            </div>
            <div className="mt-1">{getDeliveryStatus()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="items">العناصر</TabsTrigger>
          <TabsTrigger value="supplier">المورد</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        <div className="space-y-8 mt-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Order Summary */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ملخص الأمر
                </CardTitle>
                <CardDescription className="text-blue-600">تفاصيل أساسية عن أمر الشراء</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      رقم الأمر
                    </Label>
                    <p className="text-base font-bold text-gray-900 mt-1">{orderDetails.orderNumber}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      الحالة
                    </Label>
                    <div className="mt-2">
                      <Select value={currentStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {getStatusBadge(currentStatus)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <FileText className="h-4 w-4 text-yellow-600" />
                              <span>مسودة</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="APPROVED">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>معتمد</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="EXECUTED">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Package className="h-4 w-4 text-blue-600" />
                              <span>منفذ</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>ملغى</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      الأولوية
                    </Label>
                    <div className="mt-1">{getPriorityBadge(orderDetails.priority)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 2m8-2l2 2m-2-2v6a2 2 0 01-2 2H10a2 2 0 01-2-2v-6" />
                      </svg>
                      تاريخ الإنشاء
                    </Label>
                    <p className="text-base font-bold text-gray-900 mt-1">{formatDate(orderDetails.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      تاريخ التسليم المتوقع
                    </Label>
                    <p className="text-base font-bold text-gray-900 mt-1">{formatDate(orderDetails.expectedDeliveryDate)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border lg:col-span-1">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      ملاحظات
                    </Label>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">{orderDetails.notes || 'لا توجد ملاحظات'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="border-l-4 border-l-green-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  الملخص المالي
                </CardTitle>
                <CardDescription className="text-green-600">تفاصيل التكاليف والمبالغ</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
                    <span className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      المجموع الفرعي
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(orderDetails.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
                    <span className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                      </svg>
                      الضريبة ({orderDetails.taxRate || 15}%)
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(((orderDetails.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0) || 0) * (orderDetails.taxRate || 15)) / 100)}
                    </span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-100 to-green-200 rounded-lg border-2 border-green-300">
                    <span className="text-xl font-bold text-green-800 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      المجموع الإجمالي
                    </span>
                    <span className="text-2xl font-bold text-green-800">
                      {(() => {
                        const subtotal = orderDetails.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0) || 0;
                        const tax = (subtotal * (orderDetails.taxRate || 15)) / 100;
                        return formatCurrency(subtotal + tax);
                      })()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-8">
            <Card className="border-l-4 border-l-purple-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  عناصر الأمر
                </CardTitle>
                <CardDescription className="text-purple-600">قائمة بجميع المواد المطلوبة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto bg-white rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-100 to-purple-200">
                        <TableHead className="min-w-[120px] font-bold text-purple-800">كود المنتج</TableHead>
                        <TableHead className="min-w-[200px] font-bold text-purple-800">اسم المنتج</TableHead>
                        <TableHead className="min-w-[80px] font-bold text-purple-800">الوحدة</TableHead>
                        <TableHead className="min-w-[100px] text-center font-bold text-purple-800">الكمية</TableHead>
                        <TableHead className="min-w-[120px] text-center font-bold text-purple-800">سعر الوحدة</TableHead>
                        <TableHead className="min-w-[120px] text-center font-bold text-purple-800">المجموع</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {orderDetails.items?.map((item: any, index: number) => {
                      const productCode = item.material?.code || item.rawMaterial?.code || item.productCode || `ITEM-${index + 1}`;
                      const productName = item.material?.name || item.rawMaterial?.name || item.productName || 'منتج غير محدد';
                      const unit = item.material?.unit || item.rawMaterial?.unit || item.unit || 'قطعة';
                      const quantity = Number(item.quantity) || 0;
                      const unitPrice = Number(item.unitPrice) || 0;
                      const totalPrice = quantity * unitPrice;
                      
                      return (
                        <TableRow key={index} className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <TableCell className="font-mono text-sm border-r">{productCode}</TableCell>
                          <TableCell className="font-medium border-r">{productName}</TableCell>
                          <TableCell className="text-sm border-r">{unit}</TableCell>
                          <TableCell className="text-center font-medium border-r">{quantity.toLocaleString('ar-SA')}</TableCell>
                          <TableCell className="text-center font-medium border-r">{formatCurrency(unitPrice)}</TableCell>
                          <TableCell className="text-center font-bold text-green-700">{formatCurrency(totalPrice)}</TableCell>
                        </TableRow>
                      );
                    }) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا توجد عناصر في هذا الأمر
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>

                {/* Items Summary */}
                <div className="mt-8 pt-6 border-t bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">إجمالي العناصر:</span>
                    <span>{orderDetails.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0).toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="font-medium">القيمة الإجمالية:</span>
                    <span className="font-semibold">
                      {formatCurrency(orderDetails.items?.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0) || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplier Tab */}
          <TabsContent value="supplier" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المورد</CardTitle>
                <CardDescription>تفاصيل المورد المرتبط بهذا الأمر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">المعلومات الأساسية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">اسم المورد</Label>
                        <p className="text-sm text-muted-foreground mt-1">{orderDetails.supplier?.name || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">معلومات الاتصال</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">الهاتف</Label>
                          <p className="text-sm text-muted-foreground">{orderDetails.supplier?.phone || 'غير محدد'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                          <p className="text-sm text-muted-foreground">{orderDetails.supplier?.email || 'غير محدد'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-sm font-medium">العنوان</Label>
                          <p className="text-sm text-muted-foreground">{orderDetails.supplier?.address || 'غير محدد'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>سجل الأمر</CardTitle>
                <CardDescription>
                  تتبع جميع الإجراءات والتغييرات التي تمت على هذا الأمر
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvalHistory && approvalHistory.length > 0 ? (
                  <div className="space-y-6">
                    {approvalHistory.map((entry, index) => (
                      <div key={entry.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          {index < approvalHistory.length - 1 && (
                            <div className="w-px h-12 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{entry.action}</p>
                            <Badge variant="outline" className="text-xs">
                              {entry.user}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {entry.notes}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">لا يوجد سجل متاح لهذا الأمر</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}