import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isCodespaces = !!process.env.CODESPACES;

    return {
      plugins: [
        react({
          // Explicitly tell the plugin to use the dev runtime ONLY in development mode.
          // This is the key fix for the "jsxDEV is not a function" error in production builds.
          jsxDev: mode === 'development',
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
        sourcemap: false,
        reportCompressedSize: false
      },
      define: {
        // Correctly defines the environment for React and other libraries.
        'process.env.NODE_ENV': JSON.stringify(mode),
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
        // The `force: true` setting is a heavy-handed approach.
        // With the explicit jsxDev fix, it's likely no longer necessary.
        // It's commented out but can be re-enabled if other dependency issues arise.
        // force: true
      }
    };
});