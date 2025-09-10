import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';

// DELETE /api/purchase-orders/clear - Clear all purchase orders
export async function DELETE(request: NextRequest) {
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

    // Start transaction to delete all purchase orders
    const result = await db.$transaction(async (tx) => {
      // Delete all purchase order items first
      const deletedItems = await tx.purchaseOrderItem.deleteMany({});
      
      // Delete all purchase orders
      const deletedOrders = await tx.purchaseOrder.deleteMany({});
      
      return {
        deletedOrders: deletedOrders.count,
        deletedItems: deletedItems.count
      };
    });

    // Clear all purchase orders cache
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

    return NextResponse.json({
      message: 'تم مسح جميع أوامر الشراء بنجاح',
      deletedOrders: result.deletedOrders,
      deletedItems: result.deletedItems
    }, { status: 200 });
  } catch (error) {
    console.error('Error clearing purchase orders:', error);
    return NextResponse.json(
      { message: 'خطأ في مسح أوامر الشراء' },
      { status: 500 }
    );
  }
}