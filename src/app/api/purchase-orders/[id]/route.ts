import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

// دالة مساعدة لتحديث إجمالي المشتريات للمورد
async function updateSupplierTotalPurchases(supplierId: string) {
  const totalPurchases = await db.purchaseOrder.aggregate({
    where: {
      supplierId: supplierId,
      status: 'EXECUTED',
    },
    _sum: {
      totalAmount: true,
    },
  });

  await db.supplier.update({
    where: { id: supplierId },
    data: { totalPurchases: totalPurchases._sum.totalAmount || 0 }
  });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/purchase-orders/[id] - Get single purchase order
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        orderNumber: true,
        supplierId: true,
        status: true,
        totalAmount: true,
        subtotalAmount: true,
        taxAmount: true,
        priority: true,
        paymentTerms: true,
        deliveryAddress: true,
        orderDate: true,
        expectedDeliveryDate: true,
        actualDeliveryDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
        executedAt: true,
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            address: true,
          },
        },
        createdBy: true,
        approvedBy: true,
        items: {
          select: {
            id: true,
            materialId: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            receivedQuantity: true,
            material: {
              select: {
                id: true,
                name: true,
                unit: true,
                availableQuantity: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // Calculate additional data
    const isOverdue = purchaseOrder.expectedDeliveryDate && 
      purchaseOrder.status !== 'EXECUTED' && 
      purchaseOrder.status !== 'CANCELLED' &&
      new Date(purchaseOrder.expectedDeliveryDate) < new Date();

    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(purchaseOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalItems = purchaseOrder.items.length;
    const totalQuantity = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);

    const responseData = {
      ...purchaseOrder,
      isOverdue,
      daysSinceCreated,
      totalItems,
      totalQuantity,
      canEdit: ['DRAFT'].includes(purchaseOrder.status),
      canApprove: ['DRAFT', 'PENDING'].includes(purchaseOrder.status),
      canExecute: ['APPROVED'].includes(purchaseOrder.status),
      canCancel: ['DRAFT', 'PENDING', 'APPROVED'].includes(purchaseOrder.status),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب أمر الشراء' },
      { status: 500 }
    );
  }
}

// PUT /api/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    const resolvedParams = await params;
    const body = await request.json();
    const { 
      supplierId, 
      expectedDeliveryDate, 
      notes, 
      items, 
      priority, 
      paymentTerms, 
      deliveryAddress,
      orderDate,
      totalAmount,
      subtotalAmount,
      taxAmount,
      status 
    } = body;

    // Check if purchase order exists
    const existingOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // Check if order can be edited
    if (['EXECUTED', 'CANCELLED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { message: 'لا يمكن تعديل أمر الشراء المنفذ أو الملغي' },
        { status: 400 }
      );
    }

    // Validate supplier if provided
    if (supplierId) {
      const supplier = await db.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true, active: true },
      });

      if (!supplier) {
        return NextResponse.json(
          { message: 'المورد غير موجود' },
          { status: 404 }
        );
      }

      if (!supplier.active) {
        return NextResponse.json(
          { message: 'المورد غير نشط' },
          { status: 400 }
        );
      }
    }

    // Validate items if provided
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        return NextResponse.json(
          { message: 'يجب أن يحتوي أمر الشراء على عنصر واحد على الأقل' },
          { status: 400 }
        );
      }

      for (const item of items) {
        const materialId = item.rawMaterialId || item.materialId;
        if (!materialId || !item.quantity || !item.unitPrice) {
          return NextResponse.json(
            { message: 'كل عنصر يجب أن يحتوي على: الخام، الكمية، سعر الوحدة' },
            { status: 400 }
          );
        }

        if (parseFloat(item.quantity) <= 0 || parseFloat(item.unitPrice) <= 0) {
          return NextResponse.json(
            { message: 'الكمية وسعر الوحدة يجب أن يكونا أكبر من صفر' },
            { status: 400 }
          );
        }
      }

      // Validate raw materials exist
      const rawMaterialIds = items.map(item => item.rawMaterialId || item.materialId);
      const rawMaterials = await db.rawMaterial.findMany({
        where: {
          id: {
            in: rawMaterialIds,
          },
        },
        select: { id: true },
      });

      if (rawMaterials.length !== rawMaterialIds.length) {
        return NextResponse.json(
          { message: 'بعض الخامات غير موجودة' },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {};
      if (supplierId !== undefined) {
        updateData.supplier = {
          connect: { id: supplierId }
        };
      }
      if (expectedDeliveryDate !== undefined) {
        updateData.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
      }
      if (orderDate !== undefined) {
        updateData.orderDate = orderDate ? new Date(orderDate) : null;
      }
      if (notes !== undefined) updateData.notes = notes;
      if (priority !== undefined) updateData.priority = priority;
      if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
      if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
      if (status !== undefined) updateData.status = status;

      // Update financial amounts
      if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
      if (subtotalAmount !== undefined) updateData.subtotalAmount = subtotalAmount;
      if (taxAmount !== undefined) updateData.taxAmount = taxAmount;

      // Handle items update
      if (items && Array.isArray(items)) {

        // Delete existing items
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: resolvedParams.id },
        });

        // Create new items
        await Promise.all(
          items.map(item => {
            const materialId = item.rawMaterialId || item.materialId;
            return tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: resolvedParams.id,
                materialId: materialId,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
              },
            });
          })
        );
      }

      // Update purchase order
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: resolvedParams.id },
        data: updateData,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          subtotalAmount: true,
          taxAmount: true,
          priority: true,
          paymentTerms: true,
          deliveryAddress: true,
          orderDate: true,
          expectedDeliveryDate: true,
          notes: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          supplier: {
            select: {
              id: true,
              name: true,
              contactPerson: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              material: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      return updatedOrder;
    });

    // تحديث إجمالي المشتريات للمورد إذا تم تغيير الحالة
    if (status !== undefined && (status === 'EXECUTED' || existingOrder.status === 'EXECUTED')) {
      await updateSupplierTotalPurchases(result.supplier.id);
    }

    // Clear purchase orders cache
    for (let page = 1; page <= 10; page++) {
      for (const status of ['all', 'draft', 'pending', 'approved', 'executed', 'cancelled']) {
        const keyToDelete = cache.generateKey(
          CACHE_KEYS.PURCHASE_ORDERS || 'purchase-orders',
          `page-${page}`,
          `limit-10`,
          `search-none`,
          `status-${status}`,
          `supplier-none`
        );
        await cache.del(keyToDelete);
      }
    }

    // Clear suppliers cache to refresh total purchases
    const supplierCacheKey = cache.generateKey(
      CACHE_KEYS.SUPPLIERS || 'suppliers',
      'page-1',
      'limit-10',
      'search-none'
    );
    await cache.del(supplierCacheKey);

    return NextResponse.json({
      ...result,
      totalItems: result.items.length,
      canEdit: ['DRAFT'].includes(result.status),
      canApprove: ['DRAFT', 'PENDING'].includes(result.status),
      canExecute: ['APPROVED'].includes(result.status),
      canCancel: ['DRAFT', 'PENDING', 'APPROVED'].includes(result.status),
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في تحديث أمر الشراء' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/[id] - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    ) as any;

    const resolvedParams = await params;

    // Check if purchase order exists
    const existingOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // Check if order can be deleted
    if (!['DRAFT', 'CANCELLED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { message: 'لا يمكن حذف أمر الشراء في هذه الحالة' },
        { status: 400 }
      );
    }

    // Start transaction
    await db.$transaction(async (tx) => {
      // Delete purchase order items first
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: resolvedParams.id },
      });

      // Delete purchase order
      await tx.purchaseOrder.delete({
        where: { id: resolvedParams.id },
      });
    });

    // Clear purchase orders cache
    for (let page = 1; page <= 10; page++) {
      for (const status of ['all', 'draft', 'pending', 'approved', 'executed', 'cancelled']) {
        const keyToDelete = cache.generateKey(
          CACHE_KEYS.PURCHASE_ORDERS || 'purchase-orders',
          `page-${page}`,
          `limit-10`,
          `search-none`,
          `status-${status}`,
          `supplier-none`
        );
        await cache.del(keyToDelete);
      }
    }

    return NextResponse.json(
      { message: 'تم حذف أمر الشراء بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في حذف أمر الشراء' },
      { status: 500 }
    );
  }
}