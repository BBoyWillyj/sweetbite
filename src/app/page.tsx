'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import ProductCard from '@/components/ProductCard'
import { getMenuItems } from '@/lib/db'
import { MenuItem } from '@/types'
import { AlertCircle, Loader } from 'lucide-react'

export default function Home() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMenu() {
      try {
        const menuItems = await getMenuItems()
        setItems(menuItems)
      } catch (err) {
        console.error('Failed to load menu:', err)
        setError('Failed to load menu items. Please refresh.')
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">SweetBites</h1>
            <p className="text-gray-600">Fresh shawarma, always ready</p>
            <p className="text-sm text-gray-500 mt-1">Back of Amac, Lugbe, Abuja</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Loading menu...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No items available right now</p>
              <button onClick={() => window.location.reload()} className="btn-primary w-full md:w-64">
                Refresh
              </button>
            </div>
          )}

          {/* Menu Grid */}
          {!loading && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {items.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>

              {/* Quick CTA */}
              <div className="text-center text-sm text-gray-600 mb-4">
                <p>Ready to order?</p>
                <Link href="/cart" className="text-primary font-semibold hover:underline">
                  View your cart →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
