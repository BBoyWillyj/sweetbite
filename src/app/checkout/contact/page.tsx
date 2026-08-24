'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useCart } from '@/components/providers/CartProvider'
import { Loader } from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()
  const { firebaseUser, loading: authLoading } = useAuth()
  const { cart } = useCart()
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!authLoading) {
      if (!firebaseUser) {
        router.push('/auth/login')
      } else if (cart.items.length === 0) {
        router.push('/cart')
      }
    }
  }, [authLoading, firebaseUser, cart, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Save to sessionStorage for next step
      sessionStorage.setItem('checkoutData', JSON.stringify(formData))
      router.push('/checkout/pickup')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <h1 className="text-3xl font-bold mb-6">Your Contact Info</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Your full name"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+234 800 123 4567"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={firebaseUser?.email}
            className="input-field"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Continue...
            </>
          ) : (
            'Continue to Pickup Time'
          )}
        </button>
      </form>
    </div>
  )
}
