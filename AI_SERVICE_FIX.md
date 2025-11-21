# AI Service Fix - Vast.ai Connection

**Date:** November 11, 2025

## Issue
The AI service is showing as unavailable in the browser, even though the backend is running.

## Root Cause
The SSH tunnel to Vast.ai is not running, so the backend cannot connect to the AI service.

## Solution

### Step 1: Start SSH Tunnel to Vast.ai

The SSH tunnel must be running for the backend to access Vast.ai. Start it with:

```powershell
# With SSH key (if available):
ssh -p 31731 -i C:\Users\xone\.ssh\vast_ai_key -L 8081:localhost:8080 -N -f root@ssh7.vast.ai

# Or with password (will prompt):
ssh -p 31731 -L 8081:localhost:8080 -N root@ssh7.vast.ai
```

### Step 2: Verify Connection

Test that Vast.ai is accessible:
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

Should return: `{"status":"healthy","gpu":"NVIDIA RTX A5000",...}`

### Step 3: Test Backend AI Query

```powershell
$body = @{ query = "test"; topK = 5 } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/ai/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

### Step 4: Test in Browser

After the tunnel is running:
1. Go to `http://localhost:5173/ai-tools`
2. Launch "Medarion AI Assistant"
3. Ask a question
4. Should get real AI response (not "service unavailable")

## Quick Start Script

Use `start_vast_ssh_tunnel.ps1` to start the tunnel automatically.

## Status

- ✅ Backend: Running
- ✅ Vast.ai endpoints: Configured
- ⚠️ SSH Tunnel: **NEEDS TO BE RUNNING**
- ⚠️ Browser: Will work once tunnel is running

---

**Action Required:** Start the SSH tunnel to Vast.ai!

