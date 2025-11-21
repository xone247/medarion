# 🔧 Fix Port 8080 Issue

## API Crashed - Check the Error

### Step 1: Check the error
```bash
tail -30 /workspace/api.log
```

This will show why it crashed.

### Step 2: Check if port 8080 is in use
```bash
lsof -i :8080
netstat -tuln | grep :8080
```

If something is using it, kill it:
```bash
fuser -k 8080/tcp 2>/dev/null || lsof -ti :8080 | xargs kill -9 2>/dev/null
```

### Step 3: Alternative - Use Port 38660 (Already Mapped)

Since 38660 is already mapped and we know it works, let's use it properly:

```bash
# Kill everything
pkill -9 python3
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null || true
sleep 3

# Update to 38660
cd /workspace
sed -i 's/PORT = 8080/PORT = 38660/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py

# Start API
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait and check
sleep 5
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
tail -20 api.log

# Test
curl http://localhost:38660/health
```

### Step 4: Test from your PC
```bash
curl http://194.228.55.129:38660/health
```

---

## Why Port 38660 Should Work

- ✅ Already mapped in Vast.ai: `194.228.55.129:38660 -> 38660/tcp`
- ✅ No port forwarding needed
- ✅ Direct connection
- ✅ We just need to clear whatever was using it before

