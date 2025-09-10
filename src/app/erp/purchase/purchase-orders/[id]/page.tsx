'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PurchaseOrderForm } from '@/components/erp/purchase-orders/purchase-order-form';
import { PurchaseOrder, Supplier, RawMaterial } from '@/types/erp';
import { useToast } from '@/hooks/use-toast';

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب بيانات أمر الشراء
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/purchase-orders/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          toast({
            title: 'خطأ',
            description: 'فشل في جلب بيانات أمر الشراء',
            variant: 'destructive',
          });
          router.push('/erp/purchase/purchase-orders');
        }
      } catch (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في جلب بيانات أمر الشراء',
          variant: 'destructive',
        });
        router.push('/erp/purchase/purchase-orders');
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, router, toast]);

  // جلب الموردين
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers');
        if (response.ok) {
          const data = await response.json();
          // API يُرجع البيانات مباشرة كمصفوفة وليس كخاصية suppliers
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setSuppliers([]);
      }
    };

    fetchSuppliers();
  }, []);

  // جلب المواد الخام
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        const response = await fetch('/api/raw-materials');
        if (response.ok) {
          const data = await response.json();
          setRawMaterials(data.rawMaterials || []);
        }
      } catch (error) {
        console.error('Error fetching raw materials:', error);
        setRawMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRawMaterials();
  }, []);

  const handleSubmit = async (data: any) => {
    console.log('🔥 handleSubmit called with data:', data);
    console.log('🔥 params.id:', params.id);
    try {
      const response = await fetch(`/api/purchase-orders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث أمر الشراء بنجاح',
        });
        router.push('/erp/purchase/purchase-orders');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تحديث أمر الشراء');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث أمر الشراء',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    router.push('/erp/purchase/purchase-orders');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">أمر الشراء غير موجود</h1>
          <Button onClick={() => router.push('/erp/purchase/purchase-orders')}>
            العودة إلى قائمة أوامر الشراء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/erp/purchase/purchase-orders')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تعديل أمر الشراء</h1>
            <p className="text-muted-foreground">{order.orderNumber}</p>
          </div>
        </div>
      </div>

      {/* نموذج التعديل */}
      <Card>
        <CardHeader>
          <CardTitle>تعديل بيانات أمر الشراء</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            order={order}
            suppliers={suppliers}
            rawMaterials={rawMaterials}
            mode="edit"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}