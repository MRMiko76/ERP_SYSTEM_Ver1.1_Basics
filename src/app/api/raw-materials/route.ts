import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

// GET /api/raw-materials - Get all raw materials with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // production, packaging, all
    const lowStock = searchParams.get('lowStock') === 'true';
    const skip = (page - 1) * limit;

    // Build cache key
    const cacheKey = cache.generateKey(
      CACHE_KEYS.RAW_MATERIALS || 'raw-materials',
      `page-${page}`,
      `limit-${limit}`,
      `search-${search || 'none'}`,
      `type-${type}`,
      `lowStock-${lowStock}`
    );

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type !== 'all') {
      where.materialType = type.toUpperCase();
    }

    if (lowStock) {
      where.availableQuantity = {
        lte: db.rawMaterial.fields.minimumStock,
      };
    }

    // Get raw materials with pagination
    const [rawMaterials, total] = await Promise.all([
      db.rawMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          availableQuantity: true,
          minimumStock: true,
          maximumStock: true,
          reorderPoint: true,
          unitCost: true,
          materialType: true,
          unit: true,
          warehouseId: true,
          locationInWarehouse: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              stockMovements: true,
              purchaseOrderItems: true,
            },
          },
        },
      }),
      db.rawMaterial.count({ where }),
    ]);

    // Calculate additional data for each material
    const materialsWithStats = await Promise.all(
      rawMaterials.map(async (material) => {
        // Convert materialType from DB format to frontend format
        const materialTypeForFrontend = material.materialType === 'PRODUCTION_MATERIAL' ? 'production' : 'packaging';
        
        // Get last purchase info
        const lastPurchase = await db.purchaseOrderItem.findFirst({
          where: {
            materialId: material.id,
            purchaseOrder: {
              status: 'EXECUTED',
            },
          },
          orderBy: {
            purchaseOrder: {
              actualDeliveryDate: 'desc',
            },
          },
          select: {
            unitPrice: true,
            purchaseOrder: {
              select: {
                actualDeliveryDate: true,
              },
            },
          },
        });

        // Calculate total value
        const totalValue = material.availableQuantity * material.unitCost;

        // Check if low stock
        const isLowStock = material.availableQuantity <= material.minimumStock;

        return {
          id: material.id,
          name: material.name,
          availableQuantity: material.availableQuantity,
          minimumStock: material.minimumStock,
          maximumStock: material.maximumStock,
          reorderPoint: material.reorderPoint,
          unitCost: material.unitCost,
          unit: material.unit,
          materialType: materialTypeForFrontend,
          warehouseId: material.warehouseId,
          locationInWarehouse: material.locationInWarehouse,
          totalValue,
          isLowStock,
          lastPurchase: lastPurchase ? {
            unitPrice: lastPurchase.unitPrice,
            purchaseOrder: lastPurchase.purchaseOrder
          } : null,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt,
          _count: material._count
        };
      })
    );

    const result = {
      rawMaterials: materialsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        type,
        lowStock,
      },
    };

    // Cache the result for 5 minutes
    await cache.set(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب الخامات' },
      { status: 500 }
    );
  }
}

// POST /api/raw-materials - Create new raw material
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
      name,
      availableQuantity = 0,
      minimumStock = 0,
      maximumStock,
      reorderPoint = 0,
      unitCost,
      materialType,
      unit,
      warehouseId,
      locationInWarehouse
    } = body;

    console.log('Received materialType:', materialType, 'Type:', typeof materialType);

    // Validate required fields
    if (!name || !unitCost || !materialType || !unit) {
      return NextResponse.json(
        { message: 'الحقول المطلوبة: الاسم، تكلفة الوحدة، النوع، الوحدة' },
        { status: 400 }
      );
    }

    // Check if raw material with same name exists
    const existingMaterial = await db.rawMaterial.findFirst({
      where: { name },
    });

    if (existingMaterial) {
      return NextResponse.json(
        { message: 'خام بنفس الاسم موجود بالفعل' },
        { status: 400 }
      );
    }

    // Create raw material
    const rawMaterial = await db.rawMaterial.create({
      data: {
        name,
        availableQuantity: parseFloat(availableQuantity),
        minimumStock: parseFloat(minimumStock),
        maximumStock: maximumStock ? parseFloat(maximumStock) : null,
        reorderPoint: parseFloat(reorderPoint),
        unitCost: parseFloat(unitCost),
        materialType: materialType.toLowerCase() === 'production' ? 'PRODUCTION_MATERIAL' : 'PACKAGING_MATERIAL',
        unit,
        warehouseId,
        locationInWarehouse,
      },
      select: {
        id: true,
        name: true,
        availableQuantity: true,
        minimumStock: true,
        maximumStock: true,
        reorderPoint: true,
        unitCost: true,
        materialType: true,
        unit: true,
        warehouseId: true,
        locationInWarehouse: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create initial stock movement if availableQuantity > 0
    if (availableQuantity > 0) {
      await db.stockMovement.create({
        data: {
          materialId: rawMaterial.id,
          movementType: 'IN',
          quantity: parseFloat(availableQuantity),
          unitCost: parseFloat(unitCost),
          totalCost: parseFloat(availableQuantity) * parseFloat(unitCost),
          referenceType: 'INITIAL_STOCK',
          notes: 'رصيد ابتدائي',
          createdBy: decoded.userId,
        },
      });
    }

    // Clear raw materials cache
    for (let page = 1; page <= 10; page++) {
      for (const type of ['all', 'production', 'packaging']) {
        for (const lowStock of ['true', 'false']) {
          const keyToDelete = cache.generateKey(
            CACHE_KEYS.RAW_MATERIALS || 'raw-materials',
            `page-${page}`,
            `limit-10`,
            `search-none`,
            `type-${type}`,
            `lowStock-${lowStock}`
          );
          await cache.del(keyToDelete);
        }
      }
    }

    // Convert materialType for frontend
    const materialTypeForFrontend = rawMaterial.materialType === 'PRODUCTION_MATERIAL' ? 'production' : 'packaging';
    
    return NextResponse.json({
      id: rawMaterial.id,
      name: rawMaterial.name,
      availableQuantity: rawMaterial.availableQuantity,
      minimumStock: rawMaterial.minimumStock,
      maximumStock: rawMaterial.maximumStock,
      reorderPoint: rawMaterial.reorderPoint,
      unitCost: rawMaterial.unitCost,
      unit: rawMaterial.unit,
      materialType: materialTypeForFrontend,
      warehouseId: rawMaterial.warehouseId,
      locationInWarehouse: rawMaterial.locationInWarehouse,
      totalValue: rawMaterial.availableQuantity * rawMaterial.unitCost,
      isLowStock: rawMaterial.availableQuantity <= rawMaterial.minimumStock,
      createdAt: rawMaterial.createdAt,
      updatedAt: rawMaterial.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating raw material:', error);
    return NextResponse.json(
      { message: 'خطأ في إنشاء الخام' },
      { status: 500 }
    );
  }
}