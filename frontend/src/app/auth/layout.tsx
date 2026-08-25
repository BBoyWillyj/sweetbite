import Header from '@/components/Header'
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-sm mx-auto px-4 py-12">{children}</div>
      </main>
    </>
  )
}
