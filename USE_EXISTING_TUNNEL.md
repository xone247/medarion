# Using Cloudflare Tunnel for API

## 🌐 Your Current Tunnels

From your Vast.ai dashboard, you have these tunnels:
- `https://pairs-woods-flavor-scientist.trycloudflare.com` → `localhost:8080` (Jupyter)
- `https://fare-ian-dramatically-beverly.trycloudflare.com` → `localhost:6006`
- `https://urban-palestinian-enters-derby.trycloudflare.com` → `localhost:8384`
- `https://licensed-energy-corporations-gibraltar.trycloudflare.com` → `localhost:1111`

## 🚀 Create Tunnel for API (Port 44047)

### Method 1: Via Vast.ai Dashboard (Easiest)

1. Go to your Vast.ai instance dashboard
2. Find the **"Tunnels"** section
3. Click **"Create New Tunnel"** or **"Open New Port"**
4. Enter: `localhost:44047`
5. Copy the generated URL (will look like `https://random-name.trycloudflare.com`)

### Method 2: Via Command Line (Jupyter Terminal)

```bash
# Start tunnel in background
nohup cloudflared tunnel --url http://localhost:44047 > /tmp/api_tunnel.log 2>&1 &

# Wait a moment
sleep 3

# Get the URL
cat /tmp/api_tunnel.log | grep trycloudflare
```

You'll get a URL like:
```
https://random-name.trycloudflare.com
```

## 📝 Update Backend Configuration

Once you have the tunnel URL, update `server/.env`:

```env
VAST_AI_URL=https://your-api-tunnel-url.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
```

## 🧪 Test Your API

### Health Check:
```bash
curl https://your-api-tunnel-url.trycloudflare.com/health
```

### Chat Test:
```bash
curl -X POST https://your-api-tunnel-url.trycloudflare.com/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
```

## ✅ Complete Setup Steps

1. **Start API on port 44047:**
   ```bash
   cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
   ```

2. **Create Cloudflare tunnel** (via dashboard or command line)

3. **Get tunnel URL** and update backend `.env`

4. **Test the endpoint** from your PC

5. **Done!** Your API is now accessible via HTTPS without tunneling! 🎉

## 💡 Benefits of Cloudflare Tunnel

- ✅ HTTPS (secure connection)
- ✅ No port conflicts
- ✅ Easy to use
- ✅ Works from anywhere
- ✅ No SSH tunneling needed

