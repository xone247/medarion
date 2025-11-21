# 🚀 Setup API on Port 38660 - Jupyter Terminal Commands

## Copy and paste these commands one by one in your Jupyter terminal

### Step 1: Stop any existing API
```bash
pkill -f 'run_api_on_vast.py'
```
Wait 2 seconds, then verify it's stopped:
```bash
ps aux | grep run_api_on_vast.py | grep -v grep
```
(Should return nothing)

---

### Step 2: Check if port 38660 is in use
```bash
lsof -i :38660 || netstat -tuln | grep :38660 || ss -tuln | grep :38660
```

If something is using it, kill it:
```bash
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null || true
```

---

### Step 3: Navigate to workspace
```bash
cd /workspace
```

---

### Step 4: Verify the file exists and port is set to 38660
```bash
grep "PORT = " run_api_on_vast.py
```
Should show: `PORT = 38660`

---

### Step 5: Install dependencies (if needed)
```bash
pip3 install --break-system-packages flask flask-cors transformers accelerate safetensors
```

If you get errors about blinker, ignore them and continue.

---

### Step 6: Start the API on port 38660
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

---

### Step 7: Check if API started
```bash
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
```
Should show a process running.

---

### Step 8: Check the logs (to see if it's loading)
```bash
tail -20 /workspace/api.log
```

Look for:
- ✅ "API available at: http://0.0.0.0:38660" = Good!
- ✅ "Model loaded successfully" = Good!
- ❌ "ModuleNotFoundError" = Need to install dependencies
- ❌ "Address already in use" = Port conflict (go back to Step 2)

---

### Step 9: Test the API (wait 30-60 seconds for model to load)
```bash
curl http://localhost:38660/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

---

### Step 10: Test from outside (your computer)
Open a new terminal on your computer and run:
```bash
curl http://194.228.55.129:38660/health
```

Or test ping:
```bash
curl http://194.228.55.129:38660/ping
```

---

## ✅ Success Checklist

- [ ] API process is running (`ps aux | grep run_api_on_vast.py`)
- [ ] Logs show "API available at: http://0.0.0.0:38660"
- [ ] `curl http://localhost:38660/health` works
- [ ] `curl http://194.228.55.129:38660/health` works from your computer

---

## 🔧 Troubleshooting

### If port is still in use:
```bash
# Find what's using it
lsof -i :38660

# Kill it
kill -9 $(lsof -ti :38660)
```

### If API won't start:
```bash
# Check full error
tail -50 /workspace/api.log

# Try starting in foreground to see errors
cd /workspace
python3 run_api_on_vast.py
```
(Press Ctrl+C to stop, then fix the issue)

### If dependencies are missing:
```bash
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors
```

---

## 📝 Quick Reference

**API URL:** `http://194.228.55.129:38660`

**Endpoints:**
- Health: `GET http://194.228.55.129:38660/health`
- Ping: `GET http://194.228.55.129:38660/ping`
- Chat: `POST http://194.228.55.129:38660/chat` (requires API key)

**Check logs:** `tail -f /workspace/api.log`

**Stop API:** `pkill -f run_api_on_vast.py`

**Restart API:** Run Steps 1, 6, 7, 8, 9

