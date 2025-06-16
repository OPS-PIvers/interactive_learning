import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: 'src/client',
      build: {
        outDir: '../../dist',
        emptyOutDir: false,
        target: 'es2018',
        minify: false,
        rollupOptions: {
          input: path.resolve(__dirname, 'src/client/index.tsx'),
          // Make sure React and ReactDOM are bundled, not external
          external: [],
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
            name: 'InteractiveLearningApp',
            // Ensure all dependencies are bundled
            manualChunks: undefined,
            inlineDynamicImports: true
          }
        },
        cssCodeSplit: false,
        // Increase chunk size warning limit since we're bundling everything
        chunkSizeWarningLimit: 1000,
        // Ensure source maps are disabled for production
        sourcemap: false,
        // Optimize the bundle
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Ensure Vite doesn't try to optimize React separately
      optimizeDeps: {
        include: ['react', 'react-dom']
      }
    };
});