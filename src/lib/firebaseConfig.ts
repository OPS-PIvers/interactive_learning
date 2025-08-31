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
  measurementId?: string; // Optional as per Firebase docs
}

// Firebase config is loaded from environment variables
function getFirebaseConfig(): FirebaseConfiguration {
  // Extract required environment variables
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  // Production fallback configuration for when env vars are missing
  const productionFallback = {
    apiKey: "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
    authDomain: "interactive-learning-278.firebaseapp.com",
    projectId: "interactive-learning-278",
    storageBucket: "interactive-learning-278.firebasestorage.app",
    messagingSenderId: "559846873035",
    appId: "1:559846873035:web:f0abe20a8d354b02a9084e",
    measurementId: "G-FQZK3QEV9L"
  };

  // Use environment variables if available, otherwise fallback to production config
  const firebaseConfig: FirebaseConfiguration = {
    apiKey: apiKey || productionFallback.apiKey,
    authDomain: authDomain || productionFallback.authDomain,
    projectId: projectId || productionFallback.projectId,
    storageBucket: storageBucket || productionFallback.storageBucket,
    messagingSenderId: messagingSenderId || productionFallback.messagingSenderId,
    appId: appId || productionFallback.appId,
  };

  // Add optional measurementId if present
  if (measurementId || productionFallback.measurementId) {
    firebaseConfig.measurementId = measurementId || productionFallback.measurementId;
  }

  console.log('Firebase config loaded:', { 
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId
  });

  return firebaseConfig;
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
      console.log('Starting Firebase initialization...');
      
      // Dynamic import Firebase modules to prevent TDZ issues
      const { initializeApp } = await import('firebase/app');
      const { getAuth, connectAuthEmulator } = await import('firebase/auth');
      const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore');
      const { getStorage, connectStorageEmulator } = await import('firebase/storage');

      // Get Firebase configuration
      const config = getFirebaseConfig();
      console.log('Initializing Firebase app with project:', config.projectId);

      // Initialize Firebase app
      this.app = initializeApp(config);
      console.log('Firebase app initialized successfully');

      // Initialize Firestore with standard settings for all devices
      this.db = getFirestore(this.app);
      console.log('Firestore initialized successfully');

      // Initialize other services
      this.storage = getStorage(this.app);
      this.auth = getAuth(this.app);
      console.log('Firebase Auth and Storage initialized successfully');

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
      console.log('Firebase initialization completed successfully');
    } catch (error) {
      console.error('Firebase Connection Manager: Initialization failed:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
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