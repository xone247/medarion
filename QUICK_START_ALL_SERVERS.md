# Quick Start - All Servers

**Date:** November 11, 2025

## 🚀 **Start All Servers**

### Step 1: Start Backend Server
```powershell
cd server
npm start
```

### Step 2: Start Frontend Server (in new terminal)
```powershell
npm run dev
```

### Step 3: Start SSH Tunnel to Vast.ai (in new terminal)
```powershell
# With SSH key:
ssh -i C:\Users\xone\.ssh\vast_ai_key -p 37792 root@194.228.55.129 -L 8081:localhost:8080 -N

# Or without key (will prompt for password):
ssh -p 37792 root@194.228.55.129 -L 8081:localhost:8080 -N
```

**Or use the script:**
```powershell
.\start_vast_ssh_tunnel.ps1
```

## ✅ **Verify Everything is Running**

### Check Backend:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/ai/health" -UseBasicParsing
```

### Check Vast.ai:
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

### Check Frontend:
Open browser: `http://localhost:5173`

## 🎯 **Test AI Tools**

1. Go to: `http://localhost:5173/ai-tools`
2. Launch "Medarion AI Assistant"
3. Ask a question
4. Should get full AI response!

## 📝 **Important Notes**

- **Keep SSH tunnel running** while using AI tools
- **Direct connection** is more reliable than proxy
- All servers must be running for AI to work

---

**Status:** ✅ **Using Direct SSH Connection - More Reliable!**

