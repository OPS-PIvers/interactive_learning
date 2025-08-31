import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: 'src/client',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~/': resolve(__dirname, 'src/client/')
    }
  },

  build: {
    outDir: '../../dist',
    target: 'es2018',
    sourcemap: mode === 'development',
    emptyOutDir: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    },
    
    // Optimize for production
    minify: mode === 'production' ? 'esbuild' : false,
    
    // Asset optimization
    assetsDir: 'assets',
    assetsInlineLimit: 4096,

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: mode === 'production'
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    strictPort: true
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env['npm_package_version']),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // Performance optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage'
    ]
  }
}));