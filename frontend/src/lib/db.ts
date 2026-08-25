import {
  collection,
  query,
  getDocs,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'
import { MenuItem, Order, User } from '@/types'

// Menu Items
export async function getMenuItems(): Promise<MenuItem[]> {
  const q = query(collection(db, 'menuItems'), where('available', '==', true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  } as MenuItem))
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(collection(db, 'menuItems'))
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  } as MenuItem))
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const doc = await getDoc(doc(db, 'menuItems', id))
  return doc.exists()
    ? ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      } as MenuItem)
    : null
}

export async function addMenuItem(item: Omit<MenuItem, 'id' | 'createdAt'>) {
  return await addDoc(collection(db, 'menuItems'), {
    ...item,
    createdAt: serverTimestamp(),
  })
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>) {
  const { createdAt, id: _, ...updateData } = data as any
  return await updateDoc(doc(db, 'menuItems', id), updateData)
}

export async function deleteMenuItem(id: string) {
  return await deleteDoc(doc(db, 'menuItems', id))
}

// Orders
export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  return await addDoc(collection(db, 'orders'), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getOrder(id: string): Promise<Order | null> {
  const docSnap = await getDoc(doc(db, 'orders', id))
  return docSnap.exists()
    ? ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
      } as Order)
    : null
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    } as Order))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getAllOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, 'orders'))
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    } as Order))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  return await updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: Order['paymentStatus'],
  paymentRef?: string
) {
  const data: any = {
    paymentStatus,
    updatedAt: serverTimestamp(),
  }
  if (paymentRef) data.paymentRef = paymentRef
  return await updateDoc(doc(db, 'orders', orderId), data)
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const orders = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as Order))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    callback(orders)
  })
}

// Users
export async function createOrUpdateUser(uid: string, user: Omit<User, 'uid'>) {
  const userDoc = doc(db, 'users', uid)
  const existing = await getDoc(userDoc)

  if (existing.exists()) {
    await updateDoc(userDoc, user)
  } else {
    await updateDoc(userDoc, {
      ...user,
      createdAt: serverTimestamp(),
    })
  }
}

export async function getUser(uid: string): Promise<User | null> {
  const docSnap = await getDoc(doc(db, 'users', uid))
  return docSnap.exists()
    ? ({
        uid: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      } as User)
    : null
}

export async function setUserAsAdmin(uid: string) {
  return await updateDoc(doc(db, 'users', uid), { role: 'admin' })
}
