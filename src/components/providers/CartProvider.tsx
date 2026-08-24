'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Cart, CartItem } from '@/types'

interface CartContextType {
  cart: Cart
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setNote: (note: string) => void
  clearCart: () => void
  getTotal: () => number
  getSubtotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'sweetbites_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] })
  const [hydrated, setHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEY)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to load cart:', error)
      }
    }
    setHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    }
  }, [cart, hydrated])

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.items.find((item) => item.itemId === newItem.itemId)
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.itemId === newItem.itemId
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          ),
        }
      }
      return { ...prev, items: [...prev.items, newItem] }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.itemId !== itemId),
    }))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.itemId === itemId ? { ...item, quantity } : item
        ),
      }))
    }
  }

  const setNote = (note: string) => {
    setCart((prev) => ({ ...prev, note }))
  }

  const clearCart = () => {
    setCart({ items: [] })
  }

  const getSubtotal = () => {
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotal = () => {
    const subtotal = getSubtotal()
    const deliveryFee = subtotal > 0 ? (process.env.NEXT_PUBLIC_DELIVERY_FEE ? parseInt(process.env.NEXT_PUBLIC_DELIVERY_FEE) : 500) : 0
    return subtotal + deliveryFee
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setNote,
        clearCart,
        getTotal,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
