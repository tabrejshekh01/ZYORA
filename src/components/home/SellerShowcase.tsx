'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Star, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const STORES = [
  {
    name: 'Atelier Noir',
    slug: 'atelier-noir',
    logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
    location: 'Bandra West, Mumbai',
    bio: 'Architectural silhouettes, raw silk gowns & bespoke avant-garde tailoring.',
    rating: '4.95',
    productsCount: '24 Designs',
  },
  {
    name: 'Vogue Urban',
    slug: 'vogue-urban',
    logo: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop',
    location: 'Mehrauli, New Delhi',
    bio: 'High-end streetwear fusing heavy oversized cuts with techwear aesthetics.',
    rating: '4.88',
    productsCount: '38 Designs',
  },
];

export default function SellerShowcase() {
  return (
    <section className="py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-ivory-200 border border-gold-200">
            <Store className="w-3.5 h-3.5 text-gold-700" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-gold-700">
              Multi-Vendor Ecosystem
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight">
            Featured Designer Stores
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-light">
            Explore direct storefronts from verified Indian fashion houses and couture creators.
          </p>
        </div>

        {/* Store Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {STORES.map((store, index) => (
            <motion.div
              key={store.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="group relative rounded-3xl overflow-hidden bg-ivory-100 border border-stone-200 shadow-md backdrop-blur-xl hover:border-gold-400 hover:shadow-xl transition duration-500">
                {/* Store Banner Image */}
                <div className="h-48 overflow-hidden relative bg-stone-100">
                  <img
                    src={store.banner}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[0.9]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                </div>

                {/* Store Content */}
                <div className="p-6 relative z-10 -mt-12 flex flex-col justify-between">
                  <div className="flex items-end justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="w-16 h-16 rounded-2xl border-2 border-white object-cover bg-white shadow-lg"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-serif text-2xl font-bold text-stone-900 group-hover:text-gold-700 transition">
                            {store.name}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-gold-600 fill-gold-100" />
                        </div>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">{store.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-xs font-mono font-bold">
                      <Star className="w-3.5 h-3.5 fill-current text-gold-500" />
                      <span>{store.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 font-light leading-relaxed mb-6">
                    {store.bio}
                  </p>

                  <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-500 font-bold">{store.productsCount}</span>
                    <Link
                      href={`/stores/${store.slug}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition duration-300 shadow-sm"
                    >
                      <span>Visit Storefront</span>
                      <ArrowUpRight className="w-4 h-4 text-gold-400" />
                    </Link>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
