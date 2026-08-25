# SweetBites v2 — Frontend + Backend Architecture

## What Changed from v1

| Concern | v1 (old) | v2 (new) |
|---------|----------|----------|
| Firebase Auth | ✅ Frontend | ✅ Frontend (unchanged) |
| Firestore (menu, orders) | ✅ Frontend | ✅ Frontend (unchanged) |
| Paystack — initialize | ❌ Frontend (secret key exposed) | ✅ Backend only |
| Paystack — verify | ❌ Frontend | ✅ Backend only |
| Paystack — webhook | ❌ None | ✅ Backend (most reliable) |
| Secret keys in browser | ❌ Yes | ✅ Never |

## Project Structure

```
sweetbites-v2/
├── package.json              # Root — run both with `npm run dev`
│
├── frontend/                 # Next.js 14 + TypeScript + Tailwind
│   └── src/
│       ├── app/              # All pages (unchanged from v1 except payment)
│       ├── components/       # All components (unchanged from v1)
│       └── lib/
│           ├── firebase.ts   # Firebase auth + Firestore (unchanged)
│           ├── db.ts         # Firestore helpers (unchanged)
│           ├── paystack.ts   # Format utils only (no API calls)
│           └── api.ts        # ← NEW: calls backend for payments
│
└── backend/                  # Express + TypeScript
    └── src/
        ├── index.ts          # Server entry point, CORS, rate limiting
        ├── config/
        │   ├── firebase.ts   # Firebase Admin SDK (verifies tokens)
        │   └── paystack.ts   # Paystack API client (holds secret key)
        ├── middleware/
        │   ├── auth.ts       # Verifies Firebase ID token on requests
        │   └── errorHandler.ts
        ├── routes/
        │   └── payments.ts   # /initialize, /verify, /webhook, /status
        └── types/
            └── index.ts
```

## How It Works

### Payment Flow (Card)

```
User clicks "Pay"
      │
      ▼
frontend: createOrder() → Firestore (status: pending)
      │
      ▼
frontend: POST /api/payments/initialize
  + Firebase ID token in Authorization header
      │
      ▼
backend: verify Firebase token ✓
backend: call Paystack API with SECRET KEY
backend: save reference to Firestore order
backend: return { authorizationUrl, reference }
      │
      ▼
frontend: window.location.href = authorizationUrl
      │
      ▼
User enters card on Paystack's hosted page
      │
      ├─── Paystack webhook fires immediately ──────────────────────────────►
      │         backend: verify signature
      │         backend: verify transaction
      │         backend: update Firestore order (paymentStatus: completed)
      │
      ▼
Paystack redirects back to frontend (/checkout/payment?reference=xxx)
      │
      ▼
frontend: POST /api/payments/verify
backend: verify again (idempotent)
backend: confirm Firestore is updated
frontend: redirect to /order-confirmation/:id
```

### Why Webhook + Verify?

- **Webhook** = most reliable. Paystack fires it even if user closes the browser.
- **Verify** = for when the user comes back. Belt-and-suspenders approach.

## Setup

### 1. Install Dependencies

```bash
npm run install:all
# installs root, backend, and frontend packages
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

```env
PORT=4000
PAYSTACK_SECRET_KEY=sk_test_xxx          # from Paystack dashboard
PAYSTACK_WEBHOOK_SECRET=xxx              # from Paystack → Settings → Webhooks

# Firebase Admin — Option A (local dev)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Firebase Admin — Option B (production, e.g. Railway/Render)
# FIREBASE_PROJECT_ID=xxx
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

FRONTEND_URL=http://localhost:3000
```

#### Get Firebase Service Account

1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Download JSON → rename to `firebase-service-account.json`
4. Place in `backend/` directory (it's in `.gitignore`)

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_DELIVERY_FEE=500
```

No Paystack keys needed in the frontend.

### 4. Run Both Servers

```bash
# From root directory:
npm run dev

# Or individually:
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:3000
```

### 5. Set Up Paystack Webhook (Production)

1. Paystack Dashboard → Settings → Webhooks
2. Add URL: `https://your-backend.com/api/payments/webhook`
3. Copy the webhook secret → paste in `backend/.env` as `PAYSTACK_WEBHOOK_SECRET`

For local development, use [ngrok](https://ngrok.com):
```bash
ngrok http 4000
# Copy https URL → paste in Paystack webhook settings
```

## API Endpoints

### `POST /api/payments/initialize`
Requires: `Authorization: Bearer <firebase-id-token>`

```json
// Request body
{
  "orderId": "abc123",
  "email": "customer@example.com",
  "amount": 4500,
  "customerName": "John Doe",
  "items": [...],
  "pickupTime": "today ASAP"
}

// Response
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/xxx",
    "accessCode": "xxx",
    "reference": "SB-1234567890-abc123"
  }
}
```

### `POST /api/payments/verify`
Requires: `Authorization: Bearer <firebase-id-token>`

```json
// Request
{ "reference": "SB-xxx", "orderId": "abc123" }

// Response
{
  "success": true,
  "data": { "status": "success", "orderId": "abc123", "amountPaid": 4500 }
}
```

### `POST /api/payments/webhook`
Called by Paystack automatically. Not called by frontend.

### `GET /api/payments/status/:reference`
Requires: `Authorization: Bearer <firebase-id-token>`

### `GET /health`
No auth required. Returns server status.

## Deployment

### Backend (Railway / Render / Fly.io)

1. Push `backend/` folder (or whole monorepo)
2. Set environment variables in dashboard
3. Use Option B Firebase config (individual env vars, not file)
4. Set `FRONTEND_URL` to your production frontend URL

### Frontend (Vercel)

1. Push `frontend/` folder
2. Set environment variables in Vercel dashboard
3. Set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL

## Security Notes

- ✅ `PAYSTACK_SECRET_KEY` only exists in backend `.env` — never in frontend
- ✅ Webhook verified with HMAC SHA512 signature
- ✅ Every payment route requires a valid Firebase ID token
- ✅ Order ownership verified before processing payment (userId check)
- ✅ Payment reference stored in Firestore to prevent reference swapping
- ✅ Idempotency guard: already-paid orders are skipped
- ✅ Rate limiting on all routes, stricter on payment routes
- ✅ Helmet for security headers
- ✅ CORS locked to frontend URL only

## Testing Paystack

Use test keys and test cards:

| Card | Outcome |
|------|---------|
| `5078 5078 5078 5078 12` | Success |
| `5078 5078 5078 5078 13` | Insufficient funds |
| `4084 0840 8408 4081` | Visa success |

Expiry: Any future date. CVV: Any 3 digits.

Get test keys from Paystack Dashboard → toggle "Test Mode" ON.
