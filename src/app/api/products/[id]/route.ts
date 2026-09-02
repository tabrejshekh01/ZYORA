import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        category: true,
        store: true,
        images: { orderBy: { sortOrder: 'asc' } },
        sizes: { include: { size: true } },
        colors: { include: { color: true } },
        inventories: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!rawProduct) {
      return NextResponse.json({ error: 'Garment product not found' }, { status: 404 });
    }

    const userPayload = getUserFromCookies();
    const isOwner = userPayload && rawProduct.store.userId === userPayload.userId;
    const isAdmin = userPayload && userPayload.role === 'ADMIN';

    // Non-owners / non-admins can ONLY view APPROVED products
    if (!isOwner && !isAdmin && rawProduct.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Product is currently pending approval or unavailable' }, { status: 404 });
    }

    const product = {
      ...rawProduct,
      images: rawProduct.images.length > 0
        ? JSON.stringify(rawProduct.images.map((img) => img.url))
        : JSON.stringify(['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop']),
      sizes: JSON.stringify(rawProduct.sizes.map((s) => s.size.name)),
      colors: JSON.stringify(rawProduct.colors.map((c) => c.color.name)),
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product detail from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || (userPayload.role !== 'SELLER' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Seller or Admin credentials required.' }, { status: 403 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Backend Seller Ownership Enforcement
    if (userPayload.role === 'SELLER') {
      const sellerStore = await prisma.store.findUnique({
        where: { userId: userPayload.userId },
      });

      if (!sellerStore || existingProduct.storeId !== sellerStore.id) {
        return NextResponse.json({ error: 'Forbidden. You are not authorized to modify products from another store.' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { title, description, price, discountPrice, stock, sku, status, isFeatured, isTrending, images } = body;

    const updateData: any = {};

    if (title && typeof title === 'string') updateData.title = title.trim();
    if (description && typeof description === 'string') updateData.description = description;

    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return NextResponse.json({ error: 'Invalid price in INR (₹)' }, { status: 400 });
      }
      updateData.price = numPrice;
    }

    if (discountPrice !== undefined) {
      updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    }

    if (stock !== undefined) {
      updateData.stock = parseInt(stock);
    }

    if (sku) {
      updateData.sku = sku;
    }

    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isTrending !== undefined) updateData.isTrending = Boolean(isTrending);

    // Only Admin can update status directly. Sellers editing their product keep status or revert to PENDING_APPROVAL
    if (userPayload.role === 'ADMIN' && status) {
      updateData.status = status;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update images if provided
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: params.id } });
      for (let i = 0; i < images.length; i++) {
        if (images[i] && typeof images[i] === 'string') {
          await prisma.productImage.create({
            data: {
              productId: params.id,
              url: images[i].trim(),
              isPrimary: i === 0,
              sortOrder: i,
            },
          });
        }
      }
    }

    return NextResponse.json({ product: updatedProduct, message: 'Garment updated successfully' });
  } catch (error) {
    console.error('Error updating product in PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || (userPayload.role !== 'SELLER' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Backend Seller Ownership Enforcement
    if (userPayload.role === 'SELLER') {
      const sellerStore = await prisma.store.findUnique({
        where: { userId: userPayload.userId },
      });

      if (!sellerStore || existingProduct.storeId !== sellerStore.id) {
        return NextResponse.json({ error: 'Forbidden. You are not authorized to delete products from another store.' }, { status: 403 });
      }
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Garment deleted successfully' });
  } catch (error) {
    console.error('Error deleting product from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
