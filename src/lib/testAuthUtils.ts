/**
 * Test Authentication Utilities
 * Provides authentication bypass and test user management for development and testing
 */

import type { User } from 'firebase/auth';

// Test user interface
export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
}

// Create mock Firebase User object
export function createMockUser(userData: Partial<TestUser>): User {
  return {
    uid: userData.uid || 'test-user-uid',
    email: userData.email || 'test@example.com',
    displayName: userData.displayName || 'Test User',
    emailVerified: userData.emailVerified ?? true,
    photoURL: userData.photoURL || null,
    phoneNumber: null,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    providerData: [{
      providerId: 'password',
      uid: userData.email || 'test@example.com',
      displayName: userData.displayName || 'Test User',
      email: userData.email || 'test@example.com',
      phoneNumber: null,
      photoURL: userData.photoURL || null
    }],
    providerId: 'firebase',
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({
      token: 'mock-id-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'password',
      claims: {},
      signInSecondFactor: null
    }),
    reload: async () => {},
    toJSON: () => ({})
  } as User;
}

// Predefined test users
export const TEST_USERS = {
  DEFAULT: {
    uid: 'test-user-default',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true
  },
  ADMIN: {
    uid: 'test-user-admin',
    email: 'admin@example.com',
    displayName: 'Test Admin',
    emailVerified: true
  },
  DEVELOPER: {
    uid: 'dev-user-123',
    email: 'dev@localhost',
    displayName: 'Development User',
    emailVerified: true
  }
} as const;

// Development bypass utilities
export class DevAuthBypass {
  private static instance: DevAuthBypass;
  private bypassEnabled = false;
  private currentUser: User | null = null;

  private constructor() {
    // Check environment variables for bypass configuration
    this.bypassEnabled = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
    
    // Enable bypass in development mode when explicitly requested
    if (this.bypassEnabled) {
      console.warn('🚧 Development authentication bypass is ENABLED');
      this.setupDefaultUser();
    }
  }

  public static getInstance(): DevAuthBypass {
    if (!DevAuthBypass.instance) {
      DevAuthBypass.instance = new DevAuthBypass();
    }
    return DevAuthBypass.instance;
  }

  private setupDefaultUser(): void {
    const userData = {
      uid: import.meta.env.VITE_DEV_USER_ID || TEST_USERS.DEVELOPER.uid,
      email: import.meta.env.VITE_DEV_USER_EMAIL || TEST_USERS.DEVELOPER.email,
      displayName: import.meta.env.VITE_DEV_USER_NAME || TEST_USERS.DEVELOPER.displayName,
      emailVerified: true
    };
    
    this.currentUser = createMockUser(userData);
  }

  public isEnabled(): boolean {
    return this.bypassEnabled;
  }

  public getBypassUser(): User | null {
    return this.isEnabled() ? this.currentUser : null;
  }

  public setBypassUser(userData: Partial<TestUser>): void {
    if (this.isEnabled()) {
      this.currentUser = createMockUser(userData);
      console.warn(`🔧 Dev bypass user changed to: ${this.currentUser.email}`);
    }
  }

  public disable(): void {
    this.bypassEnabled = false;
    this.currentUser = null;
    console.info('🔒 Development authentication bypass disabled');
  }
}

// Environment-based test credentials
export function getTestCredentials() {
  return {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User'
  };
}

export function getAdminCredentials() {
  return {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
    displayName: process.env.TEST_ADMIN_DISPLAY_NAME || 'Test Admin'
  };
}

// Testing utility functions
export async function waitForAuth(timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Authentication timeout'));
    }, timeout);

    // Simple polling for auth state
    const checkAuth = () => {
      if (DevAuthBypass.getInstance().isEnabled() || 
          document.querySelector('[data-testid="authenticated-content"]')) {
        clearTimeout(timer);
        resolve();
      } else {
        setTimeout(checkAuth, 100);
      }
    };

    checkAuth();
  });
}

// Utility to check if we're in a testing environment
export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
  );
}

// Create test project data (for use with bypassed authentication)
export function createTestProjectData() {
  const user = DevAuthBypass.getInstance().getBypassUser();
  if (!user) return null;

  return {
    id: `test-project-${Date.now()}`,
    title: 'Test Interactive Module',
    description: 'Generated test project for Puppeteer testing',
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName || 'Test User',
    isPublic: true, // Make public for easy testing
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: '',
    hotspots: [],
    timeline: []
  };
}

export default DevAuthBypass;