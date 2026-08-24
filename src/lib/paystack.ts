export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    reference: string
    amount: number
    status: 'success' | 'failed'
    paid_at?: string
    customer: {
      id: number
      email: string
    }
  }
}

export async function initializePaystackPayment({
  email,
  amount,
  reference,
  metadata,
}: {
  email: string
  amount: number
  reference: string
  metadata: any
}): Promise<PaystackInitializeResponse> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      metadata,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to initialize payment')
  }

  return await response.json()
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to verify payment')
  }

  return await response.json()
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generatePaystackReference(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`
}
