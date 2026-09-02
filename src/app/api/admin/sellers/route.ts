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

    const stores = await prisma.store.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { products: true, orderItems: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching admin sellers from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch seller stores' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, status } = body;

    if (!storeId || !status) {
      return NextResponse.json({ error: 'Store ID and status are required' }, { status: 400 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { status: status as any },
    });

    return NextResponse.json({ store: updatedStore, message: 'Seller status updated in PostgreSQL' });
  } catch (error) {
    console.error('Error updating seller status in PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to update seller status' }, { status: 500 });
  }
}
