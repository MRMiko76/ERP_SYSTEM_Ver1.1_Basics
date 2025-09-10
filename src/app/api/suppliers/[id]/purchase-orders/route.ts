import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/suppliers/[id]/purchase-orders - Get purchase orders for a specific supplier
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const supplierId = resolvedParams.id;

    console.log('🔍 [SUPPLIER PURCHASE ORDERS] Fetching purchase orders for supplier:', supplierId);

    // Verify supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { message: 'المورد غير موجود' },
        { status: 404 }
      );
    }

    // Get purchase orders for this supplier
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        supplierId: supplierId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        expectedDeliveryDate: true,
        actualDeliveryDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('✅ [SUPPLIER PURCHASE ORDERS] Found', purchaseOrders.length, 'purchase orders for supplier:', supplier.name);

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('💥 [SUPPLIER PURCHASE ORDERS] Error fetching purchase orders:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب أوامر الشراء' },
      { status: 500 }
    );
  }
}