import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    alias: {
      '@firebase/analytics': path.resolve(__dirname, './src/tests/mocks/firebaseAnalytics.ts'),
      '@': path.resolve(__dirname, './src')
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    },
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 2, // Reduced from 4 to prevent resource contention
        minThreads: 1, // Reduced from 2 to prevent hanging
      }
    },
    testTimeout: 10000, // 10 seconds max per test (aggressive timeout for CI)
    hookTimeout: 3000, // 3 seconds max for setup/teardown (aggressive timeout)
    isolate: true, // Isolate tests to prevent hanging issues
    bail: 1, // Stop on first failure to prevent endless execution
    passWithNoTests: true,
    // Reduce console noise in CI
    silent: process.env['CI'] === 'true',
    // Faster test runs
    cache: {
      dir: './node_modules/.vitest'
    },
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
    exclude: ['src/tests/browser/**/*.test.ts'],
    browser: {
      enabled: false,
      name: 'chromium',
      provider: 'playwright',
      headless: true
    }
  },
  optimizeDeps: {
    include: ['firebase/analytics']
  }
})