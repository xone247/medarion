import type { Plugin } from 'vite';
import httpProxy from 'http-proxy';

/**
 * Vite plugin to ensure API requests are proxied BEFORE Vite tries to serve them as static files
 * This fixes the issue where browser requests to /api/* return HTML instead of proxied JSON
 */
export function apiProxyPlugin(): Plugin {
  return {
    name: 'api-proxy-plugin',
    enforce: 'pre', // Run BEFORE Vite's default middleware
    configureServer(server) {
      // Create proxy instance with target configured
      const proxy = httpProxy.createProxyServer({
        target: 'http://localhost/medarion',
        changeOrigin: true,
        secure: false,
      });

      // This middleware runs BEFORE Vite's static file middleware
      // Use use() without path prefix and check manually for better control
      // Create proxy for Node.js server (port 3001) - for AI endpoints
      const nodeProxy = httpProxy.createProxyServer({
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      });

      server.middlewares.use((req: any, res: any, next: any) => {
        // Only handle /api requests - let everything else pass through
        const url = req.url || '';
        if (!url.startsWith('/api')) {
          return next();
        }

        // Don't proxy if already handled
        if (res.headersSent) {
          return;
        }

        // Determine target based on endpoint
        // AI endpoints, admin endpoints (including modules), blog endpoints, countries endpoints, auth endpoints, and notifications go to Node.js server (port 3001)
        // Only specific PHP endpoints go to PHP server
        const isNodeJSEndpoint = url.startsWith('/api/ai') || 
                                 url.startsWith('/api/admin') ||
                                 url.startsWith('/api/blog') ||
                                 url.startsWith('/api/countries') ||
                                 url.startsWith('/api/auth') ||
                                 url.startsWith('/api/notifications');
        const target = isNodeJSEndpoint ? 'http://localhost:3001' : 'http://localhost/medarion';

        // Forward Authorization header
        if (req.headers.authorization || req.headers.Authorization) {
          req.headers.authorization = req.headers.authorization || req.headers.Authorization || '';
        }

        // Set accept header to ensure JSON response
        req.headers.accept = 'application/json, text/plain, */*';
        
        // Ensure Content-Type is set for POST/PUT/PATCH requests
        if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
          if (!req.headers['content-type'] && !req.headers['Content-Type']) {
            req.headers['content-type'] = 'application/json';
          }
          // Also ensure Content-Length is preserved if body exists
          if (req.body && typeof req.body === 'string') {
            req.headers['content-length'] = Buffer.byteLength(req.body, 'utf8').toString();
          }
        }
        
        console.log('[API Proxy Plugin] Proxying:', req.method, url, '->', `${target}${url}`);
        console.log('[API Proxy Plugin] Headers:', JSON.stringify(req.headers, null, 2));

          // Proxy the request - http-proxy will append req.url to the target
          // IMPORTANT: Don't call next() - we're handling this request completely
          try {
            const proxyInstance = isNodeJSEndpoint ? nodeProxy : proxy;
          
          // Handle proxy errors
          const errorHandler = (err: any) => {
            console.error('[API Proxy Plugin] Error:', err?.message, 'for', url, 'target:', target);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Proxy error: ${err?.message || 'Unknown error'}` }));
            }
          };
          
          // Attach error handler to proxy instance
          proxyInstance.on('error', errorHandler);
          proxyInstance.on('proxyReq', (proxyReq, req, res) => {
            console.log('[API Proxy Plugin] Proxy request:', proxyReq.method, proxyReq.path);
            // Ensure Content-Type is set for POST requests
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              if (!proxyReq.getHeader('content-type') && !proxyReq.getHeader('Content-Type')) {
                proxyReq.setHeader('content-type', 'application/json');
              }
            }
          });
          proxyInstance.on('proxyRes', (proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode || 200;
            console.log('[API Proxy Plugin] Proxy response:', statusCode, req.url);
            // Log error responses for debugging
            if (statusCode >= 400) {
              console.error('[API Proxy Plugin] Error response:', statusCode, 'for', req.url);
            }
          });
          
          proxyInstance.web(req, res, {
            target: target,
            changeOrigin: true,
            secure: false,
            xfwd: true, // Add X-Forwarded-* headers
            timeout: 120000, // 2 minute timeout for AI requests
            followRedirects: true,
            selfHandleResponse: false, // Let the proxy handle the response
          }, errorHandler);
        } catch (err: any) {
          console.error('[API Proxy Plugin] Exception:', err?.message, 'for', url);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Proxy exception: ${err?.message || 'Unknown error'}` }));
          }
        }
      });
    }
  };
}
