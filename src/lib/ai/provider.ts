import { ZYORA_AI_SYSTEM_PROMPT, FAQ_POLICIES } from './prompts';
import {
  searchCatalog,
  getUserOrders,
  getFaqInfo,
  CatalogProductResult,
  UserOrderResult,
} from './tools';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  products?: CatalogProductResult[];
  orders?: UserOrderResult[];
  suggestions: string[];
}

// Helper to extract maximum price filter from text like "under 5000", "below ₹3,000", "under 15000"
function extractMaxPrice(text: string): number | undefined {
  const match = text.match(/(?:under|below|less than|within|max)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (match && match[1]) {
    const num = parseInt(match[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return undefined;
}

// Helper to extract gender preference
function extractGender(text: string): 'MEN' | 'WOMEN' | undefined {
  const lower = text.toLowerCase();
  if (/\b(men|man|gentleman|gentlemen|male|groom|him)\b/.test(lower) && !/\bwomen\b/.test(lower)) {
    return 'MEN';
  }
  if (/\b(women|woman|lady|ladies|female|bride|her)\b/.test(lower)) {
    return 'WOMEN';
  }
  return undefined;
}

// Helper to clean search keywords
function extractSearchQuery(text: string): string {
  return text
    .replace(/(?:show me|find me|do you have|can you show|i want|looking for|under|below|less than|recommend|suggest|please|price|cost|inr|₹|[0-9,]+)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates an AI Stylist & Concierge response.
 * Uses Google Gemini API if GEMINI_API_KEY / AI_API_KEY is configured,
 * with a high-fidelity built-in concierge engine as an immediate, infallible fallback.
 */
export async function generateZyoraAiResponse({
  message,
  history = [],
  userId,
}: {
  message: string;
  history?: ChatMessage[];
  userId?: string | null;
}): Promise<AiChatResponse> {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Determine Intent
  const isOrderQuery = /\b(order|track|tracking|status|shipment|delivery|where is my|shipped)\b/i.test(lower);
  const isPolicyQuery = /\b(return|exchange|refund|ship|shipping|delivery time|authentic|original|payment|upi|card|contact|support|policy)\b/i.test(lower);

  let products: CatalogProductResult[] | undefined = undefined;
  let orders: UserOrderResult[] | undefined = undefined;
  let policyText: string | undefined = undefined;

  // 2. Query Live Database / Tool Data
  if (isOrderQuery) {
    if (userId) {
      orders = await getUserOrders(userId);
    }
  } else if (isPolicyQuery && !lower.includes('dress') && !lower.includes('suit') && !lower.includes('jacket') && !lower.includes('buy')) {
    policyText = getFaqInfo(lower);
  } else {
    // Product Search / Styling
    const maxPrice = extractMaxPrice(trimmed);
    const gender = extractGender(trimmed);
    const cleanedQuery = extractSearchQuery(trimmed);

    products = await searchCatalog({
      query: cleanedQuery.length >= 2 ? cleanedQuery : undefined,
      gender,
      maxPrice,
      limit: 4,
    });

    // If query yielded 0 results, fall back to featured/trending items
    if (products.length === 0) {
      products = await searchCatalog({ limit: 4 });
    }
  }

  // 3. Attempt Gemini API Call if Key is Configured
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (geminiApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      // Construct rich context for the LLM
      let contextSnippet = '';
      if (orders !== undefined) {
        if (userId) {
          contextSnippet = `USER ORDERS FOUND (${orders.length}):\n${JSON.stringify(orders, null, 2)}`;
        } else {
          contextSnippet = 'USER IS NOT LOGGED IN. Tell them to sign in to their ZYORA account to track their orders.';
        }
      } else if (policyText) {
        contextSnippet = `OFFICIAL PLATFORM POLICY:\n${policyText}`;
      } else if (products && products.length > 0) {
        contextSnippet = `VERIFIED ZYORA CATALOG PRODUCTS FOUND (${products.length}):\n${JSON.stringify(
          products.map((p) => ({
            id: p.id,
            title: p.title,
            price: `₹${p.price.toLocaleString('en-IN')}`,
            discountPrice: p.discountPrice ? `₹${p.discountPrice.toLocaleString('en-IN')}` : null,
            category: p.category,
            store: p.storeName,
            inStock: p.inStock,
            sizes: p.sizes,
          })),
          null,
          2
        )}`;
      }

      const promptWithContext = `User message: "${trimmed}"\n\nVerified Database Context:\n${contextSnippet}\n\nInstructions: Deliver an elegant, concise haute couture response. Recommend or address the context directly. Keep response under 3 sentences. Do not mention that you received a database context.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: ZYORA_AI_SYSTEM_PROMPT }],
            },
            contents: [
              ...history.slice(-4).map((h) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
              })),
              {
                role: 'user',
                parts: [{ text: promptWithContext }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 300,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText && generatedText.trim().length > 0) {
          return {
            reply: generatedText.trim(),
            products,
            orders,
            suggestions: generateSuggestions(lower, isOrderQuery, products),
          };
        }
      }
    } catch (llmError) {
      console.warn('[ZYORA AI] Gemini API call skipped or timed out, using luxury concierge engine:', (llmError as any)?.message);
    }
  }

  // 4. Built-in Luxury Concierge Engine (Zero-failure fallback)
  let reply = '';

  if (isOrderQuery) {
    if (!userId) {
      reply = 'To view your bespoke orders and live courier tracking, please sign in to your ZYORA account. You can track all current and past shipments under your profile.';
    } else if (!orders || orders.length === 0) {
      reply = 'I reviewed your account records, and you do not have any active couture orders at this moment. Would you like to explore our newly unveiled designer collections?';
    } else {
      const latest = orders[0];
      reply = `You have ${orders.length} order${orders.length > 1 ? 's' : ''} on record. Your latest order #${latest.orderNumber} is currently ${latest.orderStatus} with payment status ${latest.paymentStatus}. Total: ₹${latest.totalAmount.toLocaleString('en-IN')}.`;
    }
  } else if (policyText) {
    reply = `${policyText} If you need any special concierge accommodations, please let me know.`;
  } else if (products && products.length > 0) {
    const titles = products.slice(0, 2).map((p) => `"${p.title}" (₹${p.price.toLocaleString('en-IN')})`).join(' and ');
    reply = `Here are select haute couture creations tailored to your taste, including ${titles}. Each piece is crafted to impeccable designer standards.`;
  } else {
    reply = 'Welcome to ZYORA Concierge. How may I assist your style journey today? I can assist you with curated garment recommendations, bespoke sizing, fabric inquiries, or order tracking.';
  }

  return {
    reply,
    products,
    orders,
    suggestions: generateSuggestions(lower, isOrderQuery, products),
  };
}

function generateSuggestions(
  query: string,
  isOrderQuery: boolean,
  products?: CatalogProductResult[]
): string[] {
  if (isOrderQuery) {
    return [
      '✨ View trending evening wear',
      '💎 Luxury designer accessories',
      '📦 How fast is express delivery?',
      '🔄 What is the return policy?',
    ];
  }

  if (products && products.length > 0) {
    return [
      '✨ Show pieces under ₹5,000',
      '👔 Men’s bespoke suits & blazers',
      '👗 Haute couture evening gowns',
      '📦 Track my active order',
    ];
  }

  return [
    '✨ Evening gowns under ₹5,000',
    '👔 Men’s bespoke tailoring',
    '💎 Handcrafted luxury jewellery',
    '📦 Track my order status',
  ];
}

