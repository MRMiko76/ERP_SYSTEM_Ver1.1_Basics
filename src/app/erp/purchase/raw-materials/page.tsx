'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RawMaterialsTable } from '@/components/erp/raw-materials/raw-materials-table';
import { RawMaterialForm } from '@/components/erp/raw-materials/raw-material-form';
import { RawMaterialDetail } from '@/components/erp/raw-materials/raw-material-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RawMaterial } from '@/types/erp';
import { useToast } from '@/hooks/use-toast';

export default function RawMaterialsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const { toast } = useToast();

  // تم إزالة البيانات التجريبية - سيتم جلب البيانات من قاعدة البيانات

  useEffect(() => {
    // Simulate API call
    const fetchRawMaterials = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/raw-materials');
        if (response.ok) {
          const data = await response.json();
          // تحويل البيانات من API إلى التنسيق المطلوب
          const formattedMaterials = (data.rawMaterials || []).map((material: any) => ({
            id: material.id,
            code: material.id, // استخدام ID كرمز مؤقت
            name: material.name,
            description: material.description || '',
            category: material.materialType === 'production' ? 'إنتاج' : 'تعبئة',
            unit: material.unit,
            isActive: true,
            currentStock: parseFloat(material.availableQuantity || '0'),
            minStock: parseFloat(material.minimumStock || '0'),
            maxStock: parseFloat(material.maximumStock || '0'),
            reorderPoint: parseFloat(material.reorderPoint || '0'),
            standardCost: parseFloat(material.unitCost || '0'),
            lastPurchaseDate: material.lastPurchase?.date || null,
            lastPurchasePrice: material.lastPurchase?.price || null,
            createdAt: material.createdAt,
            updatedAt: material.updatedAt,
          }));
          setRawMaterials(formattedMaterials);
        } else {
          setRawMaterials([]);
        }
      } catch (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في تحميل بيانات الخامات',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRawMaterials();
  }, [toast]);

  const getStockStatus = (material: RawMaterial) => {
    if (material.currentStock === 0) return 'out-of-stock';
    if (material.currentStock <= material.reorderPoint) return 'low-stock';
    return 'in-stock';
  };

  const filteredMaterials = rawMaterials.filter(material => {
    const matchesSearch = 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' ||
      material.category === categoryFilter;
    
    const stockStatus = getStockStatus(material);
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && material.isActive) ||
      (statusFilter === 'inactive' && !material.isActive) ||
      (statusFilter === 'low-stock' && stockStatus === 'low-stock') ||
      (statusFilter === 'out-of-stock' && stockStatus === 'out-of-stock');
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateMaterial = () => {
    setSelectedMaterial(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowDetail(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      // In real app: await fetch(`/api/raw-materials/${materialId}`, { method: 'DELETE' });
      setRawMaterials(prev => prev.filter(m => m.id !== materialId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الخامة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الخامة',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (formMode === 'create') {
        // In real app: const response = await fetch('/api/raw-materials', { method: 'POST', body: JSON.stringify(data) });
        const newMaterial: RawMaterial = {
          ...data,
          id: Date.now().toString(),
          currentStock: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRawMaterials(prev => [newMaterial, ...prev]);
        toast({
          title: 'تم الإنشاء',
          description: 'تم إنشاء الخامة بنجاح',
        });
      } else {
        // In real app: await fetch(`/api/raw-materials/${selectedMaterial?.id}`, { method: 'PUT', body: JSON.stringify(data) });
        setRawMaterials(prev => prev.map(m => 
          m.id === selectedMaterial?.id 
            ? { ...m, ...data, updatedAt: new Date().toISOString() }
            : m
        ));
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث بيانات الخامة بنجاح',
        });
      }
      setShowForm(false);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: formMode === 'create' ? 'فشل في إنشاء الخامة' : 'فشل في تحديث الخامة',
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

  // Statistics
  const totalMaterials = rawMaterials.length;
  const activeMaterials = rawMaterials.filter(m => m.isActive).length;
  const lowStockMaterials = rawMaterials.filter(m => getStockStatus(m) === 'low-stock').length;
  const outOfStockMaterials = rawMaterials.filter(m => getStockStatus(m) === 'out-of-stock').length;
  const totalValue = rawMaterials.reduce((sum, m) => sum + (m.currentStock * m.standardCost), 0);

  // Categories for filter
  const categories = Array.from(new Set(rawMaterials.map(m => m.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الخامات</h1>
          <p className="text-muted-foreground">إدارة المواد الخام ومستويات المخزون</p>
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
          <Button onClick={handleCreateMaterial}>
            <Plus className="ml-2 h-4 w-4" />
            خامة جديدة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMaterials}</p>
                <p className="text-xs text-muted-foreground">إجمالي الخامات</p>
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
                <p className="text-2xl font-bold">{activeMaterials}</p>
                <p className="text-xs text-muted-foreground">خامات نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-600 rounded" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockMaterials}</p>
                <p className="text-xs text-muted-foreground">مخزون منخفض</p>
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
                <p className="text-2xl font-bold">{outOfStockMaterials}</p>
                <p className="text-xs text-muted-foreground">نفد المخزون</p>
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
                <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">قيمة المخزون</p>
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
                  placeholder="البحث بالاسم أو الكود أو الفئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="تصفية حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="low-stock">مخزون منخفض</SelectItem>
                <SelectItem value="out-of-stock">نفد المخزون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخامات</CardTitle>
          <CardDescription>
            {filteredMaterials.length} من أصل {rawMaterials.length} خامة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RawMaterialsTable
            rawMaterials={filteredMaterials}
            loading={loading}
            onView={handleViewMaterial}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
          />
        </CardContent>
      </Card>

      {/* Material Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'إضافة خامة جديدة' : 'تعديل بيانات الخامة'}
            </DialogTitle>
          </DialogHeader>
          <RawMaterialForm
            rawMaterial={selectedMaterial}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Material Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الخامة</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <RawMaterialDetail
              rawMaterial={selectedMaterial}
              onEdit={() => {
                setShowDetail(false);
                handleEditMaterial(selectedMaterial);
              }}
              onDelete={() => {
                setShowDetail(false);
                handleDeleteMaterial(selectedMaterial.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}