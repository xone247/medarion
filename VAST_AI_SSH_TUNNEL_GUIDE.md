# Vast.ai SSH Tunnel Guide

## Quick Start

To connect AI tools to Vast.ai, you need to start an SSH tunnel. The application expects the tunnel on **port 8081**.

## SSH Tunnel Commands

### Option 1: Via Proxy (Recommended)
```powershell
ssh -p 31731 root@ssh7.vast.ai -L 8081:localhost:8081
```

### Option 2: Direct Connection
```powershell
ssh -p 37792 root@194.228.55.129 -L 8081:localhost:8081
```

## Using the Script

A PowerShell script is available to start the tunnel:

```powershell
.\start_vast_ssh_tunnel.ps1
```

This script will:
1. Check if port 8081 is available
2. Prompt you to choose connection method
3. Start the SSH tunnel
4. Keep the session open

**IMPORTANT:** Keep the SSH session window open while using AI tools!

## Verify Connection

After starting the tunnel, test it:

```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

Expected response:
```json
{
  "status": "OK",
  "gpu": "RTX A5000",
  ...
}
```

## Test AI Tools

1. Start the SSH tunnel (keep it running)
2. Go to AI Tools page in the application
3. Launch any AI tool (e.g., "Medarion AI Assistant")
4. Enter a question and click "Run Analysis"
5. You should get a real AI response (not demo/fallback)

## Troubleshooting

### Port Already in Use
If port 8081 is already in use:
```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort 8081

# Kill the process if needed (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### Connection Refused
- Check if Vast.ai instance is running
- Verify SSH credentials are correct
- Try the alternative connection method (proxy vs direct)

### Still Getting Demo Answers
- Verify tunnel is running: `Get-NetTCPConnection -LocalPort 8081`
- Test health endpoint: `Invoke-WebRequest -Uri "http://localhost:8081/health"`
- Check backend logs for connection errors
- Restart the SSH tunnel

## Stopping the Tunnel

Press `Ctrl+C` in the SSH tunnel window to stop it.

---

**Note:** The SSH tunnel must remain active while using AI tools. If you close it, AI queries will fall back to demo mode.

