'use client'

import Header from '@/components/Header'
import { StepIndicator } from '@/components/StepIndicator'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const stepMap: { [key: string]: number } = {
    contact: 1,
    pickup: 2,
    payment: 3,
    confirmation: 4,
  }
  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? ''
  const currentStep = stepMap[lastSegment] ?? 1

  return (
    <>
      <Header />
      <StepIndicator current={currentStep} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">{children}</div>
      </main>
    </>
  )
}
