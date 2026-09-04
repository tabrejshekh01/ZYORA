import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isRazorpayConfigured, getRazorpayClient, getCleanRazorpayKeyId } from '@/lib/razorpay';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let currentStep = 'AUTHENTICATION';

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const ipRateLimit = await checkRateLimit(`create_order_ip_${ip}`, 10, 60);
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many checkout requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    // Step 1: Authentication check
    currentStep = 'AUTHENTICATION';
    const userPayload = getUserFromCookies();
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to checkout.', step: currentStep },
        { status: 401 }
      );
    }

    const userRateLimit = await checkRateLimit(`create_order_user_${userPayload.userId}`, 5, 60);
    if (!userRateLimit.success) {
      return NextResponse.json(
        { error: 'Order limit reached. Please wait 1 minute before creating another order.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { shippingAddress, addressId, items: clientItems } = body;

    // Step 2: Resolve cart items (client payload CartContext OR fallback to database cart)
    currentStep = 'CART_RESOLVE';
    let itemsToProcess: Array<{
      productId: string;
      quantity: number;
      size?: string | null;
      color?: string | null;
    }> = [];

    if (Array.isArray(clientItems) && clientItems.length > 0) {
      itemsToProcess = clientItems.map((i: any) => ({
        productId: i.productId || i.id,
        quantity: Math.max(1, parseInt(i.quantity) || 1),
        size: i.size || null,
        color: i.color || null,
      }));
    } else {
      const dbCart = await prisma.cart.findUnique({
        where: { userId: userPayload.userId },
        include: { items: true },
      });

      if (dbCart && dbCart.items.length > 0) {
        itemsToProcess = dbCart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        }));
      }
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Please add items to your shopping bag before checking out.', step: currentStep },
        { status: 400 }
      );
    }

    // Step 3: Server-side Product, Store, and Inventory Validation
    currentStep = 'PRODUCT_VALIDATION';
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      sellerStoreId: string;
      price: number;
      quantity: number;
      size: string | null;
      color: string | null;
    }> = [];

    const sellerGrossMap: Record<string, number> = {};
    const sellerAccountMap: Record<string, string | null> = {};

    for (const item of itemsToProcess) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { store: true },
      });

      if (!dbProduct) {
        return NextResponse.json(
          { error: `Garment product with ID "${item.productId}" was not found in catalog.`, step: currentStep },
          { status: 400 }
        );
      }

      if (dbProduct.status !== 'APPROVED') {
        return NextResponse.json(
          { error: `Garment "${dbProduct.title}" is currently pending approval by Admin and cannot be purchased yet.`, step: currentStep },
          { status: 400 }
        );
      }

      if (dbProduct.store.status !== 'APPROVED') {
        return NextResponse.json(
          { error: `Seller store "${dbProduct.store.name}" is currently pending approval or suspended.`, step: currentStep },
          { status: 400 }
        );
      }

      if (dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${dbProduct.title}". Requested: ${item.quantity}, Available: ${dbProduct.stock}.`, step: currentStep },
          { status: 400 }
        );
      }

      // Server-side price calculation (never trust client-supplied prices)
      const unitPrice = dbProduct.discountPrice && dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      const storeId = dbProduct.storeId;
      sellerGrossMap[storeId] = (sellerGrossMap[storeId] || 0) + itemSubtotal;
      sellerAccountMap[storeId] = dbProduct.store.razorpayAccountId || null;

      validatedItems.push({
        productId: dbProduct.id,
        sellerStoreId: storeId,
        price: unitPrice,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
      });
    }

    // Step 4: Fixed ZYORA Platform Commission Calculation
    // Exactly ₹4.00 per successful customer order (NOT per product, NOT percentage based)
    currentStep = 'FINANCIAL_CALCULATION';
    const ZYORA_PLATFORM_COMMISSION = 4.0;
    const orderTotal = subtotal;
    const amountPaise = Math.round(orderTotal * 100);
    const orderNumber = `ZYORA-${Date.now()}`;

    // Step 5: Check Razorpay Configuration
    currentStep = 'RAZORPAY_CONFIG_CHECK';
    if (!isRazorpayConfigured()) {
      // Return configuration advisory without creating any database records
      return NextResponse.json({
        orderNumber,
        amount: orderTotal,
        amountPaise,
        currency: 'INR',
        isConfigured: false,
        message: 'Razorpay TEST credentials not configured in environment (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET required).',
      });
    }

    // Step 6: Create Razorpay Order with Gateway FIRST
    // This prevents leaving orphaned DB orders or incorrect seller settlements if Razorpay order creation fails
    currentStep = 'RAZORPAY_ORDER_CREATION';
    const razorpay = getRazorpayClient()!;
    let razorpayOrder: any;

    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderNumber.slice(0, 36),
        notes: {
          orderNumber,
          userId: userPayload.userId,
        },
      });
    } catch (rzpErr: any) {
      console.error('Razorpay SDK Order Creation Exception:', rzpErr);
      const rzpErrMsg = rzpErr?.error?.description || rzpErr?.message || 'Razorpay API authentication or credential verification failed.';

      return NextResponse.json(
        {
          error: `Razorpay API Error: ${rzpErrMsg}. Please double-check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.`,
          step: currentStep,
          isConfigured: true,
          keyId: getCleanRazorpayKeyId(),
        },
        { status: 400 }
      );
    }

    // Step 7: Atomically create Order, OrderItems, and SellerSettlement in PostgreSQL
    // ONLY executed after Razorpay order creation succeeds
    currentStep = 'DATABASE_ORDER_CREATION';
    const dbResult = await prisma.$transaction(
      async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: userPayload.userId,
            addressId: addressId || null,
            shippingAddress: shippingAddress || 'Standard Luxury Shipping Address, India',
            totalAmount: orderTotal,
            discountAmount: 0,
            paymentMethod: 'RAZORPAY',
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING',
            zyoraCommission: ZYORA_PLATFORM_COMMISSION,
            sellerGrossTotal: subtotal,
            razorpayOrderId: razorpayOrder.id,
            items: {
              create: validatedItems.map((item) => ({
                productId: item.productId,
                sellerStoreId: item.sellerStoreId,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                status: 'PROCESSING',
              })),
            },
          },
        });

        // Allocate proportional share of ₹4 commission to each seller store in order
        for (const [sellerStoreId, grossAmount] of Object.entries(sellerGrossMap)) {
          const commissionShare = parseFloat((ZYORA_PLATFORM_COMMISSION * (grossAmount / subtotal)).toFixed(2));
          const netPayable = grossAmount - commissionShare;

          await tx.sellerSettlement.create({
            data: {
              orderId: newOrder.id,
              sellerStoreId,
              grossAmount,
              zyoraCommission: commissionShare,
              razorpayFee: 0,
              sellerNetAmount: netPayable,
              currency: 'INR',
              settlementStatus: 'PENDING',
              razorpayLinkedAccountId: sellerAccountMap[sellerStoreId] || null,
            },
          });
        }

        return newOrder;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json({
      orderId: dbResult.id,
      orderNumber: dbResult.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: orderTotal,
      amountPaise,
      currency: 'INR',
      keyId: getCleanRazorpayKeyId(),
      isConfigured: true,
    });
  } catch (error: any) {
    console.error(`[PAYMENT ERROR] Error in /api/payments/create-order at step [${currentStep}]:`, error?.message);
    const isProd = process.env.NODE_ENV === 'production';

    return NextResponse.json(
      {
        error: isProd
          ? 'Unable to initiate order at this time. Please try again later.'
          : `Server Error during ${currentStep}: ${error?.message || 'Unknown error'}`,
        step: isProd ? undefined : currentStep,
      },
      { status: 500 }
    );
  }
}
