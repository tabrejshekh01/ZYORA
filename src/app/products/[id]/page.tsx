'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { Star, ShieldCheck, Truck, RefreshCw, ShoppingBag, Store, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const prod = data.product;
          setProduct(prod);

          let imgs: string[] = [];
          try {
            imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
          } catch (e) {
            imgs = [prod.images];
          }
          if (imgs.length > 0) setSelectedImage(imgs[0]);

          let sizes: string[] = [];
          try {
            sizes = typeof prod.sizes === 'string' ? JSON.parse(prod.sizes) : prod.sizes;
          } catch (e) {}
          if (sizes.length > 0) setSelectedSize(sizes[0]);

          let colors: string[] = [];
          try {
            colors = typeof prod.colors === 'string' ? JSON.parse(prod.colors) : prod.colors;
          } catch (e) {}
          if (colors.length > 0) setSelectedColor(colors[0]);
        }
      } catch (e) {
        console.error('Error fetching product detail', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-ivory-100 text-stone-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
          <div className="h-96 rounded-3xl bg-white border border-stone-200" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-ivory-100 text-stone-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-3xl font-bold">Garment Not Found</h1>
          <Link href="/products" className="mt-4 inline-block text-xs font-bold text-gold-700 uppercase">
            ← Back to Catalog
          </Link>
        </div>
      </main>
    );
  }

  let images: string[] = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  } catch (e) {
    images = [product.images];
  }

  let sizes: string[] = [];
  try {
    sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
  } catch (e) {}

  let colors: string[] = [];
  try {
    colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;
  } catch (e) {}

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      image: selectedImage || images[0],
      size: selectedSize || 'M',
      color: selectedColor || 'Black',
      quantity: 1,
      sellerStoreId: product.store.slug,
      sellerStoreName: product.store.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-stone-500 hover:text-gold-700 transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collections</span>
        </Link>

        {/* Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 relative shadow-lg">
              <img
                src={selectedImage || images[0]}
                alt={product.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center filter brightness-[0.98]"
              />
              <span className="absolute top-4 left-4 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-white/90 border border-gold-200 text-gold-700 backdrop-blur-md shadow-sm">
                {product.category?.name || 'Haute Couture'}
              </span>
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition flex-shrink-0 ${
                      selectedImage === img ? 'border-gold-500 scale-95 shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Purchase Panel */}
          <div className="space-y-8">
            
            {/* Vendor Store Tag */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <Link
                href={`/stores/${product.store.slug}`}
                className="flex items-center space-x-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block font-bold">
                    Designed & Crafted By
                  </span>
                  <span className="font-serif text-sm font-bold text-stone-900 group-hover:text-gold-700 transition">
                    {product.store.name}
                  </span>
                </div>
              </Link>

              <div className="flex items-center space-x-1 text-gold-700 font-mono text-xs">
                <Star className="w-4 h-4 fill-current text-gold-500" />
                <span className="font-bold">4.9</span>
                <span className="text-stone-400">(18 reviews)</span>
              </div>
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
                {product.title}
              </h1>
              
              <div className="flex items-center space-x-3 mt-4">
                {product.discountPrice ? (
                  <>
                    <span className="font-mono text-2xl font-bold text-stone-900">
                      {formatPrice(product.discountPrice)}
                    </span>
                    <span className="font-mono text-base text-stone-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-50 text-gold-700 border border-gold-200 uppercase">
                      Save {formatPrice(product.price - product.discountPrice)}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-2xl font-bold text-stone-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              {product.description}
            </p>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold uppercase text-stone-900">Select Size</span>
                  <span className="text-stone-500 underline cursor-pointer">Sizing Guide</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-mono font-bold transition ${
                        selectedSize === sz
                          ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Choices */}
            {colors.length > 0 && (
              <div className="space-y-3">
                <span className="font-mono text-xs font-bold uppercase text-stone-900 block">
                  Select Shade: <span className="text-gold-700">{selectedColor}</span>
                </span>
                <div className="flex space-x-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 rounded-xl border text-xs font-medium transition ${
                        selectedColor === c
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center space-x-4 pt-4">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg transition duration-300 ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-black text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added To Atelier Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-gold-400" />
                    <span>Add To Bag</span>
                  </>
                )}
              </button>
            </div>

            {/* Guarantee Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-stone-200 text-center text-[10px] sm:text-[11px] text-stone-600">
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
                <Truck className="w-4 h-4 text-gold-600 mx-auto" />
                <p className="font-bold text-stone-900">Pan-India</p>
                <p className="text-[9px] sm:text-[10px] text-stone-500 font-light">Insured express courier</p>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
                <ShieldCheck className="w-4 h-4 text-gold-600 mx-auto" />
                <p className="font-bold text-stone-900">Authentic</p>
                <p className="text-[9px] sm:text-[10px] text-stone-500 font-light">Verified atelier</p>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
                <RefreshCw className="w-4 h-4 text-gold-600 mx-auto" />
                <p className="font-bold text-stone-900">14 Days</p>
                <p className="text-[9px] sm:text-[10px] text-stone-500 font-light">Easy returns</p>
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        {product.reviews && (
          <div className="mt-20 pt-12 border-t border-stone-200 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Client Reviews & Rating</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.reviews.map((rev: any) => (
                <div key={rev.id} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gold-50 text-gold-700 font-bold flex items-center justify-center text-xs border border-gold-200">
                        {rev.user?.name?.charAt(0) || 'S'}
                      </div>
                      <span className="text-xs font-bold text-stone-900">{rev.user?.name || 'Verified Client'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gold-700 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current text-gold-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 font-light leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
