import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import circularDependency from 'vite-plugin-circular-dependency';
import { tdzDetectionPlugin } from './vite-plugins/tdz-detection.js';

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
        }),
        // Circular dependency detection for build-time safety
        circularDependency({
          // Exclude certain patterns if needed
          exclude: [
            /node_modules/,
            /dist/,
            /\.config\.[jt]s$/,
          ],
          // Fail the build on circular dependencies in production
          failOnError: isProduction,
          // Show warnings in development
          warningOnly: isDevelopment,
          // Include import statements in analysis
          include: [/\.[jt]sx?$/],
        }),
        // Custom TDZ and runtime error detection
        tdzDetectionPlugin({
          failOnError: false, // Always warn, don't fail build
          warningOnly: true,
        })
      ],
      root: 'src/client',
      server: {
        host: '0.0.0.0',
        port: 3000,
        open: false,
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
          output: {
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]',
            format: 'es',
            manualChunks: (id) => {
              // Core shared code should stay in main bundle to prevent import issues
              if (id.includes('src/shared/')) {
                return undefined; // Keep in main bundle
              }
              
              // Firebase dependencies - split by service for better caching
              if (id.includes('firebase/app')) {
                return 'firebase-core';
              }
              if (id.includes('firebase/firestore')) {
                return 'firebase-firestore';
              }
              if (id.includes('firebase/storage')) {
                return 'firebase-storage';
              }
              if (id.includes('firebase/auth')) {
                return 'firebase-auth';
              }
              // Fallback for any other Firebase modules
              if (id.includes('firebase')) {
                return 'firebase-other';
              }
              
              // React core libraries
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react';
              }
              
              // Animation libraries
              if (id.includes('framer-motion')) {
                return 'animations';
              }
              
              // Utility libraries
              if (id.includes('lodash') || id.includes('qrcode') || id.includes('uuid')) {
                return 'utils';
              }
              
              // Large editor components (>500 lines)
              if (id.includes('UnifiedSlideEditor') || id.includes('SlideEditor')) {
                return 'editor-core';
              }
              
              // Slide system components
              if (id.includes('/slides/') && id.includes('components')) {
                return 'slide-components';
              }
              
              // Icons can be bundled together
              if (id.includes('/icons/') && id.includes('components')) {
                return 'icons';
              }
              
              // Node modules that aren't explicitly handled above
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        },
        cssCodeSplit: true,
        sourcemap: true, // Enable source maps in production for debugging
        reportCompressedSize: false,
        chunkSizeWarningLimit: 800 // Increase from default 500kB to 800kB
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
        // Tree-shake Firebase - only include modules we actually use
        include: [
          'react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/storage', 'firebase/auth'
        ],
        // Explicitly exclude unused Firebase modules for bundle optimization
        exclude: [
          'firebase/analytics',
          'firebase/performance', 
          'firebase/functions',
          'firebase/messaging',
          'firebase/remote-config',
          'firebase/database'
        ],
        // Force pre-bundling in development for consistency
        force: isDevelopment
      },
      // Add specific handling for enum/const files
      esbuild: {
        // Ensure const assertions are preserved in production
        keepNames: true,
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.ts',
      }
    };
});