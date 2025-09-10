'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SuppliersTable } from '@/components/erp/suppliers/suppliers-table';
import { SupplierForm } from '@/components/erp/suppliers/supplier-form';
import { SupplierDetail } from '@/components/erp/suppliers/supplier-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Supplier } from '@/types/erp';
import { useToast } from '@/hooks/use-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const { toast } = useToast();

  // Mock data - in real app, this would come from API
  const mockSuppliers: Supplier[] = [
    {
      id: '1',
      code: 'SUP001',
      name: 'شركة الخليج للمواد الخام',
      email: 'info@gulf-materials.com',
      phone: '+966501234567',
      address: 'الرياض، المملكة العربية السعودية',
      isActive: true,
      taxNumber: '123456789',
      commercialRegister: 'CR123456',
      paymentTerms: 'نقدي خلال 30 يوم',
      creditLimit: 100000,
      currentBalance: 25000,
      contactPerson: 'أحمد محمد',
      contactPhone: '+966501234567',
      contactEmail: 'ahmed@gulf-materials.com',
      notes: 'مورد موثوق للمواد الخام الأساسية',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
    },
    {
      id: '2',
      code: 'SUP002',
      name: 'مؤسسة النجاح التجارية',
      email: 'sales@najah-trading.com',
      phone: '+966502345678',
      address: 'جدة، المملكة العربية السعودية',
      isActive: true,
      taxNumber: '987654321',
      commercialRegister: 'CR987654',
      paymentTerms: 'نقدي خلال 15 يوم',
      creditLimit: 75000,
      currentBalance: 15000,
      contactPerson: 'فاطمة أحمد',
      contactPhone: '+966502345678',
      contactEmail: 'fatima@najah-trading.com',
      notes: 'متخصص في المواد الكيميائية',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
    },
    {
      id: '3',
      code: 'SUP003',
      name: 'شركة الشرق الأوسط للتوريدات',
      email: 'contact@me-supplies.com',
      phone: '+966503456789',
      address: 'الدمام، المملكة العربية السعودية',
      isActive: false,
      taxNumber: '456789123',
      commercialRegister: 'CR456789',
      paymentTerms: 'نقدي خلال 45 يوم',
      creditLimit: 50000,
      currentBalance: 0,
      contactPerson: 'محمد علي',
      contactPhone: '+966503456789',
      contactEmail: 'mohammed@me-supplies.com',
      notes: 'مورد سابق - متوقف مؤقتاً',
      createdAt: '2023-12-01T08:00:00Z',
      updatedAt: '2024-01-05T12:00:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        // In real app: const response = await fetch('/api/suppliers');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        setSuppliers(mockSuppliers);
      } catch (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في تحميل بيانات الموردين',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [toast]);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && supplier.isActive) ||
      (statusFilter === 'inactive' && !supplier.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetail(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      // In real app: await fetch(`/api/suppliers/${supplierId}`, { method: 'DELETE' });
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المورد بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المورد',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (formMode === 'create') {
        // In real app: const response = await fetch('/api/suppliers', { method: 'POST', body: JSON.stringify(data) });
        const newSupplier: Supplier = {
          ...data,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSuppliers(prev => [newSupplier, ...prev]);
        toast({
          title: 'تم الإنشاء',
          description: 'تم إنشاء المورد بنجاح',
        });
      } else {
        // In real app: await fetch(`/api/suppliers/${selectedSupplier?.id}`, { method: 'PUT', body: JSON.stringify(data) });
        setSuppliers(prev => prev.map(s => 
          s.id === selectedSupplier?.id 
            ? { ...s, ...data, updatedAt: new Date().toISOString() }
            : s
        ));
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث بيانات المورد بنجاح',
        });
      }
      setShowForm(false);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: formMode === 'create' ? 'فشل في إنشاء المورد' : 'فشل في تحديث المورد',
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

  const handleImport = () => {
    // In real app, this would open a file picker
    toast({
      title: 'استيراد البيانات',
      description: 'سيتم فتح نافذة اختيار الملف قريباً',
    });
  };

  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  const inactiveSuppliers = suppliers.filter(s => !s.isActive).length;
  const totalBalance = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const totalCreditLimit = suppliers.reduce((sum, s) => sum + (s.creditLimit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الموردين</h1>
          <p className="text-muted-foreground">إدارة قائمة الموردين ومعلومات الاتصال</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="ml-2 h-4 w-4" />
            استيراد
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
          <Button onClick={handleCreateSupplier}>
            <Plus className="ml-2 h-4 w-4" />
            مورد جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي الموردين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSuppliers}</p>
                <p className="text-xs text-muted-foreground">موردين نشطين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-6 h-6 bg-red-600 rounded" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveSuppliers}</p>
                <p className="text-xs text-muted-foreground">موردين غير نشطين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBalance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">إجمالي الأرصدة</p>
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
                  placeholder="البحث بالاسم أو الكود أو البريد الإلكتروني..."
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
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموردين</CardTitle>
          <CardDescription>
            {filteredSuppliers.length} من أصل {suppliers.length} مورد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuppliersTable
            suppliers={filteredSuppliers}
            loading={loading}
            onView={handleViewSupplier}
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
          />
        </CardContent>
      </Card>

      {/* Supplier Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'إضافة مورد جديد' : 'تعديل بيانات المورد'}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={selectedSupplier}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المورد</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierDetail
              supplier={selectedSupplier}
              onEdit={() => {
                setShowDetail(false);
                handleEditSupplier(selectedSupplier);
              }}
              onDelete={() => {
                setShowDetail(false);
                handleDeleteSupplier(selectedSupplier.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}