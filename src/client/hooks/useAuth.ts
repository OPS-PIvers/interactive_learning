import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuthService, firebaseManager } from '../../lib/firebaseConfig';

export const useAuth = () => {
  console.log('=== useAuth HOOK CALLED ===');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('useAuth: Current state:', { user: !!user, loading, error });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        console.log('useAuth: Starting Firebase initialization...');
        
        // Development auth bypass for testing
        const authBypass = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true' || 
                          localStorage.getItem('devAuthBypass') === 'true';
        if (authBypass) {
          console.log('useAuth: Auth bypass enabled - simulating authenticated user');
          const mockUser = {
            uid: 'dev-test-user-123',
            email: 'dev@localhost',
            displayName: 'Development User',
            emailVerified: true,
            isAnonymous: false,
            phoneNumber: null,
            photoURL: null,
            providerId: 'firebase',
            metadata: {} as any,
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => 'dev-token',
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({})
          } as User;
          
          if (mounted) {
            setUser(mockUser);
            setLoading(false);
            setError(null);
          }
          return;
        }
        
        // Add timeout for Firebase initialization to prevent hanging
        console.log('useAuth: Initializing Firebase with timeout...');
        await Promise.race([
          firebaseManager.initialize(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Firebase initialization timeout')), 8000)
          )
        ]);
        
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
          
          // Also check current auth state immediately in case user is already authenticated
          const currentUser = auth.currentUser;
          if (currentUser && mounted) {
            console.log('useAuth: Found existing authenticated user:', currentUser.email);
            setUser(currentUser);
            setLoading(false);
            setError(null);
          }
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

    // Set up timeout for auth initialization (generous timeout since we have Firebase-specific timeout)
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('useAuth: Auth initialization timeout after 15 seconds');
        setError('Authentication timeout - please refresh the page');
        setLoading(false);
      }
    }, 15000);

    initAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const logout = async () => {
    try {
      console.log('useAuth: Logging out user');
      
      // Clear dev bypass if it was used
      localStorage.removeItem('devAuthBypass');
      
      // If using real Firebase auth, sign out
      if (user && user.uid !== 'dev-test-user-123') {
        const auth = getAuthService();
        if (auth) {
          await auth.signOut();
        }
      }
      
      // Clear user state
      setUser(null);
      setLoading(false);
      setError(null);
      
    } catch (error) {
      console.error('useAuth: Logout failed:', error);
      setError(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return { user, loading, error, logout };
};
