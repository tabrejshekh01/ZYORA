import { prisma } from './prisma';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory fast cache for quick micro-burst rejection without database queries
const memoryCache = new Map<string, RateLimitRecord>();

// Clean up stale in-memory cache entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryCache.entries()) {
      if (now > record.resetTime) {
        memoryCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Serverless-compatible rate limiter.
 * Uses PostgreSQL database persistence so rate limits are respected across all serverless/Vercel lambda instances,
 * with an in-memory fast cache for immediate rejection.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const expiresAtDate = new Date(now + windowMs);

  // 1. Check in-memory fast-cache first (if limit already exceeded, reject immediately)
  const cached = memoryCache.get(identifier);
  if (cached && now < cached.resetTime && cached.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: cached.resetTime,
    };
  }

  // 2. Persistent storage in PostgreSQL
  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { key: identifier },
    });

    if (!existing || now > existing.expiresAt.getTime()) {
      // First hit or window expired: create or reset window
      await prisma.rateLimit.upsert({
        where: { key: identifier },
        create: {
          key: identifier,
          count: 1,
          expiresAt: expiresAtDate,
        },
        update: {
          count: 1,
          expiresAt: expiresAtDate,
        },
      });

      memoryCache.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }

    // Key exists and is within window
    if (existing.count >= maxRequests) {
      memoryCache.set(identifier, {
        count: existing.count,
        resetTime: existing.expiresAt.getTime(),
      });

      return {
        success: false,
        remaining: 0,
        resetTime: existing.expiresAt.getTime(),
      };
    }

    // Increment count atomically
    const updated = await prisma.rateLimit.update({
      where: { key: identifier },
      data: {
        count: {
          increment: 1,
        },
      },
    });

    memoryCache.set(identifier, {
      count: updated.count,
      resetTime: existing.expiresAt.getTime(),
    });

    return {
      success: true,
      remaining: Math.max(0, maxRequests - updated.count),
      resetTime: existing.expiresAt.getTime(),
    };
  } catch (dbError) {
    // Graceful fallback to memory cache if DB is temporarily unreachable
    console.warn('[RATE-LIMIT] Fallback to in-memory limiter due to DB connectivity issue:', (dbError as any)?.message);

    if (!cached || now > cached.resetTime) {
      memoryCache.set(identifier, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }

    if (cached.count >= maxRequests) {
      return { success: false, remaining: 0, resetTime: cached.resetTime };
    }

    cached.count += 1;
    return { success: true, remaining: maxRequests - cached.count, resetTime: cached.resetTime };
  }
}


