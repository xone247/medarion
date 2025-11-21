# Manual SSH Tunnel Start - Direct Connection

**Date:** November 11, 2025

## 🔗 **Direct SSH Connection**

We're using the **direct connection** to Vast.ai (not the proxy method).

### Connection Details:
- **Host:** `194.228.55.129`
- **Port:** `37792`
- **Local Port:** `8081`
- **Remote Port:** `8080`

## 📝 **Start Tunnel Manually**

### Option 1: Using SSH Key (Recommended)
Open PowerShell and run:
```powershell
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 37792 root@194.228.55.129 -L 8081:localhost:8080 -N
```

### Option 2: Without SSH Key (will prompt for password)
```powershell
ssh -p 37792 root@194.228.55.129 -L 8081:localhost:8080 -N
```

### Option 3: Use the Script
```powershell
.\start_vast_ssh_tunnel.ps1
```

## ✅ **Verify Tunnel is Working**

Test the connection:
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

Should return: `{"status":"healthy","gpu":"NVIDIA RTX A5000",...}`

## ⚠️ **Important**

- **Keep the SSH tunnel window open** while using AI tools
- If you close it, the AI will stop working
- The tunnel window will show connection status and any errors

## 🔧 **Troubleshooting**

### If tunnel fails to connect:
1. Check if port 8081 is already in use
2. Verify SSH key permissions
3. Try password authentication instead
4. Check firewall settings

### If you see "Permission denied":
- SSH key may need correct permissions
- Try password authentication
- Verify the key is correct

---

**Status:** ✅ **Using Direct Connection - More Reliable!**

