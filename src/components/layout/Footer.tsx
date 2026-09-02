'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ivory-200 text-stone-600 border-t border-stone-200 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-16 border-b border-stone-200">
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="p-3 rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Pan-India Express</h4>
              <p className="text-[11px] text-stone-500 font-light">Insured luxury courier delivery</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="p-3 rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">100% Authentic</h4>
              <p className="text-[11px] text-stone-500 font-light">Verified atelier garments</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="p-3 rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Bespoke Fitting</h4>
              <p className="text-[11px] text-stone-500 font-light">14-day hassle free returns</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="p-3 rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Encrypted Checkout</h4>
              <p className="text-[11px] text-stone-500 font-light">Razorpay / UPI 256-bit SSL</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-16">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
                Z
              </div>
              <span className="font-serif text-2xl font-bold tracking-[0.2em] text-stone-900">ZYORA</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm font-light">
              The premier dark & light luxury fashion marketplace connecting avant-garde Indian designers, haute couture houses, and global fashion connoisseurs.
            </p>
            <div className="pt-2">
              <Link
                href="/register?role=SELLER"
                className="inline-flex items-center space-x-2 text-xs font-bold text-gold-700 hover:text-gold-800 uppercase tracking-widest transition"
              >
                <span>Become a ZYORA Seller Store</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">Collections</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/products?category=haute-couture" className="hover:text-gold-700 transition">Haute Couture</Link></li>
              <li><Link href="/products?category=modern-streetwear" className="hover:text-gold-700 transition">Modern Streetwear</Link></li>
              <li><Link href="/products?category=tailored-outerwear" className="hover:text-gold-700 transition">Tailored Outerwear</Link></li>
              <li><Link href="/products?category=evening-wear" className="hover:text-gold-700 transition">Evening Wear</Link></li>
              <li><Link href="/products?category=luxury-accessories" className="hover:text-gold-700 transition">Luxury Accessories</Link></li>
            </ul>
          </div>

          {/* Vendors */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">Designers</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/stores/atelier-noir" className="hover:text-gold-700 transition">Atelier Noir</Link></li>
              <li><Link href="/stores/vogue-urban" className="hover:text-gold-700 transition">Vogue Urban</Link></li>
              <li><Link href="/stores" className="hover:text-gold-700 transition">All Stores</Link></li>
              <li><Link href="/register?role=SELLER" className="hover:text-gold-700 transition">Seller Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">Private Circle</h4>
            <p className="text-xs text-stone-600 font-light">
              Subscribe to receive private runway invitations & limited drops in India.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-white border border-stone-200 text-xs text-stone-900 placeholder-stone-400 px-4 py-2.5 rounded-xl focus:outline-none focus:border-gold-500 shadow-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm"
              >
                Join Private List
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 space-y-4 sm:space-y-0">
          <p>© 2026 ZYORA India. All Rights Reserved. High Couture Marketplace.</p>
          <div className="flex space-x-6 font-medium">
            <Link href="#" className="hover:text-stone-900 transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-stone-900 transition">Terms of Atelier</Link>
            <Link href="#" className="hover:text-stone-900 transition">Cookie Settings</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
