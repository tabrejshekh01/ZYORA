'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, Eye, X, CheckCircle2, Clock, XCircle, Store, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 border-b border-stone-200 pb-8 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-700 font-bold">
                Personal Atelier History • India
              </span>
              <h1 className="font-serif text-3xl font-bold text-stone-900">My Orders</h1>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-white border border-stone-200" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <p className="font-serif text-xl text-stone-800">No orders placed yet.</p>
              <Link
                href="/products"
                className="mt-4 inline-block px-8 py-3.5 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-black transition"
              >
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-8 rounded-3xl bg-white border border-stone-200 space-y-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-gold-700">
                        Ref: {order.orderNumber}
                      </span>
                      <span className="text-xs text-stone-500 block mt-0.5 font-medium">
                        Placed on {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Payment Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold border inline-flex items-center space-x-1 ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.paymentStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {order.paymentStatus === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                        {order.paymentStatus === 'FAILED' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>Payment: {order.paymentStatus}</span>
                      </span>

                      {/* Order Status Badge */}
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gold-50 text-gold-700 border border-gold-200">
                        {order.orderStatus}
                      </span>

                      <span className="font-mono text-base font-bold text-stone-900">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-4">
                    {order.items?.map((item: any) => {
                      let itemImg = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200&auto=format&fit=crop';
                      try {
                        const parsed = typeof item.product?.images === 'string' ? JSON.parse(item.product.images) : item.product?.images;
                        if (parsed && parsed.length > 0) itemImg = parsed[0];
                      } catch (e) {}

                      return (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-14 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                              <img
                                src={itemImg}
                                alt={item.product?.title || 'Garment'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{item.product?.title}</p>
                              <p className="text-[11px] text-stone-500 font-mono flex items-center space-x-2 mt-0.5">
                                <span className="inline-flex items-center space-x-1 text-gold-700 font-semibold">
                                  <Store className="w-3 h-3" />
                                  <span>{item.sellerStore?.name || 'ZYORA Atelier'}</span>
                                </span>
                                <span>•</span>
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span>Size: {item.size || 'M'}</span>
                                {item.color && (
                                  <>
                                    <span>•</span>
                                    <span>Color: {item.color}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-500 flex flex-col sm:flex-row justify-between sm:items-center gap-2 font-mono">
                    <span className="truncate max-w-md">Delivery: {order.shippingAddress}</span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center space-x-1 text-gold-700 hover:text-gold-800 font-bold self-end sm:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Receipt & Breakdown</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-gold-700 font-bold tracking-widest block">
                  Official ZYORA Order Invoice
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Order #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-ivory-100 border border-stone-200 font-mono">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className="font-bold text-emerald-700">{selectedOrder.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Fulfillment Status</span>
                  <span className="font-bold text-stone-900">{selectedOrder.orderStatus}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Order Date</span>
                  <span className="font-bold text-stone-700">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-bold text-stone-700">{selectedOrder.paymentMethod || 'RAZORPAY'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-serif font-bold text-stone-900 text-sm mb-2">Purchased Garments</h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-4 space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-stone-900">{item.product?.title}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          Seller: {item.sellerStore?.name} • Qty: {item.quantity} • Size: {item.size}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-stone-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 font-mono">
                <div className="flex justify-between text-stone-500">
                  <span>Shipping Address</span>
                  <span className="text-stone-900 font-medium text-right max-w-xs truncate">{selectedOrder.shippingAddress}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Insured Pan-India Express Delivery</span>
                  <span className="text-gold-700 font-bold">Complimentary</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                  <span>Total Paid (₹ INR)</span>
                  <span className="font-mono text-gold-700 text-base">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs transition shadow-md"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}

      <Footer />
      <CartDrawer />
    </main>
  );
}
