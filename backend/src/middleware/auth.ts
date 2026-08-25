import { Request, Response, NextFunction } from 'express'
import { auth } from '../config/firebase'

/**
 * Verifies the Firebase ID token sent in the Authorization header.
 * On success, attaches decoded token to req.user and calls next().
 * On failure, returns 401.
 *
 * Frontend must send: Authorization: Bearer <firebase_id_token>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    })
    return
  }

  const idToken = authHeader.split('Bearer ')[1].trim()

  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    }
    next()
  } catch (error: any) {
    console.error('[Auth Middleware] Token verification failed:', error.message)
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please sign in again.',
    })
  }
}

/**
 * Optional auth - attaches user if token present, but doesn't block if missing.
 * Useful for routes that behave differently for logged-in vs guest users.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next()
    return
  }

  const idToken = authHeader.split('Bearer ')[1].trim()

  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    }
  } catch {
    // Token invalid — continue without user
  }

  next()
}
