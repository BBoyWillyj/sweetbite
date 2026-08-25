'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getAllMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/db'
import { MenuItem } from '@/types'
import { formatNGN } from '@/lib/paystack'
import { Loader, Plus, Trash2, Edit2, AlertCircle, Check } from 'lucide-react'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=300&h=300&fit=crop'

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: PLACEHOLDER_IMAGE,
    dietary: [] as string[],
    available: true,
  })

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      const menuItems = await getAllMenuItems()
      setItems(menuItems)
    } catch (err) {
      console.error('Failed to load menu:', err)
      setError('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      imageUrl: PLACEHOLDER_IMAGE,
      dietary: [],
      available: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEditClick = (item: MenuItem) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      imageUrl: item.imageUrl,
      dietary: item.dietary || [],
      available: item.available,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    error && setError(null)

    try {
      if (editingId) {
        await updateMenuItem(editingId, {
          id: editingId,
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          imageUrl: formData.imageUrl,
          dietary: formData.dietary,
          available: formData.available,
          createdAt: new Date(),
        })
      } else {
        await addMenuItem({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          imageUrl: formData.imageUrl,
          dietary: formData.dietary,
          available: formData.available,
        })
      }
      await loadMenu()
      resetForm()
    } catch (err) {
      console.error('Error saving item:', err)
      setError('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setDeleting(id)
    try {
      await deleteMenuItem(id)
      await loadMenu()
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Failed to delete item')
    } finally {
      setDeleting(null)
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Items</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field col-span-2"
                required
              />

              <input
                type="number"
                placeholder="Price (₦)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                step="0.01"
                required
              />

              <input
                type="text"
                placeholder="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="input-field"
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field col-span-2 resize-none"
                rows={2}
                required
              />

              <label className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Available</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No items yet. Create your first menu item!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Image */}
              <div className="relative w-full h-40 bg-gray-200">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                {!item.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold">Unavailable</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                <p className="text-2xl font-bold text-primary mb-4">{formatNGN(item.price)}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="flex-1 bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="flex-1 bg-red-100 text-red-700 font-semibold py-2 rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting === item.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
