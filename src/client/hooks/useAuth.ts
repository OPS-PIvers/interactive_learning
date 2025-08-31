import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuthService, firebaseManager } from '../../lib/firebaseConfig';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('useAuth: Starting Firebase initialization...');
        await firebaseManager.initialize();
        
        if (!mounted) {
          console.log('useAuth: Component unmounted during initialization');
          return;
        }

        console.log('useAuth: Getting auth service...');
        const auth = getAuthService();
        
        if (auth) {
          console.log('useAuth: Setting up auth state listener...');
          unsubscribe = onAuthStateChanged(auth, (user) => {
            if (mounted) {
              console.log('useAuth: Auth state changed:', user ? 'User logged in' : 'User logged out');
              setUser(user);
              setLoading(false);
              setError(null);
            }
          });
        } else {
          console.warn('useAuth: Auth service not available');
          if (mounted) {
            setError('Authentication service unavailable');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('useAuth: Auth initialization failed:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Auth initialization failed');
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return { user, loading, error };
};
