'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Star, Heart, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    images: string;
    sizes?: string;
    colors?: string;
    store: {
      name: string;
      slug: string;
    };
    reviews?: { rating: number }[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  let imageList: string[] = [];
  try {
    imageList = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  } catch (e) {
    imageList = [product.images || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop'];
  }

  const primaryImage = imageList[0] || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop';
  const secondaryImage = imageList[1] || primaryImage;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let parsedSizes = ['M'];
    try {
      if (product.sizes) parsedSizes = JSON.parse(product.sizes);
    } catch (err) {}

    let parsedColors = ['Black'];
    try {
      if (product.colors) parsedColors = JSON.parse(product.colors);
    } catch (err) {}

    addToCart({
      productId: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      image: primaryImage,
      size: parsedSizes[0] || 'M',
      color: parsedColors[0] || 'Black',
      quantity: 1,
      sellerStoreId: product.store.slug,
      sellerStoreName: product.store.name,
    });

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const avgRating =
    product.reviews && product.reviews.length > 0
      ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
      : '4.9';

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white border border-stone-200/90 hover:border-gold-400 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500 flex flex-col justify-between">
      
      {/* Image Container with Hover Swap */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-stone-100">
        <img
          src={primaryImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-[0.98]"
        />
        {secondaryImage !== primaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.title} hover`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 filter brightness-[1]"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-white/90 backdrop-blur-md text-stone-900 border border-stone-200 shadow-sm">
            {product.store.name}
          </span>
          <button
            onClick={toggleWishlist}
            className={`p-2 rounded-full backdrop-blur-md border transition shadow-sm ${
              isWishlisted
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-white/80 text-stone-500 border-stone-200 hover:text-stone-900'
            }`}
            aria-label="Add to wishlist"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Quick Add Button on Hover */}
        <div className="absolute bottom-3 left-3 right-3 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition duration-300 ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-900 hover:bg-black text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-gold-400" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
            <span className="font-mono text-gold-700 font-bold uppercase tracking-widest text-[9px]">
              HAUTE COUTURE
            </span>
            <div className="flex items-center space-x-1 text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-mono font-bold text-stone-800">{avgRating}</span>
            </div>
          </div>

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-serif text-sm font-semibold text-stone-900 group-hover:text-gold-700 transition line-clamp-1">
              {product.title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t border-stone-100">
          {product.discountPrice ? (
            <>
              <span className="font-mono text-sm font-bold text-stone-900">
                {formatPrice(product.discountPrice)}
              </span>
              <span className="font-mono text-xs text-stone-400 line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="font-mono text-sm font-bold text-stone-900">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
