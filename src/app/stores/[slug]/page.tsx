'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import ProductCard from '@/components/products/ProductCard';
import { Star, CheckCircle2, MapPin } from 'lucide-react';

export default function VendorStorefrontPage({ params }: { params: { slug: string } }) {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch(`/api/products?store=${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          if (data.products && data.products.length > 0) {
            setStore(data.products[0].store);
          }
        }
      } catch (e) {
        console.error('Error fetching vendor store', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [params.slug]);

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      {/* Banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden bg-stone-100">
        <img
          src={store?.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop'}
          alt={store?.name || 'Store Banner'}
          className="w-full h-full object-cover filter brightness-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory-100 via-transparent to-transparent" />
      </div>

      {/* Store Header Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        <div className="p-8 rounded-3xl bg-white border border-stone-200 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <img
              src={store?.logo || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop'}
              alt={store?.name || 'Store Logo'}
              className="w-24 h-24 rounded-2xl border-2 border-white object-cover bg-white shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-3xl font-bold text-stone-900">
                  {store?.name || 'Designer Store'}
                </h1>
                <CheckCircle2 className="w-5 h-5 text-gold-600 fill-gold-100" />
              </div>
              <p className="text-xs text-stone-600 max-w-xl mt-2 font-light">
                {store?.bio || 'Verified independent Indian fashion house listing exclusive collections on ZYORA.'}
              </p>
              {store?.address && (
                <div className="flex items-center space-x-2 text-xs font-mono text-stone-500 mt-2 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-gold-600" />
                  <span>{store.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end justify-center space-y-2 border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-xs font-mono font-bold">
              <Star className="w-4 h-4 fill-current text-gold-500" />
              <span>{store?.rating || '4.95'} Atelier Rating</span>
            </div>
            <span className="text-xs font-mono text-stone-500 font-semibold">
              {products.length} Garments Available
            </span>
          </div>
        </div>

        {/* Catalog Section */}
        <div className="mt-16 space-y-8">
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Curated Garments from {store?.name || 'this Store'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-white border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
