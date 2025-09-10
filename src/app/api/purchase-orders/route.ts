import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

// GET /api/purchase-orders - Get all purchase orders with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // DRAFT, PENDING, APPROVED, EXECUTED, CANCELLED, all
    const supplierId = searchParams.get('supplierId') || '';
    const skip = (page - 1) * limit;

    // Build cache key
    const cacheKey = cache.generateKey(
      CACHE_KEYS.PURCHASE_ORDERS || 'purchase-orders',
      `page-${page}`,
      `limit-${limit}`,
      `search-${search || 'none'}`,
      `status-${status}`,
      `supplier-${supplierId || 'none'}`
    );

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          supplier: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Get purchase orders with pagination
    const [purchaseOrders, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
              contactPerson: true,
            },
          },
          createdBy: true,
          approvedBy: true,
          items: {
            select: {
              id: true,
            },
          },
        },
      }),
      db.purchaseOrder.count({ where }),
    ]);

    // Calculate additional data for each order
    const ordersWithStats = purchaseOrders.map((order) => {
      const isOverdue = order.expectedDeliveryDate && 
        order.status !== 'EXECUTED' && 
        order.status !== 'CANCELLED' &&
        new Date(order.expectedDeliveryDate) < new Date();

      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...order,
        isOverdue,
        daysSinceCreated,
      };
    });

    const result = {
      purchaseOrders: ordersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        status,
        supplierId,
      },
    };

    // Cache the result for 5 minutes
    await cache.set(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب أوامر الشراء' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      supplierId,
      expectedDeliveryDate,
      notes,
      items, // Array of { rawMaterialId, quantity, unitPrice }
    } = body;

    // Validate required fields
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'الحقول المطلوبة: المورد، عناصر الطلب' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.rawMaterialId || !item.quantity || !item.unitPrice) {
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

    // Check if supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true, active: true },
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

    // Validate raw materials exist
    const rawMaterialIds = items.map(item => item.rawMaterialId);
    const rawMaterials = await db.rawMaterial.findMany({
      where: {
        id: {
          in: rawMaterialIds,
        },
      },
      select: {
        id: true,
        name: true,
        unit: true,
      },
    });

    if (rawMaterials.length !== rawMaterialIds.length) {
      return NextResponse.json(
        { message: 'بعض الخامات غير موجودة' },
        { status: 400 }
      );
    }

    // Generate order number
    const currentYear = new Date().getFullYear();
    const orderCount = await db.purchaseOrder.count({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
    });
    const orderNumber = `PO-${currentYear}-${String(orderCount + 1).padStart(4, '0')}`;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
    }, 0);

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Create purchase order
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId,
          status: 'DRAFT',
          totalAmount,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
          notes: notes || '',
          createdBy: decoded.userId,
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
              phone: true,
              contactPerson: true,
            },
          },
          createdBy: true,
        },
      });

      // Create purchase order items
      const orderItems = await Promise.all(
        items.map(async (item) => {
          const rawMaterial = rawMaterials.find(rm => rm.id === item.rawMaterialId);
          return tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              materialId: item.rawMaterialId,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
            },
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
          });
        })
      );

      return { purchaseOrder, items: orderItems };
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

    return NextResponse.json({
      ...result.purchaseOrder,
      items: result.items,
      itemsCount: result.items.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { message: 'خطأ في إنشاء أمر الشراء' },
      { status: 500 }
    );
  }
}