# 🚀 Setup API with Port Forwarding (38660 -> 3001)

## Solution: Run API on port 3001, forward 38660 to it

This avoids port conflicts by running the API internally on 3001 and forwarding the public port 38660 to it.

---

## Step-by-Step Commands (Copy-paste in Jupyter Terminal)

### Step 1: Stop any existing API
```bash
pkill -f 'run_api_on_vast.py'
pkill -f 'socat.*38660'
```

### Step 2: Clear ports
```bash
fuser -k 3001/tcp 2>/dev/null || lsof -ti :3001 | xargs kill -9 2>/dev/null || true
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null || true
```

### Step 3: Navigate to workspace
```bash
cd /workspace
```

### Step 4: Verify API file uses port 3001
```bash
grep "PORT = " run_api_on_vast.py
```
Should show: `PORT = 3001`

### Step 5: Install socat (for port forwarding)
```bash
apt-get update -qq && apt-get install -y -qq socat
```

### Step 6: Start API on port 3001 (internal)
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Step 7: Wait a few seconds, then check if API started
```bash
sleep 5
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
```

### Step 8: Check API logs
```bash
tail -20 api.log
```
Look for: "API available at: http://0.0.0.0:3001"

### Step 9: Start port forwarder (38660 -> 3001)
```bash
nohup socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001 > /dev/null 2>&1 &
```

### Step 10: Verify forwarder is running
```bash
ps aux | grep 'socat.*38660' | grep -v grep
```

### Step 11: Test internal connection (port 3001)
```bash
curl http://localhost:3001/health
```

### Step 12: Test external connection (port 38660)
```bash
curl http://localhost:38660/health
```

### Step 13: Test from your computer
Open a new terminal on your computer:
```bash
curl http://194.228.55.129:38660/health
```

---

## ✅ Success Checklist

- [ ] API is running on port 3001 (`ps aux | grep run_api_on_vast.py`)
- [ ] Port forwarder is running (`ps aux | grep socat`)
- [ ] `curl http://localhost:3001/health` works
- [ ] `curl http://localhost:38660/health` works
- [ ] `curl http://194.228.55.129:38660/health` works from your computer

---

## 🔧 Quick Commands Reference

**Start everything:**
```bash
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 5 && nohup socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001 > /dev/null 2>&1 &
```

**Stop everything:**
```bash
pkill -f 'run_api_on_vast.py' && pkill -f 'socat.*38660'
```

**Check status:**
```bash
ps aux | grep -E 'run_api_on_vast|socat.*38660' | grep -v grep
```

**View logs:**
```bash
tail -f api.log
```

---

## 🐛 Troubleshooting

### If port 3001 is in use:
```bash
lsof -i :3001
kill -9 $(lsof -ti :3001)
```

### If port 38660 is in use:
```bash
lsof -i :38660
kill -9 $(lsof -ti :38660)
```

### If socat not found:
```bash
apt-get update && apt-get install -y socat
```

### If API won't start:
```bash
tail -50 api.log
```

### Restart everything:
```bash
pkill -f 'run_api_on_vast.py' && pkill -f 'socat.*38660'
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 5 && nohup socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001 > /dev/null 2>&1 &
```

---

## 📝 How It Works

1. **API runs on port 3001** (internal, no conflicts)
2. **socat forwards port 38660 → 3001** (public port → internal port)
3. **External requests to 38660** are forwarded to API on 3001
4. **No port conflicts** because API uses a different internal port

---

## 🎯 Final Configuration

- **Internal API Port:** 3001
- **Public Port:** 38660
- **Public URL:** http://194.228.55.129:38660
- **No tunnel needed!** Direct connection works.

