# Fix Cloudflare Tunnel Connection

## Problem
The Cloudflare tunnel URL is timing out, which means:
- ❌ API on Vast.ai may not be running
- ❌ Cloudflare tunnel may have expired/disconnected
- ❌ Tunnel URL may have changed

## Solution

### Step 1: Check API on Vast.ai

Run these commands on Vast.ai (Jupyter Terminal):

```bash
# Check if API is running
ps aux | grep "python3.*run_api_on_vast.py" | grep -v grep

# If not running, start it:
cd /workspace
pkill -f "python3.*run_api_on_vast.py"
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait 30 seconds for model to load
sleep 30

# Test local health endpoint
curl http://localhost:5000/health
```

Expected: `{"status":"ok","model":"Medarion-Mistral-7B","inference_ready":true}`

### Step 2: Restart Cloudflare Tunnel

On Vast.ai, restart the Cloudflare tunnel:

```bash
# Kill old tunnel
pkill cloudflared

# Start new tunnel
cloudflared tunnel --url http://localhost:5000
```

**IMPORTANT:** Copy the new tunnel URL that appears (e.g., `https://new-url.trycloudflare.com`)

### Step 3: Update Backend Configuration

Update `server/.env` with the new tunnel URL:

```env
VAST_AI_URL=https://NEW-TUNNEL-URL.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast
```

Replace `NEW-TUNNEL-URL` with the actual URL from Step 2.

### Step 4: Restart Backend

```bash
cd server
npm start
```

### Step 5: Test Connection

```powershell
# Test API directly
Invoke-RestMethod -Uri "https://NEW-TUNNEL-URL.trycloudflare.com/health"

# Test backend health
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health"
```

Should show: `"inference": true`

## Alternative: Use Persistent Tunnel

For a more stable setup, you can:

1. **Set up a named Cloudflare tunnel** (requires Cloudflare account)
2. **Use Vast.ai's port mapping** (if available on your instance)
3. **Use SSH tunnel** from your PC to Vast.ai (for local testing)

## Quick Check Commands

```bash
# On Vast.ai - Check API
curl http://localhost:5000/health

# On Vast.ai - Check tunnel
ps aux | grep cloudflared

# On Your PC - Test tunnel
curl https://YOUR-TUNNEL-URL.trycloudflare.com/health
```

---

**The key is: API running on Vast.ai + Active Cloudflare tunnel + Correct URL in .env = Working connection** ✅

