import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: any = {};
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const rawProducts = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const products = rawProducts.map((p) => ({
      ...p,
      images: p.images.length > 0
        ? JSON.stringify(p.images.map((img) => img.url))
        : JSON.stringify(['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop']),
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching admin products from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch admin products' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, status } = body;

    if (!productId || !status) {
      return NextResponse.json({ error: 'Product ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DRAFT'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid product status value' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status: status as any },
    });

    return NextResponse.json({ product: updatedProduct, message: `Product status updated to ${status}` });
  } catch (error) {
    console.error('Error updating admin product status in PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
  }
}

