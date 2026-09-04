import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/otp/service';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

    // 1. IP Rate Limiting (Defense against SMS bombing / OTP spam)
    const ipRateLimit = await checkRateLimit(`otp_send_ip_${ip}`, 5, 60);
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many OTP requests from your network. Please wait a minute before requesting again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string' || identifier.trim().length < 3) {
      return NextResponse.json(
        { error: 'Valid mobile number or email address is required.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 2. Identifier Rate Limiting (Defense against targeted spam)
    const targetRateLimit = await checkRateLimit(`otp_send_target_${cleanIdentifier}`, 3, 60);
    if (!targetRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests for this mobile/email. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const result = await sendOTP(cleanIdentifier);

    if (!result.success) {
      const status = result.cooldownSeconds ? 429 : 400;
      return NextResponse.json(
        { error: result.message, cooldownSeconds: result.cooldownSeconds },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      devCode: result.devCode, // Only populated in non-production mock mode
    });
  } catch (error: any) {
    console.error('Error in /api/auth/otp/send:', error?.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending verification code.' },
      { status: 500 }
    );
  }
}

