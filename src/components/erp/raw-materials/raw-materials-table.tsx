'use client';

import { useState } from 'react';
import { RawMaterial } from '@/types/erp';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Package,
  Search,
  Filter,
  Download,
  Plus,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RawMaterialsTableProps {
  rawMaterials: RawMaterial[];
  loading?: boolean;
  onView?: (material: RawMaterial) => void;
  onEdit?: (material: RawMaterial) => void;
  onDelete?: (material: RawMaterial) => void;
  onAdd?: () => void;
  onExport?: () => void;
}

export function RawMaterialsTable({
  rawMaterials,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAdd,
  onExport,
}: RawMaterialsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null);

  // Get unique categories for filter
  const categories = Array.from(new Set(rawMaterials.map(m => m.category).filter(Boolean)));

  // Filter materials based on search and filters
  const filteredMaterials = rawMaterials.filter(material => { const matchesSearch = 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && material.isActive) ||
      (statusFilter === 'inactive' && !material.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteClick = (material: RawMaterial) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (materialToDelete && onDelete) {
      onDelete(materialToDelete);
    }
    setDeleteDialogOpen(false);
    setMaterialToDelete(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    // You might want to show a toast notification here
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  const getStockStatusBadge = (currentStock: number, minStock: number) => {
    if (currentStock <= 0) {
      return <Badge variant="destructive">نفد المخزون</Badge>;
    } else if (currentStock <= minStock) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">مخزون منخفض</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-600">متوفر</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-muted animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h2 className="text-2xl font-bold">الخامات</h2>
          <Badge variant="outline">{filteredMaterials.length} خامة</Badge>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="ml-2 h-4 w-4" />
              تصدير
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة خامة
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث بالاسم أو الكود أو الوصف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية حسب الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الخامة</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>الوحدة</TableHead>
              <TableHead>المخزون الحالي</TableHead>
              <TableHead>الحد الأدنى</TableHead>
              <TableHead>متوسط التكلفة</TableHead>
              <TableHead>حالة المخزون</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>آخر تحديث</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'لا توجد خامات تطابق معايير البحث'
                        : 'لا توجد خامات مضافة بعد'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">{material.code}</div>
                      {material.description && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                          {material.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {material.category && (
                      <Badge variant="outline">{material.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell className="font-mono">
                    {material.currentStock?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {material.minStock?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(material.averageCost || 0)}
                  </TableCell>
                  <TableCell>
                    {getStockStatusBadge(
                      material.currentStock || 0,
                      material.minStock || 0
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(material.isActive)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(material.updatedAt)}
                  </TableCell>
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
                          <DropdownMenuItem onClick={() => onView(material)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(material)}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleCopyId(material.id)}>
                          <Copy className="ml-2 h-4 w-4" />
                          نسخ المعرف
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(material)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الخامة "{materialToDelete?.name}"؟
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
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