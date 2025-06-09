import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: 'src/client',
      build: {
        outDir: '../../dist',
        emptyOutDir: false,
        target: 'es2015',
        minify: 'terser',
        rollupOptions: {
          // Remove external configuration - bundle everything together
          output: {
            entryFileNames: 'bundle.js',
            chunkFileNames: 'bundle-chunk.js',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'styles.css';
              }
              return 'assets/[name].[ext]';
            },
            format: 'iife',
            name: 'InteractiveLearningApp'
            // Remove globals - everything will be bundled
          }
        },
        cssCodeSplit: false
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});