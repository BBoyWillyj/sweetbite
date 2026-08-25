'use client'

import { OrderStatus } from '@/types'
import { Check, Clock, Package } from 'lucide-react'

interface StatusTrackerProps {
  status: OrderStatus
  readyTime?: string
}

export default function StatusTracker({ status, readyTime }: StatusTrackerProps) {
  const statuses: { label: string; icon: React.ReactNode; value: OrderStatus }[] = [
    { label: 'Preparing', icon: <Clock className="w-5 h-5" />, value: 'Preparing' },
    { label: 'Ready', icon: <Package className="w-5 h-5" />, value: 'Ready' },
    { label: 'Picked Up', icon: <Check className="w-5 h-5" />, value: 'PickedUp' },
  ]

  const currentIndex = statuses.findIndex((s) => s.value === status)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {statuses.map((item, index) => (
          <div key={item.value} className="flex flex-col items-center flex-1">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                index <= currentIndex
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {item.icon}
            </div>

            {/* Label */}
            <p
              className={`text-xs font-medium text-center ${
                index <= currentIndex ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {item.label}
            </p>

            {/* Connector */}
            {index < statuses.length - 1 && (
              <div
                className={`absolute h-1 w-12 mt-6 ${
                  index < currentIndex ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Ready Time */}
      {status === 'Ready' && readyTime && (
        <div className="text-center text-sm text-primary font-semibold mt-4">
          Ready at {readyTime}
        </div>
      )}
    </div>
  )
}
