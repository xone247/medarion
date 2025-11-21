# 🔧 Fix AI Connection - Comprehensive Solution

## Problem
- API connection from cPanel to Vast.ai not working
- Tunnel creation failing
- Need reliable solution

## Solution Approach

### Step 1: Verify API Works Locally on Vast.ai

On Vast.ai instance, test:
```bash
# Test health (no auth needed now)
curl http://localhost:3001/health

# Test ping
curl http://localhost:3001/ping

# Test with API key
curl -H "X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" http://localhost:3001/chat -X POST -H "Content-Type: application/json" -d '{"query":"Hello"}'
```

### Step 2: Updated API File

The updated `run_api_on_vast.py` now has:
- ✅ `/health` - Public (no auth) for testing
- ✅ `/ping` - Public (no auth) for testing  
- ✅ `/chat` - Requires API key
- ✅ `/generate` - Requires API key

**Upload this updated file to Vast.ai!**

### Step 3: Test Connection Methods

#### Method A: Direct Connection (If Firewall Allows)

On cPanel, test:
```bash
curl http://194.228.55.129:3001/health
```

If this works, update `.env`:
```env
VAST_AI_URL=http://194.228.55.129:3001
```

#### Method B: Reverse SSH Tunnel (Recommended)

On Vast.ai:
```bash
ssh -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

On cPanel, update `.env`:
```env
VAST_AI_URL=http://localhost:8081
```

#### Method C: Create Node.js Proxy on cPanel

If both fail, create a simple proxy service on cPanel that:
- Listens on localhost:8081
- Forwards requests to Vast.ai
- Handles authentication
- Provides retry logic

### Step 4: Create Proxy Service (If Needed)

Create `/home/medasnnc/nodevenv/medarion/18/bin/vast-proxy.js`:

```javascript
const http = require('http');
const https = require('https');

const VAST_URL = process.env.VAST_AI_URL || 'http://194.228.55.129:3001';
const API_KEY = process.env.VAST_API_KEY || '47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a';
const PROXY_PORT = 8081;

const server = http.createServer((req, res) => {
  const url = new URL(VAST_URL + req.url);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...req.headers,
      'X-API-Key': API_KEY,
      'Host': url.hostname
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error: ' + err.message);
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`Vast.ai proxy listening on port ${PROXY_PORT}`);
});
```

Then update `.env`:
```env
VAST_AI_URL=http://localhost:8081
```

## Quick Fix Checklist

- [ ] Upload updated `run_api_on_vast.py` to Vast.ai
- [ ] Test API locally on Vast.ai: `curl http://localhost:3001/health`
- [ ] Set `VAST_API_KEY` on Vast.ai when starting API
- [ ] Try direct connection: `curl http://194.228.55.129:3001/health` from cPanel
- [ ] If direct fails, try reverse SSH tunnel
- [ ] If tunnel fails, create proxy service
- [ ] Test Node.js AI integration

## Recommended Order

1. **First**: Upload updated API file and test locally on Vast.ai
2. **Second**: Try reverse SSH tunnel (most reliable)
3. **Third**: If needed, create proxy service on cPanel

