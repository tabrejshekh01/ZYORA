'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  const [isHovered, setIsHovered] = useState(false);
  
  // Touch / Swipe Tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Smooth Autoplay (Pauses on hover/touch, resumes automatically)
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // 45px threshold

    if (diffX > minSwipeDistance) {
      // Swiped Left -> Next Slide
      nextSlide();
    } else if (diffX < -minSwipeDistance) {
      // Swiped Right -> Previous Slide
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[80vh] min-h-[520px] max-h-[800px] overflow-hidden bg-ivory-200 flex items-center select-none"
      aria-roledescription="carousel"
      aria-label="High fashion featured collections"
    >
      {/* Background Images: Preloaded and cross-faded smoothly */}
      {HERO_SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
          }`}
          aria-hidden={idx !== currentSlide}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.78] contrast-[1.04]"
          />
          {/* Subtle luxury gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-ivory-100 via-ivory-100/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory-100/95 via-ivory-100/70 to-transparent sm:w-4/5" />
          <div className="absolute top-0 right-0 w-80 sm:w-[450px] h-80 sm:h-[450px] bg-gold-400/10 rounded-full blur-[120px] pointer-events-none" />
        </div>
      ))}

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-xl sm:max-w-2xl space-y-4 sm:space-y-6">
          
          {/* Main Brand Tag "ZYORA" */}
          <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/90 border border-gold-200 shadow-sm backdrop-blur-xl">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gold-600 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-gold-700">
              ZYORA • LUXURY INDIAN MARKETPLACE
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="space-y-3 sm:space-y-4"
            >
              <span className="text-[10px] sm:text-xs uppercase font-mono font-bold tracking-[0.2em] sm:tracking-[0.25em] text-gold-700 block">
                {activeSlide.category}
              </span>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-7xl font-bold text-stone-900 tracking-tight leading-[1.08]">
                {activeSlide.title}
              </h1>

              <p className="text-xs sm:text-base text-stone-700 font-light leading-relaxed max-w-lg">
                {activeSlide.tagline}
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Link
                  href={activeSlide.ctaLink}
                  className="group relative inline-flex items-center space-x-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-stone-900/10 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  <span>{activeSlide.ctaText}</span>
                  <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href={activeSlide.secondaryLink}
                  className="inline-flex items-center space-x-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-200 backdrop-blur-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-300 active:scale-95"
                >
                  <span>{activeSlide.secondaryCta}</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Minimal Bottom Indicators (Clean, luxury styling with NO play/pause buttons and NO intrusive controls) */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex space-x-1.5 sm:space-x-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentSlide === index
                    ? 'w-8 sm:w-10 bg-gold-600 shadow-sm shadow-gold-500/40'
                    : 'w-2 sm:w-3 bg-stone-300 hover:bg-stone-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-[11px] sm:text-xs font-mono text-stone-600 font-bold tracking-wider">
            0{currentSlide + 1} / 0{HERO_SLIDES.length}
          </span>
        </div>

        {/* Subtle touch hint on mobile / simple indicator */}
        <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500/80 hidden sm:block">
          Swipe or hover to pause
        </div>
      </div>
    </section>
  );
}
