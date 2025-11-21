# 🚀 Deploy run_api_on_vast.py via Jupyter Terminal

## Jupyter Terminal Access
- **URL**: https://93.91.156.91:40932/terminals/1?token=09a2cecbbad518d67326342beefb4a8884ae43e6e2c25b6f1c87c2d7e7c9e68b
- **Server**: 93.91.156.91:40932

---

## Step-by-Step Deployment

### Step 1: Open Jupyter Terminal
Open the URL above in your browser to access the Jupyter terminal.

### Step 2: Stop Running API
In the Jupyter terminal, run:
```bash
pkill -f 'run_api_on_vast.py'
```

Verify it's stopped:
```bash
ps aux | grep 'run_api_on_vast.py' | grep -v grep
```
(Should return nothing if stopped)

### Step 3: Navigate to Workspace
```bash
cd /workspace
```

### Step 4: Check Current File
```bash
ls -lh run_api_on_vast.py
```

### Step 5: Remove Old File (Optional)
```bash
rm -f run_api_on_vast.py
```

### Step 6: Upload New File
**From your local PowerShell** (on your PC):
```powershell
cd C:\xampp\htdocs\medarion
scp -P 52695 run_api_on_vast.py root@93.91.156.91:/workspace/
```
(Enter password when prompted)

### Step 7: Verify File Uploaded
**Back in Jupyter terminal**:
```bash
ls -lh /workspace/run_api_on_vast.py
head -20 /workspace/run_api_on_vast.py
```

### Step 8: Start New API
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Step 9: Verify API is Running
```bash
ps aux | grep 'run_api_on_vast.py' | grep -v grep
```

Should show the process running.

### Step 10: Check Logs
```bash
tail -f /workspace/api.log
```

Press `Ctrl+C` to stop watching logs.

### Step 11: Test API
**From your local machine**:
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health"
```

---

## Quick Commands Reference

### Stop API
```bash
pkill -f 'run_api_on_vast.py'
```

### Start API
```bash
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Check Status
```bash
ps aux | grep 'run_api_on_vast.py' | grep -v grep
```

### View Logs
```bash
tail -20 /workspace/api.log
```

### Restart API
```bash
pkill -f 'run_api_on_vast.py' && sleep 2 && cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

---

## Troubleshooting

### If API won't start:
```bash
# Check for errors
python3 /workspace/run_api_on_vast.py

# Check Python version
python3 --version

# Check if port is in use
lsof -i :8080
lsof -i :8081
```

### If file upload fails:
- Check SSH connection from your PC
- Verify file exists locally
- Try uploading to `/root` instead, then move it

### To stop watching logs:
Press `Ctrl+C` in the Jupyter terminal

---

## Notes

- The Jupyter terminal is already connected to the server
- No need for SSH password when using Jupyter terminal
- Use `nohup` to run in background
- Check `api.log` for any errors

