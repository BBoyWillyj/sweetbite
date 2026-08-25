export type OrderStatus = 'Preparing' | 'Ready' | 'PickedUp'
export type PaymentStatus = 'pending' | 'completed' | 'failed'
export type PaymentMethod = 'card' | 'cash'

export interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
}

export interface InitializePaymentBody {
  orderId: string
  email: string
  amount: number          // in naira
  customerName: string
  items: OrderItem[]
  pickupTime: string
}

export interface VerifyPaymentBody {
  reference: string
  orderId: string
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    uid: string
    email?: string
  }
}

// Express augment so req.user is typed globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string
        email?: string
      }
    }
  }
}
