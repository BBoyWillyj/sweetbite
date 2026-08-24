'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, Clock } from 'lucide-react'

const TIME_SLOTS = [
  'ASAP',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
]

export default function PickupPage() {
  const router = useRouter()
  const [pickupDate, setPickupDate] = useState<'today' | 'tomorrow'>('today')
  const [pickupTime, setPickupTime] = useState('ASAP')
  const [loading, setLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState<any>(null)

  useEffect(() => {
    const data = sessionStorage.getItem('checkoutData')
    if (!data) {
      router.push('/checkout/contact')
    } else {
      setCheckoutData(JSON.parse(data))
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updatedData = {
        ...checkoutData,
        pickupDate,
        pickupTime,
      }
      sessionStorage.setItem('checkoutData', JSON.stringify(updatedData))
      router.push('/checkout/payment')
    } catch (error) {
      console.error('Error:', error)
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
    <div className="max-w-md">
      <h1 className="text-3xl font-bold mb-6">Pickup Time</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">When do you want it?</label>
          <div className="flex gap-3">
            <label className="flex-1 relative">
              <input
                type="radio"
                name="date"
                value="today"
                checked={pickupDate === 'today'}
                onChange={(e) => setPickupDate(e.target.value as 'today' | 'tomorrow')}
                className="sr-only"
              />
              <div
                className={`p-4 border-2 rounded-lg text-center font-semibold cursor-pointer transition-all ${
                  pickupDate === 'today'
                    ? 'border-primary bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Today
              </div>
            </label>
            <label className="flex-1 relative">
              <input
                type="radio"
                name="date"
                value="tomorrow"
                checked={pickupDate === 'tomorrow'}
                onChange={(e) => setPickupDate(e.target.value as 'today' | 'tomorrow')}
                className="sr-only"
              />
              <div
                className={`p-4 border-2 rounded-lg text-center font-semibold cursor-pointer transition-all ${
                  pickupDate === 'tomorrow'
                    ? 'border-primary bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Tomorrow
              </div>
            </label>
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Pickup time</label>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((time) => (
              <label key={time} className="relative">
                <input
                  type="radio"
                  name="time"
                  value={time}
                  checked={pickupTime === time}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`p-3 border-2 rounded-lg text-center font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    pickupTime === time
                      ? 'border-primary bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${time === 'ASAP' ? 'col-span-2' : ''}`}
                >
                  {time === 'ASAP' && <Clock className="w-4 h-4" />}
                  {time}
                  {time === 'ASAP' && (
                    <span className="text-xs text-primary font-normal ml-1">Recommended</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Continue...
            </>
          ) : (
            'Continue to Payment'
          )}
        </button>
      </form>

      {/* Pickup Location Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Pickup Location:</span>
          <br />
          {process.env.NEXT_PUBLIC_PICKUP_ADDRESS || 'Back of Amac, Lugbe, Abuja'}
        </p>
      </div>
    </div>
  )
}
