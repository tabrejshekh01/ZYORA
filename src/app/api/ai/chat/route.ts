import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserFromCookies } from '@/lib/auth';
import { generateZyoraAiResponse } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

    // 1. Rate Limiting: 20 AI requests per minute per IP
    const rateLimit = await checkRateLimit(`ai_chat_ip_${ip}`, 20, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Your styling request limit has been reached. Please pause a moment before asking again.',
          reply: 'You have sent several inquiries in quick succession. Please allow me a moment to prepare further styling recommendations for you.',
          suggestions: ['✨ Browse current collection', '💎 View luxury accessories'],
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { message, history } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'A message prompt is required.' },
        { status: 400 }
      );
    }

    if (message.length > 800) {
      return NextResponse.json(
        { error: 'Prompt exceeds maximum allowed length of 800 characters.' },
        { status: 400 }
      );
    }

    // 2. Identify session user if logged in
    const userPayload = getUserFromCookies();
    const userId = userPayload?.userId || null;

    // 3. Generate response with real PostgreSQL catalog grounding & anti-hallucination guardrails
    const response = await generateZyoraAiResponse({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      userId,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('[ZYORA AI API] Error handling chat message:', error);
    return NextResponse.json(
      {
        success: false,
        reply: 'I apologize, but our concierge styling service is experiencing a brief pause. Please try again in a few moments or explore our catalog directly.',
        suggestions: ['✨ View new arrivals', '👔 Men’s bespoke collection', '👗 Haute couture gowns'],
      },
      { status: 500 }
    );
  }
}

