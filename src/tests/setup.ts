import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock Firebase Analytics
vi.mock('@firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn().mockResolvedValue(false),
}));

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