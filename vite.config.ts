import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: 'src/client',
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
        sourcemap: false
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