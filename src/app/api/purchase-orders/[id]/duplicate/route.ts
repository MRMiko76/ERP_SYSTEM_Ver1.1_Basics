import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/purchase-orders/[id]/duplicate - Duplicate purchase order
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
    const { 
      includeItems = true, 
      newExpectedDeliveryDate,
      notes 
    } = body;

    // TODO: Add permission check for purchase order creation
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.create');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لإنشاء أوامر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Get the original purchase order
    const originalOrder = await db.purchaseOrder.findUnique({
      where: { id: resolvedParams.id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        items: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                availableQuantity: true,
                unit: true,
                unitCost: true,
              },
            },
          },
        },
      },
    });

    if (!originalOrder) {
      return NextResponse.json(
        { message: 'أمر الشراء المراد نسخه غير موجود' },
        { status: 404 }
      );
    }

    // Check if supplier is still active
    if (!originalOrder.supplier.active) {
      return NextResponse.json(
        { message: 'المورد غير نشط، لا يمكن نسخ أمر الشراء' },
        { status: 400 }
      );
    }

    // Get items to include in the duplicated order
    const itemsToInclude = includeItems ? originalOrder.items : [];

    if (includeItems && itemsToInclude.length === 0) {
      return NextResponse.json(
        { message: 'لا توجد عناصر في أمر الشراء الأصلي' },
        { status: 400 }
      );
    }

    // Generate new order number
    const newOrderNumber = await generatePurchaseOrderNumber();

    // Calculate total amount for items
    const totalAmount = itemsToInclude.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Create the duplicated purchase order
    const duplicatedOrder = await db.$transaction(async (tx) => {
      // Create the new purchase order
      const newOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber: newOrderNumber,
          supplierId: originalOrder.supplierId,
          totalAmount,
          expectedDeliveryDate: newExpectedDeliveryDate 
            ? new Date(newExpectedDeliveryDate)
            : originalOrder.expectedDeliveryDate,
          notes: notes 
            ? `نسخة من أمر الشراء ${originalOrder.orderNumber}\n\n${notes}`
            : `نسخة من أمر الشراء ${originalOrder.orderNumber}`,
          status: 'DRAFT',
          createdBy: decoded.userId,
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          expectedDeliveryDate: true,
          notes: true,
          status: true,
          createdAt: true,
        },
      });

      // Create order items if including items
      if (includeItems && itemsToInclude.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: itemsToInclude.map(item => ({
            purchaseOrderId: newOrder.id,
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      return newOrder;
    });

    // Get the complete duplicated order with relations
    const completeOrder = await db.purchaseOrder.findUnique({
      where: { id: duplicatedOrder.id },
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
                currentStock: true,
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

    // TODO: Send notifications
    // await sendNotification({
    //   type: 'PURCHASE_ORDER_DUPLICATED',
    //   originalOrderId: originalOrder.id,
    //   originalOrderNumber: originalOrder.orderNumber,
    //   newOrderId: completeOrder.id,
    //   newOrderNumber: completeOrder.orderNumber,
    //   createdBy: decoded.userId,
    // });

    return NextResponse.json({
      ...completeOrder,
      totalItems: completeOrder?.items.length || 0,
      canEdit: true,
      canApprove: true,
      canExecute: false,
      canCancel: true,
      duplicatedFrom: {
        id: originalOrder.id,
        orderNumber: originalOrder.orderNumber,
        itemsIncluded: includeItems,
        activeItemsCount: activeItems.length,
        originalItemsCount: originalOrder.items.length,
      },
      message: `تم نسخ أمر الشراء بنجاح. رقم الأمر الجديد: ${completeOrder?.orderNumber}`,
    });
  } catch (error) {
    console.error('Error duplicating purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في نسخ أمر الشراء' },
      { status: 500 }
    );
  }
}

// Helper function to generate purchase order number
async function generatePurchaseOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the count of purchase orders created this month
  const startOfMonth = new Date(currentYear, new Date().getMonth(), 1);
  const endOfMonth = new Date(currentYear, new Date().getMonth() + 1, 0, 23, 59, 59);
  
  const orderCount = await db.purchaseOrder.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  // Generate sequential number for this month
  const sequentialNumber = String(orderCount + 1).padStart(4, '0');
  
  // Format: PO-YYYY-MM-XXXX (e.g., PO-2024-01-0001)
  return `PO-${currentYear}-${currentMonth}-${sequentialNumber}`;
}