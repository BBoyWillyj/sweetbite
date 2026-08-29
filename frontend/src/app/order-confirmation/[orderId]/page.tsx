'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import StatusTracker from '@/components/StatusTracker'
import { getOrder } from '@/lib/db'
import { Order } from '@/types'
import { formatNGN } from '@/lib/paystack'
import { Loader, CheckCircle, AlertCircle, MapPin } from 'lucide-react'
import { StepIndicator } from '@/components/StepIndicator'


export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderData = await getOrder(orderId)
        if (!orderData) {
          setError('Order not found')
        } else {
          setOrder(orderData)
        }
      } catch (err) {
        console.error('Error loading order:', err)
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  if (loading) {
    return (
      <>
        <Header />
        <StepIndicator current={4} />
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <StepIndicator current={4} />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/" className="btn-primary">
                Back to Menu
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  const readyTime = order.createdAt
    ? new Date(order.createdAt.getTime() + 15 * 60000).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : undefined

  return (
    <>
      <Header />
      <StepIndicator current={4} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Your delicious order is being prepared</p>
          </div>

          {/* Order Number */}
          <div className="card p-6 text-center mb-6">
            <p className="text-gray-600 text-sm mb-1">Order Number</p>
            <p className="text-2xl font-mono font-bold text-primary">{order.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Status Tracker */}
          <div className="card p-6 mb-6">
            <StatusTracker status={order.status} readyTime={readyTime} />
            {order.status === 'Preparing' && (
              <p className="text-center text-sm text-gray-600 mt-4">
                Estimated ready time: <span className="font-bold">{readyTime}</span>
              </p>
            )}
          </div>

          {/* Pickup Details */}
          <div className="card p-6 mb-6">
            <h2 className="font-bold mb-4">Pickup Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold">{order.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pickup Time</p>
                <p className="font-semibold">{order.pickupTime}</p>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="font-semibold">
                    {process.env.NEXT_PUBLIC_PICKUP_ADDRESS || 'Back of Amac, Lugbe, Abuja'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card p-6 mb-6">
            <h2 className="font-bold mb-4">Your Order</h2>
            <div className="space-y-2 mb-4 pb-4 border-b">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
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
                <span>{formatNGN(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span>{formatNGN(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatNGN(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {order.paymentStatus === 'completed' && (
            <div className="card p-4 mb-6 bg-green-50 border border-green-200">
              <p className="text-sm text-green-900">
                ✓ Payment successful. Your order is confirmed.
              </p>
            </div>
          )}

          {order.paymentStatus === 'pending' && order.paymentMethod === 'card' && (
            <div className="card p-4 mb-6 bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-900">
                ⏳ Payment pending. Please complete payment before pickup.
              </p>
            </div>
          )}

          {order.paymentMethod === 'cash' && order.status !== 'PickedUp' && (
            <div className="card p-4 mb-6 bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                💵 Pay with cash when you collect your order.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/" className="btn-primary block text-center">
              Back to Menu
            </Link>
            <Link
              href="/order-history"
              className="btn-secondary w-full text-center"
            >
              View Order History
            </Link>
          </div>

          {/* Share */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'SweetBites Order',
                    text: `Check my order status for SweetBites: ${order.id.slice(0, 8).toUpperCase()}`,
                  })
                }
              }}
              className="text-primary hover:underline text-sm"
            >
              Share Order
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
