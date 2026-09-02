import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || (userPayload.role !== 'SELLER' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const sellerStore = await prisma.store.findUnique({
      where: { userId: userPayload.userId },
    });

    if (!sellerStore && userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No seller store found.' }, { status: 404 });
    }

    const where: any = {};
    if (sellerStore && userPayload.role !== 'ADMIN') {
      where.sellerStoreId = sellerStore.id;
    }

    const orderItems = await prisma.orderItem.findMany({
      where,
      include: {
        product: true,
        order: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const settlements = sellerStore
      ? await prisma.sellerSettlement.findMany({
          where: { sellerStoreId: sellerStore.id },
          include: { order: { select: { orderNumber: true, paymentStatus: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return NextResponse.json({
      orderItems,
      settlements,
      storeStatus: sellerStore?.settlementStatus || 'PENDING',
      razorpayAccountId: sellerStore?.razorpayAccountId || null,
    });
  } catch (error) {
    console.error('Error fetching seller orders from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch seller orders' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || (userPayload.role !== 'SELLER' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const sellerStore = await prisma.store.findUnique({
      where: { userId: userPayload.userId },
    });

    const body = await request.json();
    const { orderItemId, status } = body;

    if (!orderItemId || !status) {
      return NextResponse.json({ error: 'OrderItem ID and status are required' }, { status: 400 });
    }

    // Enforce Seller Ownership
    if (userPayload.role === 'SELLER') {
      const existingItem = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
      if (!existingItem || existingItem.sellerStoreId !== sellerStore?.id) {
        return NextResponse.json({ error: 'Forbidden. Cannot modify another seller item.' }, { status: 403 });
      }
    }

    const updatedOrderItem = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: status as any },
    });

    return NextResponse.json({ orderItem: updatedOrderItem, message: 'Fulfillment status updated in PostgreSQL' });
  } catch (error) {
    console.error('Error updating order item status in PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to update fulfillment status' }, { status: 500 });
  }
}
