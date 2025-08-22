import React, { createContext, useContext, useEffect, useState } from 'react';
import { DevAuthBypass } from './testAuthUtils';

// User type - will be loaded dynamically from Firebase
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    // Check for development bypass first
    const devBypass = DevAuthBypass.getInstance();
    if (devBypass.isEnabled()) {
      const bypassUser = devBypass.getBypassUser();
      setUser(bypassUser);
      setLoading(false);
      setFirebaseInitialized(true);
      return;
    }

    // Defer Firebase initialization until after React has rendered
    let unsubscribe: (() => void) | undefined;
    
    const initializeAuth = async () => {
      try {
        // Wait for next tick to ensure React has fully rendered
        await new Promise(resolve => { setTimeout(resolve, 100); });
        
        // Dynamically import Firebase modules to prevent TDZ issues
        const { firebaseManager } = await import('./firebaseConfig');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        // Initialize Firebase
        await firebaseManager.initialize();
        setFirebaseInitialized(true);
        
        // Setup auth state listener
        const auth = firebaseManager.getAuth();
        if (!auth) {
          throw new Error('Auth not initialized');
        }
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user as User);
          setLoading(false);
        }, (error) => {
          console.error('Auth state change error:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        setFirebaseInitialized(false);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { firebaseManager } = await import('./firebaseConfig');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      
      await firebaseManager.initialize();
      const auth = firebaseManager.getAuth();
      if (!auth) throw new Error('Auth not initialized');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const switchAccount = async () => {
    try {
      const { firebaseManager } = await import('./firebaseConfig');
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      
      await firebaseManager.initialize();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const auth = firebaseManager.getAuth();
      if (!auth) throw new Error('Auth not initialized');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { firebaseManager } = await import('./firebaseConfig');
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      
      await firebaseManager.initialize();
      const auth = firebaseManager.getAuth();
      if (!auth) throw new Error('Auth not initialized');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { firebaseManager } = await import('./firebaseConfig');
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      
      await firebaseManager.initialize();
      const provider = new GoogleAuthProvider();
      const auth = firebaseManager.getAuth();
      if (!auth) throw new Error('Auth not initialized');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { firebaseManager } = await import('./firebaseConfig');
      const { signOut } = await import('firebase/auth');
      
      await firebaseManager.initialize();
      const auth = firebaseManager.getAuth();
      if (!auth) throw new Error('Auth not initialized');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { firebaseManager } = await import('./firebaseConfig');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      
      await firebaseManager.initialize();
      const auth = firebaseManager.getAuth();
      if (!auth) throw new Error('Auth not initialized');
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    firebaseInitialized,
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