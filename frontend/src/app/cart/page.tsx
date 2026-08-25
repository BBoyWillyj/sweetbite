'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import CartItemComponent from '@/components/CartItemComponent'
import { useCart } from '@/components/providers/CartProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatNGN } from '@/lib/paystack'
import { ShoppingCart } from 'lucide-react'

export default function CartPage() {
  const { cart, getSubtotal, getTotal } = useCart()
  const { firebaseUser } = useAuth()
  const subtotal = getSubtotal()
  const deliveryFee = subtotal > 0 ? (process.env.NEXT_PUBLIC_DELIVERY_FEE ? parseInt(process.env.NEXT_PUBLIC_DELIVERY_FEE) : 500) : 0
  const total = getTotal()

  const isEmpty = cart.items.length === 0

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
          <Link href="/" className="text-primary hover:underline text-sm mb-6 inline-block">
            ← Continue Shopping
          </Link>

          {/* Empty State */}
          {isEmpty ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some delicious shawarma to get started!</p>
              <Link href="/" className="btn-primary">
                Browse Menu
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <CartItemComponent key={item.itemId} item={item} />
                ))}
              </div>

              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Special Instructions (Optional)</label>
                <textarea
                  placeholder="e.g., extra garlic, no onions, no tomatoes..."
                  defaultValue={cart.note}
                  className="input-field resize-none"
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="card p-4 mb-6">
                <div className="space-y-2 mb-4 border-b pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatNGN(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-semibold">{formatNGN(deliveryFee)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatNGN(total)}</span>
                </div>
              </div>

              {/* CTA */}
              {!firebaseUser ? (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 mb-3">
                    Please sign in to continue with checkout
                  </p>
                  <Link href="/auth/login" className="btn-primary">
                    Sign In to Checkout
                  </Link>
                </div>
              ) : (
                <Link href="/checkout/contact" className="btn-primary block text-center">
                  Proceed to Checkout
                </Link>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
