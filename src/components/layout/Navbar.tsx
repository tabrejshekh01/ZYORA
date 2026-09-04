'use client';

import React, { useState, useEffect } from 'react';
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
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileMenuOpen(false);
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-full backdrop-blur-xl bg-white/95 border-b border-stone-200/80 transition-all duration-300 shadow-sm shadow-stone-200/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 w-full">
          
          {/* Left: Mobile Menu Toggle + Brand Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-1.5 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition active:scale-95 flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* ZYORA Brand Mark */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-gold-500 via-gold-400 to-gold-600 p-[1px] shadow-sm shadow-gold-500/20 group-hover:shadow-gold-500/40 transition-all duration-500 flex-shrink-0">
                <div className="w-full h-full bg-white rounded-[7px] sm:rounded-[11px] flex items-center justify-center">
                  <span className="font-serif font-bold text-base sm:text-xl text-gold-600 tracking-tighter">Z</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-[0.15em] sm:tracking-[0.25em] text-stone-900 group-hover:text-gold-600 transition duration-300 whitespace-nowrap">
                  ZYORA
                </span>
                <span className="hidden sm:block text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-gold-700 font-sans font-semibold whitespace-nowrap">
                  HAUTE COUTURE • INDIA
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-stone-700">
            <Link href="/products" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group whitespace-nowrap">
              Collections
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/products?category=haute-couture" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group whitespace-nowrap">
              Couture
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/products?category=modern-streetwear" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group whitespace-nowrap">
              Streetwear
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/stores" className="hover:text-gold-600 transition-colors duration-200 py-1 relative group whitespace-nowrap">
              Designer Stores
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gold-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          {/* Right: Search, Cart & Account Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Desktop Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search luxury fashion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 xl:w-56 bg-ivory-200/80 text-xs text-stone-900 placeholder-stone-400 px-3.5 py-2 pl-8 rounded-full border border-stone-200 focus:outline-none focus:border-gold-500 focus:bg-white transition-all"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-full bg-ivory-200/90 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 transition group flex-shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-105 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gold-500 text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center shadow-md shadow-gold-500/40">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* User Account Dropdown */}
            {user ? (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1.5 sm:space-x-2 p-1 pr-2 sm:pr-3 rounded-full bg-ivory-200/80 border border-stone-200 hover:border-gold-400 transition"
                  aria-label="User profile menu"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gold-500 text-white font-bold text-xs uppercase flex items-center justify-center shadow-sm flex-shrink-0">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-stone-800 hidden md:inline max-w-[80px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500 flex-shrink-0" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 mb-1">
                        <p className="text-xs font-bold text-stone-900 truncate">{user.name}</p>
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
                          <ShieldCheck className="w-4 h-4 text-gold-600" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}

                      {user.role === 'SELLER' && (
                        <Link
                          href="/seller/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs text-gold-700 hover:bg-ivory-200 rounded-xl transition font-semibold"
                        >
                          <Store className="w-4 h-4 text-gold-600" />
                          <span>Seller Dashboard</span>
                        </Link>
                      )}

                      <Link
                        href="/account/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-xs text-stone-700 hover:bg-ivory-200 rounded-xl transition font-medium"
                      >
                        <ShoppingBag className="w-4 h-4 text-stone-500" />
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
              <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 px-2.5 py-1.5 rounded-full transition whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex relative group overflow-hidden px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-sm hover:shadow-md transition duration-300 whitespace-nowrap"
                >
                  <span className="relative z-10 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-gold-400 fill-current" />
                    <span>Join ZYORA</span>
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-b border-stone-200 bg-white/98 backdrop-blur-2xl overflow-hidden shadow-xl"
          >
            <div className="px-4 pt-3 pb-6 space-y-4">
              {/* Mobile Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search luxury fashion & collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-ivory-200 text-xs text-stone-900 placeholder-stone-400 px-4 py-2.5 pl-10 rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              </form>

              {/* Mobile Nav Links */}
              <div className="flex flex-col space-y-2.5 pt-1 text-xs font-semibold uppercase tracking-wider text-stone-700">
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1.5 border-b border-stone-100 transition flex items-center justify-between"
                >
                  <span>All Collections</span>
                  <span className="text-[10px] text-stone-400 font-mono">Explore →</span>
                </Link>
                <Link
                  href="/products?category=haute-couture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1.5 border-b border-stone-100 transition flex items-center justify-between"
                >
                  <span>Haute Couture</span>
                  <span className="text-[10px] text-stone-400 font-mono">Runway →</span>
                </Link>
                <Link
                  href="/products?category=modern-streetwear"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1.5 border-b border-stone-100 transition flex items-center justify-between"
                >
                  <span>Modern Streetwear</span>
                  <span className="text-[10px] text-stone-400 font-mono">Urban →</span>
                </Link>
                <Link
                  href="/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-gold-600 py-1.5 border-b border-stone-100 transition flex items-center justify-between"
                >
                  <span>Designer Stores</span>
                  <span className="text-[10px] text-stone-400 font-mono">Ateliers →</span>
                </Link>
              </div>

              {/* Mobile Auth CTAs when not logged in */}
              {!user && (
                <div className="pt-3 border-t border-stone-100 flex flex-col space-y-2">
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-md transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold-400 fill-current" />
                    <span>Join ZYORA Membership</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-ivory-200 text-stone-800 text-xs font-bold uppercase tracking-wider border border-stone-200 transition"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                    <span>Customer Sign In</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
