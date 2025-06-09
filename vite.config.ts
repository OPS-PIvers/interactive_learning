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
            entryFileNames: 'javascript.js',
            chunkFileNames: 'javascript.js',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'css.css';
              }
              return 'assets/[name].[ext]';
            },
            format: 'iife',
            name: 'InteractiveLearningApp',
            globals: {
              'react': 'React',
              'react-dom': 'ReactDOM',
              'react-dom/client': 'ReactDOM'
            }
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
