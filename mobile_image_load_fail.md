# Firebase Mobile Fix Implementation Plan

## Root Cause Analysis

The error "Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore" occurs because:

1. **Firebase Initialization Timing**: The `db` instance isn't fully initialized when `collection(db, 'projects')` is called
2. **Mobile-Specific Issues**: Mobile browsers have different module loading timing and network conditions
3. **Missing Initialization Guards**: No checks to ensure Firebase is ready before operations
4. **No-op Proxy Init**: `appScriptProxy.init()` doesn't actually initialize Firebase

## Implementation Plan

### 1. Create Firebase Initialization Manager

**File: `src/lib/firebaseInitManager.ts`**

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import { getPerformance } from 'firebase/performance'
import { getAnalytics } from 'firebase/analytics'

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
  auth: Auth;
  performance?: any;
  analytics?: any;
}

class FirebaseInitManager {
  private static instance: FirebaseInitManager;
  private firebaseInstances: FirebaseInstances | null = null;
  private initializationPromise: Promise<FirebaseInstances> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): FirebaseInitManager {
    if (!FirebaseInitManager.instance) {
      FirebaseInitManager.instance = new FirebaseInitManager();
    }
    return FirebaseInitManager.instance;
  }

  async initialize(): Promise<FirebaseInstances> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return cached instances if already initialized
    if (this.isInitialized && this.firebaseInstances) {
      return this.firebaseInstances;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    
    try {
      this.firebaseInstances = await this.initializationPromise;
      this.isInitialized = true;
      return this.firebaseInstances;
    } catch (error) {
      // Reset promise so it can be retried
      this.initializationPromise = null;
      throw error;
    }
  }

  private async performInitialization(): Promise<FirebaseInstances> {
    console.log('🔥 Initializing Firebase...');

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "interactive-learning-278.firebaseapp.com",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "interactive-learning-278",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "interactive-learning-278.firebasestorage.app",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "559846873035",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:559846873035:web:f0abe20a8d354b02a9084e",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FQZK3QEV9L"
    };

    // Check if Firebase is already initialized
    let app: FirebaseApp;
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('🔥 Using existing Firebase app');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('🔥 Created new Firebase app');
    }

    // Initialize core services
    const db = getFirestore(app);
    const storage = getStorage(app);
    const auth = getAuth(app);

    // Wait a bit to ensure services are ready (mobile optimization)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Initialize optional services
    let performance: any = null;
    let analytics: any = null;

    if (typeof window !== 'undefined') {
      try {
        performance = getPerformance(app);
        analytics = getAnalytics(app);
        console.log('🔥 Analytics and Performance initialized');
      } catch (error) {
        console.warn('Analytics/Performance not available:', error);
      }
    }

    // Connect to emulators in development
    if (import.meta.env.DEV && typeof window !== 'undefined' && import.meta.env.VITE_USE_FIREBASE_EMULATOR) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectStorageEmulator(storage, 'localhost', 9199);
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('🔥 Connected to Firebase emulators');
      } catch (error) {
        console.log('Emulators not available or already connected:', error);
      }
    }

    const instances: FirebaseInstances = {
      app,
      db,
      storage,
      auth,
      performance,
      analytics
    };

    console.log('🔥 Firebase initialization complete');
    return instances;
  }

  getInstances(): FirebaseInstances | null {
    return this.firebaseInstances;
  }

  isReady(): boolean {
    return this.isInitialized && this.firebaseInstances !== null;
  }

  async waitForReady(timeoutMs: number = 10000): Promise<FirebaseInstances> {
    if (this.isReady() && this.firebaseInstances) {
      return this.firebaseInstances;
    }

    return Promise.race([
      this.initialize(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Firebase initialization timeout')), timeoutMs)
      )
    ]);
  }
}

export const firebaseInitManager = FirebaseInitManager.getInstance();
```

### 2. Update Firebase Configuration

**File: `src/lib/firebaseConfig.ts`**

```typescript
import { firebaseInitManager } from './firebaseInitManager';

// Export a function to get initialized instances
export const getFirebaseInstances = async () => {
  return await firebaseInitManager.waitForReady();
};

// Export individual getters for backward compatibility
export const getDb = async () => {
  const instances = await getFirebaseInstances();
  return instances.db;
};

export const getStorage = async () => {
  const instances = await getFirebaseInstances();
  return instances.storage;
};

export const getAuth = async () => {
  const instances = await getFirebaseInstances();
  return instances.auth;
};

// Legacy exports for immediate access (with warnings)
let legacyDb: any = null;
let legacyStorage: any = null;
let legacyAuth: any = null;

// Initialize immediately for legacy code
firebaseInitManager.initialize().then(instances => {
  legacyDb = instances.db;
  legacyStorage = instances.storage;
  legacyAuth = instances.auth;
}).catch(error => {
  console.error('Failed to initialize Firebase for legacy exports:', error);
});

export const db = new Proxy({} as any, {
  get(target, prop) {
    if (!legacyDb) {
      throw new Error('Firebase not initialized. Use getDb() instead of direct db import.');
    }
    return legacyDb[prop];
  }
});

export const storage = new Proxy({} as any, {
  get(target, prop) {
    if (!legacyStorage) {
      throw new Error('Firebase not initialized. Use getStorage() instead of direct storage import.');
    }
    return legacyStorage[prop];
  }
});

export const auth = new Proxy({} as any, {
  get(target, prop) {
    if (!legacyAuth) {
      throw new Error('Firebase not initialized. Use getAuth() instead of direct auth import.');
    }
    return legacyAuth[prop];
  }
});

export default firebaseInitManager;
```

### 3. Update Firebase API with Proper Initialization

**File: `src/lib/firebaseApi.ts` (Key Changes)**

```typescript
import { 
  collection, 
  doc, 
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDoc,
  runTransaction,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseInstances } from './firebaseConfig'
import { Project, HotspotData, TimelineEventData, InteractiveModuleState } from '../shared/types'
import { DataSanitizer } from './dataSanitizer'
import { generateThumbnail } from '../client/utils/imageUtils'
import { retryWithBackoff } from '../client/utils/retryUtils'

// ... existing constants ...

export class FirebaseProjectAPI {
  private async getInitializedFirebase() {
    return await getFirebaseInstances();
  }

  private logUsage(operation: string, count: number = 1) {
    console.log(`Firebase ${operation}: ${count} operations`)
  }

  /**
   * List all projects with enhanced error handling and retry logic
   */
  async listProjects(): Promise<Project[]> {
    return retryWithBackoff(async () => {
      const { db, auth } = await this.getInitializedFirebase();
      
      // Check authentication first
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to access projects');
      }

      this.logUsage('READ_OPERATIONS', 1);
      const projectsRef = collection(db, 'projects');
      
      // Query only projects created by the current user
      const userProjectsQuery = query(
        projectsRef, 
        where('createdBy', '==', auth.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(userProjectsQuery);
      
      const projects: Project[] = snapshot.docs.map((docSnap) => {
        const projectData = docSnap.data()
        return {
          id: docSnap.id,
          title: projectData.title || 'Untitled Project',
          description: projectData.description || '',
          createdBy: projectData.createdBy,
          createdAt: projectData.createdAt?.toDate?.() || new Date(),
          updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
          thumbnailUrl: projectData.thumbnailUrl,
          interactiveData: {
            backgroundImage: projectData.backgroundImage,
            imageFitMode: projectData.imageFitMode || 'cover',
            viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
            hotspots: [],
            timelineEvents: [],
            _needsDetailLoad: true
          }
        } as Project
      })

      console.log(`Loaded ${projects.length} projects for user ${auth.currentUser.uid}`);
      return projects
    }, {
      maxAttempts: 3,
      baseDelay: 1000,
      retryCondition: (error) => {
        // Retry on network errors and Firebase initialization errors
        return error.message.includes('network') || 
               error.message.includes('Firebase not initialized') ||
               error.message.includes('collection');
      }
    });
  }

  // ... update other methods similarly ...
}

// Export singleton instance
export const firebaseAPI = new FirebaseProjectAPI()
```

### 4. Update Firebase Proxy with Proper Initialization

**File: `src/lib/firebaseProxy.ts`**

```typescript
import { Project, InteractiveModuleState } from '../shared/types'
import { firebaseAPI } from './firebaseApi'
import { firebaseInitManager } from './firebaseInitManager'

// Firebase proxy that ensures proper initialization
export const appScriptProxy = {
  init: async (): Promise<void> => {
    console.log("🔥 Initializing Firebase proxy...")
    try {
      await firebaseInitManager.waitForReady(15000); // 15 second timeout
      console.log("✅ Firebase proxy initialization complete")
    } catch (error) {
      console.error("❌ Firebase proxy initialization failed:", error)
      throw new Error(`Firebase initialization failed: ${error.message}`)
    }
  },

  listProjects: async (): Promise<Project[]> => {
    console.log("Firebase: Loading projects...")
    return await firebaseAPI.listProjects()
  },

  // ... rest of methods remain the same ...
}
```

### 5. Update Auth Context for Better Firebase Integration

**File: `src/lib/authContext.tsx` (Key Changes)**

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getAuth } from './firebaseConfig';
import { firebaseInitManager } from './firebaseInitManager';

// ... existing interface ...

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        const { auth } = await firebaseInitManager.waitForReady();
        setFirebaseReady(true);
        
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('🔐 Auth state changed:', user ? 'User signed in' : 'User signed out');
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.error('🔐 Auth initialization failed:', error);
        setLoading(false);
        // You might want to show an error state here
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { auth } = await getAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // ... update other auth methods similarly ...

  const value: AuthContextType = {
    user,
    loading: loading || !firebaseReady, // Include Firebase readiness in loading state
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    switchAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 6. Add Mobile-Specific Error Handling

**File: `src/client/utils/mobileFirebaseUtils.ts`**

```typescript
import { firebaseInitManager } from '../../lib/firebaseInitManager';

export interface MobileFirebaseError {
  code: 'INIT_TIMEOUT' | 'NETWORK_ERROR' | 'AUTH_ERROR' | 'GENERAL_ERROR';
  message: string;
  retryable: boolean;
  mobileOptimized?: boolean;
}

export class MobileFirebaseErrorHandler {
  static categorizeError(error: any): MobileFirebaseError {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('timeout') || errorMessage.includes('initialization timeout')) {
      return {
        code: 'INIT_TIMEOUT',
        message: 'Firebase is taking longer than expected to initialize. This is common on slower connections.',
        retryable: true,
        mobileOptimized: true
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection issue. Please check your internet connection.',
        retryable: true,
        mobileOptimized: true
      };
    }
    
    if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication issue. Please sign in again.',
        retryable: false
      };
    }
    
    return {
      code: 'GENERAL_ERROR',
      message: error.message || 'An unexpected error occurred.',
      retryable: true
    };
  }

  static async attemptRecovery(error: MobileFirebaseError): Promise<boolean> {
    if (!error.retryable) {
      return false;
    }

    try {
      if (error.code === 'INIT_TIMEOUT') {
        console.log('🔄 Attempting Firebase recovery...');
        await firebaseInitManager.waitForReady(20000); // Extended timeout
        return true;
      }
      
      if (error.code === 'NETWORK_ERROR') {
        // Wait for network to be available
        if (navigator.onLine) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
        
        // Wait for network to come back
        return new Promise<boolean>((resolve) => {
          const handleOnline = () => {
            window.removeEventListener('online', handleOnline);
            resolve(true);
          };
          window.addEventListener('online', handleOnline);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('online', handleOnline);
            resolve(false);
          }, 30000);
        });
      }
      
      return false;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }
}

export const mobileFirebaseUtils = {
  async initializeWithRetry(maxAttempts: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📱 Mobile Firebase init attempt ${attempt}/${maxAttempts}`);
        await firebaseInitManager.waitForReady(attempt * 5000); // Progressive timeout
        console.log('📱 Mobile Firebase initialization successful');
        return true;
      } catch (error) {
        console.warn(`📱 Mobile Firebase init attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * attempt, 5000); // Progressive delay
          console.log(`📱 Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('📱 Mobile Firebase initialization failed after all attempts');
    return false;
  }
};
```

### 7. Update Main App Component

**File: `src/client/components/App.tsx` (Key Changes)**

```typescript
// Update the loadProjects function
const loadProjects = useCallback(async () => {
  if (!user) {
    setProjects([]);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  setError(null);
  
  try {
    // Ensure Firebase is properly initialized
    await appScriptProxy.init();
    const fetchedProjects = await appScriptProxy.listProjects();
    setProjects(fetchedProjects);
  } catch (err: any) {
    console.error("Failed to load projects:", err);
    
    // Use mobile-optimized error handling
    const mobileError = MobileFirebaseErrorHandler.categorizeError(err);
    
    if (mobileError.retryable) {
      setError(`${mobileError.message} Tap 'Retry' to try again.`);
    } else {
      setError(mobileError.message);
    }
  } finally {
    setIsLoading(false);
  }
}, [user]);
```

## Testing and Validation

### 1. Test Cases to Cover

- **Cold Start**: Test app initialization on mobile devices
- **Network Interruption**: Test behavior when network drops during loading
- **Authentication Flow**: Test sign-in/sign-out cycles
- **Error Recovery**: Test retry mechanisms
- **Performance**: Ensure initialization doesn't block UI

### 2. Mobile-Specific Testing

- Test on actual mobile devices with slower connections
- Test with mobile browser throttling enabled
- Test in airplane mode scenarios
- Test with poor network conditions

### 3. Monitoring

Add logging to track:
- Firebase initialization timing
- Error frequencies
- Recovery success rates
- Mobile vs desktop performance differences

## Expected Results

After implementing this plan:

1. ✅ **No more collection errors**: Proper initialization guards prevent calling Firestore before ready
2. ✅ **Better mobile performance**: Mobile-optimized initialization and retry logic
3. ✅ **Improved error handling**: User-friendly error messages with recovery options
4. ✅ **Robust authentication**: Auth state properly managed with Firebase initialization
5. ✅ **Better debugging**: Comprehensive logging for troubleshooting

The implementation ensures Firebase is properly initialized before any operations, provides mobile-optimized error handling, and includes comprehensive retry logic for network issues.
