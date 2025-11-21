// Vast.ai Proxy Service
// Runs on cPanel and proxies requests to Vast.ai
// Handles connection issues, retries, and authentication

import http from 'http';
import https from 'https';
import { URL } from 'url';

class VastProxy {
  constructor() {
    this.vastUrl = process.env.VAST_AI_URL || 'http://194.228.55.129:3001';
    this.apiKey = process.env.VAST_API_KEY || '47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a';
    this.proxyPort = 8081;
    this.server = null;
    
    console.log('🔧 VastProxy initialized:', {
      vastUrl: this.vastUrl,
      proxyPort: this.proxyPort,
      hasApiKey: !!this.apiKey
    });
  }

  start() {
    if (this.server) {
      console.log('⚠️  Proxy server already running');
      return;
    }

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.proxyPort, '127.0.0.1', () => {
      console.log(`✅ Vast.ai proxy listening on http://127.0.0.1:${this.proxyPort}`);
      console.log(`   Proxying to: ${this.vastUrl}`);
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${this.proxyPort} already in use, proxy may already be running`);
      } else {
        console.error('❌ Proxy server error:', err);
      }
    });
  }

  async handleRequest(req, res) {
    try {
      const targetUrl = new URL(req.url, this.vastUrl);
      
      // Add API key to headers
      const headers = {
        ...req.headers,
        'X-API-Key': this.apiKey,
        'Host': targetUrl.hostname
      };
      delete headers.host; // Remove original host header

      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: headers,
        timeout: 30000
      };

      const protocol = targetUrl.protocol === 'https:' ? https : http;

      const proxyReq = protocol.request(options, (proxyRes) => {
        // Copy status and headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        // Pipe response
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('❌ Proxy request error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Proxy error', 
            message: err.message,
            target: this.vastUrl
          }));
        }
      });

      proxyReq.on('timeout', () => {
        console.error('❌ Proxy request timeout');
        proxyReq.destroy();
        if (!res.headersSent) {
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Gateway timeout',
            message: 'Request to Vast.ai timed out'
          }));
        }
      });

      // Pipe request body
      req.pipe(proxyReq);

    } catch (error) {
      console.error('❌ Proxy error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal proxy error',
          message: error.message
        }));
      }
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('🛑 Proxy server stopped');
    }
  }
}

// Export singleton instance
export const vastProxy = new VastProxy();

// Auto-start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  vastProxy.start();
}

export default vastProxy;

