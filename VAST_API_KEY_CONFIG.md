# 🔑 Vast.ai API Key Configuration

## Generated API Key

**API Key:** `[See vast_api_key.txt file]`

⚠️ **IMPORTANT:** Keep this key secure and don't share it publicly!

---

## Step 1: Configure on Vast.ai Instance

### Option A: Environment Variable (Recommended)

```bash
export VAST_API_KEY="your-api-key-here"
python3 run_api_on_vast.py
```

### Option B: Add to Startup Script

Edit your startup script or create a systemd service:

```bash
VAST_API_KEY="your-api-key-here" python3 /workspace/run_api_on_vast.py
```

### Option C: Create .env File on Vast.ai

```bash
echo 'VAST_API_KEY="your-api-key-here"' > /workspace/.env
# Then modify run_api_on_vast.py to load from .env if needed
```

---

## Step 2: Configure on cPanel

### Update .env File

Edit `/home/medasnnc/nodevenv/medarion/18/bin/.env`:

```env
AI_MODE=vast
VAST_AI_URL=http://194.228.55.129:3001
VAST_API_KEY=your-api-key-here
```

**Replace:**
- `194.228.55.129` with your actual Vast.ai IP
- `your-api-key-here` with the generated API key

---

## Step 3: Restart Services

### On Vast.ai:
```bash
# Stop existing API
pkill -f run_api_on_vast.py

# Start with API key
export VAST_API_KEY="your-api-key-here"
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### On cPanel:
```bash
systemctl restart medarion-api.service
```

---

## Step 4: Test Connection

### From cPanel:
```bash
curl -H "X-API-Key: your-api-key-here" http://194.228.55.129:3001/health
```

Should return: `{"status":"ok","model":"Mistral-7B"}`

### Test AI Query:
```bash
curl -X POST http://localhost:3001/api/ai/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"query":"Hello"}'
```

---

## Security Notes

✅ **API Key Authentication**: All endpoints now require the API key
✅ **Header Format**: Use `X-API-Key: your-key` in requests
✅ **Keep Secure**: Don't commit the key to version control
✅ **Rotate Regularly**: Change the key periodically for security

---

## Troubleshooting

### "Unauthorized: Invalid API key"
- Check the key is correct (no extra spaces)
- Verify environment variable is set on Vast.ai
- Ensure .env file has correct key on cPanel
- Restart services after changes

### "Unauthorized: API key required"
- Make sure you're sending the `X-API-Key` header
- Check Node.js service is reading the environment variable

### Connection Issues
- Verify Vast.ai firewall allows port 3001
- Check Vast.ai API is running
- Test direct connection with curl

---

## Quick Reference

**Environment Variables:**
- `VAST_API_KEY` - Vast.ai native API key (priority)
- `VAST_AI_API_KEY` - Custom API key (fallback)
- `VAST_AI_URL` - Vast.ai API URL (e.g., `http://194.228.55.129:3001`)

**Header Format:**
```
X-API-Key: your-api-key-here
```

**Endpoints:**
- `GET /health` - Health check
- `GET /ping` - Ping test
- `POST /chat` - OpenAI-compatible chat
- `POST /generate` - Simple text generation

