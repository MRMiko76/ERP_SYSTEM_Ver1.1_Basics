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

// POST /api/purchase-orders/[id]/cancel - Cancel purchase order
export async function POST(
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
    const { reason, notes } = body;

    // Validate required fields
    if (!reason) {
      return NextResponse.json(
        { message: 'سبب الإلغاء مطلوب' },
        { status: 400 }
      );
    }

    // Check if purchase order exists
    const existingOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdById: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          select: {
            rawMaterial: {
              select: {
                name: true,
              },
            },
            quantity: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (!['DRAFT', 'PENDING', 'APPROVED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { message: 'لا يمكن إلغاء أمر الشراء في هذه الحالة' },
        { status: 400 }
      );
    }

    // Check if order is already executed
    if (existingOrder.status === 'EXECUTED') {
      return NextResponse.json(
        { message: 'لا يمكن إلغاء أمر شراء تم تنفيذه' },
        { status: 400 }
      );
    }

    // TODO: Add permission check for purchase cancellation
    // For now, allow creator to cancel their own orders, or users with cancel permission
    // const canCancel = existingOrder.createdById === decoded.userId || 
    //                   await checkUserPermission(decoded.userId, 'purchases.cancel');
    // if (!canCancel) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لإلغاء هذا أمر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Update purchase order status
    const updatedOrder = await db.purchaseOrder.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: decoded.userId,
        cancelReason: reason,
        notes: notes 
          ? `${existingOrder.notes || ''}\n\nسبب الإلغاء: ${reason}\nملاحظات الإلغاء: ${notes}`.trim()
          : `${existingOrder.notes || ''}\n\nسبب الإلغاء: ${reason}`.trim(),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        expectedDeliveryDate: true,
        notes: true,
        cancelledAt: true,
        cancelReason: true,
        createdAt: true,
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        cancelledBy: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            rawMaterial: {
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

    // تحديث إجمالي المشتريات للمورد
    await updateSupplierTotalPurchases(existingOrder.supplier.id);

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

    // TODO: Send notifications
    // await sendNotification({
    //   type: 'PURCHASE_ORDER_CANCELLED',
    //   orderId: updatedOrder.id,
    //   orderNumber: updatedOrder.orderNumber,
    //   cancelledBy: decoded.userId,
    //   reason,
    //   supplier: existingOrder.supplier,
    // });

    // TODO: Handle any reservations or commitments that need to be released
    // For example, if materials were reserved for this order

    return NextResponse.json({
      ...updatedOrder,
      totalItems: updatedOrder.items.length,
      canEdit: false,
      canApprove: false,
      canExecute: false,
      canCancel: false,
      message: `تم إلغاء أمر الشراء ${updatedOrder.orderNumber} بنجاح`,
      cancellationSummary: {
        reason,
        cancelledAt: updatedOrder.cancelledAt,
        cancelledBy: updatedOrder.cancelledBy?.name,
        totalValue: updatedOrder.totalAmount,
        itemsCount: updatedOrder.items.length,
      },
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في إلغاء أمر الشراء' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/[id]/cancel - Restore cancelled purchase order
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
    const body = await request.json();
    const { notes } = body;

    // Check if purchase order exists
    const existingOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        notes: true,
        cancelledAt: true,
        approvedAt: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // Check if order is cancelled
    if (existingOrder.status !== 'CANCELLED') {
      return NextResponse.json(
        { message: 'أمر الشراء غير ملغي' },
        { status: 400 }
      );
    }

    // TODO: Add permission check for purchase restoration
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.restore');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لاستعادة أوامر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Determine the status to restore to
    const restoreStatus = existingOrder.approvedAt ? 'APPROVED' : 'DRAFT';

    // Update purchase order status
    const updatedOrder = await db.purchaseOrder.update({
      where: { id: resolvedParams.id },
      data: {
        status: restoreStatus,
        cancelledAt: null,
        cancelledById: null,
        cancelReason: null,
        notes: notes 
          ? `${existingOrder.notes || ''}\n\nتم استعادة الأمر: ${notes}`.trim()
          : `${existingOrder.notes || ''}\n\nتم استعادة الأمر`.trim(),
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        expectedDeliveryDate: true,
        notes: true,
        createdAt: true,
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            rawMaterial: {
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

    // تحديث إجمالي المشتريات للمورد
    await updateSupplierTotalPurchases(updatedOrder.supplier.id);

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

    // TODO: Send notifications
    // await sendNotification({
    //   type: 'PURCHASE_ORDER_RESTORED',
    //   orderId: updatedOrder.id,
    //   orderNumber: updatedOrder.orderNumber,
    //   restoredBy: decoded.userId,
    // });

    return NextResponse.json({
      ...updatedOrder,
      totalItems: updatedOrder.items.length,
      canEdit: restoreStatus === 'DRAFT',
      canApprove: ['DRAFT', 'PENDING'].includes(restoreStatus),
      canExecute: restoreStatus === 'APPROVED',
      canCancel: ['DRAFT', 'PENDING', 'APPROVED'].includes(restoreStatus),
      message: `تم استعادة أمر الشراء ${updatedOrder.orderNumber} بنجاح`,
    });
  } catch (error) {
    console.error('Error restoring purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في استعادة أمر الشراء' },
      { status: 500 }
    );
  }
}