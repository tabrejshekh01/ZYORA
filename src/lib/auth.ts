import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  name: string;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY WARNING] JWT_SECRET is not set in environment variables! Using fallback is unsafe.');
    }
    return 'zyora-luxury-secret-key-2026';
  }
  return secret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export { verifyTokenEdge } from './auth-edge';

export function getUserFromCookies(): TokenPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get('zyora_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}


