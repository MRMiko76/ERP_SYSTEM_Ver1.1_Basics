import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/purchase-orders/[id]/approve - Approve purchase order
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
    const { notes } = body;

    // Check if purchase order exists
    const existingOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        supplierId: true,
        createdById: true,
        supplier: {
          select: {
            name: true,
            active: true,
          },
        },
        items: {
          select: {
            rawMaterialId: true,
            quantity: true,
            rawMaterial: {
              select: {
                name: true,
              },
            },
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

    // Check if order can be approved
    if (!['DRAFT', 'PENDING'].includes(existingOrder.status)) {
      return NextResponse.json(
        { message: 'لا يمكن اعتماد أمر الشراء في هذه الحالة' },
        { status: 400 }
      );
    }

    // Check if supplier is active
    if (!existingOrder.supplier.active) {
      return NextResponse.json(
        { message: 'المورد غير نشط' },
        { status: 400 }
      );
    }

    // Check if user can approve (cannot approve own orders)
    if (existingOrder.createdById === decoded.userId) {
      return NextResponse.json(
        { message: 'لا يمكنك اعتماد أمر الشراء الذي أنشأته بنفسك' },
        { status: 400 }
      );
    }

    // TODO: Add permission check for purchase approval
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.approve');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لاعتماد أوامر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Update purchase order status
    const updatedOrder = await db.purchaseOrder.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'APPROVED',
        approvedById: decoded.userId,
        approvedAt: new Date(),
        notes: notes ? `${existingOrder.notes || ''}\n\nملاحظات الاعتماد: ${notes}`.trim() : existingOrder.notes,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        expectedDeliveryDate: true,
        notes: true,
        approvedAt: true,
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
        approvedBy: {
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

    // TODO: Send notification to relevant users
    // await sendNotification({
    //   type: 'PURCHASE_ORDER_APPROVED',
    //   orderId: updatedOrder.id,
    //   orderNumber: updatedOrder.orderNumber,
    //   approvedBy: decoded.userId,
    // });

    return NextResponse.json({
      ...updatedOrder,
      totalItems: updatedOrder.items.length,
      canEdit: false,
      canApprove: false,
      canExecute: true,
      canCancel: true,
      message: `تم اعتماد أمر الشراء ${updatedOrder.orderNumber} بنجاح`,
    });
  } catch (error) {
    console.error('Error approving purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في اعتماد أمر الشراء' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/[id]/approve - Reject/Unapprove purchase order
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
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { message: 'يجب تقديم سبب الرفض' },
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
        notes: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء غير موجود' },
        { status: 404 }
      );
    }

    // Check if order can be rejected
    if (!['PENDING', 'APPROVED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { message: 'لا يمكن رفض أمر الشراء في هذه الحالة' },
        { status: 400 }
      );
    }

    // TODO: Add permission check for purchase rejection
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.approve');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لرفض أوامر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Update purchase order status
    const updatedOrder = await db.purchaseOrder.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'DRAFT',
        approvedById: null,
        approvedAt: null,
        notes: `${existingOrder.notes || ''}\n\nسبب الرفض: ${reason}`.trim(),
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

    // TODO: Send notification to relevant users
    // await sendNotification({
    //   type: 'PURCHASE_ORDER_REJECTED',
    //   orderId: updatedOrder.id,
    //   orderNumber: updatedOrder.orderNumber,
    //   rejectedBy: decoded.userId,
    //   reason,
    // });

    return NextResponse.json({
      ...updatedOrder,
      totalItems: updatedOrder.items.length,
      canEdit: true,
      canApprove: true,
      canExecute: false,
      canCancel: true,
      message: `تم رفض أمر الشراء ${updatedOrder.orderNumber}`,
    });
  } catch (error) {
    console.error('Error rejecting purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في رفض أمر الشراء' },
      { status: 500 }
    );
  }
}