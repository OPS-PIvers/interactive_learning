import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    const isCodespaces = !!process.env.CODESPACES;
    
    // Explicit environment detection
    const isProduction = mode === 'production' || process.env.NODE_ENV === 'production' || command === 'build';
    const isDevelopment = !isProduction;
    
    // Debug logging for mode detection
    console.log(`🔧 Vite Config - Mode: ${mode}, Command: ${command}, Production: ${isProduction}, Development: ${isDevelopment}`);
    
    return {
      plugins: [
        react({
          // CRITICAL: Explicit JSX development mode control
          // Only use development JSX runtime in actual development
          jsxDev: isDevelopment,
          // Explicit JSX runtime configuration
          jsxRuntime: 'automatic',
          jsxImportSource: 'react',
        })
      ],
      root: 'src/client',
      server: {
        host: isCodespaces ? '0.0.0.0' : 'localhost',
        port: 3000,
        open: !isCodespaces,
      },
      preview: {
        host: isCodespaces ? '0.0.0.0' : 'localhost',
        port: 4173,
        open: !isCodespaces
      },
      build: {
        outDir: '../../dist',
        emptyOutDir: true,
        target: 'es2020',
        minify: isProduction ? 'terser' : false,
        rollupOptions: {
          input: path.resolve(__dirname, 'src/client/index.html'),
          output: {
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]',
            format: 'es',
            manualChunks: {
              // Split Firebase into its own chunk
              firebase: ['firebase/app', 'firebase/firestore', 'firebase/storage'],
              // Split React libs into their own chunk
              react: ['react', 'react-dom', 'react-router-dom'],
              // Split utility libraries
              utils: ['lodash.debounce', 'qrcode'],
              // Split react-dnd into its own chunk
              dnd: ['react-dnd', 'react-dnd-html5-backend']
            }
          }
        },
        cssCodeSplit: true,
        sourcemap: true, // Enable source maps in production for debugging
        reportCompressedSize: false
      },
      define: {
        // CRITICAL: Explicit environment definitions
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        '__DEV__': isDevelopment,
        'global': 'globalThis'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/storage'],
        // Force pre-bundling in development for consistency
        force: isDevelopment
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.ts',
      }
    };
});