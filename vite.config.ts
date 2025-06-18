import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isCodespaces = !!process.env.CODESPACES;
    
    return {
      plugins: [
        react({
          // CRITICAL: Explicit JSX runtime configuration
          jsxRuntime: 'automatic',
          jsxImportSource: 'react',
          // Ensure proper development/production transforms
          babel: {
            parserOpts: {
              plugins: ['decorators-legacy']
            }
          }
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
        minify: 'terser',
        rollupOptions: {
          input: path.resolve(__dirname, 'src/client/index.html'),
          output: {
            entryFileNames: 'assets/[name].[hash].js',
            chunkFileNames: 'assets/[name].[hash].js',
            assetFileNames: 'assets/[name].[hash].[ext]',
            format: 'es'
          }
        },
        cssCodeSplit: true,
        sourcemap: false, // Disable sourcemaps for production
        assetsInlineLimit: 4096,
        reportCompressedSize: false
        // JSX fix deployed - forcing cache refresh
      },
      define: {
        // CRITICAL: Explicit environment definitions
        'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production'),
        '__DEV__': mode === 'development',
        'global': 'globalThis'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/storage'],
        // CRITICAL: Force React pre-bundling to prevent runtime issues
        force: true
      }
    };
});