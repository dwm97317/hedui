import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        legacy({
            targets: ['chrome >= 60', 'android >= 9'],
            additionalLegacyPolyfills: ['regenerator-runtime/runtime']
        })
    ],
    build: {
        target: 'es2015',
        minify: 'esbuild',
        chunkSizeWarningLimit: 2000,
        emptyOutDir: false
    }
})
