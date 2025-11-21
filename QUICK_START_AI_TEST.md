# Quick Start - Test AI on Frontend

## Current Status
✅ Backend: Running on port 3001
✅ Frontend: Running on port 5173
⚠️ SSH Tunnel: Needs to be started manually

## Step 1: Start SSH Tunnel

Open a new PowerShell window and run:

```powershell
ssh -p 52695 root@93.91.156.91 -L 8081:localhost:8081 -N
```

**OR** if you have SSH key:
```powershell
ssh -i "$env:USERPROFILE\.ssh\vast_ai_key" -p 52695 root@93.91.156.91 -L 8081:localhost:8081 -N
```

**Keep this window open!** The tunnel must stay active.

## Step 2: Verify Connection

In another PowerShell window, test:
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

Should return: `{"status":"healthy","gpu":"...","vram_used":"...","vram_total":"..."}`

## Step 3: Test AI on Frontend

1. Open browser: http://localhost:5173
2. Navigate to AI Tools page
3. Test the chat interface
4. Try asking: "hello" or "who are you"

## Troubleshooting

### If SSH tunnel fails:
- Check if you need to enter password
- Verify SSH key is correct
- Try the proxy connection: `ssh -p 20675 root@ssh2.vast.ai -L 8081:localhost:8081 -N`

### If AI doesn't respond:
- Check backend logs for errors
- Verify SSH tunnel is active (port 8081 should be listening)
- Check browser console for errors

## All Servers Status

- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:5173  
- ⚠️ Vast.ai: http://localhost:8081 (requires SSH tunnel)

