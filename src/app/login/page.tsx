'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone + WhatsApp OTP State
  const [otpStep, setOtpStep] = useState<'PHONE' | 'VERIFY'>('PHONE');
  const [rawPhone, setRawPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // General Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { checkAuth } = useAuth();

  // References for the 6 OTP input boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 30s Cooldown Countdown Timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Focus the first OTP box when transitioning to VERIFY step
  useEffect(() => {
    if (otpStep === 'VERIFY' && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [otpStep]);

  // Handle Indian phone number input formatting (10 digits)
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setRawPhone(val);
    setError('');
  };

  // Helper to validate 10-digit Indian phone starting with 6, 7, 8, 9
  const isPhoneValid = /^[6-9]\d{9}$/.test(rawPhone);

  // Switch Auth Method Tabs
  const handleSwitchTab = (method: 'PASSWORD' | 'OTP') => {
    setAuthMethod(method);
    setError('');
    setSuccessMsg('');
  };

  // 1. Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.ok) {
        await checkAuth();
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/';
        window.location.href = redirectUrl;
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid email or password.');
      }
    } catch {
      setError('Connection failed. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. WhatsApp OTP Send Handler (Step 1)
  const handleSendWhatsAppOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const fullNormalizedPhone = `+91${rawPhone}`;
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: fullNormalizedPhone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpStep('VERIFY');
        setOtpCooldown(data.cooldownSeconds || 30);
        setSuccessMsg(data.message || 'OTP sent to your WhatsApp.');
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setError(data.error || 'Failed to dispatch WhatsApp verification code.');
        if (data.cooldownSeconds) {
          setOtpCooldown(data.cooldownSeconds);
        }
      }
    } catch {
      setError('Network error. Unable to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Digits Handling (6 Individual Boxes)
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanDigit;
    setOtpDigits(updated);
    setError('');

    // Advance focus to next input if digit entered
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || '';
    }
    setOtpDigits(updated);
    setError('');

    // Focus on the last filled box or submit
    const focusIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  // 3. WhatsApp OTP Verify Handler (Step 2)
  const handleVerifyWhatsAppOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedCode = otpDigits.join('');

    if (combinedCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullNormalizedPhone = `+91${rawPhone}`;
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: fullNormalizedPhone,
          otp: combinedCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await checkAuth();
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/';
        window.location.href = redirectUrl;
      } else {
        const errMsg = data.error || 'Invalid OTP. Please try again.';
        setError(errMsg);
      }
    } catch {
      setError('Verification failed due to connection issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Accounts
  const handleQuickLogin = (type: 'ADMIN' | 'SELLER' | 'CUSTOMER') => {
    setAuthMethod('PASSWORD');
    setError('');
    setSuccessMsg('');
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
    <main className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col justify-between selection:bg-gold-200 selection:text-gold-900">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-10 sm:py-16 w-full my-auto">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-gold-700">
              Welcome Back • India
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Sign In to ZYORA</h1>
            <p className="text-xs text-stone-500">
              Access your luxury couture closet, orders, and styling concierge.
            </p>
          </div>

          {/* Auth Method Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-100 border border-stone-200 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => handleSwitchTab('PASSWORD')}
              className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-2 ${
                authMethod === 'PASSWORD'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('OTP')}
              className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-2 ${
                authMethod === 'OTP'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phone + OTP</span>
            </button>
          </div>

          {/* Inline Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed font-medium">{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: PASSWORD LOGIN                                                     */}
          {/* ========================================================================= */}
          {authMethod === 'PASSWORD' && (
            <div className="space-y-5">
              {/* 1-Click Demo Accounts */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase text-gold-700 font-bold tracking-wider">
                    ⚡ 1-Click Demo Accounts
                  </p>
                  <span className="text-[9px] font-mono text-stone-400">Instant fill</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ADMIN')}
                    className="py-2 px-1 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-800 text-stone-700 border border-stone-200 shadow-sm transition"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('SELLER')}
                    className="py-2 px-1 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-800 text-stone-700 border border-stone-200 shadow-sm transition"
                  >
                    Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('CUSTOMER')}
                    className="py-2 px-1 rounded-xl bg-white hover:bg-gold-50 hover:text-gold-800 text-stone-700 border border-stone-200 shadow-sm transition"
                  >
                    Client
                  </button>
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
                <div>
                  <label className="font-mono font-bold uppercase text-stone-600 block mb-1.5 text-[11px]">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@zyora.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-gold-500 focus:bg-white transition text-xs"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-mono font-bold uppercase text-stone-600 text-[11px]">
                      Password
                    </label>
                    <span className="text-[11px] text-stone-400 hover:text-gold-700 transition cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 pr-10 text-stone-900 focus:outline-none focus:border-gold-500 focus:bg-white transition text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs transition shadow-md disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    <span>Sign In With Password</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PHONE + WHATSAPP OTP LOGIN                                         */}
          {/* ========================================================================= */}
          {authMethod === 'OTP' && (
            <div className="space-y-5">
              {/* STEP 1: PHONE NUMBER INPUT */}
              {otpStep === 'PHONE' && (
                <form onSubmit={handleSendWhatsAppOTP} className="space-y-4 text-xs">
                  <div>
                    <label className="font-mono font-bold uppercase text-stone-600 block mb-1.5 text-[11px]">
                      Phone Number
                    </label>
                    <div className="flex rounded-xl border border-stone-200 bg-stone-50 overflow-hidden focus-within:border-gold-500 focus-within:bg-white transition">
                      <div className="flex items-center justify-center px-3.5 bg-stone-100/80 border-r border-stone-200 text-stone-700 font-mono font-bold text-xs select-none">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        required
                        maxLength={10}
                        value={rawPhone}
                        onChange={handlePhoneInputChange}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full bg-transparent px-4 py-3 text-stone-900 placeholder:text-stone-400 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || rawPhone.length !== 10 || !isPhoneValid}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs transition shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending OTP...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Send OTP via WhatsApp</span>
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-center space-x-1.5 text-[11px] text-stone-500 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>An OTP will be sent to your WhatsApp number.</span>
                  </div>
                </form>
              )}

              {/* STEP 2: VERIFY 6-DIGIT OTP */}
              {otpStep === 'VERIFY' && (
                <form onSubmit={handleVerifyWhatsAppOTP} className="space-y-5 text-xs">
                  <div className="text-center space-y-1">
                    <h3 className="font-serif font-bold text-xl text-stone-900 uppercase tracking-wide">
                      Verify Your Phone
                    </h3>
                    <p className="text-xs text-stone-500">
                      We sent a 6-digit OTP to your WhatsApp.
                    </p>
                    <div className="flex items-center justify-center space-x-2 pt-1">
                      <span className="font-mono font-bold text-stone-800 text-xs bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                        +91 {rawPhone.slice(0, 5)} {rawPhone.slice(5)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('PHONE');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-[11px] text-gold-700 hover:text-gold-900 font-bold underline transition"
                      >
                        Change phone number
                      </button>
                    </div>
                  </div>

                  {/* 6 Individual Digit Boxes */}
                  <div className="space-y-2">
                    <div className="flex justify-center items-center gap-2 sm:gap-2.5">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-gold-600 focus:bg-white focus:ring-2 focus:ring-gold-500/20 transition"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400 block text-center font-mono">
                      Valid for 5 minutes
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length !== 6}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs transition shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </span>
                    ) : (
                      <span>Verify & Login</span>
                    )}
                  </button>

                  {/* 30s Resend Cooldown Section */}
                  <div className="text-center pt-1">
                    {otpCooldown > 0 ? (
                      <span className="text-[11px] font-mono text-stone-400 flex items-center justify-center space-x-1.5">
                        <RotateCcw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>Resend OTP in {otpCooldown}s</span>
                      </span>
                    ) : (
                      <div className="text-[11px] text-stone-500">
                        <span>Didn&apos;t receive the code? </span>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSendWhatsAppOTP()}
                          className="text-gold-700 hover:text-gold-900 font-bold underline transition"
                        >
                          Resend OTP
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer Link: Create Account */}
          <div className="pt-2 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500 font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-gold-700 font-bold hover:underline transition">
                Register Here
              </Link>
            </p>
          </div>

        </div>
      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
