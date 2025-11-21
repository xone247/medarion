# 🚀 Manual Setup for New Vast.ai Instance

## Instance Details
- **SSH Host:** ssh1.vast.ai
- **SSH Port:** 31216
- **Public IP:** 93.91.156.91
- **API Port:** 3001

## Step-by-Step Commands

### Step 1: Test SSH Connection

From your PC, test the connection:

```bash
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 31216 root@ssh1.vast.ai "echo 'Connected!' && python3 --version"
```

Or if using password:
```bash
ssh -p 31216 root@ssh1.vast.ai "echo 'Connected!' && python3 --version"
```

---

### Step 2: Upload run_api_on_vast.py

From your PC (in the medarion directory):

```bash
scp -i C:\Users\xone\.ssh\vast_ai_key -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/
```

Or with password:
```bash
scp -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/
```

---

### Step 3: SSH to Instance and Install Dependencies

```bash
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 31216 root@ssh1.vast.ai
```

Once connected, run:

```bash
cd /workspace
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors
```

This will take several minutes. Wait for it to complete.

---

### Step 4: Configure Port

On the instance, verify and set port:

```bash
cd /workspace
grep "PORT = " run_api_on_vast.py
sed -i 's/PORT = [0-9]*/PORT = 3001/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py
```

Should show: `PORT = 3001`

---

### Step 5: Stop Any Existing API

```bash
pkill -f "python3 run_api_on_vast.py" || true
sleep 2
ps aux | grep "run_api_on_vast" | grep -v grep || echo "No process running"
```

---

### Step 6: Start API

```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
sleep 5
ps aux | grep "python3 run_api_on_vast.py" | grep -v grep
```

You should see the Python process running.

---

### Step 7: Check Logs

```bash
tail -30 api.log
```

Look for:
- `Running on http://0.0.0.0:3001`
- `Model loaded successfully`
- No errors

---

### Step 8: Test API Locally on Instance

```bash
curl http://localhost:3001/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

---

### Step 9: Test from Your PC

From your PC (new terminal):

```bash
curl http://93.91.156.91:3001/health
```

If this works → **Direct connection works!** ✅

If this fails → Use SSH tunnel (see below)

---

### Step 10: Update cPanel (If Direct Works)

If direct connection works, update cPanel `.env`:

```bash
# On cPanel server
cd /home/medasnnc/nodevenv/medarion/18/bin
nano .env
```

Add/update:
```
VAST_AI_URL=http://93.91.156.91:3001
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

Or use the PowerShell script:
```powershell
.\update_cpanel_direct_connection.ps1
```

---

## Alternative: SSH Tunnel (If Direct Doesn't Work)

If external connection doesn't work, use SSH tunnel:

### On Your PC:

```bash
ssh -p 31216 root@ssh1.vast.ai -L 8080:localhost:3001 -N -f
```

### Test Tunnel:

```bash
curl http://localhost:8080/health
```

### Update cPanel:

Set up tunnel on cPanel server (see `setup_vast_tunnel_cpanel.sh`)

---

## Quick Copy-Paste (All Steps)

```bash
# 1. Upload file
scp -i C:\Users\xone\.ssh\vast_ai_key -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/

# 2. SSH to instance
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 31216 root@ssh1.vast.ai

# 3. On instance - install dependencies
cd /workspace
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors

# 4. Configure port
sed -i 's/PORT = [0-9]*/PORT = 3001/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py

# 5. Stop old API
pkill -f "python3 run_api_on_vast.py" || true
sleep 2

# 6. Start API
nohup python3 run_api_on_vast.py > api.log 2>&1 &
sleep 5

# 7. Check status
ps aux | grep "python3 run_api_on_vast.py" | grep -v grep
tail -20 api.log

# 8. Test
curl http://localhost:3001/health
```

---

## Troubleshooting

### API Not Starting

Check logs:
```bash
tail -50 api.log
```

Common issues:
- Missing dependencies → Re-run pip install
- Port in use → `pkill -f run_api_on_vast.py` and try again
- Model not found → Check `/workspace/model_api/extracted` exists

### External Connection Fails

1. Check if port 3001 is actually open:
   ```bash
   # On instance
   netstat -tuln | grep 3001
   ```

2. Try different port (8080):
   ```bash
   sed -i 's/PORT = 3001/PORT = 8080/' run_api_on_vast.py
   # Restart API
   ```

3. Use SSH tunnel instead

---

## Success Indicators

✅ API process running: `ps aux | grep python3 run_api_on_vast.py`
✅ Health check works: `curl http://localhost:3001/health` returns JSON
✅ Logs show: `Running on http://0.0.0.0:3001`
✅ External test works: `curl http://93.91.156.91:3001/health`

Once all these work, the AI is ready! 🎉

