# Quick Start: SSH Tunnel to Vast.ai

## ✅ SSH Key Found!

Your SSH key is located at: `C:\Users\xone\.ssh\vast_ai_key`

## 🚀 Start Tunnel (Choose One Method)

### Method 1: Using the Script (Easiest)
```powershell
.\start_vast_ssh_tunnel.ps1
```
The script will automatically detect your SSH key and use it.

### Method 2: Manual Command (Proxy)
```powershell
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 31731 root@ssh7.vast.ai -L 8081:localhost:8081
```

### Method 3: Manual Command (Direct)
```powershell
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 37792 root@194.228.55.129 -L 8081:localhost:8081
```

## ⚠️ Important Notes

1. **Keep the SSH window open** - Closing it will break the tunnel
2. **If prompted for password** - Enter your SSH password
3. **Wait for connection** - May take 5-10 seconds to establish

## ✅ Verify Connection

After starting the tunnel, test it:

```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

Expected response:
```json
{
  "status": "OK",
  "gpu": "RTX A5000"
}
```

## 🧪 Test AI Tools

Once tunnel is connected:

1. Go to AI Tools page in browser
2. Launch "Medarion AI Assistant"
3. Enter a question
4. Click "Run Analysis"
5. Should get **real AI response** (not demo)

---

**Status:** SSH key found ✅ | Tunnel starting... ⏳

