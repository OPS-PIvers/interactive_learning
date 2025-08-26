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
        maxThreads: 4,
        minThreads: 2,
      }
    },
    testTimeout: 30000, // 30 seconds max per test
    hookTimeout: 10000, // 10 seconds max for setup/teardown
    isolate: false, // Share context between tests for better performance
    passWithNoTests: true,
    // Reduce console noise in CI
    silent: process.env.CI === 'true',
    // Faster test runs
    cache: {
      dir: './node_modules/.vitest'
    }
  },
})