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

// Firebase config is loaded from environment variables
function getFirebaseConfig(): FirebaseConfiguration {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // Basic validation to ensure all required environment variables are loaded
  const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value && key !== 'measurementId') // measurementId is optional
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    const errorMessage = `Firebase config missing required variable(s): ${missingVars.join(', ')}. Ensure you have a .env file with all required VITE_FIREBASE_... variables.`;
    console.error(errorMessage);
    throw new Error(`Firebase configuration is missing required variable(s): ${missingVars.join(', ')}.`);
  }

  return firebaseConfig as FirebaseConfiguration;
}

// Environment validation removed to prevent import.meta.env access during initialization

// Firebase Connection Manager with singleton pattern and mobile optimization
class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private app: import('firebase/app').FirebaseApp | null = null;
  private db: import('firebase/firestore').Firestore | null = null;
  private storage: import('firebase/storage').FirebaseStorage | null = null;
  private auth: import('firebase/auth').Auth | null = null;
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

      // Emulator setup for local development
      if (import.meta.env.DEV) {
        // Vite's import.meta.env is recommended for environment variables
        const devConfig = {
          authEmuHost: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1',
          authEmuPort: parseInt(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || '9099', 10),
          firestoreEmuHost: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || '127.0.0.1',
          firestoreEmuPort: parseInt(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080', 10),
          storageEmuHost: import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1',
          storageEmuPort: parseInt(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || '9199', 10),
        };

        console.log('Connecting to Firebase emulators:', {
          auth: `http://${devConfig.authEmuHost}:${devConfig.authEmuPort}`,
          firestore: `${devConfig.firestoreEmuHost}:${devConfig.firestoreEmuPort}`,
          storage: `${devConfig.storageEmuHost}:${devConfig.storageEmuPort}`,
        });

        // Null safety checks before connecting to emulators
        if (this.auth && this.db && this.storage) {
          connectAuthEmulator(this.auth, `http://${devConfig.authEmuHost}:${devConfig.authEmuPort}`);
          connectFirestoreEmulator(this.db, devConfig.firestoreEmuHost, devConfig.firestoreEmuPort);
          connectStorageEmulator(this.storage, devConfig.storageEmuHost, devConfig.storageEmuPort);
        } else {
          console.warn('Some Firebase services failed to initialize, skipping emulator connections');
        }
      }

      this.isInitialized = true;
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