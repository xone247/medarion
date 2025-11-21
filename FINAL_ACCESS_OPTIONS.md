# Final Access Options - Your API is Ready!

## ✅ Current Setup

- **Jupyter**: Running on port 8080 (don't kill this!)
- **Cloudflare Tunnel**: Already running!
- **API Script**: Updated to use port 44047

## 🌐 Access Options

### Option 1: Cloudflare Tunnel (Recommended - Already Running!)

**Get your tunnel URL:**
```bash
# In Jupyter terminal:
cat /tmp/cloudflared.log | grep trycloudflare
# OR check Vast.ai dashboard for tunnel URL
```

**Your URL will look like:**
```
https://random-name.trycloudflare.com
```

**Update backend `.env`:**
```env
VAST_AI_URL=https://your-tunnel-url.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
```

**Advantages:**
- ✅ Already set up and running
- ✅ HTTPS (secure)
- ✅ No port conflicts
- ✅ Works immediately

### Option 2: Port Mapping (44047)

**Public URL:**
```
http://93.91.156.86:44047
```

**Update backend `.env`:**
```env
VAST_AI_URL=http://93.91.156.86:44047
VAST_AI_API_KEY=medarion-secure-key-2025
```

**To use this:**
1. Make sure API is running on port 44047
2. Test: `curl http://93.91.156.86:44047/health`

## 🚀 Quick Start

### If using Cloudflare Tunnel:
1. Get tunnel URL (see commands above)
2. Update backend `.env` with tunnel URL
3. Done! ✅

### If using Port Mapping:
1. Start API: `cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &`
2. Test: `curl http://93.91.156.86:44047/health`
3. Update backend `.env` with port mapping URL
4. Done! ✅

## 🧪 Test Your Endpoint

### Health Check:
```bash
# Cloudflare tunnel
curl https://your-tunnel-url.trycloudflare.com/health

# OR Port mapping
curl http://93.91.156.86:44047/health
```

### Chat Test:
```bash
# Cloudflare tunnel
curl -X POST https://your-tunnel-url.trycloudflare.com/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'

# OR Port mapping
curl -X POST http://93.91.156.86:44047/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
```

## 💡 Recommendation

**Use Cloudflare Tunnel** - it's already running and provides:
- HTTPS security
- No port conflicts
- Easy to use
- Already configured

Just get the URL and use it in your backend!

