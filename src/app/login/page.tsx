'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        await checkAuth();
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid login credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (type: 'ADMIN' | 'SELLER' | 'CUSTOMER') => {
    if (type === 'ADMIN') {
      setEmail('admin@zyora.com');
      setPassword('admin123');
    } else if (type === 'SELLER') {
      setEmail('seller@atelier.com');
      setPassword('seller123');
    } else {
      setEmail('user@zyora.com');
      setPassword('user123');
    }
  };

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900 flex flex-col justify-between">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-16 w-full my-auto">
        <div className="p-8 rounded-3xl bg-white border border-stone-200 backdrop-blur-2xl space-y-6 shadow-xl">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gold-700">
              Welcome Back • India
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Sign In to ZYORA</h1>
          </div>

          {/* Instant Quick-Login Buttons */}
          <div className="p-4 rounded-2xl bg-ivory-200/80 border border-stone-200 space-y-2">
            <p className="text-[10px] font-mono uppercase text-gold-700 font-bold tracking-wider text-center">
              ⚡ 1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono font-bold">
              <button
                onClick={() => quickLogin('ADMIN')}
                className="p-2 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-700 text-stone-700 border border-stone-200 shadow-sm transition"
              >
                Admin
              </button>
              <button
                onClick={() => quickLogin('SELLER')}
                className="p-2 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-700 text-stone-700 border border-stone-200 shadow-sm transition"
              >
                Seller
              </button>
              <button
                onClick={() => quickLogin('CUSTOMER')}
                className="p-2 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-700 text-stone-700 border border-stone-200 shadow-sm transition"
              >
                Client
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-mono font-bold uppercase text-stone-600 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="font-mono font-bold uppercase text-stone-600 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md"
            >
              {loading ? <span>Signing In...</span> : <span>Sign In</span>}
            </button>
          </form>

          <p className="text-xs text-center text-stone-500 pt-2 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-gold-700 font-bold hover:underline">
              Register Here
            </Link>
          </p>

        </div>
      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
