'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import { Supplier } from '@/types/erp';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building,
  Copy,
  Check,
  Printer,
  FileText,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onView: (supplier: Supplier) => void;
  loading?: boolean;
}

export function SuppliersTable({
  suppliers,
  onEdit,
  onDelete,
  onView,
  loading = false,
}: SuppliersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      onDelete(supplierToDelete.id);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success('تم نسخ المعرف');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('فشل في نسخ المعرف');
    }
  };

  const handleSendEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  const getPaymentTermsBadge = (terms: string) => {
    const colorMap: Record<string, string> = {
      'CASH': 'bg-green-100 text-green-800',
      'NET_30': 'bg-blue-100 text-blue-800',
      'NET_60': 'bg-yellow-100 text-yellow-800',
      'NET_90': 'bg-red-100 text-red-800',
    };

    const labelMap: Record<string, string> = {
      'CASH': 'نقداً',
      'NET_30': '30 يوم',
      'NET_60': '60 يوم',
      'NET_90': '90 يوم',
    };

    return (
      <Badge className={colorMap[terms] || 'bg-gray-100 text-gray-800'}>
        {labelMap[terms] || terms}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد موردين</h3>
        <p className="mt-1 text-sm text-gray-500">
          ابدأ بإضافة مورد جديد لإدارة المشتريات
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم المورد</TableHead>
              <TableHead className="text-right">معلومات الاتصال</TableHead>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">شروط الدفع</TableHead>
              <TableHead className="text-right">الرصيد</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الإنشاء</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {supplier.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.code}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {supplier.email && (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {supplier.address && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="max-w-xs truncate">{supplier.address}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {getPaymentTermsBadge(supplier.paymentTerms)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className={`font-medium ${
                      supplier.balance > 0 ? 'text-red-600' : 
                      supplier.balance < 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {formatCurrency(Math.abs(supplier.balance))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {supplier.balance > 0 ? 'مدين' : 
                       supplier.balance < 0 ? 'دائن' : 'متوازن'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(supplier.isActive)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(supplier.createdAt), 'dd/MM/yyyy', { locale: ar })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(supplier)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(supplier)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCopyId(supplier.id)}>
                        {copiedId === supplier.id ? (
                          <Check className="ml-2 h-4 w-4" />
                        ) : (
                          <Copy className="ml-2 h-4 w-4" />
                        )}
                        نسخ المعرف
                      </DropdownMenuItem>
                      {supplier.email && (
                        <DropdownMenuItem onClick={() => handleSendEmail(supplier.email!)}>
                          <Mail className="ml-2 h-4 w-4" />
                          إرسال بريد إلكتروني
                        </DropdownMenuItem>
                      )}
                      {supplier.phone && (
                        <DropdownMenuItem onClick={() => handleCall(supplier.phone!)}>
                          <Phone className="ml-2 h-4 w-4" />
                          اتصال
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <FileText className="ml-2 h-4 w-4" />
                        تقرير المورد
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <DollarSign className="ml-2 h-4 w-4" />
                        كشف حساب
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="ml-2 h-4 w-4" />
                        طباعة
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(supplier)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المورد "{supplierToDelete?.name}"؟
              <br />
              <span className="text-red-600 font-medium">
                تحذير: سيتم حذف جميع البيانات المرتبطة بهذا المورد نهائياً.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}