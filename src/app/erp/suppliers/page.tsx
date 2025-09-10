'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Users, Search, Edit, Trash2, Eye, Phone, Mail, MapPin, MoreHorizontal, Copy, Printer, FileText, DollarSign, User } from 'lucide-react';

// أنواع البيانات للموردين
interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  balance: number; // الرصيد الحالي (مدين/دائن)
  totalPurchases: number; // إجمالي المشتريات
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSupplierData {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

export default function SuppliersPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  // حالة البيانات
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    status: 'active'
  });

  // جلب البيانات من API
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        // تحويل البيانات لتتوافق مع النوع المطلوب
        const formattedSuppliers = data.map((supplier: any) => ({
          ...supplier,
          status: supplier.active ? 'active' : 'inactive',
          balance: 0, // سيتم حسابه لاحقاً من المعاملات
          totalPurchases: 0, // سيتم حسابه لاحقاً من أوامر الشراء
          createdAt: new Date(supplier.createdAt),
          updatedAt: new Date(supplier.updatedAt)
        }));
        setSuppliers(formattedSuppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'خطأ في جلب البيانات',
        description: 'حدث خطأ أثناء جلب بيانات الموردين',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تصفية الموردين
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // إنشاء مورد جديد
  const handleCreateSupplier = async () => {
    if (!formData.name || !formData.contactPerson || !formData.phone) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          address: formData.address,
          active: formData.status === 'active'
        }),
      });

      if (response.ok) {
        const newSupplier = await response.json();
        // إعادة جلب البيانات لضمان التحديث
        await fetchSuppliers();
        setIsCreateDialogOpen(false);
        setFormData({ name: '', contactPerson: '', phone: '', address: '', status: 'active' });
        
        toast({
          title: 'تم إنشاء المورد',
          description: 'تم إضافة المورد الجديد بنجاح'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ في الحفظ',
          description: error.error || 'حدث خطأ أثناء حفظ المورد',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ المورد',
        variant: 'destructive'
      });
    }
  };

  // تحديث مورد
  const handleUpdateSupplier = async () => {
    if (!selectedSupplier || !formData.name || !formData.contactPerson || !formData.phone) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedSupplier.id,
          name: formData.name,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          address: formData.address,
          active: formData.status === 'active'
        }),
      });

      if (response.ok) {
        await fetchSuppliers();
        setIsEditDialogOpen(false);
        setSelectedSupplier(null);
        setFormData({ name: '', contactPerson: '', phone: '', address: '', status: 'active' });
        
        toast({
          title: 'تم تحديث المورد',
          description: 'تم تحديث بيانات المورد بنجاح'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ في التحديث',
          description: error.error || 'حدث خطأ أثناء تحديث المورد',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: 'خطأ في التحديث',
        description: 'حدث خطأ أثناء تحديث المورد',
        variant: 'destructive'
      });
    }
  };

  // فتح تأكيد الحذف
  const openDeleteDialog = (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setIsDeleteDialogOpen(true);
  };

  // تأكيد حذف مورد
  const confirmDeleteSupplier = async () => {
    if (supplierToDelete) {
      try {
        const response = await fetch(`/api/suppliers?id=${supplierToDelete}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchSuppliers();
          toast({
            title: 'تم حذف المورد',
            description: 'تم حذف المورد بنجاح'
          });
        } else {
          const error = await response.json();
          toast({
            title: 'خطأ في الحذف',
            description: error.error || 'حدث خطأ أثناء حذف المورد',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast({
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء حذف المورد',
          variant: 'destructive'
        });
      } finally {
        setSupplierToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  // فتح نموذج التحديث
  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status
    });
    setIsEditDialogOpen(true);
  };

  // نسخ المورد بالبيانات الأساسية
  const handleCopySupplier = (supplier: Supplier) => {
    setFormData({
      name: `نسخة من ${supplier.name}`,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status
    });
    setIsCreateDialogOpen(true);
    toast({
      title: 'تم نسخ المورد',
      description: 'تم نسخ بيانات المورد، يمكنك الآن تعديلها وحفظها كمورد جديد'
    });
  };

  // تنسيق الرصيد
  const formatBalance = (balance: number) => {
    const absBalance = Math.abs(balance);
    const type = balance < 0 ? 'مدين' : balance > 0 ? 'دائن' : 'متوازن';
    const color = balance < 0 ? 'text-red-600' : balance > 0 ? 'text-green-600' : 'text-gray-600';
    return (
      <span className={color}>
        {absBalance.toLocaleString()} ريال ({type})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الموردين</h1>
          <p className="text-muted-foreground">
            إدارة بيانات الموردين وحساباتهم المالية
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة مورد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إضافة مورد جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات المورد الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المورد *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم المورد"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-person">اسم الشخص المسؤول *</Label>
                  <Input
                    id="contact-person"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="أدخل اسم الشخص المسؤول"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                <div></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="أدخل عنوان المورد"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateSupplier}>
                إضافة المورد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموردين النشطين</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.reduce((sum, s) => sum + s.totalPurchases, 0).toLocaleString()} ريال
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الأرصدة</CardTitle>
            <div className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.reduce((sum, s) => sum + s.balance, 0).toLocaleString()} ريال
            </div>
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
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
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
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الموردين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموردين</CardTitle>
          <CardDescription>
            عدد النتائج: {filteredSuppliers.length} مورد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المورد</TableHead>
                <TableHead>معلومات الاتصال</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الرصيد الحالي</TableHead>
                <TableHead>إجمالي المشتريات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 ml-1" />
                        {supplier.address || 'لا يوجد عنوان'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <User className="h-3 w-3 ml-1" />
                        {supplier.contactPerson}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 ml-1" />
                        {supplier.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatBalance(supplier.balance)}</TableCell>
                  <TableCell>{supplier.totalPurchases.toLocaleString()} ريال</TableCell>
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
                        <DropdownMenuItem onClick={() => router.push(`/erp/suppliers/${supplier.id}`)}>
                          <Eye className="ml-2 h-4 w-4" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopySupplier(supplier)}>
                          <Copy className="ml-2 h-4 w-4" />
                          نسخ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/erp/purchase/purchase-orders/new?supplier=${supplier.id}`)}>
                          <DollarSign className="ml-2 h-4 w-4" />
                          إنشاء أمر شراء
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('طباعة', supplier.id)}>
                          <Printer className="ml-2 h-4 w-4" />
                          طباعة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('تصدير', supplier.id)}>
                          <FileText className="ml-2 h-4 w-4" />
                          تصدير البيانات
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(supplier.id)}
                          className="text-destructive"
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
        </CardContent>
      </Card>

      {/* نموذج التحديث */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تحديث بيانات المورد</DialogTitle>
            <DialogDescription>
              تحديث بيانات المورد: {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم المورد *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم المورد"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-person">اسم الشخص المسؤول *</Label>
                <Input
                  id="edit-contact-person"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="أدخل اسم الشخص المسؤول"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">الحالة</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم الهاتف *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">العنوان</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="أدخل عنوان المورد"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateSupplier}>
              تحديث المورد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSupplier}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}