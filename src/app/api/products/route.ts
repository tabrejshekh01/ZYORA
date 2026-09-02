import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const storeSlug = searchParams.get('store');
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // ONLY return APPROVED products from APPROVED stores to public customers
    const where: any = {
      status: 'APPROVED',
      store: {
        status: 'APPROVED',
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (gender) {
      where.gender = gender.toUpperCase();
    }

    if (storeSlug) {
      where.store = { slug: storeSlug, status: 'APPROVED' };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (trending === 'true') {
      where.isTrending = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const rawProducts = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
        images: { orderBy: { sortOrder: 'asc' } },
        sizes: { include: { size: true } },
        colors: { include: { color: true } },
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const products = rawProducts.map((p) => ({
      ...p,
      images: p.images.length > 0
        ? JSON.stringify(p.images.map((img) => img.url))
        : JSON.stringify(['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop']),
      sizes: JSON.stringify(p.sizes.map((s) => s.size.name)),
      colors: JSON.stringify(p.colors.map((c) => c.color.name)),
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromCookies();
    if (!userPayload || (userPayload.role !== 'SELLER' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Seller or Admin access required.' }, { status: 403 });
    }

    // Parse JSON body once
    const body = await request.json().catch(() => ({}));
    const {
      title,
      description,
      price,
      discountPrice,
      gender,
      images,
      sizes,
      colors,
      stock,
      sku,
      categoryId,
      storeId,
      status,
      isFeatured,
      isTrending,
    } = body;

    let targetStoreId = '';
    let initialStatus: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL';

    if (userPayload.role === 'SELLER') {
      const sellerStore = await prisma.store.findUnique({
        where: { userId: userPayload.userId },
      });

      if (!sellerStore) {
        return NextResponse.json({ error: 'No store found for this seller account. Please create a store first.' }, { status: 400 });
      }

      if (sellerStore.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Your seller store is currently pending approval or suspended.' }, { status: 403 });
      }

      // Security: Never trust client-provided storeId or status for Sellers
      targetStoreId = sellerStore.id;
      initialStatus = 'PENDING_APPROVAL';
    } else {
      // ADMIN
      targetStoreId = storeId;
      initialStatus = status === 'APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL';
    }

    // Server-Side Data Validation
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json({ error: 'Valid product name/title is required' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Product description is required' }, { status: 400 });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: 'Valid positive price in INR (₹) is required' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Product category is required' }, { status: 400 });
    }

    const numDiscount = discountPrice ? parseFloat(discountPrice) : null;
    if (numDiscount !== null && (isNaN(numDiscount) || numDiscount >= numPrice)) {
      return NextResponse.json({ error: 'Discount price must be less than regular price' }, { status: 400 });
    }

    const numStock = stock ? parseInt(stock) : 50;
    const generatedSlug = slugify(title) + '-' + Math.floor(Math.random() * 10000);
    const productSku = sku || `SKU-${generatedSlug.toUpperCase()}`;

    // Create Product in PostgreSQL with PENDING_APPROVAL status for Sellers
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        slug: generatedSlug,
        description,
        price: numPrice,
        discountPrice: numDiscount,
        gender: gender || 'UNISEX',
        stock: numStock,
        sku: productSku,
        categoryId,
        storeId: targetStoreId,
        isFeatured: Boolean(isFeatured),
        isTrending: Boolean(isTrending),
        status: initialStatus,
      },
    });

    // Create Product Images
    const imgList = Array.isArray(images)
      ? images
      : [images || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'];

    for (let i = 0; i < imgList.length; i++) {
      if (imgList[i] && typeof imgList[i] === 'string' && imgList[i].trim().length > 0) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imgList[i].trim(),
            isPrimary: i === 0,
            sortOrder: i,
          },
        });
      }
    }

    // Connect Sizes if provided
    if (sizes) {
      const sizeArr = Array.isArray(sizes) ? sizes : String(sizes).split(',').map((s) => s.trim());
      for (const sName of sizeArr) {
        const sizeObj = await prisma.size.findUnique({ where: { name: sName } });
        if (sizeObj) {
          await prisma.productSize.create({
            data: { productId: product.id, sizeId: sizeObj.id },
          }).catch(() => {});
        }
      }
    }

    // Connect Colors if provided
    if (colors) {
      const colorArr = Array.isArray(colors) ? colors : String(colors).split(',').map((c) => c.trim());
      for (const cName of colorArr) {
        const colorObj = await prisma.color.findUnique({ where: { name: cName } });
        if (colorObj) {
          await prisma.productColor.create({
            data: { productId: product.id, colorId: colorObj.id },
          }).catch(() => {});
        }
      }
    }

    // Create Inventory Record
    await prisma.inventory.create({
      data: {
        productId: product.id,
        storeId: targetStoreId,
        stockQuantity: numStock,
        sku: productSku,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        product,
        message:
          initialStatus === 'PENDING_APPROVAL'
            ? 'Product submitted successfully for Admin approval.'
            : 'Product created and approved.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product in PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
