import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'

// Mock Firebase Analytics
vi.mock('@firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
}));

const noop = () => {};
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true });

// Mock window.matchMedia for mobile detection tests.
// This can be overridden in individual tests to simulate different devices.
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false, // Default to desktop
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Global error handler to catch unhandled exceptions and promise rejections
let unhandledErrors: (Error | PromiseRejectionEvent)[] = [];

const errorListener = (event: ErrorEvent) => {
  // Don't fail tests for errors caught by React Error Boundaries
  if (
    event.message.includes('The above error occurred in the') ||
    (event.error && event.error.__suppressFlushSyncWarning)
  ) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  unhandledErrors.push(event.error);
};

const rejectionListener = (event: PromiseRejectionEvent) => {
  unhandledErrors.push(event);
};

const startListening = () => {
  window.addEventListener('error', errorListener);
  window.addEventListener('unhandledrejection', rejectionListener);
};

const stopListening = () => {
  window.removeEventListener('error', errorListener);
  window.removeEventListener('unhandledrejection', rejectionListener);
};

startListening();

// Expose control to tests
global.pauseGlobalErrorHandler = stopListening;
global.resumeGlobalErrorHandler = startListening;

afterEach(() => {
  if (unhandledErrors.length > 0) {
    const errors = [...unhandledErrors];
    unhandledErrors = []; // Clear for the next test
    const errorMessages = errors.map(err => {
      if (err instanceof Error) {
        return err.stack || err.message;
      }
      if (err instanceof PromiseRejectionEvent) {
        return err.reason?.stack || err.reason;
      }
      return 'Unknown error';
    }).join('\n');
    throw new Error(`The following errors were caught by the global error handler:\n${errorMessages}`);
  }
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