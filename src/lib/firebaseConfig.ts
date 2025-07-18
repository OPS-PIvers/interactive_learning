import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getPerformance } from 'firebase/performance'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Debug environment variables (development only)
if (import.meta.env.DEV) {
  console.log('Environment variables:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'MISSING',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'MISSING',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
    fullEnv: import.meta.env
  });
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "interactive-learning-278.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "interactive-learning-278",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "interactive-learning-278.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "559846873035",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:559846873035:web:f0abe20a8d354b02a9084e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FQZK3QEV9L"
}

if (import.meta.env.DEV) {
  console.log('Firebase config:', firebaseConfig);
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
    // Check if analytics is supported before initializing
    if (isSupported()) {
      analytics = getAnalytics(app)
      if (import.meta.env.DEV) {
        console.log('Firebase Analytics initialized')
      }
    } else if (import.meta.env.DEV) {
      console.log('Firebase Analytics not supported in this environment')
    }
    if (import.meta.env.DEV) {
      console.log('Firebase Performance initialized')
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.log('Analytics/Performance not available:', error)
    }
  }
}

export { performance, analytics }

// For local development with emulators (optional)
if (import.meta.env.DEV && typeof window !== 'undefined' && import.meta.env.VITE_USE_FIREBASE_EMULATOR) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectAuthEmulator(auth, 'http://localhost:9099')
    console.log('Connected to Firebase emulators')
  } catch (error) {
    console.log('Emulators not available or already connected:', error)
  }
}

export default app