import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZYORA Production PostgreSQL Database (INR ₹)...');

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // 1. Create Sizes
  const sizeNames = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const sizesMap: Record<string, any> = {};
  for (const name of sizeNames) {
    sizesMap[name] = await prisma.size.create({ data: { name } });
  }

  // 2. Create Colors
  const colorsData = [
    { name: 'Obsidian Black', hexCode: '#111111' },
    { name: 'Midnight Navy', hexCode: '#1B263B' },
    { name: 'Crimson Red', hexCode: '#8B0000' },
    { name: 'Champagne Gold', hexCode: '#C5A059' },
    { name: 'Shadow Gray', hexCode: '#4A4A4A' },
    { name: 'Tactical Olive', hexCode: '#4B5320' },
  ];
  const colorsMap: Record<string, any> = {};
  for (const c of colorsData) {
    colorsMap[c.name] = await prisma.color.create({ data: c });
  }

  // 3. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'ZYORA Admin',
      email: 'admin@zyora.com',
      password: adminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop',
      phone: '+91 98765 43210',
    },
  });

  // 4. Create Sellers & Stores
  const seller1User = await prisma.user.create({
    data: {
      name: 'Alexander Vance',
      email: 'seller@atelier.com',
      password: sellerPassword,
      role: 'SELLER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop',
      phone: '+91 98112 34567',
    },
  });

  const store1 = await prisma.store.create({
    data: {
      userId: seller1User.id,
      name: 'Atelier Noir',
      slug: 'atelier-noir',
      logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
      bio: 'Architectural silhouettes, raw silk gowns & bespoke avant-garde tailoring.',
      phone: '+91 98112 34567',
      address: 'Design District, Bandra West, Mumbai',
      status: 'APPROVED',
      rating: 4.95,
    },
  });

  const seller2User = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'seller@vogue.com',
      password: sellerPassword,
      role: 'SELLER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop',
      phone: '+91 98765 12345',
    },
  });

  const store2 = await prisma.store.create({
    data: {
      userId: seller2User.id,
      name: 'Vogue Urban',
      slug: 'vogue-urban',
      logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
      banner: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop',
      bio: 'High-end luxury streetwear fusing heavy oversized cuts with tech-wear aesthetics.',
      phone: '+91 98765 12345',
      address: 'Mehrauli Fashion Hub, New Delhi',
      status: 'APPROVED',
      rating: 4.88,
    },
  });

  // 5. Create Customer
  const customer = await prisma.user.create({
    data: {
      name: 'Sophia Sterling',
      email: 'user@zyora.com',
      password: userPassword,
      role: 'CUSTOMER',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop',
      phone: '+91 99887 76655',
    },
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Sophia Sterling',
      phone: '+91 99887 76655',
      street: '42 Pali Hill, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      country: 'India',
      isDefault: true,
    },
  });

  // 6. Create Categories
  const cat1 = await prisma.category.create({
    data: {
      name: 'Haute Couture',
      slug: 'haute-couture',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
      description: 'Runway statement pieces and bespoke tailored garments.',
    },
  });

  const cat2 = await prisma.category.create({
    data: {
      name: 'Modern Streetwear',
      slug: 'modern-streetwear',
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop',
      description: 'Oversized silhouettes, heavyweight hoodies, and urban outerwear.',
    },
  });

  const cat3 = await prisma.category.create({
    data: {
      name: 'Tailored Outerwear',
      slug: 'tailored-outerwear',
      image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop',
      description: 'Double-breasted trench coats, wool overcoats, and leather jackets.',
    },
  });

  const cat4 = await prisma.category.create({
    data: {
      name: 'Evening Wear',
      slug: 'evening-wear',
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
      description: 'Silk slip gowns, velvet blazers, and red-carpet ensembles.',
    },
  });

  const cat5 = await prisma.category.create({
    data: {
      name: 'Luxury Accessories',
      slug: 'luxury-accessories',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
      description: 'Handcrafted leather bags, dark eyewear, signature footwear, and jewelry.',
    },
  });

  // 7. Create Products with Images, Sizes, Colors & Inventories
  const productsData = [
    {
      title: 'Obsidian Sculpted Double-Breasted Blazer',
      slug: 'obsidian-sculpted-double-breasted-blazer',
      description: 'Precision-cut wool jacket with accentuated structured shoulders, satin lapels, and matte metallic hardware. Designed for timeless prestige.',
      price: 28500,
      discountPrice: 22900,
      gender: 'UNISEX',
      images: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Obsidian Black', 'Midnight Navy'],
      stock: 35,
      isFeatured: true,
      isTrending: true,
      categoryId: cat1.id,
      storeId: store1.id,
    },
    {
      title: 'Cyber-Heavyweight 500GSM Boxy Hoodie',
      slug: 'cyber-heavyweight-500gsm-boxy-hoodie',
      description: 'Ultra-dense French terry cotton with drop-shoulder proportion, high-density embossed ZYORA branding, and rubberized aglets.',
      price: 5990,
      discountPrice: 4490,
      gender: 'UNISEX',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Shadow Gray', 'Obsidian Black'],
      stock: 60,
      isFeatured: true,
      isTrending: true,
      categoryId: cat2.id,
      storeId: store2.id,
    },
    {
      title: 'Vanguard Cashmere Longline Trench Coat',
      slug: 'vanguard-cashmere-longline-trench-coat',
      description: 'Floor-length cashmere blend overcoat with removable waist harness belt, hidden button placket, and deep storm flaps.',
      price: 48500,
      discountPrice: null,
      gender: 'MEN',
      images: [
        'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['M', 'L', 'XL'],
      colors: ['Champagne Gold', 'Obsidian Black'],
      stock: 18,
      isFeatured: true,
      isTrending: false,
      categoryId: cat3.id,
      storeId: store1.id,
    },
    {
      title: 'Midnight Velvet Asymmetrical Gown',
      slug: 'midnight-velvet-asymmetrical-gown',
      description: 'Architectural evening gown tailored from plush silk velvet with high leg slit, dramatic train, and corset-boned bodice.',
      price: 34900,
      discountPrice: 28500,
      gender: 'WOMEN',
      images: [
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Crimson Red', 'Obsidian Black'],
      stock: 12,
      isFeatured: true,
      isTrending: true,
      categoryId: cat4.id,
      storeId: store1.id,
    },
    {
      title: 'Monolith Leather Utility Weekender Bag',
      slug: 'monolith-leather-utility-weekender-bag',
      description: 'Handcrafted full-grain Italian leather duffel featuring custom gunmetal clips, waterproof suede lining, and dedicated shoe compartment.',
      price: 18500,
      discountPrice: 14900,
      gender: 'UNISEX',
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['M'],
      colors: ['Obsidian Black'],
      stock: 40,
      isFeatured: false,
      isTrending: true,
      categoryId: cat5.id,
      storeId: store2.id,
    },
    {
      title: 'Neon Noir Oversized Graphic Bomber',
      slug: 'neon-noir-oversized-graphic-bomber',
      description: 'Water-resistant nylon bomber jacket featuring embroidered cybernetic typography, satin orange interior lining, and heavy zip closures.',
      price: 9990,
      discountPrice: 7990,
      gender: 'UNISEX',
      images: [
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Tactical Olive', 'Obsidian Black'],
      stock: 25,
      isFeatured: false,
      isTrending: true,
      categoryId: cat2.id,
      storeId: store2.id,
    },
    {
      title: 'Aura Silk Satin Draped Corset Top',
      slug: 'aura-silk-satin-draped-corset-top',
      description: 'Pure 100% mulberry silk satin top with boned bodice construction, exposed back zip, and fluid halter neckline.',
      price: 8490,
      discountPrice: null,
      gender: 'WOMEN',
      images: [
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['XS', 'S', 'M'],
      colors: ['Champagne Gold'],
      stock: 30,
      isFeatured: true,
      isTrending: true,
      categoryId: cat4.id,
      storeId: store1.id,
    },
    {
      title: 'Kevlar-Weave Cargo Trousers',
      slug: 'kevlar-weave-cargo-trousers',
      description: 'Modular tech-wear pants featuring magnetic pocket closures, adjustable knee cinch straps, and ergonomic articulated paneling.',
      price: 6990,
      discountPrice: 5490,
      gender: 'MEN',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1000&auto=format&fit=crop',
      ],
      sizes: ['S', 'M', 'L'],
      colors: ['Tactical Olive', 'Obsidian Black'],
      stock: 45,
      isFeatured: false,
      isTrending: false,
      categoryId: cat2.id,
      storeId: store2.id,
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        gender: p.gender,
        stock: p.stock,
        isFeatured: p.isFeatured,
        isTrending: p.isTrending,
        status: 'APPROVED',
        categoryId: p.categoryId,
        storeId: p.storeId,
      },
    });

    // Add Images
    for (let i = 0; i < p.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: prod.id,
          url: p.images[i],
          isPrimary: i === 0,
          sortOrder: i,
        },
      });
    }

    // Add Sizes
    for (const s of p.sizes) {
      if (sizesMap[s]) {
        await prisma.productSize.create({
          data: {
            productId: prod.id,
            sizeId: sizesMap[s].id,
          },
        });
      }
    }

    // Add Colors
    for (const c of p.colors) {
      if (colorsMap[c]) {
        await prisma.productColor.create({
          data: {
            productId: prod.id,
            colorId: colorsMap[c].id,
          },
        });
      }
    }

    // Add Inventory Record
    await prisma.inventory.create({
      data: {
        productId: prod.id,
        storeId: p.storeId,
        size: p.sizes[0] || 'M',
        color: p.colors[0] || 'Obsidian Black',
        stockQuantity: p.stock,
        sku: `SKU-${prod.slug.toUpperCase()}`,
      },
    });

    createdProducts.push(prod);
  }

  // 8. Create Coupon
  const coupon = await prisma.coupon.create({
    data: {
      code: 'ZYORA10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 5000,
      maxDiscount: 2000,
      isActive: true,
    },
  });

  // 9. Create Orders & Payments
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ZY-849201',
      userId: customer.id,
      addressId: customerAddress.id,
      shippingAddress: `${customerAddress.street}, ${customerAddress.city}, ${customerAddress.state} ${customerAddress.pincode}`,
      totalAmount: 27390,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            sellerStoreId: store1.id,
            price: 22900,
            quantity: 1,
            size: 'L',
            color: 'Obsidian Black',
            status: 'DELIVERED',
          },
          {
            productId: createdProducts[1].id,
            sellerStoreId: store2.id,
            price: 4490,
            quantity: 1,
            size: 'XL',
            color: 'Shadow Gray',
            status: 'DELIVERED',
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      gateway: 'UPI',
      transactionId: 'TXN-UPI-99482910',
      amount: 27390,
      currency: 'INR',
      status: 'PAID',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ZY-910243',
      userId: customer.id,
      addressId: customerAddress.id,
      shippingAddress: `${customerAddress.street}, ${customerAddress.city}, ${customerAddress.state} ${customerAddress.pincode}`,
      totalAmount: 28500,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PAID',
      orderStatus: 'PROCESSING',
      items: {
        create: [
          {
            productId: createdProducts[3].id,
            sellerStoreId: store1.id,
            price: 28500,
            quantity: 1,
            size: 'S',
            color: 'Crimson Red',
            status: 'PROCESSING',
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      gateway: 'RAZORPAY',
      transactionId: 'pay_RZP99102482',
      amount: 28500,
      currency: 'INR',
      status: 'PAID',
    },
  });

  // 10. Create Reviews
  await prisma.review.create({
    data: {
      userId: customer.id,
      productId: createdProducts[0].id,
      rating: 5,
      comment: 'Exceptional craftsmanship. The shoulders and fabric weight are pure haute couture quality. Fast delivery from Atelier Noir.',
    },
  });

  console.log('✅ ZYORA Production PostgreSQL Database seeded successfully with real relational schemas!');
}

main()
  .catch((e) => {
    console.error('❌ PostgreSQL Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
