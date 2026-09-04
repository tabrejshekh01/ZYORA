import { prisma } from '@/lib/prisma';
import { FAQ_POLICIES } from './prompts';

export interface CatalogProductResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  image: string;
  category: string;
  gender: string;
  storeId: string;
  storeName: string;
  inStock: boolean;
  stock: number;
  sizes: string[];
  colors: string[];
}

export interface SearchCatalogParams {
  query?: string;
  category?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export async function searchCatalog(params: SearchCatalogParams): Promise<CatalogProductResult[]> {
  try {
    const { query, category, gender, minPrice, maxPrice, limit = 6 } = params;

    const whereClause: any = {
      status: 'APPROVED',
    };

    if (gender) {
      const g = gender.toUpperCase();
      if (['MEN', 'WOMEN', 'UNISEX'].includes(g)) {
        whereClause.gender = { in: [g, 'UNISEX'] };
      }
    }

    if (category) {
      whereClause.category = {
        OR: [
          { name: { contains: category, mode: 'insensitive' } },
          { slug: { contains: category, mode: 'insensitive' } },
        ],
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) whereClause.price.gte = minPrice;
      if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    if (query && query.trim().length > 0) {
      const cleaned = query.trim();
      whereClause.OR = [
        { title: { contains: cleaned, mode: 'insensitive' } },
        { description: { contains: cleaned, mode: 'insensitive' } },
        { category: { name: { contains: cleaned, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: Math.min(limit, 10),
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
        store: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 2,
        },
        sizes: {
          include: { size: true },
        },
        colors: {
          include: { color: true },
        },
      },
    });

    return products.map((p) => {
      const primaryImg = p.images.find((img) => img.isPrimary) || p.images[0];
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description.slice(0, 160) + (p.description.length > 160 ? '...' : ''),
        price: p.price,
        discountPrice: p.discountPrice,
        image: primaryImg?.url || '/images/placeholder.jpg',
        category: p.category.name,
        gender: p.gender,
        storeId: p.store.id,
        storeName: p.store.name,
        inStock: p.stock > 0,
        stock: p.stock,
        sizes: p.sizes.map((s) => s.size.name),
        colors: p.colors.map((c) => c.color.name),
      };
    });
  } catch (error) {
    console.error('[AI TOOLS] Error searching catalog:', error);
    return [];
  }
}

export interface UserOrderResult {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  itemsCount: number;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
}

export async function getUserOrders(userId: string): Promise<UserOrderResult[]> {
  try {
    if (!userId) return [];

    const orders = await prisma.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
      items: o.items.map((it) => ({
        title: it.product?.title || 'Garment',
        quantity: it.quantity,
        price: it.price,
        size: it.size || undefined,
        color: it.color || undefined,
        image: it.product?.images[0]?.url || undefined,
      })),
    }));
  } catch (error) {
    console.error('[AI TOOLS] Error fetching user orders:', error);
    return [];
  }
}

export function getFaqInfo(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('ship') || lower.includes('deliver') || lower.includes('reach') || lower.includes('time')) {
    return FAQ_POLICIES.shipping;
  }
  if (lower.includes('return') || lower.includes('exchange') || lower.includes('refund')) {
    return FAQ_POLICIES.returns;
  }
  if (lower.includes('authentic') || lower.includes('original') || lower.includes('fake') || lower.includes('real')) {
    return FAQ_POLICIES.authenticity;
  }
  if (lower.includes('pay') || lower.includes('upi') || lower.includes('card') || lower.includes('cod')) {
    return FAQ_POLICIES.payment;
  }
  if (lower.includes('contact') || lower.includes('help') || lower.includes('call') || lower.includes('email') || lower.includes('support')) {
    return FAQ_POLICIES.support;
  }
  return `${FAQ_POLICIES.shipping} ${FAQ_POLICIES.returns}`;
}

