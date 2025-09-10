'use client';

import { useState } from 'react';
import { PurchaseOrder } from '@/types/erp';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  onView?: (order: PurchaseOrder) => void;
  onEdit?: (order: PurchaseOrder) => void;
  onDelete?: (order: PurchaseOrder) => void;
  onDuplicate?: (order: PurchaseOrder) => void;
  onApprove?: (order: PurchaseOrder) => void;
  onReject?: (order: PurchaseOrder) => void;
  onExecute?: (order: PurchaseOrder) => void;
  onCancel?: (order: PurchaseOrder) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function PurchaseOrdersTable({
  purchaseOrders,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onApprove,
  onReject,
  onExecute,
  onCancel,
  onExport,
  onRefresh,
  loading = false,
}: PurchaseOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<string>('');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'مسودة', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      PENDING: { label: 'في الانتظار', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      APPROVED: { label: 'معتمد', className: 'bg-green-100 text-green-800 border-green-200' },
      EXECUTED: { label: 'منفذ', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      CANCELLED: { label: 'ملغي', className: 'bg-red-100 text-red-800 border-red-200' },
      REJECTED: { label: 'مرفوض', className: 'bg-red-100 text-red-800 border-red-200' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'EXECUTED':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'منخفضة', variant: 'outline' as const },
      MEDIUM: { label: 'متوسطة', variant: 'secondary' as const },
      HIGH: { label: 'عالية', variant: 'destructive' as const },
      URGENT: { label: 'عاجلة', variant: 'destructive' as const },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      label: priority,
      variant: 'outline' as const,
    };

    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const isOverdue = (expectedDate: string) => {
    return new Date(expectedDate) < new Date() && new Date(expectedDate).toDateString() !== new Date().toDateString();
  };

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || order.supplierId === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const uniqueSuppliers = Array.from(
    new Set(purchaseOrders.map(order => order.supplier?.name).filter(Boolean))
  );

  const handleAction = (order: PurchaseOrder, action: string) => {
    setSelectedOrder(order);
    setActionType(action);
  };

  const executeAction = () => {
    if (!selectedOrder) return;

    switch (actionType) {
      case 'delete':
        onDelete?.(selectedOrder);
        break;
      case 'approve':
        onApprove?.(selectedOrder);
        break;
      case 'reject':
        onReject?.(selectedOrder);
        break;
      case 'execute':
        onExecute?.(selectedOrder);
        break;
      case 'cancel':
        onCancel?.(selectedOrder);
        break;
    }
    
    setSelectedOrder(null);
    setActionType('');
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'delete': return 'حذف أمر الشراء';
      case 'approve': return 'اعتماد أمر الشراء';
      case 'reject': return 'رفض أمر الشراء';
      case 'execute': return 'تنفيذ أمر الشراء';
      case 'cancel': return 'إلغاء أمر الشراء';
      default: return 'تأكيد العملية';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'delete': return 'هل أنت متأكد من حذف أمر الشراء؟ لا يمكن التراجع عن هذا الإجراء.';
      case 'approve': return 'هل أنت متأكد من اعتماد أمر الشراء؟';
      case 'reject': return 'هل أنت متأكد من رفض أمر الشراء؟';
      case 'execute': return 'هل أنت متأكد من تنفيذ أمر الشراء؟ سيتم تحديث المخزون.';
      case 'cancel': return 'هل أنت متأكد من إلغاء أمر الشراء؟';
      default: return 'هل أنت متأكد من تنفيذ هذا الإجراء؟';
    }
  };

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalValue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingOrders = filteredOrders.filter(order => order.status === 'PENDING').length;
  const overdueOrders = filteredOrders.filter(order => 
    order.status !== 'EXECUTED' && order.status !== 'CANCELLED' && 
    isOverdue(order.expectedDeliveryDate)
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-8 w-8 text-blue-600" />
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
              <Clock className="h-8 w-8 text-orange-600" />
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
              <XCircle className="h-8 w-8 text-red-600" />
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
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>أوامر الشراء</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                  تصدير
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث برقم الأمر، المورد، أو الملاحظات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="حالة الأمر" />
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
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="المورد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموردين</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier || ''}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الأمر</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>تاريخ الأمر</TableHead>
                  <TableHead>تاريخ التسليم المتوقع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>إجمالي المبلغ</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>جاري التحميل...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد أوامر شراء
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            {isOverdue(order.expectedDeliveryDate) && order.status !== 'EXECUTED' && order.status !== 'CANCELLED' && (
                              <Badge variant="destructive" className="text-xs mt-1">متأخر</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.supplier?.name}</p>
                          <p className="text-sm text-muted-foreground">{order.supplier?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <div className={isOverdue(order.expectedDeliveryDate) && order.status !== 'EXECUTED' && order.status !== 'CANCELLED' ? 'text-red-600' : ''}>
                          {formatDate(order.expectedDeliveryDate)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority || 'MEDIUM')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(order.totalAmount || 0)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(order)}>
                                <Eye className="ml-2 h-4 w-4" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                            )}
                            {onEdit && order.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => onEdit(order)}>
                                <Edit className="ml-2 h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                            )}
                            {onDuplicate && (
                              <DropdownMenuItem onClick={() => onDuplicate(order)}>
                                <Copy className="ml-2 h-4 w-4" />
                                نسخ الأمر
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {onApprove && order.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => handleAction(order, 'approve')}>
                                <CheckCircle className="ml-2 h-4 w-4" />
                                اعتماد
                              </DropdownMenuItem>
                            )}
                            {onReject && (order.status === 'PENDING' || order.status === 'APPROVED') && (
                              <DropdownMenuItem onClick={() => handleAction(order, 'reject')}>
                                <XCircle className="ml-2 h-4 w-4" />
                                رفض
                              </DropdownMenuItem>
                            )}
                            {onExecute && order.status === 'APPROVED' && (
                              <DropdownMenuItem onClick={() => handleAction(order, 'execute')}>
                                <Package className="ml-2 h-4 w-4" />
                                تنفيذ
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            {onDelete && order.status === 'DRAFT' && (
                              <DropdownMenuItem 
                                onClick={() => handleAction(order, 'delete')}
                                className="text-destructive"
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedOrder && !!actionType} onOpenChange={() => {
        setSelectedOrder(null);
        setActionType('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
            </AlertDialogDescription>
            {selectedOrder && (
              <div className="mt-2 p-2 bg-muted rounded">
                <div className="text-sm font-medium">أمر الشراء: {selectedOrder.orderNumber}</div>
                <div className="text-sm text-muted-foreground">المورد: {selectedOrder.supplier?.name}</div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}