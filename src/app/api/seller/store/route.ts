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

    const store = await prisma.store.findUnique({
      where: { userId: userPayload.userId },
      include: {
        products: {
          include: {
            category: true,
            images: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true, orderItems: true },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found for this seller' }, { status: 404 });
    }

    const formattedStore = {
      ...store,
      products: store.products.map((p) => ({
        ...p,
        images: p.images.length > 0 ? JSON.stringify(p.images.map((img) => img.url)) : JSON.stringify(['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop']),
      })),
    };

    return NextResponse.json({ store: formattedStore });
  } catch (error) {
    console.error('Error fetching seller store from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch store details' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || (userPayload.role !== 'SELLER' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, bio, logo, banner, phone, address } = body;

    const updatedStore = await prisma.store.update({
      where: { userId: userPayload.userId },
      data: {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(logo && { logo }),
        ...(banner && { banner }),
        ...(phone && { phone }),
        ...(address && { address }),
      },
    });

    return NextResponse.json({ store: updatedStore, message: 'Store profile updated in PostgreSQL' });
  } catch (error) {
    console.error('Error updating seller store in PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}
