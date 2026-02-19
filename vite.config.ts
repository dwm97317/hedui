import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Ensure relative paths for file:// protocol
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['vconsole'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      emptyOutDir: false, // Prevent deleting root-owned .well-known folder
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Keep logs for debugging black screen
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vconsole': ['vconsole'],
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    }
  };
});
