'use client';

import React, { useState, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'SELLER' ? 'SELLER' : 'CUSTOMER';

  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeBio, setStoreBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuth } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          storeName: role === 'SELLER' ? storeName : undefined,
          storeBio: role === 'SELLER' ? storeBio : undefined,
          phone,
        }),
      });

      if (res.ok) {
        await checkAuth();
        if (role === 'SELLER') {
          window.location.href = '/seller/dashboard';
        } else {
          window.location.href = '/';
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-3xl bg-white border border-stone-200 backdrop-blur-2xl space-y-6 shadow-xl">
      
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gold-700">
          Join ZYORA • India
        </span>
        <h1 className="font-serif text-3xl font-bold text-stone-900">Create An Account</h1>
      </div>

      {/* Role Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-ivory-200 border border-stone-200 text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setRole('CUSTOMER')}
          className={`py-2 rounded-xl transition ${
            role === 'CUSTOMER'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Client Account
        </button>
        <button
          type="button"
          onClick={() => setRole('SELLER')}
          className={`py-2 rounded-xl transition ${
            role === 'SELLER'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200 font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Seller Store
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4 text-xs">
        <div>
          <label className="font-mono font-bold uppercase text-stone-600 block mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alexander Vance"
            className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="font-mono font-bold uppercase text-stone-600 block mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alexander@brand.com"
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

        {role === 'SELLER' && (
          <>
            <div>
              <label className="font-mono font-bold uppercase text-stone-600 block mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Atelier Vance"
                className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="font-mono font-bold uppercase text-stone-600 block mb-1">Store Bio</label>
              <textarea
                rows={2}
                value={storeBio}
                onChange={(e) => setStoreBio(e.target.value)}
                placeholder="Bespoke Indian luxury tailoring..."
                className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md"
        >
          {loading ? <span>Creating Account...</span> : <span>Create Account</span>}
        </button>
      </form>

      <p className="text-xs text-center text-stone-500 pt-2 font-medium">
        Already have an account?{' '}
        <Link href="/login" className="text-gold-700 font-bold hover:underline">
          Sign In
        </Link>
      </p>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900 flex flex-col justify-between">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-16 w-full my-auto">
        <Suspense fallback={<div className="text-center text-stone-500">Loading form...</div>}>
          <RegisterForm />
        </Suspense>
      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
