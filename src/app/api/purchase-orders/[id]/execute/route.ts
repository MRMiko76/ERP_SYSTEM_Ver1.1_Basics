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

// POST /api/purchase-orders/[id]/execute - Execute purchase order
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
    const { actualDeliveryDate, notes, receivedItems } = body;

    // Validate required fields
    if (!actualDeliveryDate) {
      return NextResponse.json(
        { message: 'تاريخ الاستلام الفعلي مطلوب' },
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
        supplierId: true,
        notes: true,
        supplier: {
          select: {
            id: true,
            name: true,
            balance: true,
          },
        },
        items: {
          select: {
            id: true,
            rawMaterialId: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            rawMaterial: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unitCost: true,
                unit: true,
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

    // Check if order can be executed
    if (existingOrder.status !== 'APPROVED') {
      return NextResponse.json(
        { message: 'يجب اعتماد أمر الشراء أولاً قبل التنفيذ' },
        { status: 400 }
      );
    }

    // Validate received items if provided
    let itemsToReceive = existingOrder.items;
    if (receivedItems && Array.isArray(receivedItems)) {
      // Validate that all received items exist in the order
      for (const receivedItem of receivedItems) {
        const orderItem = existingOrder.items.find(item => item.id === receivedItem.itemId);
        if (!orderItem) {
          return NextResponse.json(
            { message: 'عنصر غير موجود في أمر الشراء' },
            { status: 400 }
          );
        }

        if (parseFloat(receivedItem.receivedQuantity) < 0) {
          return NextResponse.json(
            { message: 'الكمية المستلمة يجب أن تكون أكبر من أو تساوي صفر' },
            { status: 400 }
          );
        }
      }

      // Update items with received quantities
      itemsToReceive = existingOrder.items.map(item => {
        const receivedItem = receivedItems.find(ri => ri.itemId === item.id);
        return {
          ...item,
          receivedQuantity: receivedItem ? parseFloat(receivedItem.receivedQuantity) : item.quantity,
        };
      });
    } else {
      // If no received items specified, assume all items were received as ordered
      itemsToReceive = existingOrder.items.map(item => ({
        ...item,
        receivedQuantity: item.quantity,
      }));
    }

    // TODO: Add permission check for purchase execution
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.execute');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لتنفيذ أوامر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Update purchase order status
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: resolvedParams.id },
        data: {
          status: 'EXECUTED',
          actualDeliveryDate: new Date(actualDeliveryDate),
          executedAt: new Date(),
          notes: notes ? `${existingOrder.notes || ''}\n\nملاحظات التنفيذ: ${notes}`.trim() : existingOrder.notes,
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          actualDeliveryDate: true,
          executedAt: true,
          notes: true,
        },
      });

      // Update raw material quantities and create stock movements
      const stockMovements = [];
      const updatedMaterials = [];

      for (const item of itemsToReceive) {
        if (item.receivedQuantity > 0) {
          // Calculate new average cost
          const currentQuantity = item.rawMaterial.quantity;
          const currentCost = item.rawMaterial.unitCost;
          const receivedQuantity = item.receivedQuantity;
          const receivedCost = item.unitPrice;

          const totalQuantity = currentQuantity + receivedQuantity;
          const newAverageCost = totalQuantity > 0 
            ? ((currentQuantity * currentCost) + (receivedQuantity * receivedCost)) / totalQuantity
            : receivedCost;

          // Update raw material
          const updatedMaterial = await tx.rawMaterial.update({
            where: { id: item.rawMaterialId },
            data: {
              quantity: totalQuantity,
              unitCost: newAverageCost,
            },
            select: {
              id: true,
              name: true,
              quantity: true,
              unitCost: true,
              unit: true,
            },
          });

          updatedMaterials.push(updatedMaterial);

          // Create stock movement
          const stockMovement = await tx.stockMovement.create({
            data: {
              rawMaterialId: item.rawMaterialId,
              type: 'IN',
              quantity: receivedQuantity,
              reason: 'PURCHASE_ORDER',
              notes: `استلام من أمر الشراء ${existingOrder.orderNumber}`,
              userId: decoded.userId,
              purchaseOrderId: existingOrder.id,
            },
            select: {
              id: true,
              type: true,
              quantity: true,
              reason: true,
              notes: true,
              createdAt: true,
            },
          });

          stockMovements.push(stockMovement);
        }
      }

      // Update supplier balance (increase debt)
      await tx.supplier.update({
        where: { id: existingOrder.supplierId },
        data: {
          balance: {
            increment: existingOrder.totalAmount,
          },
        },
      });

      // TODO: Create accounting entries
      // await createAccountingEntries({
      //   type: 'PURCHASE_ORDER_EXECUTION',
      //   orderId: existingOrder.id,
      //   amount: existingOrder.totalAmount,
      //   supplierId: existingOrder.supplierId,
      //   items: itemsToReceive,
      // });

      return {
        order: updatedOrder,
        stockMovements,
        updatedMaterials,
      };
    });

    // تحديث إجمالي المشتريات للمورد
    await updateSupplierTotalPurchases(existingOrder.supplierId);

    // Clear caches
    const cacheKeys = [
      CACHE_KEYS.PURCHASE_ORDERS,
      CACHE_KEYS.RAW_MATERIALS,
      CACHE_KEYS.SUPPLIERS,
      CACHE_KEYS.LOW_STOCK_MATERIALS,
    ];

    for (const cacheKey of cacheKeys) {
      if (cacheKey) {
        // Clear multiple pages and filters
        for (let page = 1; page <= 10; page++) {
          for (const filter of ['all', 'true', 'false', 'draft', 'pending', 'approved', 'executed', 'cancelled', 'production', 'packaging']) {
            const keyToDelete = cache.generateKey(
              cacheKey,
              `page-${page}`,
              `limit-10`,
              `search-none`,
              `filter-${filter}`
            );
            await cache.del(keyToDelete);
          }
        }
      }
    }

    // TODO: Send notifications
    // await sendNotification({
    //   type: 'PURCHASE_ORDER_EXECUTED',
    //   orderId: result.order.id,
    //   orderNumber: result.order.orderNumber,
    //   executedBy: decoded.userId,
    //   receivedItems: itemsToReceive.filter(item => item.receivedQuantity > 0),
    // });

    return NextResponse.json({
      order: result.order,
      stockMovements: result.stockMovements,
      updatedMaterials: result.updatedMaterials,
      message: `تم تنفيذ أمر الشراء ${result.order.orderNumber} بنجاح`,
      summary: {
        totalItemsReceived: itemsToReceive.filter(item => item.receivedQuantity > 0).length,
        totalQuantityReceived: itemsToReceive.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0),
        totalValue: existingOrder.totalAmount,
      },
    });
  } catch (error) {
    console.error('Error executing purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في تنفيذ أمر الشراء' },
      { status: 500 }
    );
  }
}