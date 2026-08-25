import { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth'
import {
  initializeTransaction,
  verifyTransaction,
  generateReference,
  toKobo,
  toNaira,
} from '../config/paystack'
import { db } from '../config/firebase'
import { InitializePaymentBody, VerifyPaymentBody } from '../types'
import { createError } from '../middleware/errorHandler'
import admin from '../config/firebase'

const router = Router()

/**
 * POST /api/payments/initialize
 *
 * Called by the frontend when user clicks "Pay with Card".
 * Creates the Paystack transaction and returns the payment URL.
 *
 * Protected: requires Firebase ID token.
 */
router.post(
  '/initialize',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId, email, amount, customerName, items, pickupTime } =
        req.body as InitializePaymentBody

      // Validate required fields
      if (!orderId || !email || !amount || !customerName) {
        return next(createError('Missing required fields: orderId, email, amount, customerName', 400))
      }

      if (amount <= 0) {
        return next(createError('Amount must be greater than 0', 400))
      }

      // Make sure the order exists in Firestore and belongs to this user
      const orderRef = db.collection('orders').doc(orderId)
      const orderSnap = await orderRef.get()

      if (!orderSnap.exists) {
        return next(createError('Order not found', 404))
      }

      const orderData = orderSnap.data()!

      if (orderData.userId !== req.user!.uid) {
        return next(createError('Unauthorized: order does not belong to this user', 403))
      }

      if (orderData.paymentStatus === 'completed') {
        return next(createError('Order has already been paid', 400))
      }

      // Generate a unique payment reference
      const reference = generateReference()

      // Initialize the transaction on Paystack's servers
      const paystackResponse = await initializeTransaction({
        email,
        amount: toKobo(amount),
        reference,
        currency: 'NGN',
        metadata: {
          orderId,
          userId: req.user!.uid,
          customerName,
          items,
          pickupTime,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: orderId,
            },
            {
              display_name: 'Customer',
              variable_name: 'customer_name',
              value: customerName,
            },
          ],
        },
      })

      if (!paystackResponse.status || !paystackResponse.data?.authorization_url) {
        return next(createError('Failed to initialize payment with Paystack', 502))
      }

      // Save the reference to the order so we can verify it later
      await orderRef.update({
        paymentRef: reference,
        paymentStatus: 'pending',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      res.status(200).json({
        success: true,
        data: {
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          reference,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/payments/verify
 *
 * Called by the frontend after Paystack redirects back (or after inline success).
 * Verifies the transaction and updates the Firestore order.
 *
 * Protected: requires Firebase ID token.
 */
router.post(
  '/verify',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference, orderId } = req.body as VerifyPaymentBody

      if (!reference || !orderId) {
        return next(createError('Missing required fields: reference, orderId', 400))
      }

      // Fetch order from Firestore
      const orderRef = db.collection('orders').doc(orderId)
      const orderSnap = await orderRef.get()

      if (!orderSnap.exists) {
        return next(createError('Order not found', 404))
      }

      const orderData = orderSnap.data()!

      // Security: ensure this user owns the order
      if (orderData.userId !== req.user!.uid) {
        return next(createError('Unauthorized', 403))
      }

      // Ensure reference matches what we stored
      if (orderData.paymentRef !== reference) {
        return next(createError('Payment reference mismatch', 400))
      }

      // Already verified — idempotent
      if (orderData.paymentStatus === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'Payment already verified',
          data: { status: 'success', orderId },
        })
      }

      // Verify with Paystack
      const paystackResponse = await verifyTransaction(reference)

      if (!paystackResponse.status) {
        return next(createError('Paystack verification request failed', 502))
      }

      const txData = paystackResponse.data

      if (txData.status === 'success') {
        // Update Firestore order
        await orderRef.update({
          paymentStatus: 'completed',
          status: 'Preparing',
          paidAt: txData.paid_at,
          amountPaid: toNaira(txData.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            status: 'success',
            orderId,
            amountPaid: toNaira(txData.amount),
            paidAt: txData.paid_at,
          },
        })
      }

      // Payment failed or abandoned
      await orderRef.update({
        paymentStatus: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      res.status(200).json({
        success: false,
        message: `Payment ${txData.status}`,
        data: { status: txData.status, orderId },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/payments/webhook
 *
 * Paystack calls this automatically after every transaction event.
 * This is the most reliable way to confirm payments — don't skip it.
 *
 * Configure in Paystack Dashboard → Settings → Webhooks
 * URL: https://your-backend.com/api/payments/webhook
 *
 * NOT protected by Firebase auth — protected by Paystack signature instead.
 */
router.post(
  '/webhook',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify the request is actually from Paystack
      const paystackSignature = req.headers['x-paystack-signature'] as string
      const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET

      if (!webhookSecret) {
        console.error('[Webhook] PAYSTACK_WEBHOOK_SECRET is not set')
        return res.sendStatus(500)
      }

      if (!paystackSignature) {
        console.warn('[Webhook] No Paystack signature header')
        return res.sendStatus(401)
      }

      // Compute HMAC SHA512 of raw body using webhook secret
      const hash = crypto
        .createHmac('sha512', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex')

      if (hash !== paystackSignature) {
        console.warn('[Webhook] Invalid signature — possible spoofing attempt')
        return res.sendStatus(401)
      }

      // Acknowledge receipt immediately (Paystack expects 200 fast)
      res.sendStatus(200)

      // Process the event asynchronously after responding
      const event = req.body

      console.log(`[Webhook] Event received: ${event.event}`)

      if (event.event === 'charge.success') {
        const txData = event.data
        const reference = txData.reference
        const orderId = txData.metadata?.orderId

        if (!orderId) {
          console.warn('[Webhook] charge.success has no orderId in metadata')
          return
        }

        const orderRef = db.collection('orders').doc(orderId)
        const orderSnap = await orderRef.get()

        if (!orderSnap.exists) {
          console.warn(`[Webhook] Order ${orderId} not found in Firestore`)
          return
        }

        const orderData = orderSnap.data()!

        // Idempotency guard — only update if still pending
        if (orderData.paymentStatus === 'completed') {
          console.log(`[Webhook] Order ${orderId} already marked completed, skipping`)
          return
        }

        // Verify reference matches
        if (orderData.paymentRef && orderData.paymentRef !== reference) {
          console.warn(`[Webhook] Reference mismatch for order ${orderId}`)
          return
        }

        // Update order in Firestore
        await orderRef.update({
          paymentStatus: 'completed',
          status: 'Preparing',
          paymentRef: reference,
          paidAt: txData.paid_at,
          amountPaid: toNaira(txData.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        console.log(`[Webhook] Order ${orderId} marked as paid ✓`)
      }

      if (event.event === 'charge.dispute.create') {
        console.warn('[Webhook] Dispute raised for reference:', event.data?.reference)
        // TODO: notify admin via email / Slack
      }
    } catch (error) {
      console.error('[Webhook] Error processing webhook:', error)
      // Don't call next(error) here — we already sent 200 to Paystack
    }
  }
)

/**
 * GET /api/payments/status/:reference
 *
 * Quick status check — lets the frontend poll if needed.
 * Protected: requires Firebase ID token.
 */
router.get(
  '/status/:reference',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference } = req.params

      const paystackResponse = await verifyTransaction(reference)

      if (!paystackResponse.status) {
        return next(createError('Failed to check payment status', 502))
      }

      res.status(200).json({
        success: true,
        data: {
          status: paystackResponse.data.status,
          amount: toNaira(paystackResponse.data.amount),
          paidAt: paystackResponse.data.paid_at,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
