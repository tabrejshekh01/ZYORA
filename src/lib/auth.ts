import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'zyora-luxury-secret-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getUserFromCookies(): TokenPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get('zyora_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

