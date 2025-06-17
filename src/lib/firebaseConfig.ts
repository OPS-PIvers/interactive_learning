import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getPerformance } from 'firebase/performance'
import { getAnalytics } from 'firebase/analytics'

// Use environment variables in production, fallback to hardcoded values for now
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "interactive-learning-278.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "interactive-learning-278",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "interactive-learning-278.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "559846873035",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:559846873035:web:f0abe20a8d354b02a9084e",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-FQZK3QEV9L"
}

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