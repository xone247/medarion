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
    open: true,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
      clientPort: 5173,
      overlay: true // Show error overlay in browser
    },
    watch: {
      usePolling: false,
      interval: 100,
      ignored: ['**/node_modules/**', '**/.git/**', '**/medarion-dist/**']
    },
    // Keep server running even on errors
    middlewareMode: false,
    // Increase timeout for slow file systems
    fs: {
      strict: false,
      allow: ['..']
    }
    // Note: Proxy is handled by apiProxyPlugin() to ensure it runs BEFORE static file serving
  },
});