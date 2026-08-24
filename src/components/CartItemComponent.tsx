'use client'

import Image from 'next/image'
import { CartItem } from '@/types'
import { useCart } from './providers/CartProvider'
import { formatNGN } from '@/lib/paystack'
import { Minus, Plus, Trash2 } from 'lucide-react'

interface CartItemComponentProps {
  item: CartItem
}

export default function CartItemComponent({ item }: CartItemComponentProps) {
  const { updateQuantity, removeFromCart } = useCart()

  return (
    <div className="card p-4 flex gap-4">
      {/* Image */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold mb-1">{item.name}</h3>
        <p className="text-primary font-semibold mb-3">{formatNGN(item.price)}</p>

        {/* Quantity & Remove */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
              className="p-1 hover:bg-gray-100"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 py-1 text-sm font-semibold">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
              className="p-1 hover:bg-gray-100"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => removeFromCart(item.itemId)}
            className="text-red-600 hover:text-red-700 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <p className="text-sm text-gray-600 mb-1">Subtotal</p>
        <p className="font-bold text-lg">{formatNGN(item.price * item.quantity)}</p>
      </div>
    </div>
  )
}
