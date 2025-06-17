import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Detect if we're in GitHub Codespaces
    const isCodespaces = !!process.env.CODESPACES;
    
    return {
      root: 'src/client',
      server: {
        // Make server accessible from outside container
        host: isCodespaces ? '0.0.0.0' : 'localhost',
        port: 3000, // Use a consistent port
        // Auto-open browser in Codespaces
        open: !isCodespaces,
      },
      preview: {
        // Configure preview server for 'npm run preview'
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
        sourcemap: mode === 'development' // Enable sourcemaps for dev
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['firebase/app', 'firebase/firestore', 'firebase/storage', 'react', 'react-dom']
      }
    };
});