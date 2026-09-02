'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'Haute Couture',
    slug: 'haute-couture',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
    count: '24 Designs',
    description: 'Runway statement pieces & bespoke tailored garments.',
  },
  {
    name: 'Modern Streetwear',
    slug: 'modern-streetwear',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop',
    count: '38 Designs',
    description: 'Oversized heavy Terry hoodies & techwear outerwear.',
  },
  {
    name: 'Tailored Outerwear',
    slug: 'tailored-outerwear',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop',
    count: '19 Designs',
    description: 'Cashmere longline trench coats & structured blazers.',
  },
  {
    name: 'Evening Wear',
    slug: 'evening-wear',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
    count: '15 Designs',
    description: 'Silk slip gowns, velvet blazers & red-carpet suits.',
  },
  {
    name: 'Luxury Accessories',
    slug: 'luxury-accessories',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
    count: '42 Items',
    description: 'Handcrafted leather bags, dark eyewear & boots.',
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-gold-700">
              Curated Divisions
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight mt-2">
              Browse By Category
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 text-xs font-bold text-gold-700 hover:text-gold-800 uppercase tracking-widest transition"
          >
            <span>View All Categories</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={`/products?category=${cat.slug}`}
                className="group relative block h-80 rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm transition-all duration-500 hover:border-gold-400 hover:shadow-xl"
              >
                {/* Background Image */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-[0.85] group-hover:brightness-[0.9]"
                />

                {/* Dark Gradient Overlay for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-white/90 border border-stone-200 text-stone-900 shadow-sm backdrop-blur-md">
                      {cat.count}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/90 border border-stone-200 text-stone-700 group-hover:text-gold-600 group-hover:bg-white flex items-center justify-center transition-all shadow-sm">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-bold text-white group-hover:text-gold-300 transition">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-stone-200 mt-1 line-clamp-2 font-light">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
