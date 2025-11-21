# 🔧 Kill Process Using Port 38660

## Find and Kill What's Using Port 38660

### Step 1: Find what's using port 38660
```bash
lsof -i :38660
```

OR if lsof doesn't work:
```bash
netstat -tuln | grep :38660
ss -tuln | grep :38660
fuser 38660/tcp
```

### Step 2: Kill it (try all methods)
```bash
# Method 1: Using fuser
fuser -k 38660/tcp

# Method 2: Using lsof
lsof -ti :38660 | xargs kill -9

# Method 3: Using netstat (if you see PID)
# netstat -tulnp | grep :38660
# Then: kill -9 <PID>

# Method 4: Kill all Python processes (nuclear option)
pkill -9 python3
```

### Step 3: Verify port is free
```bash
lsof -i :38660 || echo "✅ Port is free"
```

### Step 4: Wait a moment
```bash
sleep 3
```

### Step 5: Start API again
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Step 6: Check if it started
```bash
sleep 5
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
tail -20 api.log
```

---

## All-in-One Kill Command

```bash
# Kill everything that might be using port 38660
fuser -k 38660/tcp 2>/dev/null
lsof -ti :38660 | xargs kill -9 2>/dev/null
pkill -9 -f port_forward
pkill -9 -f 'run_api_on_vast'
pkill -9 python3
sleep 3

# Verify
lsof -i :38660 || echo "✅ Port is free"

# Start API
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait and check
sleep 5
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
curl http://localhost:38660/health
```

---

## Alternative: Use a Different Port

If port 38660 keeps having issues, we can use another available port from your list:
- 38710 (mapped to 1111)
- 38570 (mapped to 6006)
- 38941 (mapped to 8080)

But 38660 should work if we kill what's using it.

