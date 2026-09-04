'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  
  // Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP State
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devHelperCode, setDevHelperCode] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { checkAuth } = useAuth();

  // Cooldown countdown effect
  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpIdentifier.trim()) {
      setError('Please enter your mobile number or email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setDevHelperCode(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: otpIdentifier.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpCooldown(data.cooldownSeconds || 60);
        setSuccessMsg(data.message || 'Verification code sent.');
        if (data.devCode) {
          setDevHelperCode(data.devCode);
        }
      } else {
        setError(data.error || 'Failed to send verification code.');
        if (data.cooldownSeconds) {
          setOtpCooldown(data.cooldownSeconds);
        }
      }
    } catch (err) {
      setError('Failed to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: otpIdentifier.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await checkAuth();
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (type: 'ADMIN' | 'SELLER' | 'CUSTOMER') => {
    setAuthMethod('PASSWORD');
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

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16 w-full my-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 backdrop-blur-2xl space-y-6 shadow-xl">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-gold-700">
              Welcome Back • India
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Sign In to ZYORA</h1>
          </div>

          {/* Auth Method Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-ivory-200 border border-stone-200 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => { setAuthMethod('PASSWORD'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-xl transition ${
                authMethod === 'PASSWORD'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('OTP'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-xl transition ${
                authMethod === 'OTP'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              One-Time Passcode (OTP)
            </button>
          </div>

          {/* Instant Quick-Login Buttons (Shown for Password Tab) */}
          {authMethod === 'PASSWORD' && (
            <div className="p-4 rounded-2xl bg-ivory-200/80 border border-stone-200 space-y-2">
              <p className="text-[10px] font-mono uppercase text-gold-700 font-bold tracking-wider text-center">
                ⚡ 1-Click Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => quickLogin('ADMIN')}
                  className="p-2 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-700 text-stone-700 border border-stone-200 shadow-sm transition"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('SELLER')}
                  className="p-2 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-700 text-stone-700 border border-stone-200 shadow-sm transition"
                >
                  Seller
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('CUSTOMER')}
                  className="p-2 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-700 text-stone-700 border border-stone-200 shadow-sm transition"
                >
                  Client
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {devHelperCode && (
            <div className="p-3 rounded-xl bg-gold-50 border border-gold-300 text-gold-900 text-xs text-center font-mono">
              <span className="font-bold block text-[10px] uppercase text-gold-700">Development Mock Mode</span>
              Your Code: <strong className="text-sm tracking-widest text-gold-800">{devHelperCode}</strong>
            </div>
          )}

          {/* Form 1: Password Login */}
          {authMethod === 'PASSWORD' && (
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
                className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md disabled:opacity-50"
              >
                {loading ? <span>Signing In...</span> : <span>Sign In With Password</span>}
              </button>
            </form>
          )}

          {/* Form 2: OTP Login / Fast Sign Up */}
          {authMethod === 'OTP' && (
            <div className="space-y-4 text-xs">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="font-mono font-bold uppercase text-stone-600 block mb-1">
                      Mobile Number or Email Address
                    </label>
                    <input
                      type="text"
                      required
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      placeholder="+91 9876543210 or name@example.com"
                      className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
                    />
                    <span className="text-[10px] text-stone-500 block mt-1">
                      We will send an encrypted 6-digit verification code.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCooldown > 0}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending Code...</span>
                    ) : otpCooldown > 0 ? (
                      <span>Resend in {otpCooldown}s</span>
                    ) : (
                      <span>Send 6-Digit Code</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-mono font-bold uppercase text-stone-600">Enter 6-Digit Code</label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setDevHelperCode(null); }}
                        className="text-[11px] text-gold-700 underline font-bold"
                      >
                        Change Identifier
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-gold-500 text-center font-mono font-bold text-xl tracking-[0.3em]"
                    />
                    <span className="text-[10px] text-stone-500 block mt-1 text-center">
                      Code sent to {otpIdentifier} (valid for 5 minutes).
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md disabled:opacity-50"
                  >
                    {loading ? <span>Verifying...</span> : <span>Verify & Continue</span>}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || loading}
                      onClick={handleSendOtp}
                      className="text-[11px] font-mono text-stone-500 hover:text-stone-900 disabled:opacity-50 underline"
                    >
                      {otpCooldown > 0 ? `Resend Code in ${otpCooldown}s` : 'Did not receive code? Resend'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
