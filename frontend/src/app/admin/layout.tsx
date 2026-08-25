'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Header from '@/components/Header'
import Link from 'next/link'
import { Loader } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Admin Nav */}
          <div className="flex gap-4 mb-8 border-b pb-4">
            <Link
              href="/admin"
              className="font-semibold text-primary hover:underline"
            >
              Orders
            </Link>
            <Link
              href="/admin/menu"
              className="font-semibold text-gray-600 hover:text-gray-900"
            >
              Menu
            </Link>
          </div>

          {children}
        </div>
      </main>
    </>
  )
}
