import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('zyora_token')?.value;

  const isAdminRoute = pathname.startsWith('/admin');
  const isSellerRoute = pathname.startsWith('/seller');
  const isCustomerProtectedRoute =
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/checkout');

  // If on a protected route, cryptographically verify token
  if (isAdminRoute || isSellerRoute || isCustomerProtectedRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
      // Invalid or expired token: clear cookie and redirect
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('zyora_token');
      return response;
    }

    // Role-based Access Enforcement
    if (isAdminRoute && payload.role !== 'ADMIN') {
      // Unauthorized customer/seller trying to access admin
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isSellerRoute && payload.role !== 'SELLER' && payload.role !== 'ADMIN') {
      // Customer trying to access seller dashboard
      return NextResponse.redirect(new URL('/register?role=SELLER', request.url));
    }
  }

  const response = NextResponse.next();

  // Basic security headers at middleware level
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/checkout/:path*',
  ],
};

