# SweetBites - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js App)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pages (Home, Cart, Auth, Checkout, Admin)            │  │
│  │  Components (Header, ProductCard, CartItem, etc)      │  │
│  │  Providers (AuthProvider, CartProvider)               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼──┐  ┌───▼─────┐  │
            │ Firebase │  │ Paystack │  │
            │   Auth   │  │  Payments│  │
            └───────┬──┘  └───┬─────┘  │
                    │         │        │
            ┌───────▼──────────▼──┐    │
            │  Firebase Firestore │    │
            │   (menuItems        │    │
            │    orders           │    │
            │    users)           │    │
            └────────────────────┘    │
                                      │
                              (Database)
```

## 📁 Project Structure

### `/src/app` - Pages & Routes

```
app/
├── page.tsx                           # Home - Menu browsing
├── layout.tsx                         # Root layout with providers
├── globals.css                        # Global styles
│
├── cart/
│   └── page.tsx                       # Shopping cart page
│
├── auth/
│   ├── layout.tsx                     # Auth pages layout
│   ├── login/page.tsx                 # Email/Google login
│   └── signup/page.tsx                # Email/Google signup
│
├── checkout/
│   ├── layout.tsx                     # Checkout layout with step indicator
│   ├── contact/page.tsx               # Step 1: Customer info form
│   ├── pickup/page.tsx                # Step 2: Pickup time selector
│   └── payment/page.tsx               # Step 3: Paystack integration
│
├── order-confirmation/
│   └── [orderId]/page.tsx             # Order confirmation & status tracking
│
├── order-history/
│   └── page.tsx                       # User's past orders
│
└── admin/
    ├── layout.tsx                     # Admin layout with auth guard
    ├── page.tsx                       # Order management dashboard
    └── menu/page.tsx                  # Menu item CRUD operations
```

### `/src/components` - Reusable Components

```
components/
├── Header.tsx                         # Navigation with auth menu
├── ProductCard.tsx                    # Menu item card (add to cart)
├── CartItemComponent.tsx              # Cart line item (qty, remove)
├── StatusTracker.tsx                  # Order status progress
│
└── providers/
    ├── AuthProvider.tsx               # Firebase Auth context
    └── CartProvider.tsx               # Shopping cart context
```

### `/src/lib` - Business Logic

```
lib/
├── firebase.ts                        # Firebase initialization
├── db.ts                              # Firestore operations
│   ├── getMenuItems()
│   ├── getOrder()
│   ├── createOrder()
│   ├── getUserOrders()
│   ├── updateOrderStatus()
│   ├── subscribeToOrders()            # Real-time listener
│   └── ...
│
└── paystack.ts                        # Paystack API integration
    ├── initializePaystackPayment()
    ├── verifyPaystackPayment()
    ├── formatNGN()
    └── generatePaystackReference()
```

### `/src/types` - TypeScript Definitions

```
types/
└── index.ts
    ├── MenuItem
    ├── CartItem
    ├── Order
    ├── User
    ├── OrderStatus
    └── PaymentStatus
```

## 🔄 User Flows

### Customer Journey

```
1. HOME PAGE (/)
   └─ Browse menu items from Firestore
   └─ Add items to cart (localStorage)
   └─ View cart count in header

2. CART (/cart)
   └─ View cart items
   └─ Modify quantities
   └─ Edit special instructions
   └─ See order summary (subtotal + delivery fee)
   └─ If not signed in: Redirect to login
   └─ Proceed to Checkout

3. CHECKOUT FLOW
   
   a) Contact Info (/checkout/contact)
      └─ Enter: Name, Phone, Email
      └─ Save to sessionStorage
      └─ Continue to pickup
   
   b) Pickup Time (/checkout/pickup)
      └─ Choose: Today or Tomorrow
      └─ Select: Time slot (ASAP, 12:00 PM, etc.)
      └─ Show pickup location
      └─ Continue to payment
   
   c) Payment (/checkout/payment)
      └─ Create order in Firestore (status: "Preparing", payment: "pending")
      └─ Choose: Card or Cash
      └─ If Card: Initialize Paystack → Open checkout → Verify payment
      └─ If Cash: Proceed directly
      └─ Clear cart & sessionStorage
      └─ Redirect to confirmation

4. CONFIRMATION (/order-confirmation/:id)
   └─ Display: Order number, status, items, total
   └─ Show: Status tracker (Preparing → Ready → PickedUp)
   └─ Estimated ready time: +15 mins
   └─ Pickup details
   └─ View Order History button

5. ORDER HISTORY (/order-history)
   └─ Display: All user's orders (most recent first)
   └─ Show: Status, total, items, payment status
   └─ Click order → View confirmation page
```

### Admin Journey

```
1. LOGIN & ROLE CHECK
   └─ User signs in
   └─ Check `users/{uid}.role` in Firestore
   └─ If role="admin": Show admin link in header

2. ORDERS DASHBOARD (/admin)
   └─ Real-time Firestore listener (subscribeToOrders)
   └─ Display: All orders in status order
   └─ For each order show:
      - Order ID & timestamp
      - Customer info (name, phone, email)
      - Items list with quantities
      - Payment status
      - Pickup time
      - Current status with visual indicator
   └─ Action buttons: Mark as "Ready" or "Picked Up"
   └─ Updates trigger: updateOrderStatus() → Firestore → Real-time update

3. MENU MANAGEMENT (/admin/menu)
   └─ Display: All menu items (gallery)
   └─ Actions:
      - Add: New item form
      - Edit: Pre-fill form with item data
      - Delete: Confirm & remove
      - Toggle: Available/Unavailable
   └─ Fields: Name, Price, Description, Image URL, Dietary badges
   └─ Database: CRUD operations on menuItems collection
```

## 🔐 Authentication Flow

```
FIREBASE AUTH
  │
  ├─ Email/Password
  │  ├─ Sign Up (createUserWithEmailAndPassword)
  │  │  └─ Create user in users/{uid}
  │  │
  │  └─ Sign In (signInWithEmailAndPassword)
  │     └─ Update user data in users/{uid}
  │
  └─ Google OAuth
     ├─ Sign In with Google (signInWithPopup)
     └─ Create/Update users/{uid}
```

## 💳 Payment Flow

```
CHECKOUT PAYMENT PAGE
  │
  └─ User selects: Card or Cash
     │
     ├─ CARD PAYMENT
     │  ├─ Create order in Firestore (paymentStatus: "pending")
     │  ├─ Generate Paystack reference
     │  ├─ Call: initializePaystackPayment()
     │  ├─ Open Paystack checkout modal
     │  ├─ User enters card details in Paystack (PCI compliant)
     │  ├─ On success: updatePaymentStatus() → "completed"
     │  └─ Redirect to confirmation page
     │
     └─ CASH PAYMENT
        ├─ Create order in Firestore (paymentStatus: "pending")
        └─ Redirect to confirmation page (payment verified at pickup)
```

## 🗄️ Database Schema

### menuItems Collection
```javascript
{
  id: "auto",
  name: "Double Sausage",
  price: 2200,
  description: "Fresh shawarma with double sausage",
  imageUrl: "https://...",
  dietary: ["spicy"],
  available: true,
  createdAt: timestamp
}
```

### orders Collection
```javascript
{
  id: "auto",
  userId: "firebase_uid",
  customerName: "John Doe",
  phone: "+234 800 123 4567",
  email: "john@example.com",
  
  items: [
    {
      itemId: "item_id",
      name: "Single Sausage",
      price: 2000,
      quantity: 2
    }
  ],
  
  subtotal: 4000,
  deliveryFee: 500,
  total: 4500,
  
  pickupTime: "2024-01-15 12:30",
  status: "Preparing",           // Preparing | Ready | PickedUp
  paymentStatus: "completed",    // pending | completed | failed
  paymentRef: "paystack_ref_123",
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### users Collection
```javascript
{
  uid: "firebase_uid",
  email: "user@example.com",
  displayName: "John Doe",
  role: "customer",              // customer | admin
  createdAt: timestamp
}
```

## 🔐 Security

### Firebase Firestore Rules
- **menuItems**: Public read, Admin write
- **orders**: Users read own, Admin can update
- **users**: Users read/write own profile

### Environment Variables
- `NEXT_PUBLIC_*`: Safe to expose (public keys)
- Other keys: Server-side only (kept secret)

### Paystack PCI Compliance
- Never store card details
- Use Paystack hosted checkout (built-in iframe/redirect)
- Server receives only transaction reference

## 📊 State Management

### Auth State (Context)
```javascript
{
  firebaseUser: FirebaseUser | null,    // Firebase user
  user: User | null,                    // Custom user data
  loading: boolean,
  signOut: () => Promise<void>
}
```

### Cart State (Context + localStorage)
```javascript
{
  items: CartItem[],
  note?: string
}
```

## 🌐 API Integration Points

### Firebase
- `initializeApp()` - Initialize Firebase
- `getAuth()` - Get auth instance
- `getFirestore()` - Get Firestore instance
- `signInWithEmailAndPassword()` - Email login
- `signInWithPopup(GoogleAuthProvider)` - Google login
- `onAuthStateChanged()` - Listen to auth changes
- `getDocs()` - Query Firestore
- `addDoc()` - Create document
- `updateDoc()` - Update document
- `deleteDoc()` - Delete document
- `onSnapshot()` - Real-time listener

### Paystack
- `POST /transaction/initialize` - Start payment
- `GET /transaction/verify/:reference` - Verify payment

## 🚀 Deployment Checklist

- [ ] All env vars set in production
- [ ] Firebase Firestore rules applied
- [ ] Firebase Auth domains configured
- [ ] Paystack keys switched to live
- [ ] CORS configured if needed
- [ ] Database backups enabled
- [ ] Error logging set up
- [ ] Performance monitoring
- [ ] SEO meta tags

---

**Architecture maintained for scalability, security, and real-time updates.**
