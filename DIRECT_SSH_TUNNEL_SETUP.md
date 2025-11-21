# Direct SSH Tunnel Setup - Vast.ai

**Date:** November 11, 2025

## ✅ **Using Direct Connection**

We're now using the **direct SSH connection** to Vast.ai instead of the proxy method. This is more reliable and faster.

### Direct Connection Details:
- **Host:** `194.228.55.129`
- **Port:** `37792`
- **Local Port:** `8081`
- **Remote Port:** `8080`

## 🔧 **SSH Tunnel Command**

### With SSH Key (Recommended):
```bash
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 37792 root@194.228.55.129 -L 8081:localhost:8080 -N
```

### Without SSH Key (will prompt for password):
```bash
ssh -p 37792 root@194.228.55.129 -L 8081:localhost:8080 -N
```

## 📝 **Quick Start**

### Option 1: Use the Script
```powershell
.\start_vast_ssh_tunnel.ps1
```

### Option 2: Manual Command
Run the SSH command above in a terminal and keep it running.

## ✅ **Advantages of Direct Connection**

1. **More Reliable** - Direct connection, no proxy hops
2. **Faster** - Lower latency
3. **Simpler** - Fewer moving parts
4. **Better for Production** - More stable

## 🔄 **Server Status**

After restarting:
- ✅ Backend Server: Running on port 3001
- ✅ Frontend Server: Running on port 5173
- ✅ SSH Tunnel: Direct connection to Vast.ai on port 8081

## 🎯 **Testing**

1. Verify tunnel: `Invoke-WebRequest -Uri "http://localhost:8081/health"`
2. Test backend: `Invoke-WebRequest -Uri "http://localhost:3001/api/ai/health"`
3. Test in browser: Go to `http://localhost:5173/ai-tools`

---

**Status:** ✅ **Using Direct Connection - More Reliable!**

