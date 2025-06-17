import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getPerformance } from 'firebase/performance'
import { getAnalytics } from 'firebase/analytics'

// Debug environment variables
console.log('Environment variables:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'MISSING',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'MISSING',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
  allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
  fullEnv: import.meta.env
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

console.log('Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

// Add performance monitoring and analytics
let performance: any = null
let analytics: any = null

if (typeof window !== 'undefined') {
  try {
    performance = getPerformance(app)
    analytics = getAnalytics(app)
    console.log('Firebase Performance and Analytics initialized')
  } catch (error) {
    console.log('Analytics/Performance not available:', error)
  }
}

export { performance, analytics }

// For local development with emulators (optional)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // Only connect to emulators if they're not already connected
    if (!db._delegate._databaseId.database.includes('(default)')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectStorageEmulator(storage, 'localhost', 9199)
      connectAuthEmulator(auth, 'http://localhost:9099')
      console.log('Connected to Firebase emulators')
    }
  } catch (error) {
    console.log('Emulators not available or already connected')
  }
}

export default app