# SweetBites - Shawarma Ordering Website

A production-ready shawarma ordering platform built with Next.js, Firebase, and Paystack.

## Project Overview

**Business:** SweetBites
**Location:** Back of Amac, Lugbe, Abuja
**Menu:** Single Sausage (₦2,000) | Double Sausage (₦2,200) | Beef with Double Sausage (₦4,000)

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Payments:** Paystack
- **UI Icons:** Lucide React

## 📋 Features

### Customer-Facing
- ✅ Browse menu with real-time availability
- ✅ Add/remove/edit cart items (localStorage persistence)
- ✅ Email & Google authentication
- ✅ Multi-step checkout (contact → pickup time → payment)
- ✅ Paystack card payments + Cash on pickup
- ✅ Order confirmation with real-time status tracking
- ✅ Order history with past orders
- ✅ Mobile-first responsive design

### Admin Dashboard
- ✅ Real-time order management
- ✅ Order status updates (Preparing → Ready → Picked Up)
- ✅ Menu item management (add/edit/delete)
- ✅ Toggle item availability
- ✅ Admin-protected routes

## 🔧 Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project (free tier works)
- Paystack account

### 2. Clone & Install

```bash
cd sweetbites
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable these services:
   - **Authentication:** Email/Password + Google
   - **Firestore Database:** Create in production mode
   - **Storage:** Create a bucket
4. Copy credentials from Project Settings → General → Your apps

### 4. Environment Variables

Create `.env.local` in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx (or pk_test_xxx for testing)
PAYSTACK_SECRET_KEY=sk_live_xxx (or sk_test_xxx for testing)

# App Configuration
NEXT_PUBLIC_APP_NAME=SweetBites
NEXT_PUBLIC_PICKUP_ADDRESS=Back of Amac, Lugbe, Abuja
NEXT_PUBLIC_DELIVERY_FEE=500
```

### 5. Initialize Firestore

Go to Firebase Console → Firestore → Create collection `menuItems` with these sample documents:

```json
{
  "name": "Single Sausage",
  "price": 2000,
  "description": "Fresh shawarma with single sausage",
  "imageUrl": "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=300",
  "dietary": ["spicy"],
  "available": true
}
```

### 6. Create Admin User

1. Sign up in the app at `/auth/signup`
2. Get your Firebase UID from Firebase Console → Authentication
3. In Firestore, go to `users/{uid}` and change `role` from `customer` to `admin`

### 7. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📂 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home/Menu page
│   ├── cart/page.tsx            # Shopping cart
│   ├── auth/
│   │   ├── login/page.tsx       # Login page
│   │   └── signup/page.tsx      # Sign up page
│   ├── checkout/
│   │   ├── contact/page.tsx     # Step 1: Customer info
│   │   ├── pickup/page.tsx      # Step 2: Pickup time
│   │   └── payment/page.tsx     # Step 3: Payment method
│   ├── order-confirmation/[orderId]/page.tsx  # Order status
│   ├── order-history/page.tsx   # Past orders
│   └── admin/                    # Protected admin routes
│       ├── page.tsx             # Order management
│       └── menu/page.tsx        # Menu management
├── components/
│   ├── Header.tsx               # Navigation header
│   ├── ProductCard.tsx          # Menu item card
│   ├── CartItemComponent.tsx    # Cart line item
│   ├── StatusTracker.tsx        # Order status display
│   └── providers/               # Context providers
│       ├── AuthProvider.tsx     # Auth context
│       └── CartProvider.tsx     # Cart context
├── lib/
│   ├── firebase.ts              # Firebase config
│   ├── db.ts                    # Database functions
│   └── paystack.ts              # Paystack integration
├── types/
│   └── index.ts                 # TypeScript definitions
└── app/
    └── globals.css              # Global styles
```

## 📊 Firestore Schema

### Collections

**menuItems/**
```
{
  id: string (auto)
  name: string
  price: number
  description: string
  imageUrl: string
  dietary: string[] (e.g., ["vegan", "spicy"])
  available: boolean
  createdAt: timestamp
}
```

**orders/**
```
{
  id: string (auto)
  userId: string (Firebase UID)
  customerName: string
  phone: string
  email: string
  items: [{itemId, name, price, quantity}, ...]
  subtotal: number
  deliveryFee: number
  total: number
  pickupTime: string
  status: "Preparing" | "Ready" | "PickedUp"
  paymentStatus: "pending" | "completed" | "failed"
  paymentRef: string (Paystack reference)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**users/**
```
{
  uid: string (Firebase UID)
  email: string
  displayName: string
  role: "customer" | "admin"
  createdAt: timestamp
}
```

## 🔐 Security Rules

Apply these Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Menu items - public read, admin write
    match /menuItems/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Orders - users read their own, write own, admin can update
    match /orders/{orderId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users - own profile read/write
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

## 💳 Paystack Integration

### Testing
- Use Paystack test keys for development
- Test card: `5053-0439-5534-1970`
- Test expiry: Any future date
- Test CVV: Any 3 digits

### Production
1. Get live keys from Paystack dashboard
2. Update `.env.local` with live keys
3. Deploy to production

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard → Settings → Environment Variables

### Other Platforms
- Environment variables must include all `.env.local` keys
- Build command: `npm run build`
- Start command: `npm run start`

## 📱 Testing Checklist

- [ ] Browse menu on home page
- [ ] Add items to cart
- [ ] View cart and modify quantities
- [ ] Sign up/login with email
- [ ] Sign in with Google
- [ ] Go through checkout flow (contact → pickup → payment)
- [ ] Test card payment with Paystack
- [ ] Test cash on pickup option
- [ ] View order confirmation with status
- [ ] Check order history
- [ ] Admin: Log in as admin
- [ ] Admin: View real-time orders
- [ ] Admin: Update order status
- [ ] Admin: Add/edit/delete menu items

## 🐛 Troubleshooting

**"Firebase config error"**
- Check `.env.local` keys match Firebase project
- Ensure all `NEXT_PUBLIC_*` variables are present

**"Payment button not working"**
- Verify Paystack key is correct
- Check browser console for errors
- Ensure `/checkout/payment` page loads Paystack script

**"Admin access denied"**
- Verify user `role` field is set to `admin` in Firestore
- Clear browser cache and re-login

**"Orders not updating in real-time"**
- Check Firestore listener is connected
- Verify Firestore rules allow admin read/write

## 📞 Support

For issues:
1. Check browser console for errors
2. Check Firebase Console → Logs
3. Verify all environment variables
4. Check Paystack test credentials

## 📄 License

This project is built for SweetBites. All rights reserved.

---

**Built with ❤️ for SweetBites**
Delivery: Back of Amac, Lugbe, Abuja
