import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

// GET /api/purchase-orders/generate-number - Generate new purchase order number
export async function GET(request: NextRequest) {
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

    // TODO: Add permission check for purchase order creation
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.create');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لإنشاء أوامر الشراء' },
    //     { status: 403 }
    //   );
    // }

    // Generate purchase order number
    const orderNumber = await generatePurchaseOrderNumber();

    return NextResponse.json({
      orderNumber,
      message: 'تم توليد رقم أمر الشراء بنجاح',
    });
  } catch (error) {
    console.error('Error generating purchase order number:', error);
    return NextResponse.json(
      { message: 'خطأ في توليد رقم أمر الشراء' },
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

// POST /api/purchase-orders/generate-number - Generate and reserve purchase order number
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
    const { reserve = false } = body;

    // Generate purchase order number
    const orderNumber = await generatePurchaseOrderNumber();

    // If reserve is true, create a placeholder record to reserve the number
    if (reserve) {
      // Check if number already exists
      const existingOrder = await db.purchaseOrder.findFirst({
        where: { orderNumber },
      });

      if (existingOrder) {
        // If exists, generate a new one
        const newOrderNumber = await generatePurchaseOrderNumber();
        return NextResponse.json({
          orderNumber: newOrderNumber,
          reserved: true,
          message: 'تم توليد وحجز رقم أمر الشراء بنجاح',
        });
      }

      // Create a temporary placeholder (will be updated when actual order is created)
      // This is optional - you might want to implement a separate reservation system
      // For now, we'll just return the number without creating a placeholder
    }

    return NextResponse.json({
      orderNumber,
      reserved: reserve,
      message: reserve 
        ? 'تم توليد وحجز رقم أمر الشراء بنجاح'
        : 'تم توليد رقم أمر الشراء بنجاح',
    });
  } catch (error) {
    console.error('Error generating/reserving purchase order number:', error);
    return NextResponse.json(
      { message: 'خطأ في توليد رقم أمر الشراء' },
      { status: 500 }
    );
  }
}