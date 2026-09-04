'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalAmount } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-full sm:max-w-md bg-white border-l border-stone-200 z-50 flex flex-col shadow-2xl backdrop-blur-3xl"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-gold-600" />
                <h2 className="font-serif text-lg font-bold text-stone-900 tracking-wide">
                  Your Atelier Bag
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-gold-50 text-gold-700 border border-gold-200">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center text-stone-400 border border-stone-200">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-semibold text-stone-800">Your bag is empty</p>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs font-light">
                      Explore our haute couture & streetwear collections to elevate your wardrobe.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 text-xs font-bold text-gold-600 hover:underline uppercase tracking-widest"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-4 p-4 rounded-2xl bg-ivory-100 border border-stone-200/80 hover:border-gold-300 transition group"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-24 object-cover rounded-xl bg-stone-100 border border-stone-200"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-gold-600 transition">
                            {item.title}
                          </h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-400 hover:text-rose-600 transition ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-gold-700 mt-0.5">
                          {item.sellerStoreName}
                        </p>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-1">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <span>Color: {item.color}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2 bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-stone-500 hover:text-stone-900 px-1 text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-stone-900 px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-stone-500 hover:text-stone-900 px-1 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono text-xs font-bold text-stone-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-stone-100 bg-ivory-100/90 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-stone-800">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Express Insured Shipping</span>
                    <span className="text-gold-700 font-bold">Complimentary</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-200">
                    <span>Estimated Total</span>
                    <span className="font-mono text-gold-600 text-base">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest shadow-md transition duration-300"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </Link>

                <p className="text-[10px] text-center text-stone-500 flex items-center justify-center space-x-1 font-light">
                  <Sparkles className="w-3 h-3 text-gold-500" />
                  <span>Pan-India Insured Express Delivery & 14-day Returns</span>
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
