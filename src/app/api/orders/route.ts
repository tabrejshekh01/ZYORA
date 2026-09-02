import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: userPayload.userId },
      include: {
        items: {
          include: {
            product: true,
            sellerStore: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching user orders from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Insecure legacy order creation is disabled. All orders must go through the verified Razorpay payment pipeline.
export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct order creation is disabled for security. Please initiate checkout via /api/payments/create-order.',
    },
    { status: 405 }
  );
}
