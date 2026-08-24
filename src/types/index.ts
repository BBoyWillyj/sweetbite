export interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  imageUrl: string
  dietary?: string[]
  available: boolean
  createdAt: Date
}

export interface CartItem {
  itemId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
}

export interface Cart {
  items: CartItem[]
  note?: string
}

export interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
}

export type OrderStatus = 'Preparing' | 'Ready' | 'PickedUp'
export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface Order {
  id: string
  userId: string
  customerName: string
  phone: string
  email: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  pickupTime: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentRef?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  uid: string
  email: string
  displayName?: string
  role: 'customer' | 'admin'
  createdAt: Date
}

export interface CheckoutData {
  customerName: string
  phone: string
  email: string
  pickupDate: 'today' | 'tomorrow'
  pickupTime: string
  note?: string
}
