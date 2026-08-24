# SweetBites - Quick Start Guide (5 Minutes)

## Step 1: Get Your Keys (2 min)

### Firebase
1. Go to https://console.firebase.google.com
2. Click "Create Project"
3. Name it "SweetBites"
4. Create → Continue → Disable Google Analytics → Create
5. Click "Web" icon to create web app
6. Name it "SweetBites Web"
7. **Copy these values:**
   ```
   apiKey: 
   authDomain:
   projectId:
   storageBucket:
   messagingSenderId:
   appId:
   ```

### Paystack
1. Go to https://dashboard.paystack.com
2. Sign up or log in
3. Go to Settings → API Keys & Webhooks
4. **Copy your Public Key and Secret Key** (use TEST keys first)

## Step 2: Setup Firebase (1 min)

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **Create Database**
3. Select **Production mode**
4. Choose region closest to Nigeria (us-central1 is fine)
5. Click **Enable**

6. Go to **Build → Authentication**
7. Click **Email/Password**
8. Enable both "Email/Password" and "Google"
9. Save

## Step 3: Configure Env (1 min)

1. In your project folder, rename `.env.example` to `.env.local`
2. Paste your keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx

NEXT_PUBLIC_DELIVERY_FEE=500
```

## Step 4: Run (1 min)

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

## Step 5: Add Menu Items (Optional)

1. Sign up at `http://localhost:3000/auth/signup`
2. Make yourself admin:
   - Firebase Console → Authentication → Click your user
   - Copy your UID
   - Go to Firestore → Create collection `users`
   - Create document with ID = your UID
   - Add fields: `email`, `displayName`, `role: "admin"`
3. Refresh page → You'll see `/admin` link
4. Go to `/admin/menu` → Add Items
5. Add these:
   - **Single Sausage** - ₦2,000
   - **Double Sausage** - ₦2,200
   - **Beef with Double Sausage** - ₦4,000

## Step 6: Test Full Flow

1. **Home** → Add items to cart
2. **Cart** → View cart
3. **Checkout** → Fill contact info
4. **Pickup** → Choose time
5. **Payment** → Pay with test card (5053-0439-5534-1970)
6. **Confirmation** → See order status

## 🎉 You're Live!

### Next Steps
- Add real menu images (upload to Firebase Storage or Cloudinary)
- Customize colors in `tailwind.config.ts`
- Deploy to Vercel: `npm install -g vercel && vercel`
- Switch to live Paystack keys for real payments

## 🔑 Key Routes

**Customer:**
- `/` - Home/Menu
- `/cart` - Shopping cart
- `/auth/login` - Sign in
- `/auth/signup` - Create account
- `/checkout/contact` - Checkout step 1
- `/checkout/pickup` - Checkout step 2
- `/checkout/payment` - Checkout step 3
- `/order-confirmation/:id` - Order status
- `/order-history` - Past orders

**Admin:**
- `/admin` - Orders dashboard
- `/admin/menu` - Menu management

## 💡 Tips

- Use Paystack **test keys** first
- Test card: `5053-0439-5534-1970` + any future date + any CVV
- Press Ctrl+Shift+Delete to clear browser cache if styles don't update
- Check browser console (F12) for errors

## ❓ Quick Fixes

**Styles not loading?**
```bash
rm -rf .next
npm run dev
```

**Firebase connection error?**
- Double-check `.env.local` keys
- Make sure Firestore is enabled

**Paystack button not showing?**
- Check `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is correct
- Verify you're on `/checkout/payment`

---

**Questions?** Check README.md for full documentation.
