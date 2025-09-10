import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/suppliers/[id] - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const supplier = await db.supplier.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        phone: true,
        address: true,
        active: true,
        accountBalance: true,
        creditLimit: true,
        totalPurchases: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            purchaseOrders: true,
            supplierTransactions: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { message: 'المورد غير موجود' },
        { status: 404 }
      );
    }



    // Get last purchase date
    const lastPurchase = await db.purchaseOrder.findFirst({
      where: {
        supplierId: supplier.id,
        status: 'EXECUTED',
      },
      orderBy: {
        actualDeliveryDate: 'desc',
      },
      select: {
        actualDeliveryDate: true,
      },
    });

    const responseSupplier = {
      ...supplier,
      lastPurchaseDate: lastPurchase?.actualDeliveryDate,
    };

    return NextResponse.json(responseSupplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب المورد' },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - Update supplier
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
    const { name, email, phone, address, active } = body;

    // Check if supplier exists
    const existingSupplier = await db.supplier.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { message: 'المورد غير موجود' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another supplier
    if (email && email !== existingSupplier.email) {
      const supplierWithSameEmail = await db.supplier.findUnique({
        where: { email },
      });

      if (supplierWithSameEmail) {
        return NextResponse.json(
          { message: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (active !== undefined) updateData.active = active;

    // Update supplier
    const updatedSupplier = await db.supplier.update({
      where: { id: resolvedParams.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        contactPerson: true,
        phone: true,
        address: true,
        active: true,
        accountBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get additional data

    const lastPurchase = await db.purchaseOrder.findFirst({
      where: {
        supplierId: updatedSupplier.id,
        status: 'EXECUTED',
      },
      orderBy: {
        actualDeliveryDate: 'desc',
      },
      select: {
        actualDeliveryDate: true,
      },
    });

    // Clear suppliers cache
    for (let page = 1; page <= 10; page++) {
      for (const active of ['all', 'true', 'false']) {
        const keyToDelete = cache.generateKey(
          CACHE_KEYS.SUPPLIERS || 'suppliers',
          `page-${page}`,
          `limit-10`,
          `search-none`,
          `active-${active}`
        );
        await cache.del(keyToDelete);
      }
    }

    return NextResponse.json({
      ...updatedSupplier,
      lastPurchaseDate: lastPurchase?.actualDeliveryDate,
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { message: 'خطأ في تحديث المورد' },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
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

    // Check if supplier exists
    const existingSupplier = await db.supplier.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { message: 'المورد غير موجود' },
        { status: 404 }
      );
    }

    // Check if supplier has any purchase orders
    const purchaseOrdersCount = await db.purchaseOrder.count({
      where: { supplierId: resolvedParams.id },
    });

    if (purchaseOrdersCount > 0) {
      return NextResponse.json(
        { message: 'لا يمكن حذف المورد لوجود أوامر شراء مرتبطة به' },
        { status: 400 }
      );
    }

    // Delete supplier
    await db.supplier.delete({
      where: { id: resolvedParams.id },
    });

    // Clear suppliers cache
    for (let page = 1; page <= 10; page++) {
      for (const active of ['all', 'true', 'false']) {
        const keyToDelete = cache.generateKey(
          CACHE_KEYS.SUPPLIERS || 'suppliers',
          `page-${page}`,
          `limit-10`,
          `search-none`,
          `active-${active}`
        );
        await cache.del(keyToDelete);
      }
    }

    return NextResponse.json(
      { message: 'تم حذف المورد بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { message: 'خطأ في حذف المورد' },
      { status: 500 }
    );
  }
}