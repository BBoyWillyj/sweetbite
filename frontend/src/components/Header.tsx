'use client'

import Link from 'next/link'
import { useAuth } from './providers/AuthProvider'
import { useCart } from './providers/CartProvider'
import { useState } from 'react'
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react'

export default function Header() {
  const { firebaseUser, user, signOut } = useAuth()
  const { cart } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🌯</span>
          </div>
          <span className="font-bold text-lg hidden sm:inline">SweetBites</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {firebaseUser ? (
            <>
              <span className="text-sm text-gray-600">{firebaseUser.email}</span>
              {user?.role === 'admin' && (
                <Link href="/admin" className="text-primary font-medium hover:underline">
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {firebaseUser && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden sm:inline text-sm text-primary hover:underline"
            >
              Admin
            </Link>
          )}

          <Link href="/cart" className="relative">
            <ShoppingCart className="w-6 h-6 text-primary hover:text-orange-600" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="max-w-md mx-auto px-4 py-4 space-y-4">
            {firebaseUser ? (
              <>
                <div className="text-sm text-gray-600">{firebaseUser.email}</div>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block text-primary font-medium hover:underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="block text-primary font-medium hover:underline"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
