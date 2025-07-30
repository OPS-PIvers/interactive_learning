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
          output: {
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]',
            format: 'es',
            manualChunks: (id) => {
              // Firebase dependencies - largest external dependency
              if (id.includes('firebase')) {
                return 'firebase';
              }
              
              // React core libraries
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react';
              }
              
              // Animation libraries
              if (id.includes('framer-motion')) {
                return 'animations';
              }
              
              // DnD libraries
              if (id.includes('dnd-kit') || id.includes('react-dnd')) {
                return 'dnd';
              }
              
              // Utility libraries
              if (id.includes('lodash') || id.includes('qrcode') || id.includes('uuid')) {
                return 'utils';
              }
              
              // Large editor components (>500 lines)
              if (id.includes('UnifiedSlideEditor') || id.includes('SlideEditor') || id.includes('EnhancedPropertiesPanel')) {
                return 'editor-core';
              }
              
              // Mobile-specific components
              if (id.includes('/mobile/') || id.includes('Mobile') && id.includes('components')) {
                return 'mobile-components';
              }
              
              // Desktop-specific components  
              if (id.includes('/desktop/') || id.includes('Desktop') && id.includes('components')) {
                return 'desktop-components';
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