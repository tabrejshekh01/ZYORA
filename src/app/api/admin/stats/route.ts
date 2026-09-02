import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      paidOrdersCount,
      unpaidOrdersCount,
      paidRevenueResult,
      paidCommissionResult,
      settlementsList,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { paymentStatus: { not: 'PAID' } } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { zyoraCommission: true },
      }),
      prisma.sellerSettlement.findMany({
        include: {
          sellerStore: { select: { name: true, slug: true, razorpayAccountId: true } },
          order: { select: { orderNumber: true, paymentStatus: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        take: 50,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              product: { select: { title: true, images: true } },
              sellerStore: { select: { name: true, slug: true } },
            },
          },
          settlements: {
            include: {
              sellerStore: { select: { name: true } },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Financial calculations strictly based on verified successful (PAID) orders
    const totalSales = paidRevenueResult._sum.totalAmount || 0;
    // Fixed ₹4 per successful customer order
    const totalZyoraCommission = paidCommissionResult._sum.zyoraCommission || (paidOrdersCount * 4.0);
    const sellerPayableAmount = Math.max(0, totalSales - totalZyoraCommission);

    const stats = {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      paidOrders: paidOrdersCount,
      unpaidOrders: unpaidOrdersCount,
      totalRevenue: totalSales, // GMV of Paid Orders
      totalSales,
      totalZyoraCommission, // ₹4 * paid orders
      sellerPayableAmount,
      recentOrders,
      settlementsList,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
