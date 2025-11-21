# Fix Port 3001 In Use - Jupyter Terminal Commands

## Problem
Port 3001 is already in use, and `pkill` isn't working properly.

## Solution: Find and Kill Process Using Port 3001

### Step 1: Find Process Using Port 3001
```bash
# Method 1: Using lsof (if available)
lsof -i :3001

# Method 2: Using netstat
netstat -tulpn | grep :3001

# Method 3: Using ss (most reliable)
ss -tulpn | grep :3001

# Method 4: Using fuser
fuser 3001/tcp
```

### Step 2: Kill the Process

**If you got a PID from Step 1:**
```bash
# Kill by PID (replace XXXX with actual PID)
kill -9 XXXX

# Or force kill
kill -9 $(lsof -t -i:3001)
```

**If you know it's the API:**
```bash
# Find all Python processes
ps aux | grep python

# Find specifically run_api_on_vast.py
ps aux | grep 'run_api_on_vast.py' | grep -v grep

# Kill by process name (more reliable than pkill)
kill -9 $(ps aux | grep 'run_api_on_vast.py' | grep -v grep | awk '{print $2}')
```

### Step 3: Verify Port is Free
```bash
# Check if port is still in use
ss -tulpn | grep :3001

# Should return nothing if port is free
```

### Step 4: Start API
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

## Alternative: Use Different Port

If you can't free port 3001, change the port in the script:

```python
PORT = 3002  # Change from 3001 to 3002
```

Then update tunnel:
```powershell
# In PowerShell, update tunnel to new port
ssh -p 38506 root@194.228.55.129 -L 8081:localhost:3002 -N
```

## Quick One-Liner to Kill Process on Port 3001

```bash
# Most reliable method
kill -9 $(lsof -t -i:3001) 2>/dev/null || kill -9 $(fuser 3001/tcp 2>/dev/null | awk '{print $NF}') || echo "Port 3001 is free or process not found"
```

## If Nothing Works

```bash
# Nuclear option: Kill all Python processes (be careful!)
pkill -9 python3

# Wait a moment
sleep 2

# Check port
ss -tulpn | grep :3001

# Start API
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

