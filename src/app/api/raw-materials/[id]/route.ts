import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/raw-materials/[id] - Get single raw material
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const rawMaterial = await db.rawMaterial.findUnique({
      where: { id: resolvedParams.id },
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
    });

    if (!rawMaterial) {
      return NextResponse.json(
        { message: 'الخام غير موجود' },
        { status: 404 }
      );
    }

    // Get stock movements history
    const stockMovements = await db.stockMovement.findMany({
      where: { materialId: rawMaterial.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
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

    // Get last purchase info
    const lastPurchase = await db.purchaseOrderItem.findFirst({
      where: {
        materialId: rawMaterial.id,
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
        quantity: true,
        purchaseOrder: {
          select: {
            actualDeliveryDate: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate total purchases
    const totalPurchases = await db.purchaseOrderItem.aggregate({
      where: {
        materialId: rawMaterial.id,
        purchaseOrder: {
          status: 'EXECUTED',
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Calculate additional data
    const totalValue = rawMaterial.availableQuantity * rawMaterial.unitCost;
    const isLowStock = rawMaterial.availableQuantity <= rawMaterial.minimumStock;
    
    // Convert materialType from DB format to frontend format
    const materialTypeForFrontend = rawMaterial.materialType === 'PRODUCTION_MATERIAL' ? 'production' : 'packaging';

    const responseData = {
      id: rawMaterial.id,
      name: rawMaterial.name,
      quantity: rawMaterial.availableQuantity,
      minQuantity: rawMaterial.minimumStock,
      maxQuantity: rawMaterial.maximumStock,
      reorderPoint: rawMaterial.reorderPoint,
      unitCost: rawMaterial.unitCost,
      type: materialTypeForFrontend,
      unit: rawMaterial.unit,
      warehouseId: rawMaterial.warehouseId,
      locationInWarehouse: rawMaterial.locationInWarehouse,
      totalValue,
      isLowStock,
      stockMovements,
      lastPurchase: lastPurchase ? {
        price: lastPurchase.unitPrice,
        quantity: lastPurchase.quantity,
        date: lastPurchase.purchaseOrder.actualDeliveryDate,
        supplier: lastPurchase.purchaseOrder.supplier.name,
      } : null,
      totalPurchasedQuantity: totalPurchases._sum.quantity || 0,
      createdAt: rawMaterial.createdAt,
      updatedAt: rawMaterial.updatedAt,
      _count: rawMaterial._count
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching raw material:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب الخام' },
      { status: 500 }
    );
  }
}

// PUT /api/raw-materials/[id] - Update raw material
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
    const { name, minimumStock, maximumStock, unitCost, materialType, unit, description } = body;

    // Check if raw material exists
    const existingMaterial = await db.rawMaterial.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { message: 'الخام غير موجود' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another material
    if (name && name !== existingMaterial.name) {
      const materialWithSameName = await db.rawMaterial.findFirst({
        where: { name },
      });

      if (materialWithSameName) {
        return NextResponse.json(
          { message: 'خام بنفس الاسم موجود بالفعل' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (minimumStock !== undefined) updateData.minimumStock = parseFloat(minimumStock);
    if (maximumStock !== undefined) updateData.maximumStock = parseFloat(maximumStock);
    if (unitCost !== undefined) updateData.unitCost = parseFloat(unitCost);
    if (materialType !== undefined) {
      // Convert frontend format to DB format
      updateData.materialType = materialType.toLowerCase() === 'production' ? 'PRODUCTION_MATERIAL' : 'PACKAGING_MATERIAL';
    }
    if (unit !== undefined) updateData.unit = unit;

    // Update raw material
    const updatedMaterial = await db.rawMaterial.update({
      where: { id: resolvedParams.id },
      data: updateData,
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

    // Convert materialType for frontend response
    const materialTypeForFrontend = updatedMaterial.materialType === 'PRODUCTION_MATERIAL' ? 'production' : 'packaging';
    
    return NextResponse.json({
      id: updatedMaterial.id,
      name: updatedMaterial.name,
      availableQuantity: updatedMaterial.availableQuantity,
      minimumStock: updatedMaterial.minimumStock,
      maximumStock: updatedMaterial.maximumStock,
      reorderPoint: updatedMaterial.reorderPoint,
      unitCost: updatedMaterial.unitCost,
      materialType: materialTypeForFrontend,
      unit: updatedMaterial.unit,
      warehouseId: updatedMaterial.warehouseId,
      locationInWarehouse: updatedMaterial.locationInWarehouse,
      totalValue: updatedMaterial.availableQuantity * updatedMaterial.unitCost,
      isLowStock: updatedMaterial.availableQuantity <= updatedMaterial.minimumStock,
      createdAt: updatedMaterial.createdAt,
      updatedAt: updatedMaterial.updatedAt
    });
  } catch (error) {
    console.error('Error updating raw material:', error);
    return NextResponse.json(
      { message: 'خطأ في تحديث الخام' },
      { status: 500 }
    );
  }
}

// DELETE /api/raw-materials/[id] - Delete raw material
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

    // Check if raw material exists
    const existingMaterial = await db.rawMaterial.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { message: 'الخام غير موجود' },
        { status: 404 }
      );
    }

    // Check if material has any purchase order items
    const purchaseOrderItemsCount = await db.purchaseOrderItem.count({
      where: { materialId: resolvedParams.id },
    });

    if (purchaseOrderItemsCount > 0) {
      return NextResponse.json(
        { message: 'لا يمكن حذف الخام لوجود أوامر شراء مرتبطة به' },
        { status: 400 }
      );
    }

    // Delete related stock movements first
    await db.stockMovement.deleteMany({
      where: { materialId: resolvedParams.id },
    });

    // Delete raw material
    await db.rawMaterial.delete({
      where: { id: resolvedParams.id },
    });

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

    return NextResponse.json(
      { message: 'تم حذف الخام بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting raw material:', error);
    return NextResponse.json(
      { message: 'خطأ في حذف الخام' },
      { status: 500 }
    );
  }
}