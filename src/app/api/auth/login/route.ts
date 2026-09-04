import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Protection (Brute Force Defense by IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const ipRateLimit = await checkRateLimit(`login_ip_${ip}`, 10, 60);

    if (!ipRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // 2. Rate Limiting Protection by Account
    const accountRateLimit = await checkRateLimit(`login_account_${cleanEmail}`, 5, 60);
    if (!accountRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many failed attempts for this account. Please wait 1 minute before retrying.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { store: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'CUSTOMER' | 'SELLER' | 'ADMIN',
      name: user.name,
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      message: 'Login successful',
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

    response.cookies.set({
      name: 'zyora_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
