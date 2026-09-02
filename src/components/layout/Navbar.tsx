'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Store,
  ShieldCheck,
  LogOut,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/90 border-b border-stone-200/80 transition-all duration-300 shadow-sm shadow-stone-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Toggle */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* ZYORA Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-500 via-gold-400 to-gold-600 p-[1px] shadow-md shadow-gold-500/20 group-hover:shadow-gold-500/40 transition-all duration-500">
                <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
                  <span className="font-serif font-bold text-xl text-gold-600 tracking-tighter">Z</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-[0.25em] text-stone-900 group-hover:text-gold-600 transition duration-300">
                  ZYORA
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-gold-700 font-sans font-semibold">
                  HAUTE COUTURE • INDIA
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-stone-700">
            <Link href="/products" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group">
              Collections
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/products?category=haute-couture" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group">
              Couture
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/products?category=modern-streetwear" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group">
              Streetwear
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/stores" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group">
              Designer Stores
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center space-x-5">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search luxury fashion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-60 bg-ivory-200/80 text-xs text-stone-900 placeholder-stone-400 px-4 py-2.5 pl-9 rounded-full border border-stone-200 focus:outline-none focus:border-gold-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            </form>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-ivory-200/80 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 transition group"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-500 text-white font-bold text-[10px] flex items-center justify-center shadow-md shadow-gold-500/40 animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Auth Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 pr-3 rounded-full bg-ivory-200/80 border border-stone-200 hover:border-gold-400 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gold-500 text-white font-bold text-xs uppercase flex items-center justify-center shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-stone-800 hidden sm:inline max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-50 backdrop-blur-2xl"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 mb-1">
                        <p className="text-xs font-bold text-stone-900">{user.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-gold-50 text-gold-700 border border-gold-200">
                          {user.role}
                        </span>
                      </div>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs text-gold-700 hover:bg-ivory-200 rounded-xl transition font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}

                      {user.role === 'SELLER' && (
                        <Link
                          href="/seller/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs text-gold-700 hover:bg-ivory-200 rounded-xl transition font-semibold"
                        >
                          <Store className="w-4 h-4" />
                          <span>Seller Dashboard</span>
                        </Link>
                      )}

                      <Link
                        href="/account/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-xs text-stone-700 hover:bg-ivory-200 rounded-xl transition font-medium"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>My Orders</span>
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-3 py-2 rounded-full transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="relative group overflow-hidden px-4 py-2 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg transition duration-300"
                >
                  <span className="relative z-10 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400 fill-current" />
                    <span>Join ZYORA</span>
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-stone-200 bg-white/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-6 space-y-4">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search luxury fashion..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-ivory-200 text-xs text-stone-900 placeholder-stone-400 px-4 py-3 pl-10 rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </form>

              <div className="flex flex-col space-y-3 pt-2 text-xs font-semibold uppercase tracking-wider text-stone-700">
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1 transition"
                >
                  All Collections
                </Link>
                <Link
                  href="/products?category=haute-couture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1 transition"
                >
                  Couture
                </Link>
                <Link
                  href="/products?category=modern-streetwear"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1 transition"
                >
                  Streetwear
                </Link>
                <Link
                  href="/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1 transition"
                >
                  Designer Stores
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
