import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import paymentsRouter from './routes/payments'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 4000

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet())

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Stricter limit on payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many payment requests. Please wait a bit.' },
})

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, server-to-server, mobile)
      if (!origin) return callback(null, true)
      
      const allowed = [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL,
      ].filter(Boolean)

      if (allowed.includes(origin)) {
        callback(null, true)
      } else {
        console.log(`CORS blocked: ${origin}`)
        callback(null, true) // temporarily allow all to debug
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// ─── Body Parsing ─────────────────────────────────────────────────────────────

// Important: webhook route needs raw body for signature verification
// All other routes can use JSON parsing

app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    // Keep raw body for Paystack signature verification
    express.raw({ type: 'application/json' })(req, res, (err) => {
      if (err) return next(err)
      // Parse to object but keep original for hash verification
      if (Buffer.isBuffer(req.body)) {
        req.body = JSON.parse(req.body.toString())
      }
      next()
    })
  } else {
    express.json({ limit: '10kb' })(req, res, next)
  }
})

app.use(express.urlencoded({ extended: true }))

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SweetBites backend is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET', // ← add this
  })
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/payments', paymentLimiter, paymentsRouter)

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound)
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║       SweetBites Backend 🌯          ║
╠══════════════════════════════════════╣
║  Server:  http://localhost:${PORT}      ║
║  Env:     ${(process.env.NODE_ENV || 'development').padEnd(25)}║
║  Health:  /health                    ║
║  Payments: /api/payments             ║
╚══════════════════════════════════════╝
  `)
})

export default app
