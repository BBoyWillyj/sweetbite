'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types'
import { useCart } from './providers/CartProvider'
import { formatNGN } from '@/lib/paystack'
import { Minus, Plus } from 'lucide-react'

interface ProductCardProps {
  item: MenuItem
}

export default function ProductCard({ item }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    addToCart({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      imageUrl: item.imageUrl,
    })
    setQuantity(1)
  }

  return (
    <div className="card overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-40 bg-gray-200">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
        />
        {item.dietary && item.dietary.length > 0 && (
          <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
            {item.dietary[0]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{item.description}</p>

        {/* Price */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{formatNGN(item.price)}</span>
        </div>

        {/* Quantity & Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary flex-1"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
