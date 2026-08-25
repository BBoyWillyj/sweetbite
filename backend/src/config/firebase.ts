import admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  // Option A: Use service account JSON file (local dev)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (serviceAccountPath) {
    const resolvedPath = path.resolve(serviceAccountPath)
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'))
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    }
  }

  // Option B: Use individual env vars (production)
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped newlines (common issue with env vars)
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    })
  }

  throw new Error(
    'Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or ' +
    'FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
  )
}

const app = initializeFirebaseAdmin()

export const db = admin.firestore()
export const auth = admin.auth()
export default admin
