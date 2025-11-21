# 🔧 Fix Port 38700 External Connection

## Issue: Port 38700 not accessible from your PC

This usually means:
1. API is only listening on localhost (127.0.0.1) instead of 0.0.0.0
2. Vast.ai hasn't mapped the port yet
3. Firewall blocking the port

## Step-by-Step Fix

### Step 1: Check what the API is listening on
```bash
lsof -i :38700
netstat -tuln | grep :38700
ss -tuln | grep :38700
```

Look for:
- `0.0.0.0:38700` = ✅ Good (listening on all interfaces)
- `127.0.0.1:38700` = ❌ Bad (only localhost)

### Step 2: Verify API is binding to 0.0.0.0
Check the API code:
```bash
grep -A 5 "app.run" /workspace/run_api_on_vast.py
```

Should show: `app.run(host="0.0.0.0", port=PORT)`

### Step 3: Check API logs
```bash
tail -30 /workspace/api.log
```

Look for: `"Running on http://0.0.0.0:38700"`

### Step 4: Test from Vast.ai itself
```bash
# Test localhost
curl http://localhost:38700/health

# Test 0.0.0.0
curl http://0.0.0.0:38700/health

# Test external IP
curl http://194.228.55.129:38700/health
```

### Step 5: Check if port is in Vast.ai port mapping
Port 38700 needs to be in the Vast.ai port mapping. Check your Vast.ai dashboard to see if 38700 is listed.

If not, you may need to:
- Use a port that's already mapped (like 38941 which maps to 8080)
- Or configure Vast.ai to map 38700

## Alternative: Use Port 38941 (Already Mapped to 8080)

If 38700 isn't accessible, use port 38941 which is already mapped:

```bash
# Kill API
pkill -9 python3
sleep 2

# Update to use 38941
cd /workspace
sed -i 's/PORT = 38700/PORT = 38941/' run_api_on_vast.py
# But we need to map it to 8080 internally, or just use 38941 directly

# Actually, 38941 maps to 8080, so we need to run on 8080
sed -i 's/PORT = 38700/PORT = 8080/' run_api_on_vast.py

# Start
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Test
curl http://localhost:8080/health
curl http://194.228.55.129:38941/health
```

## Or: Use Port 38660 (Already Mapped)

Since 38660 is already mapped in Vast.ai, let's use it properly:

```bash
# Kill everything
pkill -9 python3
fuser -k 38660/tcp 2>/dev/null
sleep 3

# Update to 38660
cd /workspace
sed -i 's/PORT = 38700/PORT = 38660/' run_api_on_vast.py

# Start
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Test
curl http://localhost:38660/health
```

