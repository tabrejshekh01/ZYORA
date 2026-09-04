'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  Package,
  Check,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CatalogProductResult, UserOrderResult } from '@/lib/ai/tools';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: CatalogProductResult[];
  orders?: UserOrderResult[];
  timestamp: string;
}

const INITIAL_SUGGESTIONS = [
  '✨ Evening gowns under ₹5,000',
  '👔 Men’s bespoke suits & blazers',
  '📦 Track my order status',
  '💎 Luxury designer jewellery',
];

export default function ZyoraAiAssistant() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});

  const { addToCart, setIsCartOpen } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize welcome message
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content:
          'Bonjour. I am Zyora AI, your personal haute couture stylist and luxury concierge. Tell me what silhouettes, occasions, or palettes you desire today, or ask me to check your recent orders.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  if (!mounted) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Here are our verified designer recommendations for you.',
        products: data.products,
        orders: data.orders,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching AI response:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, our styling atelier connection encountered a brief delay. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Our styling atelier is refreshed. How may I assist your style journey today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setSuggestions(INITIAL_SUGGESTIONS);
  };

  const handleQuickAdd = (product: CatalogProductResult) => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      size: product.sizes[0] || 'Free Size',
      color: product.colors[0] || 'Original',
      quantity: 1,
      sellerStoreId: product.storeId,
      sellerStoreName: product.storeName,
    });

    setAddedProductIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedProductIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);

    setIsCartOpen(true);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Zyora AI Stylist"
            className="group relative flex items-center gap-3 bg-gradient-to-r from-onyx-950 via-onyx-900 to-onyx-950 border border-gold-500/40 text-gold-400 px-4 py-3 rounded-full shadow-2xl hover:border-gold-400 hover:shadow-gold-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
            </span>
            <Sparkles className="w-5 h-5 text-gold-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-serif text-sm tracking-wider font-semibold text-ivory-100 hidden sm:inline">
              Zyora AI Stylist
            </span>
          </button>
        )}
      </div>

      {/* Luxury Chat Window Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Zyora AI Concierge"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] sm:h-[620px] max-h-[88vh] bg-onyx-950/98 border border-gold-500/40 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-2xl animate-slide-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-onyx-900 via-onyx-950 to-onyx-900 border-b border-gold-500/20 text-ivory-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-onyx-950 font-serif font-bold text-xs shadow-md">
                Z
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-semibold text-sm tracking-wide text-ivory-100">
                    ZYORA Concierge
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </div>
                <p className="text-[11px] text-gold-400/80 font-sans tracking-tight">
                  Haute Couture & Personal Stylist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 text-onyx-500 hover:text-gold-400 hover:bg-onyx-800/60 rounded-lg transition-colors"
                aria-label="Reset chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close concierge"
                className="p-1.5 text-onyx-500 hover:text-ivory-100 hover:bg-onyx-800/60 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm scrollbar-thin scrollbar-thumb-onyx-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-onyx-950 font-medium rounded-tr-none'
                      : 'bg-onyx-900/90 text-ivory-200 border border-gold-500/20 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-onyx-500 px-1 mt-1">
                  {msg.timestamp}
                </span>

                {/* Embedded Real Order Cards */}
                {msg.orders && msg.orders.length > 0 && (
                  <div className="w-full mt-3 space-y-2.5">
                    {msg.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-onyx-900/90 border border-gold-500/30 rounded-xl p-3 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-onyx-800 pb-2">
                          <div className="flex items-center gap-1.5 font-medium text-ivory-100">
                            <Package className="w-3.5 h-3.5 text-gold-400" />
                            <span>Order #{ord.orderNumber}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              ord.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : ord.orderStatus === 'SHIPPED'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-gold-500/20 text-gold-400'
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>

                        <div className="flex justify-between text-onyx-500 text-[11px]">
                          <span>Placed: {ord.createdAt}</span>
                          <span className="text-gold-400 font-semibold">
                            Total: ₹{ord.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {ord.items && ord.items.length > 0 && (
                          <div className="text-ivory-300 text-[11px] truncate">
                            Items: {ord.items.map((it) => `${it.title} (${it.quantity}x)`).join(', ')}
                          </div>
                        )}

                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/orders/${ord.id}`}
                            className="text-gold-400 hover:text-gold-300 font-medium inline-flex items-center gap-1 text-[11px]"
                          >
                            View Order Details
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Embedded Real Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {msg.products.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-onyx-900/95 border border-gold-500/25 rounded-xl overflow-hidden hover:border-gold-400/50 transition-all flex flex-col"
                      >
                        <div className="relative w-full h-32 bg-onyx-800">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400';
                            }}
                          />
                          <span className="absolute top-2 left-2 bg-onyx-950/80 backdrop-blur-sm text-gold-400 text-[10px] px-2 py-0.5 rounded-full border border-gold-500/30">
                            {prod.category}
                          </span>
                        </div>

                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h4 className="font-serif text-xs font-semibold text-ivory-100 line-clamp-1">
                              {prod.title}
                            </h4>
                            <p className="text-[10px] text-onyx-500">
                              By {prod.storeName}
                            </p>
                          </div>

                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-gold-400 font-mono">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </span>
                            {prod.discountPrice && (
                              <span className="text-[10px] text-onyx-500 line-through">
                                ₹{prod.discountPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <Link
                              href={`/product/${prod.id}`}
                              className="text-center bg-onyx-800 hover:bg-onyx-700 text-ivory-200 py-1.5 px-2 rounded text-[11px] font-medium transition-colors"
                            >
                              Details
                            </Link>
                            <button
                              onClick={() => handleQuickAdd(prod)}
                              disabled={!prod.inStock}
                              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                                addedProductIds[prod.id]
                                  ? 'bg-emerald-600 text-white'
                                  : prod.inStock
                                  ? 'bg-gold-500 hover:bg-gold-400 text-onyx-950 font-semibold'
                                  : 'bg-onyx-800 text-onyx-500 cursor-not-allowed'
                              }`}
                            >
                              {addedProductIds[prod.id] ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Added</span>
                                </>
                              ) : prod.inStock ? (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Add</span>
                                </>
                              ) : (
                                'Sold Out'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading Animation */}
            {isLoading && (
              <div className="flex items-start gap-2 text-ivory-200">
                <div className="bg-onyx-900 border border-gold-500/20 px-3.5 py-2 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                  <span className="text-xs text-gold-400/80 font-serif ml-1.5">
                    Styling Atelier consulting...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-onyx-900/60 border-t border-onyx-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                disabled={isLoading}
                className="whitespace-nowrap text-[11px] bg-onyx-800/90 hover:bg-gold-500/20 text-ivory-300 hover:text-gold-300 border border-onyx-700/60 hover:border-gold-500/40 px-2.5 py-1 rounded-full transition-all flex-shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-onyx-950 border-t border-gold-500/20 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about couture, sizing, styling, or orders..."
              maxLength={800}
              disabled={isLoading}
              className="flex-1 bg-onyx-900 border border-onyx-700/80 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-ivory-100 placeholder-onyx-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="bg-gold-500 hover:bg-gold-400 disabled:bg-onyx-800 disabled:text-onyx-600 text-onyx-950 p-2 rounded-xl transition-all shadow-md font-semibold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Subtext */}
          <div className="px-3 py-1 bg-onyx-950 border-t border-onyx-900 flex items-center justify-between text-[9px] text-onyx-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-gold-400" />
              Verified live catalog data • Anti-hallucination enabled
            </span>
            <span className="font-serif">ZYORA Haute Couture</span>
          </div>
        </div>
      )}
    </>
  );
}

