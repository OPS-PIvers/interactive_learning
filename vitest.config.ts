import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    alias: {
      '@firebase/analytics': './src/tests/mocks/firebaseAnalytics.ts',
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
    testTimeout: 15000, // 15 seconds max per test (was causing hangs at 30s)
    hookTimeout: 5000, // 5 seconds max for setup/teardown (was causing hangs)
    isolate: true, // Isolate tests to prevent hanging issues (changed from false)
    passWithNoTests: true,
    // Reduce console noise in CI
    silent: process.env.CI === 'true',
    // Faster test runs
    cache: {
      dir: './node_modules/.vitest'
    }
  },
})