'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useCart } from '@/components/providers/CartProvider'
import { createOrder, updatePaymentStatus } from '@/lib/db'
import { initializePaystackPayment, generatePaystackReference, formatNGN } from '@/lib/paystack'
import { Loader, AlertCircle } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    PaystackPop: any
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const { cart, getTotal, getSubtotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const subtotal = getSubtotal()
  const deliveryFee = subtotal > 0 ? (process.env.NEXT_PUBLIC_DELIVERY_FEE ? parseInt(process.env.NEXT_PUBLIC_DELIVERY_FEE) : 500) : 0
  const total = getTotal()

  useEffect(() => {
    const data = sessionStorage.getItem('checkoutData')
    if (!data || !firebaseUser || cart.items.length === 0) {
      router.push('/cart')
    } else {
      setCheckoutData(JSON.parse(data))
    }
  }, [router, firebaseUser, cart])

  const handlePayWithCard = async () => {
    if (!checkoutData || !firebaseUser) return

    setError(null)
    setLoading(true)

    try {
      // Create order first with 'pending' status
      const orderData = {
        userId: firebaseUser.uid,
        customerName: checkoutData.customerName,
        phone: checkoutData.phone,
        email: checkoutData.email,
        items: cart.items.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        pickupTime: `${checkoutData.pickupDate} ${checkoutData.pickupTime}`,
        status: 'Preparing' as const,
        paymentStatus: 'pending' as const,
      }

      const orderRef = await createOrder(orderData)
      setOrderId(orderRef.id)

      // Initialize Paystack payment
      const reference = generatePaystackReference()
      const paystackResponse = await initializePaystackPayment({
        email: checkoutData.email,
        amount: total,
        reference,
        metadata: {
          orderId: orderRef.id,
          customerName: checkoutData.customerName,
        },
      })

      if (!paystackResponse.data?.authorization_url) {
        throw new Error('Failed to initialize payment')
      }

      // Open Paystack checkout
      if (window.PaystackPop) {
        window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: checkoutData.email,
          amount: Math.round(total * 100),
          ref: reference,
          currency: 'NGN',
          onClose: () => {
            setLoading(false)
            setError('Payment cancelled. Your order is saved.')
          },
          onSuccess: async (response: any) => {
            try {
              // Update order with payment status
              await updatePaymentStatus(orderRef.id, 'completed', reference)
              clearCart()
              sessionStorage.removeItem('checkoutData')
              router.push(`/order-confirmation/${orderRef.id}`)
            } catch (err) {
              console.error('Error updating payment:', err)
              setError('Payment successful but order update failed. Please contact support.')
            } finally {
              setLoading(false)
            }
          },
        })

        window.PaystackPop.openIframe()
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Failed to process payment')
      setLoading(false)
    }
  }

  const handlePayWithCash = async () => {
    if (!checkoutData || !firebaseUser) return

    setError(null)
    setLoading(true)

    try {
      const orderData = {
        userId: firebaseUser.uid,
        customerName: checkoutData.customerName,
        phone: checkoutData.phone,
        email: checkoutData.email,
        items: cart.items.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        pickupTime: `${checkoutData.pickupDate} ${checkoutData.pickupTime}`,
        status: 'Preparing' as const,
        paymentStatus: 'pending' as const,
      }

      const orderRef = await createOrder(orderData)
      clearCart()
      sessionStorage.removeItem('checkoutData')
      router.push(`/order-confirmation/${orderRef.id}`)
    } catch (err: any) {
      console.error('Order creation error:', err)
      setError(err.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  if (!checkoutData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" />
      <div className="max-w-md">
        <h1 className="text-3xl font-bold mb-6">Payment</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="card p-4 mb-6">
          <h2 className="font-bold mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm mb-4 pb-4 border-b">
            {cart.items.map((item) => (
              <div key={item.itemId} className="flex justify-between">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>{formatNGN(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatNGN(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span>{formatNGN(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-primary text-lg">{formatNGN(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          {/* Card Payment */}
          <label className="relative">
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash')}
              className="sr-only"
            />
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'card'
                  ? 'border-primary bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">💳 Debit/Credit Card (Paystack)</div>
              <p className="text-sm text-gray-600 mt-1">
                Pay securely with your card via Paystack
              </p>
            </div>
          </label>

          {/* Cash Payment */}
          <label className="relative">
            <input
              type="radio"
              name="payment"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'cash')}
              className="sr-only"
            />
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'cash'
                  ? 'border-primary bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">💵 Cash on Pickup</div>
              <p className="text-sm text-gray-600 mt-1">
                Pay when you pick up your order
              </p>
            </div>
          </label>
        </div>

        {/* CTA Button */}
        <button
          onClick={paymentMethod === 'card' ? handlePayWithCard : handlePayWithCash}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Complete Payment - ${formatNGN(total)}`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secure and encrypted
        </p>
      </div>
    </>
  )
}
