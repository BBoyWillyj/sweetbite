import axios from 'axios'

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface PaystackInitializePayload {
  email: string
  amount: number        // in kobo (naira * 100)
  reference: string
  callback_url?: string
  metadata?: Record<string, any>
  currency?: string
  channels?: string[]
}

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
    id: number
    reference: string
    amount: number        // in kobo
    status: 'success' | 'failed' | 'abandoned' | 'pending'
    paid_at: string | null
    currency: string
    customer: {
      id: number
      email: string
      customer_code: string
    }
    metadata: Record<string, any>
  }
}

export async function initializeTransaction(
  payload: PaystackInitializePayload
): Promise<PaystackInitializeResponse> {
  const { data } = await paystackClient.post<PaystackInitializeResponse>(
    '/transaction/initialize',
    payload
  )
  return data
}

export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const { data } = await paystackClient.get<PaystackVerifyResponse>(
    `/transaction/verify/${reference}`
  )
  return data
}

export function generateReference(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `SB-${timestamp}-${random}`
}

export function toKobo(naira: number): number {
  return Math.round(naira * 100)
}

export function toNaira(kobo: number): number {
  return kobo / 100
}

export default paystackClient
