# 🔧 Quick Fix: Vast.ai API Setup

## Current Status
✅ API is running on port 3001
⚠️ Connection tests failing (likely missing API key configuration)

## Quick Fix Steps

### Step 1: Verify Updated File is Uploaded

On Vast.ai, check if the file has API key authentication:

```bash
grep -n "check_auth" /workspace/run_api_on_vast.py
```

If it returns nothing, the updated file isn't uploaded yet.

### Step 2: Set API Key Environment Variable

On Vast.ai instance:

```bash
export VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"
```

### Step 3: Restart API with Key

Stop current API:
```bash
pkill -f run_api_on_vast.py
```

Start with API key:
```bash
export VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"
nohup python3 /workspace/run_api_on_vast.py > api.log 2>&1 &
```

Or in one command:
```bash
VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" python3 /workspace/run_api_on_vast.py
```

### Step 4: Verify It's Working

Test from cPanel:
```bash
curl -H "X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" http://194.228.55.129:3001/health
```

Should return: `{"status":"ok","model":"Mistral-7B"}`

## Troubleshooting

### If health check fails:
1. Check if updated `run_api_on_vast.py` is uploaded
2. Verify `VAST_API_KEY` environment variable is set
3. Check API logs: `tail -f api.log` or check the terminal output
4. Verify firewall allows port 3001

### If "Unauthorized" error:
- API key is set correctly
- Make sure you're sending `X-API-Key` header
- Verify the key matches exactly (no extra spaces)

### If connection timeout:
- Check Vast.ai firewall settings
- Verify port 3001 is open
- Test from Vast.ai itself: `curl http://localhost:3001/health`

## Complete Setup Checklist

- [ ] Updated `run_api_on_vast.py` uploaded to Vast.ai
- [ ] `VAST_API_KEY` environment variable set
- [ ] API restarted with the key
- [ ] Health check works with API key
- [ ] Health check fails without API key (security working)
- [ ] Node.js on cPanel can connect and use AI

