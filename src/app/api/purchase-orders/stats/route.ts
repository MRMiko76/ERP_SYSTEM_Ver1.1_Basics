import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/lib/cache';
import jwt from 'jsonwebtoken';

// GET /api/purchase-orders/stats - Get purchase orders statistics
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

    // TODO: Add permission check for viewing purchase statistics
    // const hasPermission = await checkUserPermission(decoded.userId, 'purchases.view_stats');
    // if (!hasPermission) {
    //   return NextResponse.json(
    //     { message: 'ليس لديك صلاحية لعرض إحصائيات المشتريات' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, quarter, year, all
    const supplierId = searchParams.get('supplierId');

    // Check cache first
    const cacheKey = cache.generateKey(
      CACHE_KEYS.PURCHASE_ORDERS_STATS || 'purchase-orders-stats',
      `period-${period}`,
      `supplier-${supplierId || 'all'}`
    );
    
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(2020, 0, 1); // All time
    }

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    // Get basic statistics
    const [totalOrders, totalValue, statusCounts, supplierStats] = await Promise.all([
      // Total orders count
      db.purchaseOrder.count({ where: whereClause }),
      
      // Total value
      db.purchaseOrder.aggregate({
        where: whereClause,
        _sum: { totalAmount: true },
      }),
      
      // Orders by status
      db.purchaseOrder.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      
      // Top suppliers
      db.purchaseOrder.groupBy({
        by: ['supplierId'],
        where: whereClause,
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
    ]);

    // Get supplier details for top suppliers
    const supplierIds = supplierStats.map(stat => stat.supplierId);
    const suppliers = await db.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true },
    });

    const supplierMap = suppliers.reduce((acc, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {} as Record<string, string>);

    // Get monthly trends (last 12 months)
    const monthlyTrends = await getMonthlyTrends(supplierId);

    // Get overdue orders
    const overdueOrders = await db.purchaseOrder.count({
      where: {
        ...whereClause,
        status: { in: ['APPROVED', 'PENDING'] },
        expectedDeliveryDate: { lt: now },
      },
    });

    // Get pending approvals
    const pendingApprovals = await db.purchaseOrder.count({
      where: {
        ...whereClause,
        status: 'PENDING',
      },
    });

    // Get average order value
    const avgOrderValue = totalOrders > 0 ? (totalValue._sum.totalAmount || 0) / totalOrders : 0;

    // Get most purchased materials
    const topMaterials = await db.purchaseOrderItem.groupBy({
      by: ['rawMaterialId'],
      where: {
        purchaseOrder: whereClause,
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: { _all: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    });

    // Get material details
    const materialIds = topMaterials.map(item => item.rawMaterialId);
    const materials = await db.rawMaterial.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, unit: true },
    });

    const materialMap = materials.reduce((acc, material) => {
      acc[material.id] = material;
      return acc;
    }, {} as Record<string, any>);

    // Format the response
    const stats = {
      summary: {
        totalOrders,
        totalValue: totalValue._sum.totalAmount || 0,
        avgOrderValue,
        overdueOrders,
        pendingApprovals,
        period,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
      statusBreakdown: statusCounts.map(stat => ({
        status: stat.status,
        count: stat._count._all,
        value: stat._sum.totalAmount || 0,
        percentage: totalOrders > 0 ? (stat._count._all / totalOrders) * 100 : 0,
      })),
      topSuppliers: supplierStats.map(stat => ({
        supplierId: stat.supplierId,
        supplierName: supplierMap[stat.supplierId] || 'غير معروف',
        orderCount: stat._count._all,
        totalValue: stat._sum.totalAmount || 0,
        percentage: totalValue._sum.totalAmount > 0 
          ? ((stat._sum.totalAmount || 0) / (totalValue._sum.totalAmount || 1)) * 100 
          : 0,
      })),
      topMaterials: topMaterials.map(item => ({
        materialId: item.rawMaterialId,
        materialName: materialMap[item.rawMaterialId]?.name || 'غير معروف',
        unit: materialMap[item.rawMaterialId]?.unit || '',
        totalQuantity: item._sum.quantity || 0,
        totalValue: item._sum.totalPrice || 0,
        orderCount: item._count._all,
      })),
      monthlyTrends,
      insights: {
        mostActiveMonth: monthlyTrends.reduce((max, month) => 
          month.orderCount > max.orderCount ? month : max, 
          monthlyTrends[0] || { month: '', orderCount: 0 }
        ),
        highestValueMonth: monthlyTrends.reduce((max, month) => 
          month.totalValue > max.totalValue ? month : max, 
          monthlyTrends[0] || { month: '', totalValue: 0 }
        ),
        growthRate: calculateGrowthRate(monthlyTrends),
      },
    };

    // Cache the results for 1 hour
    await cache.set(cacheKey, stats, 3600);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching purchase orders statistics:', error);
    return NextResponse.json(
      { message: 'خطأ في جلب إحصائيات أوامر الشراء' },
      { status: 500 }
    );
  }
}

// Helper function to get monthly trends
async function getMonthlyTrends(supplierId?: string | null) {
  const trends = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const whereClause: any = {
      createdAt: {
        gte: date,
        lt: nextMonth,
      },
    };
    
    if (supplierId) {
      whereClause.supplierId = supplierId;
    }
    
    const [orderCount, totalValue] = await Promise.all([
      db.purchaseOrder.count({ where: whereClause }),
      db.purchaseOrder.aggregate({
        where: whereClause,
        _sum: { totalAmount: true },
      }),
    ]);
    
    trends.push({
      month: date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
      monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      orderCount,
      totalValue: totalValue._sum.totalAmount || 0,
      avgOrderValue: orderCount > 0 ? (totalValue._sum.totalAmount || 0) / orderCount : 0,
    });
  }
  
  return trends;
}

// Helper function to calculate growth rate
function calculateGrowthRate(trends: any[]) {
  if (trends.length < 2) return 0;
  
  const currentMonth = trends[trends.length - 1];
  const previousMonth = trends[trends.length - 2];
  
  if (previousMonth.totalValue === 0) return 0;
  
  return ((currentMonth.totalValue - previousMonth.totalValue) / previousMonth.totalValue) * 100;
}