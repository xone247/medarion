# 🚀 Run API Directly on Port 38660 (No Forwarding Needed)

Since port forwarding keeps failing, let's run the API directly on port 38660.

## Step-by-Step

### Step 1: Find what's using port 38660
```bash
lsof -i :38660
netstat -tuln | grep :38660
ss -tuln | grep :38660
fuser 38660/tcp
```

### Step 2: Kill whatever is using it
```bash
# Try all methods
fuser -k 38660/tcp 2>/dev/null
lsof -ti :38660 | xargs kill -9 2>/dev/null
pkill -f port_forward
pkill -f socat
```

### Step 3: Verify port is free
```bash
lsof -i :38660 || echo "✅ Port is free"
```

### Step 4: Stop API on port 3001
```bash
pkill -f 'run_api_on_vast.py'
sleep 2
```

### Step 5: Update API to use port 38660
```bash
cd /workspace
sed -i 's/PORT = 3001/PORT = 38660/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py
```

Should show: `PORT = 38660`

### Step 6: Start API on port 38660
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Step 7: Wait and check
```bash
sleep 5
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
tail -20 api.log
```

Look for: `"API available at: http://0.0.0.0:38660"`

### Step 8: Test
```bash
curl http://localhost:38660/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

### Step 9: Test from your computer
```bash
curl http://194.228.55.129:38660/health
```

---

## All-in-One Command

```bash
# Kill everything
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null || true
pkill -f 'run_api_on_vast.py' || true
pkill -f port_forward || true
sleep 2

# Update port
cd /workspace
sed -i 's/PORT = 3001/PORT = 38660/' run_api_on_vast.py

# Start API
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait and test
sleep 5
curl http://localhost:38660/health
```

---

## Why This is Better

- ✅ No port forwarding needed
- ✅ Simpler setup
- ✅ More reliable
- ✅ Direct connection
- ✅ One less thing that can break

