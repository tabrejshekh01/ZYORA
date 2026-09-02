'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  DollarSign,
  Store,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  BadgeIndianRupee,
  ShoppingBag,
  Eye,
  X,
} from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SELLERS' | 'PRODUCTS' | 'ORDERS' | 'SETTLEMENTS'>('SELLERS');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'PAID' | 'UNPAID'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchAdminStats();
    fetchSellers();
    fetchAdminProducts(productStatusFilter);
  }, [productStatusFilter]);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch('/api/admin/sellers');
      if (res.ok) {
        const data = await res.json();
        setSellers(data.stores || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminProducts = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/products?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSellerStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, status: newStatus }),
      });
      if (res.ok) {
        fetchSellers();
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProductStatus = async (productId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: newStatus }),
      });
      if (res.ok) {
        fetchAdminProducts(productStatusFilter);
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const pendingProductsCount = products.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const filteredOrders = (stats?.recentOrders || []).filter((o: any) => {
    if (orderStatusFilter === 'PAID') return o.paymentStatus === 'PAID';
    if (orderStatusFilter === 'UNPAID') return o.paymentStatus !== 'PAID';
    return true;
  });

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-stone-200 pb-8 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-700 font-bold">
              Platform Master Administration • India (₹)
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900">ZYORA Platform Control Panel</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Total Sales / GMV (₹)</span>
              <DollarSign className="w-4 h-4 text-gold-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-gold-700">{formatPrice(stats?.totalSales || 0)}</p>
            <p className="text-[10px] text-stone-500 font-mono">
              Paid Orders: {stats?.paidOrders || 0} • Unpaid: {stats?.unpaidOrders || 0}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">ZYORA Commission (₹)</span>
              <BadgeIndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-700">{formatPrice(stats?.totalZyoraCommission || 0)}</p>
            <p className="text-[10px] text-stone-500">Fixed ₹4 per paid order ({stats?.paidOrders || 0} × ₹4)</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Seller Net Payable (₹)</span>
              <Receipt className="w-4 h-4 text-gold-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-stone-900">{formatPrice(stats?.sellerPayableAmount || 0)}</p>
            <p className="text-[10px] text-stone-500">Net seller earnings from paid sales</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Stores / Total Orders</span>
              <Store className="w-4 h-4 text-gold-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-stone-900">
              {stats?.totalSellers || 0} / {stats?.totalOrders || 0}
            </p>
            <p className="text-[10px] text-stone-500">Active Stores & Orders Received</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 border-b border-stone-200 mb-8">
          {[
            { id: 'SELLERS', label: `Seller Stores (${sellers.length})` },
            { id: 'PRODUCTS', label: `Product Approvals (${products.length})`, count: pendingProductsCount },
            { id: 'ORDERS', label: `Customer Orders (${stats?.totalOrders || 0})` },
            { id: 'SETTLEMENTS', label: `Seller Settlements (${stats?.settlementsList?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-xs font-mono font-bold uppercase tracking-wider transition relative flex items-center space-x-2 ${
                activeTab === tab.id ? 'text-gold-700 border-b-2 border-gold-600' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count && tab.count > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {tab.count} Pending
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab 1: Sellers Table */}
        {activeTab === 'SELLERS' && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Seller Store Governance</h2>

            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Store Name</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Razorpay Route Account</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-ivory-100/50 transition">
                      <td className="p-4 flex items-center space-x-3">
                        <img
                          src={s.logo || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop'}
                          alt={s.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 bg-white"
                        />
                        <span className="font-bold text-stone-900">{s.name}</span>
                      </td>
                      <td className="p-4 text-stone-600 font-mono">{s.user?.email}</td>
                      <td className="p-4 font-mono font-bold text-gold-700">{s._count?.products}</td>
                      <td className="p-4 font-mono text-stone-600">{s.razorpayAccountId || 'Pending Route KYC'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                            s.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleSellerStatus(s.id, s.status)}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition ${
                            s.status === 'APPROVED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {s.status === 'APPROVED' ? 'Suspend Store' : 'Approve Store'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Products Governance */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Garment Approvals & Governance</h2>

              <div className="flex space-x-2 text-xs font-mono font-bold">
                {[
                  { id: 'all', label: 'All Statuses' },
                  { id: 'PENDING_APPROVAL', label: 'Pending' },
                  { id: 'APPROVED', label: 'Approved' },
                  { id: 'REJECTED', label: 'Rejected' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setProductStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      productStatusFilter === f.id
                        ? 'bg-gold-50 text-gold-700 border-gold-300'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-ivory-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Garment</th>
                    <th className="p-4">Seller Store</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (₹)</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 font-serif">
                        No products match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      let imagesArr = [];
                      try {
                        imagesArr = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                      } catch (e) {
                        imagesArr = [p.images];
                      }
                      const firstImg = imagesArr[0] || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200&auto=format&fit=crop';

                      return (
                        <tr key={p.id} className="hover:bg-ivory-100/50 transition">
                          <td className="p-4 flex items-center space-x-3">
                            <img
                              src={firstImg}
                              alt={p.title}
                              className="w-12 h-14 object-cover rounded-xl border border-stone-200 bg-stone-100"
                            />
                            <div>
                              <span className="font-bold text-stone-900 block">{p.title}</span>
                              <span className="text-[10px] text-stone-500 font-mono">SKU: {p.sku || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-stone-700 font-semibold">{p.store?.name}</td>
                          <td className="p-4 text-stone-600 font-mono">{p.category?.name}</td>
                          <td className="p-4 font-mono font-bold text-stone-900">{formatPrice(p.price)}</td>
                          <td className="p-4">
                            {p.status === 'APPROVED' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>APPROVED</span>
                              </span>
                            )}
                            {p.status === 'PENDING_APPROVAL' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center space-x-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>PENDING APPROVAL</span>
                              </span>
                            )}
                            {p.status === 'REJECTED' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center space-x-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>REJECTED</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {p.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleUpdateProductStatus(p.id, 'APPROVED')}
                                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-bold shadow-sm transition"
                              >
                                Approve
                              </button>
                            )}
                            {p.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleUpdateProductStatus(p.id, 'REJECTED')}
                                className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-mono text-[11px] font-bold transition"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Orders Management */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">All Customer Orders ({filteredOrders.length})</h2>

              <div className="flex space-x-2 text-xs font-mono font-bold">
                {[
                  { id: 'all', label: `All (${stats?.totalOrders || 0})` },
                  { id: 'PAID', label: `Paid (${stats?.paidOrders || 0})` },
                  { id: 'UNPAID', label: `Unpaid (${stats?.unpaidOrders || 0})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl border transition ${
                      orderStatusFilter === f.id
                        ? 'bg-gold-50 text-gold-700 border-gold-300'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-ivory-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items / Stores</th>
                    <th className="p-4">Total (₹)</th>
                    <th className="p-4">ZYORA Fee</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400 font-serif">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-ivory-100/50 transition font-mono">
                        <td className="p-4 font-bold text-gold-700">
                          <div>{ord.orderNumber}</div>
                          <span className="text-[10px] text-stone-400 block font-normal">{formatDate(ord.createdAt)}</span>
                        </td>
                        <td className="p-4 text-stone-800">
                          <div className="font-bold">{ord.user?.name || 'Customer'}</div>
                          <div className="text-[10px] text-stone-400 font-normal">{ord.user?.email}</div>
                        </td>
                        <td className="p-4 text-stone-600">
                          <div>{ord.items?.length || 0} garments</div>
                          <div className="text-[10px] text-stone-400">
                            {ord.items?.[0]?.sellerStore?.name || 'ZYORA Store'}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-stone-900">{formatPrice(ord.totalAmount)}</td>
                        <td className="p-4 text-emerald-700 font-bold">₹{ord.zyoraCommission?.toFixed(2) || '4.00'}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ord.paymentStatus === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-stone-700">{ord.orderStatus}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg text-gold-700 hover:bg-gold-50 inline-flex items-center space-x-1"
                            title="View Full Order Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-[11px] font-bold">Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Settlements Breakdown */}
        {activeTab === 'SETTLEMENTS' && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Multi-Vendor Settlement Ledger</h2>

            <div className="p-4 rounded-2xl bg-gold-50 border border-gold-200 text-gold-900 text-xs font-mono">
              <strong>Fixed ZYORA Commission Model:</strong> ZYORA retains <strong>₹4.00</strong> platform commission per
              successful customer order. Seller net payout = Gross Sales - Allocated ₹4 Commission.
            </div>

            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Seller Store</th>
                    <th className="p-4">Gross Sales (₹)</th>
                    <th className="p-4">ZYORA Commission (Fixed ₹4 Share)</th>
                    <th className="p-4">Seller Net Payout (₹)</th>
                    <th className="p-4">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stats?.settlementsList?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400 font-serif">
                        No settlements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    stats?.settlementsList?.map((st: any) => (
                      <tr key={st.id} className="hover:bg-ivory-100/50 transition font-mono">
                        <td className="p-4 font-bold text-gold-700">{st.order?.orderNumber}</td>
                        <td className="p-4 text-stone-900 font-bold">{st.sellerStore?.name}</td>
                        <td className="p-4 font-bold text-stone-900">{formatPrice(st.grossAmount)}</td>
                        <td className="p-4 text-rose-700 font-bold">-{formatPrice(st.zyoraCommission)}</td>
                        <td className="p-4 text-emerald-700 font-bold">{formatPrice(st.sellerNetAmount)}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              st.settlementStatus === 'TRANSFERRED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {st.settlementStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Admin Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] uppercase text-gold-700 font-bold block">
                  Master Order Audit
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-ivory-100 border border-stone-200">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-bold text-stone-900">{selectedOrder.user?.name}</span>
                <span className="text-stone-500 block text-[10px]">{selectedOrder.user?.email}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className={`font-bold ${selectedOrder.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">ZYORA Commission</span>
                <span className="font-bold text-emerald-700">₹{selectedOrder.zyoraCommission?.toFixed(2) || '4.00'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Total Order Amount</span>
                <span className="font-bold text-gold-700 text-sm">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm mb-2">Order Line Items</h4>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-4 space-y-2">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-stone-900">{item.product?.title}</p>
                      <p className="text-[10px] text-stone-500">
                        Store: {item.sellerStore?.name} • Qty: {item.quantity} • Size: {item.size}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex justify-between text-stone-500">
                <span>Shipping Address</span>
                <span className="text-stone-900 font-medium text-right max-w-xs truncate">{selectedOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Razorpay Order ID</span>
                <span className="text-stone-800">{selectedOrder.razorpayOrderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Razorpay Payment ID</span>
                <span className="text-stone-800">{selectedOrder.razorpayPaymentId || 'N/A'}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs transition shadow-md"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      <Footer />
      <CartDrawer />
    </main>
  );
}
