import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

vi.doMock('../lib/firebaseConfig', () => ({
  firebaseManager: {
    initialize: vi.fn(() => Promise.resolve()),
    isReady: vi.fn(() => true),
    getAuth: vi.fn(() => ({
      currentUser: {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User',
        getIdToken: () => Promise.resolve('test-token'),
        getIdTokenResult: () => Promise.resolve({
          token: 'test-token',
          expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          signInProvider: null,
          signInSecondFactor: null,
          claims: {},
        }),
      },
      onAuthStateChanged: vi.fn(() => () => {}),
    })),
    getFirestore: vi.fn(() => ({})),
    getStorage: vi.fn(() => ({})),
    getPerformance: vi.fn(() => ({})),
    getAnalytics: vi.fn(() => ({})),
  },
  auth: {
    currentUser: {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: () => Promise.resolve('test-token'),
      getIdTokenResult: () => Promise.resolve({
        token: 'test-token',
        expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        signInProvider: null,
        signInSecondFactor: null,
        claims: {},
      }),
    },
    onAuthStateChanged: vi.fn(() => () => {}),
  },
}));

// Mock Firebase Analytics - both module formats
vi.mock('@firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(() => Promise.resolve(false)),
  logEvent: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
  initializeAnalytics: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(() => Promise.resolve(false)),
  logEvent: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
  initializeAnalytics: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
}));

const noop = () => {};
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true });

// Mock window.matchMedia for mobile detection tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.visualViewport
Object.defineProperty(window, 'visualViewport', {
  writable: true,
  value: {
    width: 1280,
    height: 800,
    scale: 1,
    offsetTop: 0,
    offsetLeft: 0,
    onresize: null,
    onscroll: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
});

// Mock for react-window
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  writable: true,
  value: () => ({
    width: 1024,
    height: 768,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
});

HTMLCanvasElement.prototype.getContext = vi.fn();

Object.defineProperty(window, 'CSS', {
  value: {
    ...window.CSS,
    supports: vi.fn(() => true),
  },
  writable: true,
});