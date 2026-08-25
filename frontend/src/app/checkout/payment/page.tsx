'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useCart } from '@/components/providers/CartProvider'
import { createOrder } from '@/lib/db'
import { initializePayment, verifyPayment } from '@/lib/api'   // ← backend calls
import { formatNGN } from '@/lib/paystack'
import { Loader, AlertCircle, CreditCard, Banknote } from 'lucide-react'

const DELIVERY_FEE = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE ?? 500)

export default function PaymentPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const { cart, getTotal, getSubtotal, clearCart } = useCart()

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<any>(null)

  const subtotal = getSubtotal()
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0
  const total = getTotal()

  // ── On mount — load session data, guard against direct navigation ──────────
  useEffect(() => {
    const raw = sessionStorage.getItem('checkoutData')
    if (!raw || !firebaseUser || cart.items.length === 0) {
      router.replace('/cart')
      return
    }
    setCheckoutData(JSON.parse(raw))
  }, [firebaseUser, cart, router])

  // ── After user returns from Paystack redirect ─────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference')
    const orderId = params.get('orderId')

    if (reference && orderId) {
      handleVerifyAfterRedirect(reference, orderId)
    }
  }, [])

  async function handleVerifyAfterRedirect(reference: string, orderId: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await verifyPayment(reference, orderId)

      if (result.status === 'success') {
        clearCart()
        sessionStorage.removeItem('checkoutData')
        router.replace(`/order-confirmation/${orderId}`)
      } else {
        setError(`Payment ${result.status}. Please try again.`)
      }
    } catch (err: any) {
      setError(err.message || 'Could not verify payment. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  // ── Card payment — backend initializes Paystack, we redirect ─────────────
  async function handleCardPayment() {
    if (!checkoutData || !firebaseUser) return
    setError(null)
    setLoading(true)

    try {
      // 1. Write order to Firestore first (status: pending)
      const orderRef = await createOrder({
        userId: firebaseUser.uid,
        customerName: checkoutData.customerName,
        phone: checkoutData.phone,
        email: checkoutData.email,
        items: cart.items.map(({ itemId, name, price, quantity }) => ({
          itemId,
          name,
          price,
          quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        pickupTime: `${checkoutData.pickupDate} ${checkoutData.pickupTime}`,
        status: 'Preparing',
        paymentStatus: 'pending',
      })

      const orderId = orderRef.id

      // 2. Ask backend to create Paystack transaction
      //    Backend holds the secret key — frontend only gets back a URL
      const { authorizationUrl } = await initializePayment({
        orderId,
        email: checkoutData.email,
        amount: total,
        customerName: checkoutData.customerName,
        items: cart.items,
        pickupTime: `${checkoutData.pickupDate} ${checkoutData.pickupTime}`,
      })

      // 3. Redirect user to Paystack's hosted checkout page
      //    After payment, Paystack redirects back to this page with
      //    ?reference=xxx&orderId=xxx (we append orderId to the callback URL
      //    via metadata — or you can store it in sessionStorage as below)
      sessionStorage.setItem('pendingOrderId', orderId)
      window.location.href = authorizationUrl

    } catch (err: any) {
      console.error('[Payment] Error:', err)
      setError(err.message || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  // ── Cash payment — just write the order and redirect ──────────────────────
  async function handleCashPayment() {
    if (!checkoutData || !firebaseUser) return
    setError(null)
    setLoading(true)

    try {
      const orderRef = await createOrder({
        userId: firebaseUser.uid,
        customerName: checkoutData.customerName,
        phone: checkoutData.phone,
        email: checkoutData.email,
        items: cart.items.map(({ itemId, name, price, quantity }) => ({
          itemId,
          name,
          price,
          quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        pickupTime: `${checkoutData.pickupDate} ${checkoutData.pickupTime}`,
        status: 'Preparing',
        paymentStatus: 'pending',     // cashier confirms at pickup
      })

      clearCart()
      sessionStorage.removeItem('checkoutData')
      router.push(`/order-confirmation/${orderRef.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Guard render ──────────────────────────────────────────────────────────
  if (!checkoutData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <h1 className="text-3xl font-bold mb-6">Payment</h1>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Payment issue</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Order Summary ── */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold mb-3">Order Summary</h2>
        <div className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-100">
          {cart.items.map((item) => (
            <div key={item.itemId} className="flex justify-between">
              <span className="text-gray-700">
                {item.name} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-medium">{formatNGN(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatNGN(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery fee</span>
            <span>{formatNGN(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3 mt-1">
            <span>Total</span>
            <span className="text-primary text-lg">{formatNGN(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <p className="text-sm font-semibold text-gray-700 mb-3">Choose payment method</p>
      <div className="space-y-3 mb-6">
        {/* Card via Paystack */}
        <label className="block cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
            className="sr-only"
          />
          <div
            className={`p-4 border-2 rounded-xl transition-all flex items-start gap-3 ${
              paymentMethod === 'card'
                ? 'border-primary bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Debit / Credit Card</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Secured by Paystack — your card details never touch our servers
              </p>
            </div>
          </div>
        </label>

        {/* Cash on pickup */}
        <label className="block cursor-pointer">
          <input
            type="radio"
            name="payment"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={() => setPaymentMethod('cash')}
            className="sr-only"
          />
          <div
            className={`p-4 border-2 rounded-xl transition-all flex items-start gap-3 ${
              paymentMethod === 'cash'
                ? 'border-primary bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Banknote className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Cash on Pickup</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Pay in cash when you collect your order
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* ── CTA ── */}
      <button
        onClick={paymentMethod === 'card' ? handleCardPayment : handleCashPayment}
        disabled={loading}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            {paymentMethod === 'card' ? 'Redirecting to Paystack…' : 'Placing order…'}
          </>
        ) : (
          `${paymentMethod === 'card' ? 'Pay' : 'Place Order'} — ${formatNGN(total)}`
        )}
      </button>

      <p className="text-xs text-gray-400 text-center mt-4">
        {paymentMethod === 'card'
          ? 'You will be redirected to Paystack secure checkout page.'
          : 'Your order will be confirmed immediately.'}
      </p>
    </div>
  )
}
