'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Pause, Play } from 'lucide-react';
import Link from 'next/link';

interface HeroSlide {
  id: number;
  title: string;
  tagline: string;
  category: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  secondaryCta: string;
  secondaryLink: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'INDIAN HAUTE COUTURE 2026',
    tagline: 'Architectural silhouettes and bespoke hand-embellished tailored prestige.',
    category: 'Runway Designer Drop',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1800&auto=format&fit=crop',
    ctaText: 'Explore Collection',
    ctaLink: '/products?category=haute-couture',
    secondaryCta: 'View Lookbook',
    secondaryLink: '/products',
  },
  {
    id: 2,
    title: 'THE OBSIDIAN SERIES',
    tagline: 'Sculpted double-breasted outerwear woven from royal wool and pure mulberry silk.',
    category: 'Atelier Noir Exclusive',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1800&auto=format&fit=crop',
    ctaText: 'Shop Atelier Noir',
    ctaLink: '/stores/atelier-noir',
    secondaryCta: 'Discover Outerwear',
    secondaryLink: '/products?category=tailored-outerwear',
  },
  {
    id: 3,
    title: 'CYBER-STREETWEAR INDIA',
    tagline: '500GSM oversized Terry hoodies & modular techwear designed for urban dominance.',
    category: 'Vogue Urban Drop',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1800&auto=format&fit=crop',
    ctaText: 'Shop Streetwear',
    ctaLink: '/products?category=modern-streetwear',
    secondaryCta: 'Vogue Urban Store',
    secondaryLink: '/stores/vogue-urban',
  },
  {
    id: 4,
    title: 'SILK & VELVET NOIR',
    tagline: 'Fluid slip gowns and crimson velvet blazers for unforgettable twilight glamour.',
    category: 'Evening Wear Essentials',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1800&auto=format&fit=crop',
    ctaText: 'View Evening Wear',
    ctaLink: '/products?category=evening-wear',
    secondaryCta: 'All Designers',
    secondaryLink: '/stores',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSlide]);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] max-h-[850px] overflow-hidden bg-ivory-200 flex items-center">
      
      {/* Background Animated Images Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.05]"
          />
          {/* Light Ivory Gradient Overlays for High Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-ivory-100 via-ivory-100/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory-100/90 via-ivory-100/60 to-transparent" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-[140px] pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-6">
          
          {/* Main Brand Tag "ZYORA" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/90 border border-gold-200 shadow-sm backdrop-blur-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-gold-700">
              ZYORA • LUXURY INDIAN MARKETPLACE
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <span className="text-xs uppercase font-mono font-bold tracking-[0.25em] text-gold-700 block">
                {activeSlide.category}
              </span>

              <h1 className="font-serif text-5xl sm:text-7xl font-bold text-stone-900 tracking-tight leading-[1.05]">
                {activeSlide.title}
              </h1>

              <p className="text-sm sm:text-lg text-stone-700 font-light leading-relaxed max-w-xl">
                {activeSlide.tagline}
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={activeSlide.ctaLink}
                  className="group relative inline-flex items-center space-x-3 px-8 py-4 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-stone-900/10 hover:scale-[1.02] transition-all duration-300"
                >
                  <span>{activeSlide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href={activeSlide.secondaryLink}
                  className="inline-flex items-center space-x-2 px-7 py-4 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-200 backdrop-blur-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-300"
                >
                  <span>{activeSlide.secondaryCta}</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Auto-Play Controls & Slide Progress */}
      <div className="absolute bottom-8 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Indicators */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentSlide === index
                    ? 'w-10 bg-gold-600 shadow-md shadow-gold-500/30'
                    : 'w-3 bg-stone-300 hover:bg-stone-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-stone-600 font-bold tracking-wider">
            0{currentSlide + 1} / 0{HERO_SLIDES.length}
          </span>
        </div>

        {/* Play/Pause & Arrows */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-white/90 text-stone-700 hover:text-gold-600 border border-stone-200 backdrop-blur-xl transition hover:scale-105 shadow-sm"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/90 text-stone-700 hover:text-stone-900 border border-stone-200 backdrop-blur-xl transition hover:scale-105 shadow-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/90 text-stone-700 hover:text-stone-900 border border-stone-200 backdrop-blur-xl transition hover:scale-105 shadow-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
