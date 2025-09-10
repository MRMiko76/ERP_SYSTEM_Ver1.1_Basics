import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - جلب جميع الموردين
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    // إرجاع مصفوفة فارغة في حالة الخطأ لتجنب كسر الواجهة
    return NextResponse.json([]);
  } finally {
    await prisma.$disconnect();
  }
}

// POST - إضافة مورد جديد
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contactPerson, phone, address } = body;

    // التحقق من البيانات المطلوبة
    if (!name) {
      return NextResponse.json(
        { error: 'اسم المورد مطلوب' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        phone,
        address,
        active: true
      }
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة المورد' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - تحديث مورد موجود
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, contactPerson, phone, address, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المورد مطلوب' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: id },
      data: {
        name,
        contactPerson,
        phone,
        address,
        active
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المورد' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - حذف مورد
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المورد مطلوب' },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'المورد غير موجود' },
        { status: 404 }
      );
    }

    // Check if supplier has any purchase orders
    const purchaseOrdersCount = await prisma.purchaseOrder.count({
      where: { supplierId: id },
    });

    if (purchaseOrdersCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف المورد لوجود أوامر شراء مرتبطة به' },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'تم حذف المورد بنجاح' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المورد' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}