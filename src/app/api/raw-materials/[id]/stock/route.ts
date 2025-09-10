import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/raw-materials/[id]/stock - Adjust stock quantity
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
    const { type, quantity, reason, notes } = body;

    // Validate required fields
    if (!type || !quantity || !reason) {
      return NextResponse.json(
        { message: 'الحقول المطلوبة: النوع، الكمية، السبب' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['IN', 'OUT'].includes(type)) {
      return NextResponse.json(
        { message: 'نوع الحركة يجب أن يكون IN أو OUT' },
        { status: 400 }
      );
    }

    // Validate quantity
    const adjustmentQuantity = parseFloat(quantity);
    if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
      return NextResponse.json(
        { message: 'الكمية يجب أن تكون رقم موجب' },
        { status: 400 }
      );
    }

    // Check if raw material exists
    const rawMaterial = await db.rawMaterial.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        quantity: true,
        unitCost: true,
      },
    });

    if (!rawMaterial) {
      return NextResponse.json(
        { message: 'الخام غير موجود' },
        { status: 404 }
      );
    }

    // Check if we have enough stock for OUT operations
    if (type === 'OUT' && rawMaterial.quantity < adjustmentQuantity) {
      return NextResponse.json(
        { message: `الكمية المتاحة غير كافية. الكمية الحالية: ${rawMaterial.quantity}` },
        { status: 400 }
      );
    }

    // Calculate new quantity
    const newQuantity = type === 'IN' 
      ? rawMaterial.quantity + adjustmentQuantity
      : rawMaterial.quantity - adjustmentQuantity;

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Update raw material quantity
      const updatedMaterial = await tx.rawMaterial.update({
        where: { id: resolvedParams.id },
        data: { quantity: newQuantity },
        select: {
          id: true,
          name: true,
          quantity: true,
          minQuantity: true,
          unitCost: true,
          type: true,
          unit: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Create stock movement record
      const stockMovement = await tx.stockMovement.create({
        data: {
          materialId: resolvedParams.id,
          type,
          quantity: adjustmentQuantity,
          reason,
          notes: notes || '',
          userId: decoded.userId,
        },
        select: {
          id: true,
          type: true,
          quantity: true,
          reason: true,
          notes: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      return { updatedMaterial, stockMovement };
    });

    // Clear raw materials cache
    for (let page = 1; page <= 10; page++) {
      for (const materialType of ['all', 'production', 'packaging']) {
        for (const lowStock of ['true', 'false']) {
          const keyToDelete = cache.generateKey(
            CACHE_KEYS.RAW_MATERIALS || 'raw-materials',
            `page-${page}`,
            `limit-10`,
            `search-none`,
            `type-${materialType}`,
            `lowStock-${lowStock}`
          );
          await cache.del(keyToDelete);
        }
      }
    }

    // Clear low stock cache if applicable
    if (CACHE_KEYS.LOW_STOCK_MATERIALS) {
      await cache.del(CACHE_KEYS.LOW_STOCK_MATERIALS);
    }

    return NextResponse.json({
      material: {
        ...result.updatedMaterial,
        totalValue: result.updatedMaterial.quantity * result.updatedMaterial.unitCost,
        isLowStock: result.updatedMaterial.quantity <= result.updatedMaterial.minQuantity,
      },
      stockMovement: result.stockMovement,
      message: `تم ${type === 'IN' ? 'إضافة' : 'خصم'} ${adjustmentQuantity} ${result.updatedMaterial.unit} ${type === 'IN' ? 'إلى' : 'من'} مخزون ${result.updatedMaterial.name}`,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { message: 'خطأ في تعديل المخزون' },
      { status: 500 }
    );
  }
}

// GET /api/raw-materials/[id]/stock - Get stock movements history
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // IN, OUT, or null for all
    const skip = (page - 1) * limit;

    // Check if raw material exists
    const rawMaterial = await db.rawMaterial.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!rawMaterial) {
      return NextResponse.json(
        { message: 'الخام غير موجود' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      materialId: resolvedParams.id,
    };

    if (type && ['IN', 'OUT'].includes(type)) {
      where.type = type;
    }

    // Get stock movements with pagination
    const [stockMovements, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          quantity: true,
          reason: true,
          notes: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
      db.stockMovement.count({ where }),
    ]);

    return NextResponse.json({
      material: rawMaterial,
      stockMovements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        type,
      },
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب حركات المخزون' },
      { status: 500 }
    );
  }
}