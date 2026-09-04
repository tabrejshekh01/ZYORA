import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Protection (Bot registration defense)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const rateLimit = await checkRateLimit(`register_${ip}`, 5, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, storeName, storeBio, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'SELLER' ? 'SELLER' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: userRole,
        phone: phone ? String(phone).trim() : null,
      },
    });

    // If role is SELLER, automatically create Store in PostgreSQL
    if (userRole === 'SELLER') {
      const sName = storeName ? String(storeName).trim() : `${cleanName}'s Atelier`;
      const sSlug = slugify(sName) + '-' + Math.floor(Math.random() * 10000);

      await prisma.store.create({
        data: {
          userId: user.id,
          name: sName,
          slug: sSlug,
          bio: storeBio || 'Independent luxury fashion atelier on ZYORA.',
          logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
          banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
          status: 'APPROVED',
        },
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Registered successfully in PostgreSQL database',
    });

    response.cookies.set('zyora_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error during registration in PostgreSQL:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
