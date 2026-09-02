'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import {
  Store,
  DollarSign,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Edit,
  Building2,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS' | 'SETTLEMENTS'>('PRODUCTS');

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    gender: 'UNISEX',
    categoryId: '',
    images: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    sizes: 'S, M, L, XL',
    colors: 'Obsidian Black, Crimson Red',
    stock: '50',
    sku: '',
  });

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchStoreData();
    fetchOrdersData();
    fetchCategories();
  }, []);

  const fetchStoreData = async () => {
    try {
      const res = await fetch('/api/seller/store');
      if (res.ok) {
        const data = await res.json();
        setStore(data.store);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersData = async () => {
    try {
      const res = await fetch('/api/seller/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orderItems || []);
        setSettlements(data.settlements || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setNewProduct((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedSizes = newProduct.sizes.split(',').map((s) => s.trim());
      const formattedColors = newProduct.colors.split(',').map((c) => c.trim());
      const formattedImages = [newProduct.images.trim()];

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          sizes: formattedSizes,
          colors: formattedColors,
          images: formattedImages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowAddModal(false);
        fetchStoreData();
        alert(data.message || 'Product submitted successfully for Admin approval!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add product');
      }
    } catch (e) {
      console.error('Error creating product', e);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      let imagesArr = [editingProduct.images];
      if (typeof editingProduct.images === 'string') {
        try {
          imagesArr = JSON.parse(editingProduct.images);
        } catch (e) {
          imagesArr = [editingProduct.images];
        }
      }

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingProduct.title,
          description: editingProduct.description,
          price: editingProduct.price,
          discountPrice: editingProduct.discountPrice,
          stock: editingProduct.stock,
          sku: editingProduct.sku,
          images: imagesArr,
        }),
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchStoreData();
        alert('Product updated successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update product');
      }
    } catch (e) {
      console.error('Error updating product', e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this garment from your store?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStoreData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete product');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (orderItemId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId, status: newStatus }),
      });
      if (res.ok) {
        fetchOrdersData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalSales = orders.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-8 mb-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 shadow-sm">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-700 font-bold">
                Seller Control Center • India
              </span>
              <h1 className="font-serif text-3xl font-bold text-stone-900">{store?.name || 'Seller Dashboard'}</h1>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Add New Garment</span>
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Total Sales (₹)</span>
              <DollarSign className="w-4 h-4 text-gold-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-gold-700">{formatPrice(totalSales)}</p>
            <p className="text-[10px] text-stone-500">Gross sales from store garments</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Total Products</span>
              <Package className="w-4 h-4 text-gold-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-stone-900">{store?.products?.length || 0}</p>
            <p className="text-[10px] text-stone-500">Garments in your catalog</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-gold-600" />
            </div>
            <p className="font-mono text-2xl font-bold text-stone-900">{orders.length}</p>
            <p className="text-[10px] text-stone-500">Item orders received</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-mono uppercase font-bold">Payout Account</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-mono text-xs font-bold text-stone-900">
              {store?.razorpayAccountId ? `Account: ${store.razorpayAccountId}` : 'Pending Razorpay Route KYC'}
            </p>
            <p className="text-[10px] text-stone-500">Bank Settlement Account</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b border-stone-200 mb-8">
          {[
            { id: 'PRODUCTS', label: `My Products (${store?.products?.length || 0})` },
            { id: 'ORDERS', label: `Orders Fulfillment (${orders.length})` },
            { id: 'SETTLEMENTS', label: `Financial Settlements (${settlements.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-xs font-mono font-bold uppercase tracking-wider transition relative ${
                activeTab === tab.id ? 'text-gold-700 border-b-2 border-gold-600' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Products */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Garment</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (₹)</th>
                    <th className="p-4">Stock / SKU</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {store?.products?.map((prod: any) => {
                    let firstImg = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200&auto=format&fit=crop';
                    try {
                      const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                      if (parsed && parsed.length > 0) firstImg = parsed[0];
                    } catch (e) {}

                    return (
                      <tr key={prod.id} className="hover:bg-ivory-100/50 transition">
                        <td className="p-4 flex items-center space-x-3">
                          <img
                            src={firstImg}
                            alt={prod.title}
                            className="w-12 h-14 object-cover rounded-xl bg-stone-100 border border-stone-200"
                          />
                          <div>
                            <span className="font-bold text-stone-900 block">{prod.title}</span>
                            <span className="text-[10px] text-stone-500 font-mono">{prod.gender}</span>
                          </div>
                        </td>
                        <td className="p-4 text-stone-600 font-mono">{prod.category?.name}</td>
                        <td className="p-4 font-mono font-bold text-stone-900">{formatPrice(prod.price)}</td>
                        <td className="p-4 font-mono text-stone-700">
                          <div>Qty: {prod.stock}</div>
                          <div className="text-[10px] text-stone-400">{prod.sku || 'No SKU'}</div>
                        </td>
                        <td className="p-4">
                          {prod.status === 'APPROVED' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Live in Shop</span>
                            </span>
                          )}
                          {prod.status === 'PENDING_APPROVAL' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Admin Review</span>
                            </span>
                          )}
                          {prod.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center space-x-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                            title="Edit Garment"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Garment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Item</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Price (₹)</th>
                    <th className="p-4">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((item) => (
                    <tr key={item.id} className="hover:bg-ivory-100/50 transition">
                      <td className="p-4 font-mono font-bold text-gold-700">{item.order?.orderNumber}</td>
                      <td className="p-4 text-stone-900 font-bold">
                        {item.product?.title} (x{item.quantity})
                      </td>
                      <td className="p-4 text-stone-600">
                        {item.order?.user?.name}
                        <span className="block text-[10px] text-stone-400">{item.order?.user?.email}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-stone-900">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                      <td className="p-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateOrderStatus(item.id, e.target.value)}
                          className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-gold-500 shadow-sm"
                        >
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Settlements */}
        {activeTab === 'SETTLEMENTS' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gold-50 border border-gold-200 text-gold-900 text-xs font-mono">
              <strong>Fixed ZYORA Commission Model:</strong> ZYORA charges a flat <strong>₹4.00</strong> platform
              commission per order. Settlement status remains <code>PENDING</code> until Razorpay Route / Linked Account is
              verified for your store.
            </div>

            <div className="overflow-x-auto rounded-3xl bg-white border border-stone-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-stone-700 font-mono uppercase border-b border-stone-200 font-bold">
                  <tr>
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Gross Item Sales</th>
                    <th className="p-4">ZYORA Commission (Fixed ₹4 Share)</th>
                    <th className="p-4">Net Seller Payout (₹)</th>
                    <th className="p-4">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400 font-serif">
                        No financial settlement records found yet.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((st) => (
                      <tr key={st.id} className="hover:bg-ivory-100/50 transition font-mono">
                        <td className="p-4 font-bold text-gold-700">{st.order?.orderNumber}</td>
                        <td className="p-4 text-stone-900 font-bold">{formatPrice(st.grossAmount)}</td>
                        <td className="p-4 text-rose-700 font-bold">-{formatPrice(st.zyoraCommission)}</td>
                        <td className="p-4 text-emerald-700 font-bold">{formatPrice(st.sellerNetAmount)}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">Add New Garment (₹ INR)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. Silk Zardozi Embroidered Sherwani"
                  className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Detailed sartorial craftsmanship notes..."
                  className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="18500"
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={newProduct.discountPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, discountPrice: e.target.value })}
                    placeholder="14900"
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Stock / Inventory</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="50"
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="SKU-SILK-001"
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Category</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Gender</label>
                  <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-medium"
                  >
                    <option value="UNISEX">UNISEX</option>
                    <option value="MEN">MEN</option>
                    <option value="WOMEN">WOMEN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={newProduct.images}
                  onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                  className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Sizes</label>
                  <input
                    type="text"
                    value={newProduct.sizes}
                    onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                    placeholder="S, M, L, XL"
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Colors</label>
                  <input
                    type="text"
                    value={newProduct.colors}
                    onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })}
                    placeholder="Obsidian Black, Crimson Red"
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md"
              >
                Submit Garment for Admin Approval
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <h3 className="font-serif text-xl font-bold text-stone-900">Edit Garment Details</h3>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.discountPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discountPrice: e.target.value })}
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">Stock / Inventory</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono uppercase font-bold text-stone-600 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-ivory-200 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold uppercase tracking-widest transition shadow-md"
              >
                Save Garment Modifications
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <CartDrawer />
    </main>
  );
}
