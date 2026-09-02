'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/products/ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedGender, setSelectedGender] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState(100000);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedGender, priceRange]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?maxPrice=${priceRange}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedGender) url += `&gender=${selectedGender}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Error fetching products', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filter Sidebar */}
        <div className="lg:col-span-1 space-y-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm backdrop-blur-xl h-fit">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center space-x-2 text-gold-700 font-mono font-bold text-xs uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedGender('');
                setSearchQuery('');
                setPriceRange(100000);
              }}
              className="text-[11px] text-stone-500 hover:text-stone-900 transition"
            >
              Reset
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ivory-200 text-xs text-stone-900 placeholder-stone-400 px-4 py-2.5 pl-9 rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          </form>

          {/* Category Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">Categories</h3>
            <div className="space-y-2 text-xs">
              {[
                { name: 'All Categories', slug: '' },
                { name: 'Haute Couture', slug: 'haute-couture' },
                { name: 'Modern Streetwear', slug: 'modern-streetwear' },
                { name: 'Tailored Outerwear', slug: 'tailored-outerwear' },
                { name: 'Evening Wear', slug: 'evening-wear' },
                { name: 'Luxury Accessories', slug: 'luxury-accessories' },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${
                    selectedCategory === cat.slug
                      ? 'bg-gold-50 text-gold-700 border border-gold-200 font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-ivory-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">Department</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['', 'MEN', 'WOMEN'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`py-2 rounded-xl border text-center transition ${
                    selectedGender === g
                      ? 'bg-gold-50 text-gold-700 border-gold-300 font-bold'
                      : 'bg-ivory-100 text-stone-600 border-stone-200 hover:text-stone-900'
                  }`}
                >
                  {g === '' ? 'All' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <h3 className="font-mono font-bold uppercase tracking-wider text-stone-900">Max Price</h3>
              <span className="font-mono font-bold text-gold-700">{formatPrice(priceRange)}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="100000"
              step="1000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-gold-500 bg-stone-200"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-white border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <p className="text-lg font-serif text-stone-800">No luxury items found matching your filters</p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedGender('');
                  setSearchQuery('');
                  setPriceRange(100000);
                }}
                className="mt-4 px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-ivory-200 via-ivory-100 to-ivory-100 border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold-700 font-bold">
            ZYORA COLLECTIONS • INDIA
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight mt-2">
            Haute Couture & Streetwear Catalog
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl mt-3 font-light">
            Discover bespoke garments and limited runway drops from verified Indian designer ateliers priced in Indian Rupees (₹).
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-stone-500">Loading catalog...</div>}>
        <ProductsContent />
      </Suspense>

      <Footer />
      <CartDrawer />
    </main>
  );
}
