import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuthService, firebaseManager } from '@/lib/firebaseConfig';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        await firebaseManager.initialize();
        const auth = getAuthService();
        if (auth) {
          unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => unsubscribe?.();
  }, []);

  return { user, loading };
};
