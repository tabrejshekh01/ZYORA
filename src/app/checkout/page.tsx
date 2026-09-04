'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { ShieldCheck, Lock, CreditCard, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { cart, totalAmount, clearCart } = useCart();
  const [address, setAddress] = useState({
    fullName: '',
    email: '',
    street: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400050',
    phone: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch current logged-in user profile
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAddress((prev) => ({
            ...prev,
            fullName: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          }));
        }
      })
      .catch(() => {});

    // 2. Dynamically load Razorpay Checkout Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add garments to your bag before checking out.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setWarningMessage(null);

    try {
      const formattedAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;

      // 1. Create ZYORA & Razorpay Order on Server-Side
      const createRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: formattedAddress,
          items: cart,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setErrorMessage(createData.error || 'Failed to initiate order.');
        setIsProcessing(false);
        return;
      }

      // If Razorpay credentials are not configured in environment
      if (!createData.isConfigured) {
        setWarningMessage(
          createData.message ||
            'Razorpay TEST credentials not configured in environment (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET required).'
        );
        setIsProcessing(false);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: createData.keyId,
        amount: createData.amountPaise,
        currency: createData.currency || 'INR',
        name: 'ZYORA Luxury Fashion',
        description: `Order Ref: ${createData.orderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        theme: {
          color: '#C5A059',
        },
        handler: async function (response: any) {
          try {
            // 3. Verify Razorpay Payment Signature Server-Side
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: createData.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setCompletedOrder(verifyData.order || { orderNumber: createData.orderNumber, totalAmount });
              clearCart();
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#c5a059', '#d4af37', '#ffffff', '#111111'],
              });
            } else {
              setErrorMessage(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (err) {
            console.error('Error verifying payment:', err);
            setErrorMessage('Payment verification failed.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setErrorMessage('Razorpay Checkout SDK failed to load. Please check your internet connection.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setErrorMessage('An unexpected error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  if (completedOrder) {
    return (
      <main className="min-h-screen bg-ivory-100 text-stone-900 flex flex-col justify-between">
        <Navbar />

        <div className="max-w-3xl mx-auto px-4 py-20 w-full text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-gold-50 border border-gold-200 text-gold-600 flex items-center justify-center mx-auto shadow-xl animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold-700 font-bold">
              Razorpay Verified • Order Confirmed
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">
              Thank You For Your Order
            </h1>
            <p className="text-xs font-mono text-stone-500 font-bold">
              Order Reference: <span className="text-gold-700">{completedOrder.orderNumber}</span>
            </p>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl bg-white border border-stone-200 text-left space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Zyora Atelier Invoice (India)</h3>
                <p className="text-xs text-stone-500">Status: Processing for Insured Dispatch</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gold-50 text-gold-700 border border-gold-200">
                PAID IN FULL (₹)
              </span>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-sm font-bold">
              <span>Total Payable</span>
              <span className="font-mono text-lg text-gold-700">{formatPrice(completedOrder.totalAmount || totalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Link
              href="/account/orders"
              className="px-8 py-3.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs uppercase tracking-wider transition"
            >
              Track Order Status
            </Link>
            <Link
              href="/products"
              className="px-8 py-3.5 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-md"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mb-10 sm:mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold-700 font-bold">
            Razorpay Secure Checkout • India (₹)
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mt-1">
            Checkout & Payment Verification
          </h1>
        </div>

        {warningMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <p className="font-serif text-xl text-stone-800">Your shopping bag is empty.</p>
            <Link
              href="/products"
              className="mt-4 inline-block px-8 py-3.5 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider"
            >
              Browse Collections
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-8">
              <div className="p-5 sm:p-8 rounded-3xl bg-white border border-stone-200 space-y-6 shadow-sm">
                <div className="flex items-center space-x-2 border-b border-stone-100 pb-4">
                  <ShieldCheck className="w-5 h-5 text-gold-600" />
                  <h2 className="font-serif text-xl font-bold text-stone-900">1. Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase font-bold text-stone-600 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase font-bold text-stone-600 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono uppercase font-bold text-stone-600 block mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase font-bold text-stone-600 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase font-bold text-stone-600 block mb-1">
                      State / Pincode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="bg-ivory-200 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-gold-500"
                      />
                      <input
                        type="text"
                        required
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                        className="bg-ivory-200 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Razorpay Gateway Info */}
              <div className="p-5 sm:p-8 rounded-3xl bg-white border border-stone-200 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 border-b border-stone-100 pb-4">
                  <CreditCard className="w-5 h-5 text-gold-600" />
                  <h2 className="font-serif text-xl font-bold text-stone-900">2. Razorpay Secure Payment Methods</h2>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Upon clicking <strong>Proceed to Razorpay</strong>, an encrypted checkout window will open supporting
                  all Indian payment methods:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center text-xs font-mono font-bold text-stone-700">
                  <div className="p-3 rounded-2xl bg-ivory-200 border border-stone-200">UPI / GPay / PhonePe</div>
                  <div className="p-3 rounded-2xl bg-ivory-200 border border-stone-200">Debit / Credit Card</div>
                  <div className="p-3 rounded-2xl bg-ivory-200 border border-stone-200">Net Banking</div>
                  <div className="p-3 rounded-2xl bg-ivory-200 border border-stone-200">Paytm Wallet</div>
                </div>

                <p className="text-[10px] text-stone-500 flex items-center space-x-1 font-light pt-2">
                  <Lock className="w-3 h-3 text-gold-600" />
                  <span>256-bit SSL Encrypted • Direct Razorpay Processing</span>
                </p>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="p-5 sm:p-8 rounded-3xl bg-white border border-stone-200 space-y-6 sticky top-28 shadow-lg">
                <h3 className="font-serif text-xl font-bold text-stone-900 border-b border-stone-100 pb-4">
                  Order Summary
                </h3>

                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-stone-900 line-clamp-1">{item.title}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          Qty: {item.quantity} • {item.sellerStoreName}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-stone-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-mono text-stone-900">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Pan-India Insured Delivery</span>
                    <span className="text-gold-700 font-bold">Complimentary</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total Payable</span>
                    <span className="font-mono text-gold-600 text-lg">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest shadow-md transition duration-300 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Opening Razorpay...</span>
                  ) : (
                    <>
                      <span>Proceed to Razorpay Pay (₹)</span>
                      <ArrowRight className="w-4 h-4 text-gold-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <Footer />
      <CartDrawer />
    </main>
  );
}
