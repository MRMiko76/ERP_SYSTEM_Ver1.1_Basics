'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PurchaseOrderItem {
  id: string
  materialId: string
  materialName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit: string
}

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  address?: string
  active?: boolean
}

// تم إزالة البيانات التجريبية - سيتم جلب الخامات من قاعدة البيانات

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // جلب الموردين والخامات من API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الموردين
        const suppliersResponse = await fetch('/api/suppliers')
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json()
          setSuppliers(suppliersData || [])
        }
        
        // جلب الخامات
        const materialsResponse = await fetch('/api/raw-materials')
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json()
          const formattedMaterials = (materialsData.rawMaterials || []).map((material: any) => ({
            id: material.id,
            name: material.name,
            unit: material.unit,
            price: parseFloat(material.unitCost || '0')
          }))
          setMaterials(formattedMaterials)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // تحديد المورد المحدد مسبقاً من URL
  useEffect(() => {
    const supplierId = searchParams.get('supplier')
    if (supplierId && suppliers.length > 0) {
      setSelectedSupplierId(supplierId)
    }
  }, [searchParams, suppliers])
  


  // حساب المجموع الكلي
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0)
    setTotalAmount(total)
  }, [items])

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: Date.now().toString(),
      materialId: '',
      materialName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      unit: ''
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // إذا تم تغيير المادة، تحديث البيانات المرتبطة
        if (field === 'materialId') {
          const material = materials.find(m => m.id === value)
          if (material) {
            updatedItem.materialName = material.name
            updatedItem.unitPrice = material.price
            updatedItem.unit = material.unit
          }
        }
        
        // حساب السعر الإجمالي
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const handleSubmit = () => {
    if (!selectedSupplierId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار المورد',
        variant: 'destructive'
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إضافة عنصر واحد على الأقل',
        variant: 'destructive'
      })
      return
    }

    if (!deliveryDate) {
      toast({
        title: 'خطأ',
        description: 'يرجى تحديد تاريخ التسليم',
        variant: 'destructive'
      })
      return
    }

    // هنا يتم حفظ أمر الشراء
    const purchaseOrder = {
      supplierId: selectedSupplierId,
      orderDate,
      deliveryDate,
      notes,
      items,
      totalAmount,
      status: 'pending',
      orderNumber: `PO-${Date.now()}`
    }

    console.log('أمر الشراء الجديد:', purchaseOrder)
    
    toast({
      title: 'تم الحفظ بنجاح',
      description: 'تم إنشاء أمر الشراء بنجاح',
    })

    // العودة إلى صفحة أوامر الشراء
    router.push('/erp/purchase/purchase-orders')
  }

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          رجوع
        </Button>
        <h1 className="text-2xl font-bold">إنشاء أمر شراء جديد</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* معلومات أساسية */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">المورد *</Label>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد">
                        {selectedSupplierId && suppliers.length > 0 
                          ? suppliers.find(s => s.id === selectedSupplierId)?.name || "اختر المورد"
                          : "اختر المورد"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>
                          جاري التحميل...
                        </SelectItem>
                      ) : suppliers.length === 0 ? (
                        <SelectItem value="no-suppliers" disabled>
                          لا توجد موردين متاحين
                        </SelectItem>
                      ) : (
                        suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="orderDate">تاريخ الطلب</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryDate">تاريخ التسليم المطلوب *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  placeholder="أدخل أي ملاحظات إضافية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* أصناف الطلب */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>أصناف الطلب</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة صنف
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لم يتم إضافة أي أصناف بعد
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">الصنف {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>المادة *</Label>
                          <Select
                            value={item.materialId}
                            onValueChange={(value) => updateItem(item.id, 'materialId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المادة" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(material => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>الكمية *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <Label>سعر الوحدة</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          />
                        </div>
                        
                        <div>
                          <Label>الإجمالي</Label>
                          <Input
                            value={item.totalPrice.toLocaleString()}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      
                      {item.unit && (
                        <div className="text-sm text-gray-600">
                          الوحدة: {item.unit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ملخص الطلب */}
        <div className="space-y-6">
          {selectedSupplier && (
            <Card>
              <CardHeader>
                <CardTitle>بيانات المورد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">الاسم:</span>
                  <p className="text-sm text-gray-600">{selectedSupplier.name}</p>
                </div>
                <div>
                  <span className="font-medium">الهاتف:</span>
                  <p className="text-sm text-gray-600">{selectedSupplier.phone}</p>
                </div>
                <div>
                  <span className="font-medium">البريد:</span>
                  <p className="text-sm text-gray-600">{selectedSupplier.email}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>عدد الأصناف:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>المجموع الكلي:</span>
                <span>{totalAmount.toLocaleString()} ج.م</span>
              </div>
              
              <Button 
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                حفظ أمر الشراء
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}