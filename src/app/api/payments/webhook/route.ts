import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 1. Verify Webhook Signature
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid Razorpay webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const eventId = payload.event_id || `${payload.payload?.payment?.entity?.id}_${eventType}`;

    // 2. Idempotency Check (Duplicate Event Protection)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, note: 'Duplicate webhook event already processed.' });
    }

    // Save Webhook Event in PostgreSQL
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType,
      },
    });

    // 3. Process Webhook Event Types
    if (eventType === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [{ razorpayOrderId }, { id: paymentEntity?.notes?.orderId }],
          },
          include: { items: true },
        });

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.$transaction(async (tx) => {
            // Safely decrement stock for each garment
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              }).catch(() => {});
            }

            // Mark order as PAID
            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                orderStatus: 'PROCESSING',
                razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
              },
            });

            // Upsert Payment Record
            await tx.payment.upsert({
              where: { razorpayPaymentId: razorpayPaymentId || `pay_${order.id}` },
              create: {
                orderId: order.id,
                gateway: 'RAZORPAY',
                transactionId: razorpayPaymentId,
                razorpayOrderId,
                razorpayPaymentId,
                amount: order.totalAmount,
                currency: 'INR',
                status: 'PAID',
              },
              update: { status: 'PAID' },
            });

            // Clear Cart
            await tx.cart.update({
              where: { userId: order.userId },
              data: { items: { deleteMany: {} } },
            }).catch(() => {});
          });
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;

      if (razorpayOrderId) {
        await prisma.order.updateMany({
          where: { razorpayOrderId },
          data: { paymentStatus: 'FAILED' },
        });
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('Error processing Razorpay webhook in PostgreSQL:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
