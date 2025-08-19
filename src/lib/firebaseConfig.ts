// Dynamic Firebase imports to prevent TDZ issues in production builds
// All Firebase modules are loaded dynamically when needed
// Analytics and Performance removed for bundle size optimization
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

// Lazy configuration getter to prevent issues with import.meta.env in production builds
function getFirebaseConfig(): FirebaseConfiguration {
  return {
    apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] || "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
    authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] || "interactive-learning-278.firebaseapp.com",
    projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] || "interactive-learning-278",
    storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] || "interactive-learning-278.firebasestorage.app",
    messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] || "559846873035",
    appId: import.meta.env['VITE_FIREBASE_APP_ID'] || "1:559846873035:web:f0abe20a8d354b02a9084e",
    measurementId: import.meta.env['VITE_FIREBASE_MEASUREMENT_ID'] || "G-FQZK3QEV9L"
  };
}

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
  // Analytics and Performance removed for bundle optimization
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

      // Dynamic import Firebase modules to prevent TDZ issues
      const { initializeApp } = await import('firebase/app');
      const { getAuth, connectAuthEmulator } = await import('firebase/auth');
      const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
      const { getStorage, connectStorageEmulator } = await import('firebase/storage');

      // Initialize Firebase app
      this.app = initializeApp(getFirebaseConfig());

      // Initialize Firestore with standard settings for all devices
      this.db = getFirestore(this.app);

      // Initialize other services
      this.storage = getStorage(this.app);
      this.auth = getAuth(this.app);

      // Analytics and Performance initialization removed for bundle optimization
      // This reduces Firebase bundle size by ~200-300KB

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

  // Performance and Analytics getters removed for bundle optimization

  getApp() {
    return this.app;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const firebaseManager = FirebaseConnectionManager.getInstance();

// Legacy exports for backward compatibility - these functions ensure proper initialization
export const getDb = () => {
  if (!firebaseManager.isReady()) {
    throw new Error('Firebase not initialized. Call firebaseManager.initialize() first.');
  }
  return firebaseManager.getFirestore();
};

export const getStorageService = () => {
  if (!firebaseManager.isReady()) {
    throw new Error('Firebase not initialized. Call firebaseManager.initialize() first.');
  }
  return firebaseManager.getStorage();
};

export const getAuthService = () => {
  if (!firebaseManager.isReady()) {
    throw new Error('Firebase not initialized. Call firebaseManager.initialize() first.');
  }
  return firebaseManager.getAuth();
};

// Note: Firebase initialization is now handled explicitly by components
// This prevents circular dependency issues in production builds

// Export the manager for explicit initialization control
export { firebaseManager };

// Performance and Analytics exports removed for bundle optimization
// This saves ~200-300KB in the Firebase bundle

export default firebaseManager.getApp();