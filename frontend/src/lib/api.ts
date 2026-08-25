/**
 * api.ts
 *
 * Thin client for communicating with the SweetBites backend.
 * Only payment-related calls go here — everything else (menu, orders,
 * auth) still talks to Firebase directly.
 *
 * Every request automatically attaches the Firebase ID token in the
 * Authorization header so the backend can verify the caller.
 */

import { auth } from './firebase'
import { CartItem } from '@/types'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getIdToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('User is not authenticated')
  return user.getIdToken()
}

async function backendFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getIdToken()

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const json = await response.json()

  if (!response.ok) {
    // Throw with backend's message so it surfaces in UI
    throw new Error(json.message || `Request failed: ${response.status}`)
  }

  return json
}

// ─── Payment API ──────────────────────────────────────────────────────────────

export interface InitializePaymentPayload {
  orderId: string
  email: string
  amount: number
  customerName: string
  items: CartItem[]
  pickupTime: string
}

export interface InitializePaymentResult {
  authorizationUrl: string
  accessCode: string
  reference: string
}

/**
 * Calls backend to create a Paystack transaction.
 * Returns the Paystack authorization URL and payment reference.
 */
export async function initializePayment(
  payload: InitializePaymentPayload
): Promise<InitializePaymentResult> {
  const response = await backendFetch<{
    success: boolean
    data: InitializePaymentResult
  }>('/api/payments/initialize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

/**
 * Calls backend to verify a Paystack payment after the user returns
 * from the Paystack checkout page. Updates the Firestore order status
 * internally — frontend just polls Firestore for the live update.
 */
export async function verifyPayment(
  reference: string,
  orderId: string
): Promise<{ status: string; orderId: string; amountPaid?: number }> {
  const response = await backendFetch<{
    success: boolean
    data: { status: string; orderId: string; amountPaid?: number }
  }>('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ reference, orderId }),
  })

  return response.data
}

/**
 * Lightweight status poll — use when you need to check payment state
 * without triggering a full verify cycle.
 */
export async function getPaymentStatus(
  reference: string
): Promise<{ status: string; amount?: number; paidAt?: string }> {
  const response = await backendFetch<{
    success: boolean
    data: { status: string; amount?: number; paidAt?: string }
  }>(`/api/payments/status/${reference}`)

  return response.data
}
