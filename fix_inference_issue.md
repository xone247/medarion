# Fix "No Inference" Issue

## Problem
You're seeing "no inference" but the model files are present. This usually means:
1. Model files exist but API isn't running
2. API is running but health check is failing
3. Model loaded but health endpoint not responding correctly

## Quick Diagnostic

Run this on your Vast.ai instance (Jupyter terminal):

```bash
# Make script executable
chmod +x check_model_and_api.sh

# Run diagnostic
./check_model_and_api.sh
```

Or run these commands manually:

```bash
# 1. Check model files
ls -lh /workspace/model_api/extracted/

# 2. Check if API is running
ps aux | grep "python3.*run_api_on_vast.py" | grep -v grep

# 3. Check port 5000
lsof -i :5000

# 4. Test health endpoint
curl -H "X-API-Key: medarion-secure-key-2025" http://localhost:5000/health

# 5. Test chat endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}' \
  http://localhost:5000/chat
```

## Common Fixes

### Fix 1: API Not Running

If API process is not found:

```bash
# Kill any old processes
pkill -f "python3.*run_api_on_vast.py"

# Start API in background
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait a few seconds for model to load
sleep 10

# Check if it's running
ps aux | grep "python3.*run_api_on_vast.py" | grep -v grep

# Check logs
tail -50 api.log
```

### Fix 2: Model Files Missing

If model files are missing:

```bash
# The script should auto-download from S3, but you can force it:
cd /workspace
python3 run_api_on_vast.py
```

The script will:
1. Check if model exists
2. Download from S3 if missing
3. Extract if needed
4. Load and start API

### Fix 3: Port Already in Use

If port 5000 is already in use:

```bash
# Find what's using port 5000
lsof -i :5000

# Kill it if needed
fuser -k 5000/tcp

# Or use a different port (edit run_api_on_vast.py)
# Change: PORT = 5000
# To: PORT = 5001 (or another free port)
```

### Fix 4: Health Check Failing

If health endpoint doesn't respond:

```bash
# Check API logs
tail -100 api.log

# Look for errors like:
# - Model load failed
# - Port already in use
# - Missing dependencies

# Restart API
pkill -f "python3.*run_api_on_vast.py"
cd /workspace
python3 run_api_on_vast.py > api.log 2>&1 &
```

## Verify Everything Works

After fixing, verify:

```bash
# 1. Health check should return:
curl -H "X-API-Key: medarion-secure-key-2025" http://localhost:5000/health
# Expected: {"status":"ok","model":"Medarion-Mistral-7B"}

# 2. Chat should work:
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}' \
  http://localhost:5000/chat
# Expected: JSON with "choices" array containing response

# 3. Backend should see inference: true
# Test from your PC:
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health"
# Should show: "inference": true
```

## Still Not Working?

1. **Check API logs**: `tail -100 api.log`
2. **Check model files**: `ls -lh /workspace/model_api/extracted/`
3. **Check Python version**: `python3 --version` (should be 3.8+)
4. **Check GPU**: `nvidia-smi` (should show GPU available)
5. **Check disk space**: `df -h` (need space for model)

---

**The key is: Model files + API running + Health endpoint working = Inference TRUE** ✅

