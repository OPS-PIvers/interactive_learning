// Firebase v8 legacy SDK configuration
// Using the stable v8 namespaced API to avoid modular v9+ TDZ issues
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
  authDomain: "interactive-learning-278.firebaseapp.com",
  projectId: "interactive-learning-278",
  storageBucket: "interactive-learning-278.firebasestorage.app",
  messagingSenderId: "559846873035",
  appId: "1:559846873035:web:f0abe20a8d354b02a9084e",
  measurementId: "G-FQZK3QEV9L"
};

// Initialize Firebase v8 app
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get Firebase services using v8 API
export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();

// Firebase manager for compatibility with existing code
class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private isInitialized = true; // Always initialized with v8

  static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  async initialize(): Promise<void> {
    // No-op for v8 - already initialized above
    return Promise.resolve();
  }

  getFirestore() {
    return db;
  }

  getStorage() {
    return storage;
  }

  getAuth() {
    return auth;
  }

  getApp() {
    return firebase.app();
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const firebaseManager = FirebaseConnectionManager.getInstance();

// Legacy exports for backward compatibility
export const getDb = () => db;
export const getStorageService = () => storage;
export const getAuthService = () => auth;

// Export the manager for explicit initialization control
export { firebaseManager };

export default firebase.app();