import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp/service';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

    // 1. IP Rate Limiting (Defense against brute-force attacks)
    const ipRateLimit = await checkRateLimit(`otp_verify_ip_${ip}`, 10, 60);
    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { identifier, otp, role } = body;

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: 'Both identifier (mobile/email) and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 2. Account Rate Limiting
    const targetRateLimit = await checkRateLimit(`otp_verify_target_${cleanIdentifier}`, 5, 60);
    if (!targetRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many attempts for this account. Please wait 1 minute before retrying.' },
        { status: 429 }
      );
    }

    const verificationResult = await verifyOTP(
      cleanIdentifier,
      cleanOtp,
      role === 'SELLER' ? 'SELLER' : 'CUSTOMER'
    );

    if (!verificationResult.success || !verificationResult.userId) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    // 3. Fetch Full User Profile
    const user = await prisma.user.findUnique({
      where: { id: verificationResult.userId },
      include: { store: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    // 4. Issue Signed JWT Session
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: verificationResult.isNewUser
        ? 'Welcome to ZYORA! Your account has been created.'
        : 'Sign in successful.',
      isNewUser: verificationResult.isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        store: user.store
          ? {
              id: user.store.id,
              name: user.store.name,
              slug: user.store.slug,
              status: user.store.status,
            }
          : undefined,
      },
    });

    // 5. Set Secure HTTP-Only Cookie
    response.cookies.set({
      name: 'zyora_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/otp/verify:', error?.message);
    return NextResponse.json(
      { error: 'Verification failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}

