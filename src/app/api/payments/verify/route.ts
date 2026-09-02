import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required Razorpay verification payload fields' }, { status: 400 });
    }

    // 1. Verify Razorpay HMAC SHA256 Signature Server-Side
    const isValidSignature = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      console.warn(`[SECURITY ALERT] Invalid Razorpay signature for order ${orderId}`);

      // Mark order payment status as FAILED in PostgreSQL safely without throwing if orderId is unrecognized
      await prisma.order.updateMany({
        where: {
          OR: [{ id: orderId }, { razorpayOrderId: razorpay_order_id }],
        },
        data: { paymentStatus: 'FAILED' },
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay payment signature. Payment verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch ZYORA Order from PostgreSQL
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { razorpayOrderId: razorpay_order_id }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found in PostgreSQL' }, { status: 404 });
    }

    // 3. Idempotency check: If order is already PAID, return success without duplicate stock deduction
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Order has already been verified and paid.',
        order,
      });
    }

    // 4. Atomic PostgreSQL Transaction: Verify stock, decrement stock, mark order PAID, record payment, and clear cart
    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        // 4a. Verify stock availability and safely decrement stock
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, title: true },
          });

          if (!product || product.stock < item.quantity) {
            console.warn(`[STOCK WARNING] Low/insufficient stock for garment "${product?.title || item.productId}" during payment verification.`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // 4b. Mark Order as PAID & status PROCESSING
        const completedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          },
          include: {
            items: {
              include: {
                product: true,
                sellerStore: true,
              },
            },
          },
        });

        // 4c. Record Payment Audit Entry
        await tx.payment.upsert({
          where: { razorpayPaymentId: razorpay_payment_id },
          create: {
            orderId: order.id,
            gateway: 'RAZORPAY',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: order.totalAmount,
            currency: 'INR',
            status: 'PAID',
          },
          update: {
            status: 'PAID',
          },
        });

        // 4d. Clear Customer Cart
        await tx.cart.update({
          where: { userId: order.userId },
          data: {
            items: {
              deleteMany: {},
            },
          },
        }).catch(() => {});

        return completedOrder;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Razorpay payment verified and order confirmed successfully.',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment in PostgreSQL:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
