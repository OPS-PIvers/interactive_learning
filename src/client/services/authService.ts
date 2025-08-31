import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  updateProfile,
  User
} from 'firebase/auth';
import { firebaseManager } from '../../lib/firebaseConfig';

class AuthService {
  private async getAuth() {
    await firebaseManager.initialize();
    const auth = firebaseManager.getAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    return auth;
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    console.log('AuthService: Signing in with email:', email);
    const auth = await this.getAuth();
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthService: Sign-in successful');
      return userCredential.user;
    } catch (error) {
      console.error('AuthService: Sign-in failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    console.log('AuthService: Creating account for:', email);
    const auth = await this.getAuth();
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user's display name
      await updateProfile(user, { displayName });
      console.log('AuthService: Account created successfully');
      
      return user;
    } catch (error) {
      console.error('AuthService: Sign-up failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async signInWithGoogle(): Promise<User> {
    console.log('AuthService: Signing in with Google');
    const auth = await this.getAuth();
    const provider = new GoogleAuthProvider();
    
    try {
      const userCredential = await signInWithPopup(auth, provider);
      console.log('AuthService: Google sign-in successful');
      return userCredential.user;
    } catch (error) {
      console.error('AuthService: Google sign-in failed:', error);
      throw this.formatAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    console.log('AuthService: Signing out');
    const auth = await this.getAuth();
    
    try {
      await signOut(auth);
      console.log('AuthService: Sign-out successful');
    } catch (error) {
      console.error('AuthService: Sign-out failed:', error);
      throw this.formatAuthError(error);
    }
  }

  createDevUser(): User {
    console.log('AuthService: Creating development user');
    return {
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
  }

  private formatAuthError(error: any): Error {
    if (typeof error === 'object' && error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return new Error('Invalid email or password');
        case 'auth/email-already-in-use':
          return new Error('An account with this email already exists');
        case 'auth/weak-password':
          return new Error('Password should be at least 6 characters');
        case 'auth/invalid-email':
          return new Error('Please enter a valid email address');
        case 'auth/too-many-requests':
          return new Error('Too many failed attempts. Please try again later');
        case 'auth/popup-closed-by-user':
          return new Error('Sign-in was cancelled');
        case 'auth/popup-blocked':
          return new Error('Popup was blocked. Please allow popups and try again');
        default:
          return new Error(error.message || 'Authentication failed');
      }
    }
    
    return error instanceof Error ? error : new Error('Authentication failed');
  }
}

export const authService = new AuthService();