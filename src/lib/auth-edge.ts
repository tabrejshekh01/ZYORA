export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CRITICAL SECURITY RISK] JWT_SECRET is not set in production!');
    }
    return 'zyora-luxury-fashion-secure-jwt-secret-key-2024-default';
  }
  return secret;
}

/**
 * Edge-runtime and middleware compatible cryptographic JWT verifier
 * Uses standard Web Crypto API (crypto.subtle) without native Node dependencies.
 */
export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const secret = getJwtSecret();

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);

    // Decode base64url signature
    let b64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binarySignature = atob(b64);
    const sigBytes = new Uint8Array(binarySignature.length);
    for (let i = 0; i < binarySignature.length; i++) {
      sigBytes[i] = binarySignature.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!isValid) return null;

    let payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) payloadStr += '=';
    const payload = JSON.parse(atob(payloadStr)) as TokenPayload & { exp?: number };

    // Verify expiry timestamp
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

