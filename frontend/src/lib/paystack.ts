/**
 * paystack.ts (frontend)
 *
 * Only utility functions live here — no Paystack API calls.
 * All actual Paystack API communication is handled by the backend.
 * This file is safe to import in any client component.
 */

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
