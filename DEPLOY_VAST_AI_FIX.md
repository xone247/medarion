# 🚀 Deploy Fixed run_api_on_vast.py to Vast.ai

## Step-by-Step Instructions

### Prerequisites
- SSH access to Vast.ai server
- Updated `run_api_on_vast.py` file on your local machine
- SSH key: `C:\Users\xone\.ssh\vast_ai_key` (or password)

---

## Step 1: Connect to Vast.ai Server

### Option A: Direct Connection (Recommended)
```powershell
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 37792 root@194.228.55.129
```

### Option B: Proxy Connection (Alternative)
```powershell
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 31731 root@ssh7.vast.ai
```

### Option C: Without SSH Key (will prompt for password)
```powershell
ssh -p 37792 root@194.228.55.129
```

---

## Step 2: Find and Stop the Running Flask API

Once connected to Vast.ai, run these commands:

```bash
# Find the running Flask/Python process
ps aux | grep "run_api_on_vast.py"
# OR
ps aux | grep "python.*api"
# OR
ps aux | grep "flask"

# Find process by port (if running on port 8080 or 8081)
lsof -i :8080
lsof -i :8081
# OR
netstat -tulpn | grep :8080
netstat -tulpn | grep :8081
```

**Stop the process:**
```bash
# If you found the PID (process ID), kill it:
kill <PID>

# OR force kill if needed:
kill -9 <PID>

# OR kill all Python processes (be careful!):
pkill -f "run_api_on_vast.py"

# Verify it's stopped:
ps aux | grep "run_api_on_vast.py"
```

---

## Step 3: Navigate to the File Location

```bash
# Common locations to check:
cd /workspace
# OR
cd /root
# OR
cd ~

# Find where the file is:
find / -name "run_api_on_vast.py" 2>/dev/null

# Once found, navigate there:
cd /path/to/directory
```

---

## Step 4: Upload the New File

### Option A: Using SCP from Your Local Machine (Recommended)

**Open a NEW PowerShell window on your local machine** (keep SSH session open):

```powershell
# Navigate to project directory
cd C:\xampp\htdocs\medarion

# Upload file using SCP (Direct connection)
scp -i C:\Users\xone\.ssh\vast_ai_key -P 37792 run_api_on_vast.py root@194.228.55.129:/workspace/run_api_on_vast.py

# OR (Proxy connection)
scp -i C:\Users\xone\.ssh\vast_ai_key -P 31731 run_api_on_vast.py root@ssh7.vast.ai:/workspace/run_api_on_vast.py

# OR (Without key, will prompt for password)
scp -P 37792 run_api_on_vast.py root@194.228.55.129:/workspace/run_api_on_vast.py
```

### Option B: Manual Copy-Paste (If SCP doesn't work)

1. On your local machine, open `run_api_on_vast.py` in a text editor
2. Copy the entire file content
3. On Vast.ai server (in SSH session), create/edit the file:
```bash
nano /workspace/run_api_on_vast.py
# OR
vi /workspace/run_api_on_vast.py
```
4. Paste the content and save (Ctrl+O, Enter, Ctrl+X for nano)

---

## Step 5: Verify the File Was Updated

On Vast.ai server:
```bash
# Check file exists and has content
ls -lh /workspace/run_api_on_vast.py

# Check file modification time
stat /workspace/run_api_on_vast.py

# View first few lines to verify
head -20 /workspace/run_api_on_vast.py
```

---

## Step 6: Start the Flask API

On Vast.ai server:
```bash
# Navigate to file location
cd /workspace

# Make sure file is executable
chmod +x run_api_on_vast.py

# Start the API (in background with nohup)
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# OR start in a screen/tmux session (recommended for persistent running)
screen -S vast_api
python3 run_api_on_vast.py
# Press Ctrl+A then D to detach from screen

# OR start in tmux
tmux new -s vast_api
python3 run_api_on_vast.py
# Press Ctrl+B then D to detach from tmux
```

**To reattach to screen/tmux later:**
```bash
# Screen:
screen -r vast_api

# Tmux:
tmux attach -t vast_api
```

---

## Step 7: Verify the API is Running

On Vast.ai server:
```bash
# Check if process is running
ps aux | grep "run_api_on_vast.py"

# Check if port is listening
lsof -i :8080
lsof -i :8081
netstat -tulpn | grep :808

# Check logs
tail -f api.log
# OR if using nohup
tail -f nohup.out
```

**From your local machine (test through SSH tunnel):**
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing

# Test chat endpoint
$test = @{ messages = @( @{ role = "user"; content = "Hello" } ) } | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:8081/chat" -Method POST -Body $test -ContentType "application/json"
```

---

## Step 8: Monitor the API

```bash
# View real-time logs
tail -f api.log

# Check process status
ps aux | grep python

# Check resource usage
top -p $(pgrep -f "run_api_on_vast.py")
```

---

## Troubleshooting

### If API doesn't start:
```bash
# Check for errors
python3 run_api_on_vast.py

# Check Python version
python3 --version

# Check dependencies
pip3 list | grep -E "(flask|torch|transformers)"
```

### If port is already in use:
```bash
# Find what's using the port
lsof -i :8080
lsof -i :8081

# Kill the process
kill <PID>
```

### If file upload fails:
- Check SSH key permissions: `chmod 600 C:\Users\xone\.ssh\vast_ai_key`
- Try without key (password authentication)
- Use manual copy-paste method instead

---

## Quick Reference Commands

**Stop API:**
```bash
pkill -f "run_api_on_vast.py"
```

**Start API:**
```bash
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

**Check Status:**
```bash
ps aux | grep "run_api_on_vast.py" && tail -20 api.log
```

**Restart API:**
```bash
pkill -f "run_api_on_vast.py" && sleep 2 && cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

