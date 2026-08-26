'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { useAuth } from '@/components/providers/AuthProvider'
import { getUserOrders } from '@/lib/db'
import { Order } from '@/types'
import { formatNGN } from '@/lib/paystack'
import { Loader, AlertCircle } from 'lucide-react'

export default function OrderHistoryPage() {
  const { firebaseUser, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrders() {
      if (!firebaseUser) {
        setLoading(false)
        return
      }

      try {
        const userOrders = await getUserOrders(firebaseUser.uid)
        setOrders(userOrders)
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError('Failed to load order history')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadOrders()
    }
  }, [firebaseUser, authLoading])

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!firebaseUser) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Order History</h1>
              <p className="text-gray-600 mb-6">Sign in to view your orders</p>
              <Link href="/auth/login" className="btn-primary">
                Sign In
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">Order History</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-900">{error}</p>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Link href="/" className="btn-primary">
                Start Ordering
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/order-confirmation/${order.id}`}>
                  <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          {order.createdAt.toLocaleDateString('en-NG')}
                        </p>
                        <p className="font-mono text-sm font-bold text-primary">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {formatNGN(order.total)}
                        </p>
                        <p className={`text-xs font-semibold ${order.paymentStatus === 'completed'
                            ? 'text-green-600'
                            : order.paymentMethod === 'cash'
                              ? 'text-blue-600'
                              : order.paymentStatus === 'pending'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}>
                          {order.paymentStatus === 'completed' && '✓ Paid'}
                          {order.paymentMethod === 'cash' && order.paymentStatus !== 'completed' && '💵 Cash'}
                          {order.paymentMethod !== 'cash' && order.paymentStatus === 'pending' && '⏳ Pending'}
                          {order.paymentStatus === 'failed' && '✗ Failed'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b">
                      <p className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm line-clamp-1">
                        {order.items.map((item) => item.name).join(', ')}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${order.status === 'PickedUp'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'Ready'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {order.pickupTime}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-primary hover:underline">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
