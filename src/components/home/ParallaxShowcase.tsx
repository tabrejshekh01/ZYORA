'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowUpRight, Crown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ParallaxShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yColumn1 = useTransform(scrollYProgress, [0, 1], [50, -80]);
  const yColumn2 = useTransform(scrollYProgress, [0, 1], [-70, 90]);
  const yColumn3 = useTransform(scrollYProgress, [0, 1], [80, -60]);

  return (
    <section
      ref={containerRef}
      className="relative py-28 bg-ivory-100 overflow-hidden border-b border-stone-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white border border-gold-200 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-gold-600" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-gold-700">
              Curated Masterpieces
            </span>
          </div>
          
          <h2 className="font-serif text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight">
            Sartorial Distinction In <span className="gold-gradient-text">Indian Luxury</span>
          </h2>
          
          <p className="text-sm sm:text-base text-stone-600 font-light leading-relaxed">
            ZYORA unites premier independent designer ateliers and luxury streetwear houses across India. Scroll to view our signature lookbook.
          </p>
        </div>

        {/* 3-Column Parallax Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Column 1 */}
          <motion.div style={{ y: yColumn1 }} className="space-y-8">
            <div className="group relative rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-xl transition duration-500 hover:border-gold-400">
              <div className="h-96 overflow-hidden relative bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop"
                  alt="Cashmere Trench Coat"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter contrast-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-6 relative z-10 -mt-16 backdrop-blur-xl bg-white/95 m-4 rounded-2xl border border-stone-200 shadow-lg">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-700">
                  Atelier Noir
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-1">
                  Vanguard Cashmere Trench
                </h3>
                <p className="text-xs text-stone-600 mt-2 line-clamp-2 font-light">
                  Floor-length cashmere blend with custom harness detailing.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-stone-900">₹48,500</span>
                  <Link
                    href="/products/vanguard-cashmere-longline-trench-coat"
                    className="p-2 rounded-full bg-ivory-200 text-stone-800 group-hover:bg-gold-500 group-hover:text-white transition"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-900">Verified Atelier Authenticity</h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Every garment listed on ZYORA undergoes rigorous quality verification by our master sartorial team in India.
              </p>
            </div>
          </motion.div>

          {/* Column 2 */}
          <motion.div style={{ y: yColumn2 }} className="space-y-8">
            <div className="group relative rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-xl transition duration-500 hover:border-gold-400">
              <div className="h-[440px] overflow-hidden relative bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
                  alt="Haute Couture Gown"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter contrast-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-6 relative z-10 -mt-16 backdrop-blur-xl bg-white/95 m-4 rounded-2xl border border-stone-200 shadow-lg">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-700">
                  Haute Couture
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-1">
                  Midnight Velvet Gown
                </h3>
                <p className="text-xs text-stone-600 mt-2 line-clamp-2 font-light">
                  Architectural silk velvet gown with dramatic train and corset boning.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-stone-900">₹28,500</span>
                  <Link
                    href="/products/midnight-velvet-asymmetrical-gown"
                    className="p-2 rounded-full bg-ivory-200 text-stone-800 group-hover:bg-gold-500 group-hover:text-white transition"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column 3 */}
          <motion.div style={{ y: yColumn3 }} className="space-y-8">
            <div className="group relative rounded-3xl overflow-hidden bg-white border border-stone-200/80 shadow-xl transition duration-500 hover:border-gold-400">
              <div className="h-96 overflow-hidden relative bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop"
                  alt="Streetwear Hoodie"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter contrast-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-6 relative z-10 -mt-16 backdrop-blur-xl bg-white/95 m-4 rounded-2xl border border-stone-200 shadow-lg">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-700">
                  Vogue Urban
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-1">
                  Cyber 500GSM Heavyweight Hoodie
                </h3>
                <p className="text-xs text-stone-600 mt-2 line-clamp-2 font-light">
                  Heavyweight French terry cotton with drop-shoulder boxy fit.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-stone-900">₹4,490</span>
                  <Link
                    href="/products/cyber-heavyweight-500gsm-boxy-hoodie"
                    className="p-2 rounded-full bg-ivory-200 text-stone-800 group-hover:bg-gold-500 group-hover:text-white transition"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-ivory-200/80 border border-stone-200 text-center space-y-3">
              <Sparkles className="w-6 h-6 text-gold-600 mx-auto" />
              <h4 className="font-serif text-lg font-bold text-stone-900">Direct Designer Stores</h4>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Connect directly with independent creators across Mumbai, Delhi, and Bangalore for limited luxury drops.
              </p>
              <Link
                href="/stores"
                className="inline-block text-xs font-bold text-gold-700 uppercase tracking-widest hover:underline pt-1"
              >
                Browse All Stores →
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
