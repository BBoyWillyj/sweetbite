'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createOrUpdateUser } from '@/lib/db'
import { AlertCircle, Loader } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await createOrUpdateUser(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName,
        role: 'customer',
      })
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await createOrUpdateUser(result.user.uid, {
        email: result.user.email || '',
        displayName: result.user.displayName,
        role: 'customer',
      })
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your SweetBites account</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        className="w-full border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        disabled={loading}
      >
        <span>🔐</span>
        Sign in with Google
      </button>

      {/* Sign Up Link */}
      <p className="text-center text-gray-600 mt-6">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
