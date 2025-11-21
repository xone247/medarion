import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiProxyPlugin } from './vite-plugin-api-proxy';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), apiProxyPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'medarion-dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0', // Allow external access (needed for ngrok)
    port: 5173,
    strictPort: false, // allow fallback to next available port if 5173 is busy
    open: true
    // Note: Proxy is handled by apiProxyPlugin() to ensure it runs BEFORE static file serving
  },
});