'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  sellerStoreId: string;
  sellerStoreName: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalAmount: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isInitialized = useRef(false);

  // Safely load cart from localStorage once on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zyora_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    } finally {
      isInitialized.current = true;
    }
  }, []);

  // Save to localStorage only after initialization has completed
  useEffect(() => {
    if (!isInitialized.current) return;
    try {
      localStorage.setItem('zyora_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }, [cart]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'id'>) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          i.size === newItem.size &&
          i.color === newItem.color
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }

      const id = `${newItem.productId}-${newItem.size}-${newItem.color}-${Date.now()}`;
      return [...prevCart, { ...newItem, id }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const contextValue = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      itemCount,
      isCartOpen,
      setIsCartOpen,
    }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, itemCount, isCartOpen]
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
