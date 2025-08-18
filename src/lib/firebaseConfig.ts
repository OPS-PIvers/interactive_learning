import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getPerformance, FirebasePerformance } from 'firebase/performance';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
// Firebase configuration and initialization
interface FirebaseConfiguration {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Debug environment variables (development only)
if (import.meta.env['DEV']) {







}

const firebaseConfig: FirebaseConfiguration = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] || "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] || "interactive-learning-278.firebaseapp.com",
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] || "interactive-learning-278",
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] || "interactive-learning-278.firebasestorage.app",
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] || "559846873035",
  appId: import.meta.env['VITE_FIREBASE_APP_ID'] || "1:559846873035:web:f0abe20a8d354b02a9084e",
  measurementId: import.meta.env['VITE_FIREBASE_MEASUREMENT_ID'] || "G-FQZK3QEV9L"
};

// Validate required environment variables function (called during initialization)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateFirebaseConfig(): string[] {
  const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'];


  return requiredEnvVars.filter((varName) => !import.meta.env[varName]);
}

if (import.meta.env['DEV']) {

}

// Firebase Connection Manager with singleton pattern and mobile optimization
class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private app: any = null;
  private db: any = null;
  private storage: any = null;
  private auth: any = null;
  private performance: any = null;
  private analytics: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      if (import.meta.env['DEV']) {

      }

      // Initialize Firebase app
      this.app = initializeApp(firebaseConfig);

      // Initialize Firestore with standard settings for all devices
      this.db = getFirestore(this.app);

      // Initialize other services
      this.storage = getStorage(this.app);
      this.auth = getAuth(this.app);

      // Initialize performance and analytics (non-blocking)
      if (typeof window !== 'undefined') {
        try {
          this.performance = getPerformance(this.app);
          if (await isSupported()) {
            this.analytics = getAnalytics(this.app);
            if (import.meta.env['DEV']) {

            }
          }
          if (import.meta.env['DEV']) {

          }
        } catch (error) {
          if (import.meta.env['DEV']) {

          }
        }
      }

      // Setup emulators for development
      if (import.meta.env['DEV'] && typeof window !== 'undefined' && import.meta.env['VITE_USE_FIREBASE_EMULATOR']) {
        try {
          connectFirestoreEmulator(this.db, 'localhost', 8080);
          connectStorageEmulator(this.storage, 'localhost', 9199);
          connectAuthEmulator(this.auth, 'http://localhost:9099');

        } catch (error) {

        }
      }

      this.isInitialized = true;
      if (import.meta.env['DEV']) {

      }
    } catch (error) {
      console.error('Firebase Connection Manager: Initialization failed:', error);
      this.initPromise = null;
      throw error;
    }
  }

  getFirestore() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.db;
  }

  getStorage() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  getAuth() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  getPerformance() {
    return this.performance;
  }

  getAnalytics() {
    return this.analytics;
  }

  getApp() {
    return this.app;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const firebaseManager = FirebaseConnectionManager.getInstance();

// Legacy exports for backward compatibility - these will throw if not initialized
export const db = new Proxy({} as any, {
  get(target, prop) {
    return firebaseManager.getFirestore()[prop];
  }
});

export const storage = new Proxy({} as any, {
  get(target, prop) {
    return firebaseManager.getStorage()[prop];
  }
});

export const auth = new Proxy({} as any, {
  get(target, prop) {
    return firebaseManager.getAuth()[prop];
  }
});

// Initialize Firebase immediately but non-blocking
firebaseManager.initialize().catch((error) => {
  console.error('Firebase initialization failed:', error);
});

// Export the manager for explicit initialization control
export { firebaseManager };

// Legacy exports for performance and analytics
export const performance = firebaseManager.getPerformance();
export const analytics = firebaseManager.getAnalytics();

export default firebaseManager.getApp();