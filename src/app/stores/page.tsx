'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SellerShowcase from '@/components/home/SellerShowcase';
import Link from 'next/link';
import { Store, ArrowRight, Sparkles } from 'lucide-react';

export default function AllStoresPage() {
  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-ivory-200 via-ivory-100 to-ivory-100 border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-gold-200 text-gold-700 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
              Multi-Vendor Guild
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight">
            Verified Designer Stores
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl mt-3 font-light">
            Connect directly with luxury ateliers, independent streetwear creators, and master tailors across India.
          </p>
        </div>
      </div>

      <SellerShowcase />

      {/* Become a Seller CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="p-12 rounded-3xl bg-white border border-stone-200 text-center space-y-6 relative overflow-hidden shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 mx-auto">
            <Store className="w-6 h-6" />
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight">
            Are You a Designer or Fashion Brand in India?
          </h2>

          <p className="text-sm text-stone-600 max-w-xl mx-auto font-light leading-relaxed">
            Join the ZYORA seller marketplace. Showcase your garments to high-intent luxury collectors with zero setup friction.
          </p>

          <Link
            href="/register?role=SELLER"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest shadow-md transition duration-300"
          >
            <span>Apply For Seller Account</span>
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </Link>
        </div>
      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
