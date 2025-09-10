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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Package, Search, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, MoreHorizontal, Eye, Copy, Printer, FileText } from 'lucide-react';

// أنواع البيانات للخامات
interface RawMaterial {
  id: string;
  name: string;
  description?: string;
  availableQuantity: number;
  unitCost: number;
  unit: string; // وحدة القياس (كيلو، لتر، قطعة، إلخ)
  materialType: 'production' | 'packaging'; // نوع الخام
  minStockLevel: number; // الحد الأدنى للمخزون
  maxStockLevel: number; // الحد الأقصى للمخزون
  // إعداد للربط المستقبلي مع المخازن
  warehouseId?: string; // معرف المخزن (للربط المستقبلي)
  locationInWarehouse?: string; // موقع الخام في المخزن
  // معلومات إضافية
  supplier?: string; // المورد الرئيسي
  lastPurchaseDate?: Date;
  lastPurchasePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRawMaterialData {
  name: string;
  description?: string;
  availableQuantity: number;
  unitCost: number;
  unit: string;
  materialType: 'production' | 'packaging';
  minStockLevel: number;
  maxStockLevel: number;
  supplier?: string;
}

// وحدات القياس المتاحة
const UNITS = [
  { value: 'kg', label: 'كيلوجرام' },
  { value: 'g', label: 'جرام' },
  { value: 'l', label: 'لتر' },
  { value: 'ml', label: 'مليلتر' },
  { value: 'piece', label: 'قطعة' },
  { value: 'box', label: 'صندوق' },
  { value: 'bag', label: 'كيس' },
  { value: 'roll', label: 'لفة' }
];

export default function RawMaterialsPage() {
  const { toast } = useToast();
  
  // حالة البيانات
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات المكونات
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState<CreateRawMaterialData>({
    name: '',
    description: '',
    availableQuantity: 0,
    unitCost: 0,
    unit: 'kg',
    materialType: 'production',
    minStockLevel: 0,
    maxStockLevel: 0,
    supplier: ''
  });

  // تحميل البيانات من API
  const fetchRawMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/raw-materials?limit=100');
      
      if (!response.ok) {
        throw new Error('فشل في تحميل البيانات');
      }
      
      const data = await response.json();
      
      // تحويل البيانات من API إلى تنسيق الواجهة
      const materialsForState: RawMaterial[] = (data.rawMaterials || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        availableQuantity: item.availableQuantity || 0,
        unitCost: Number(item.unitCost) || 0,
        unit: item.unit || 'kg',
        materialType: item.materialType || 'production', // API يرجع 'production' أو 'packaging'
        minStockLevel: item.minimumStock || 0,
        maxStockLevel: item.maximumStock || 0,
        warehouseId: item.warehouseId,
        locationInWarehouse: item.locationInWarehouse,
        supplier: item.supplier || '',
        lastPurchaseDate: item.lastPurchase?.purchaseOrder?.actualDeliveryDate ? new Date(item.lastPurchase.purchaseOrder.actualDeliveryDate) : undefined,
        lastPurchasePrice: item.lastPurchase?.unitPrice,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }));
      
      setRawMaterials(materialsForState);
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      toast({
        title: 'خطأ في التحميل',
        description: 'فشل في تحميل بيانات الخامات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchRawMaterials();
  }, []);

  // تصفية الخامات
  const filteredMaterials = rawMaterials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || material.materialType === selectedType;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = material.availableQuantity <= material.minStockLevel;
    } else if (stockFilter === 'high') {
      matchesStock = material.availableQuantity >= material.maxStockLevel;
    } else if (stockFilter === 'normal') {
      matchesStock = material.availableQuantity > material.minStockLevel && material.availableQuantity < material.maxStockLevel;
    }
    
    return matchesSearch && matchesType && matchesStock;
  });

  // إنشاء خام جديد
  const handleCreateMaterial = async () => {
    if (!formData.name || formData.unitCost <= 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/raw-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          availableQuantity: formData.availableQuantity,
          minimumStock: formData.minStockLevel,
          maximumStock: formData.maxStockLevel,
          reorderPoint: formData.minStockLevel, // استخدام نفس قيمة الحد الأدنى كنقطة إعادة الطلب
          unitCost: formData.unitCost,
          materialType: formData.materialType,
          unit: formData.unit
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إنشاء الخام');
      }

      const newMaterial = await response.json();
      
      // تحديث القائمة المحلية
      const materialForState: RawMaterial = {
        id: newMaterial.id,
        name: newMaterial.name,
        description: formData.description || '',
        availableQuantity: newMaterial.availableQuantity || 0,
        unitCost: newMaterial.unitCost,
        unit: newMaterial.unit,
        materialType: newMaterial.materialType, // API يرجع 'production' أو 'packaging'
        minStockLevel: newMaterial.minimumStock || 0,
        maxStockLevel: newMaterial.maximumStock || 0,
        warehouseId: newMaterial.warehouseId,
        locationInWarehouse: newMaterial.locationInWarehouse,
        supplier: formData.supplier,
        createdAt: new Date(newMaterial.createdAt),
        updatedAt: new Date(newMaterial.updatedAt)
      };

      setRawMaterials([...rawMaterials, materialForState]);
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        availableQuantity: 0,
        unitCost: 0,
        unit: 'kg',
        materialType: 'production',
        minStockLevel: 0,
        maxStockLevel: 0,
        supplier: ''
      });
      
      toast({
        title: 'تم إنشاء الخام',
        description: 'تم إضافة الخام الجديد بنجاح'
      });
    } catch (error) {
      console.error('Error creating raw material:', error);
      toast({
        title: 'خطأ في الإنشاء',
        description: error instanceof Error ? error.message : 'فشل في إنشاء الخام',
        variant: 'destructive'
      });
    }
  };

  // تحديث خام
  const handleUpdateMaterial = async () => {
    if (!selectedMaterial || !formData.name || formData.unitCost <= 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/raw-materials/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          minimumStock: formData.minStockLevel,
          maximumStock: formData.maxStockLevel,
          unitCost: formData.unitCost,
          materialType: formData.materialType,
          unit: formData.unit
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تحديث الخام');
      }

      const updatedMaterial = await response.json();
      
      // تحديث القائمة المحلية
      const updatedMaterials = rawMaterials.map(material => 
        material.id === selectedMaterial.id 
          ? {
              ...material,
              name: updatedMaterial.name,
              description: formData.description || '',
              unitCost: updatedMaterial.unitCost,
              unit: updatedMaterial.unit,
              materialType: updatedMaterial.materialType, // API يرجع 'production' أو 'packaging'
              minStockLevel: updatedMaterial.minimumStock || 0,
              maxStockLevel: updatedMaterial.maximumStock || 0,
              warehouseId: updatedMaterial.warehouseId,
              locationInWarehouse: updatedMaterial.locationInWarehouse,
              updatedAt: new Date(updatedMaterial.updatedAt)
            }
          : material
      );

      setRawMaterials(updatedMaterials);
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
      setFormData({
        name: '',
        description: '',
        availableQuantity: 0,
        unitCost: 0,
        unit: 'kg',
        materialType: 'production',
        minStockLevel: 0,
        maxStockLevel: 0,
        supplier: ''
      });
      
      toast({
        title: 'تم تحديث الخام',
        description: 'تم تحديث بيانات الخام بنجاح'
      });
    } catch (error) {
      console.error('Error updating raw material:', error);
      toast({
        title: 'خطأ في التحديث',
        description: error instanceof Error ? error.message : 'فشل في تحديث الخام',
        variant: 'destructive'
      });
    }
  };

  // حذف خام
  const handleDeleteMaterial = (materialId: string) => {
    setRawMaterials(rawMaterials.filter(material => material.id !== materialId));
    toast({
      title: 'تم حذف الخام',
      description: 'تم حذف الخام بنجاح'
    });
  };

  // فتح نموذج التحديث
  const openEditDialog = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || '',
      availableQuantity: material.availableQuantity,
      unitCost: material.unitCost,
      unit: material.unit,
      materialType: material.materialType,
      minStockLevel: material.minStockLevel,
      maxStockLevel: material.maxStockLevel,
      supplier: material.supplier || ''
    });
    setIsEditDialogOpen(true);
  };

  // تحديد حالة المخزون
  const getStockStatus = (material: RawMaterial) => {
    if (material.availableQuantity <= material.minStockLevel) {
      return { status: 'low', label: 'منخفض', color: 'text-red-600 bg-red-50' };
    } else if (material.availableQuantity >= material.maxStockLevel) {
      return { status: 'high', label: 'مرتفع', color: 'text-blue-600 bg-blue-50' };
    } else {
      return { status: 'normal', label: 'طبيعي', color: 'text-green-600 bg-green-50' };
    }
  };

  // حساب الإحصائيات
  const stats = {
    total: rawMaterials.length,
    production: rawMaterials.filter(m => m.materialType === 'production').length,
    packaging: rawMaterials.filter(m => m.materialType === 'packaging').length,
    lowStock: rawMaterials.filter(m => m.availableQuantity <= m.minStockLevel).length,
    totalValue: rawMaterials.reduce((sum, m) => sum + (m.availableQuantity * m.unitCost), 0)
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخامات</h1>
          <p className="text-muted-foreground">
            إدارة المواد الخام ومواد التعبئة والتغليف
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة خام جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>إضافة خام جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الخام الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الخام *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الخام"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialType">نوع الخام</Label>
                  <Select value={formData.materialType} onValueChange={(value: 'production' | 'packaging') => setFormData({ ...formData, materialType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">خامات إنتاج</SelectItem>
                      <SelectItem value="packaging">مواد تعبئة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أدخل وصف الخام"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availableQuantity">الكمية المتاحة</Label>
                  <Input
                    id="availableQuantity"
                    type="number"
                    min="0"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({ ...formData, availableQuantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">تكلفة الوحدة *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">وحدة القياس</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">الحد الأدنى للمخزون</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStockLevel">الحد الأقصى للمخزون</Label>
                  <Input
                    id="maxStockLevel"
                    type="number"
                    min="0"
                    value={formData.maxStockLevel}
                    onChange={(e) => setFormData({ ...formData, maxStockLevel: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">المورد الرئيسي</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="أدخل اسم المورد الرئيسي"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateMaterial}>
                إضافة الخام
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الخامات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">خامات الإنتاج</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.production}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مواد التعبئة</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.packaging}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
                  placeholder="البحث بالاسم أو الوصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="تصفية بالنوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="production">خامات إنتاج</SelectItem>
                <SelectItem value="packaging">مواد تعبئة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="تصفية بالمخزون" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="low">مخزون منخفض</SelectItem>
                <SelectItem value="normal">مخزون طبيعي</SelectItem>
                <SelectItem value="high">مخزون مرتفع</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الخامات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخامات</CardTitle>
          <CardDescription>
            عدد النتائج: {filteredMaterials.length} خام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الخام</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الكمية المتاحة</TableHead>
                <TableHead>تكلفة الوحدة</TableHead>
                <TableHead>حالة المخزون</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <div className="text-lg font-medium text-muted-foreground">
                        لا توجد خامات مضافة
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ابدأ بإضافة خامات جديدة لإدارة المخزون
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => {
                  const stockStatus = getStockStatus(material);
                  const unitLabel = UNITS.find(u => u.value === material.unit)?.label || material.unit;
                  
                  return (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{material.name}</div>
                          {material.description && (
                            <div className="text-sm text-muted-foreground">{material.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={material.materialType === 'production' ? 'default' : 'secondary'}>
                          {material.materialType === 'production' ? 'خامات إنتاج' : 'مواد تعبئة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {material.availableQuantity.toLocaleString()} {unitLabel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          الحد الأدنى: {material.minStockLevel} {unitLabel}
                        </div>
                      </TableCell>
                      <TableCell>{Number(material.unitCost).toFixed(2)} ريال</TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{material.supplier || 'غير محدد'}</TableCell>
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
                            <DropdownMenuItem onClick={() => {
                              setSelectedMaterial(material);
                              setIsViewDialogOpen(true);
                            }}>
                              <Eye className="ml-2 h-4 w-4" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(material)}>
                              <Edit className="ml-2 h-4 w-4" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(material.id);
                              toast({
                                title: "تم نسخ الكود",
                                description: `تم نسخ كود الخام: ${material.id}`,
                              });
                            }}>
                              <Copy className="ml-2 h-4 w-4" />
                              نسخ الكود
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('إنشاء أمر شراء', material.id)}>
                              <Package className="ml-2 h-4 w-4" />
                              إنشاء أمر شراء
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('طباعة', material.id)}>
                              <Printer className="ml-2 h-4 w-4" />
                              طباعة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('تصدير', material.id)}>
                              <FileText className="ml-2 h-4 w-4" />
                              تصدير البيانات
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نموذج التحديث */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>تحديث بيانات الخام</DialogTitle>
            <DialogDescription>
              تحديث بيانات الخام: {selectedMaterial?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم الخام *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم الخام"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-materialType">نوع الخام</Label>
                <Select value={formData.materialType} onValueChange={(value: 'production' | 'packaging') => setFormData({ ...formData, materialType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">خامات إنتاج</SelectItem>
                    <SelectItem value="packaging">مواد تعبئة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">الوصف</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل وصف الخام"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-availableQuantity">الكمية المتاحة</Label>
                <Input
                  id="edit-availableQuantity"
                  type="number"
                  min="0"
                  value={formData.availableQuantity}
                  onChange={(e) => setFormData({ ...formData, availableQuantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unitCost">تكلفة الوحدة *</Label>
                <Input
                  id="edit-unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">وحدة القياس</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minStockLevel">الحد الأدنى للمخزون</Label>
                <Input
                  id="edit-minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStockLevel">الحد الأقصى للمخزون</Label>
                <Input
                  id="edit-maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">المورد الرئيسي</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="أدخل اسم المورد الرئيسي"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateMaterial}>
              تحديث الخام
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نموذج عرض التفاصيل */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الخام</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الخام: {selectedMaterial?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">اسم الخام</Label>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">نوع الخام</Label>
                  <Badge variant={selectedMaterial.materialType === 'production' ? 'default' : 'secondary'}>
                    {selectedMaterial.materialType === 'production' ? 'إنتاج' : 'تعبئة'}
                  </Badge>
                </div>
              </div>
              
              {selectedMaterial.description && (
                <div>
                  <Label className="text-sm font-medium">الوصف</Label>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">الكمية المتاحة</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMaterial.availableQuantity.toLocaleString()} {UNITS.find(u => u.value === selectedMaterial.unit)?.label || selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تكلفة الوحدة</Label>
                  <p className="text-sm text-muted-foreground">{Number(selectedMaterial.unitCost).toFixed(2)} ريال</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">الحد الأدنى للمخزون</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMaterial.minStockLevel} {UNITS.find(u => u.value === selectedMaterial.unit)?.label || selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الحد الأقصى للمخزون</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMaterial.maxStockLevel} {UNITS.find(u => u.value === selectedMaterial.unit)?.label || selectedMaterial.unit}
                  </p>
                </div>
              </div>
              
              {selectedMaterial.supplier && (
                <div>
                  <Label className="text-sm font-medium">المورد</Label>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.supplier}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">حالة المخزون</Label>
                <div className="mt-1">
                  {(() => {
                    const stockStatus = selectedMaterial.availableQuantity <= selectedMaterial.minStockLevel
                      ? { label: 'مخزون منخفض', color: 'bg-red-100 text-red-800 border-red-200' }
                      : selectedMaterial.availableQuantity >= selectedMaterial.maxStockLevel
                      ? { label: 'مخزون مرتفع', color: 'bg-blue-100 text-blue-800 border-blue-200' }
                      : { label: 'مخزون طبيعي', color: 'bg-green-100 text-green-800 border-green-200' };
                    return <Badge className={stockStatus.color}>{stockStatus.label}</Badge>;
                  })()}
                </div>
              </div>
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