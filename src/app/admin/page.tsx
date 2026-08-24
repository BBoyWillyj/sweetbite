'use client'

import { useEffect, useState } from 'react'
import { subscribeToOrders, updateOrderStatus } from '@/lib/db'
import { Order, OrderStatus } from '@/types'
import { formatNGN } from '@/lib/paystack'
import { AlertCircle, Loader, CheckCircle } from 'lucide-react'

const STATUS_COLORS: { [key in OrderStatus]: string } = {
  Preparing: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-blue-100 text-blue-700',
  PickedUp: 'bg-green-100 text-green-700',
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToOrders((orders) => {
      setOrders(orders)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const nextStatus: { [key in OrderStatus]: OrderStatus } = {
    Preparing: 'Ready',
    Ready: 'PickedUp',
    PickedUp: 'PickedUp', // No change
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No orders yet
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono font-bold text-lg">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="mb-4 pb-4 border-b">
                <h3 className="font-bold mb-2">{order.customerName}</h3>
                <p className="text-sm text-gray-600">
                  📞 {order.phone}
                </p>
                <p className="text-sm text-gray-600">
                  📧 {order.email}
                </p>
              </div>

              {/* Items */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Items:</p>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-sm">
                      {item.name} x{item.quantity} - {formatNGN(item.price * item.quantity)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Pickup Info */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-600 mb-1">Pickup Time</p>
                <p className="font-semibold">{order.pickupTime}</p>
              </div>

              {/* Payment & Total */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-semibold ${
                    order.paymentStatus === 'completed'
                      ? 'text-green-600'
                      : order.paymentStatus === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}>
                    {order.paymentStatus === 'completed' && '✓ Paid'}
                    {order.paymentStatus === 'pending' && '⏳ Pending'}
                    {order.paymentStatus === 'failed' && '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatNGN(order.total)}</span>
                </div>
              </div>

              {/* Status Update Button */}
              {order.status !== 'PickedUp' && (
                <button
                  onClick={() => handleStatusChange(order.id, nextStatus[order.status])}
                  disabled={updatingId === order.id}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {updatingId === order.id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark as {nextStatus[order.status]}
                    </>
                  )}
                </button>
              )}

              {order.status === 'PickedUp' && (
                <div className="w-full text-center py-2 text-gray-600 font-semibold">
                  ✓ Order Completed
                </div>
              )}

              {/* Order Time */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Ordered: {order.createdAt.toLocaleString('en-NG')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
