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
          external: ['react', 'react-dom', 'react-dom/client'],
          output: {
            entryFileNames: 'bundle.js',
            chunkFileNames: 'bundle.js',
            assetFileNames: 'bundle.[ext]',
            format: 'iife',
            name: 'InteractiveLearningApp',
            globals: {
              'react': 'React',
              'react-dom': 'ReactDOM',
              'react-dom/client': 'ReactDOM'
            }
          }
        }
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
