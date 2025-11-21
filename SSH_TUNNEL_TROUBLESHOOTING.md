# SSH Tunnel Troubleshooting Guide

## Current Issue: Permission Denied (publickey)

The SSH connection is failing because it requires authentication. Here are solutions:

---

## Solution 1: Use SSH Key (Recommended)

If you have an SSH key for Vast.ai:

### Check if key exists:
```powershell
Test-Path "$env:USERPROFILE\.ssh\vast_ai_key"
```

### Use key in tunnel command:
```powershell
# Proxy method
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 31731 root@ssh7.vast.ai -L 8081:localhost:8081

# Direct method
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 37792 root@194.228.55.129 -L 8081:localhost:8081
```

---

## Solution 2: Password Authentication

If you don't have an SSH key, try password authentication:

```powershell
# Proxy method
ssh -p 31731 root@ssh7.vast.ai -L 8081:localhost:8081

# Direct method  
ssh -p 37792 root@194.228.55.129 -L 8081:localhost:8081
```

**Note:** You'll be prompted for the root password. Enter it when asked.

---

## Solution 3: Generate and Add SSH Key

If you need to set up SSH key authentication:

### 1. Generate SSH key (if you don't have one):
```powershell
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\vast_ai_key" -N '""'
```

### 2. Copy public key to Vast.ai:
```powershell
# Display your public key
Get-Content "$env:USERPROFILE\.ssh\vast_ai_key.pub"

# Copy the output and add it to Vast.ai instance's ~/.ssh/authorized_keys
```

### 3. Use the key:
```powershell
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 31731 root@ssh7.vast.ai -L 8081:localhost:8081
```

---

## Solution 4: Use Updated Script

The `start_vast_ssh_tunnel.ps1` script has been updated to automatically detect and use SSH keys:

```powershell
.\start_vast_ssh_tunnel.ps1
```

It will:
- Check for SSH key automatically
- Use key if found, otherwise prompt for password
- Let you choose connection method

---

## Quick Test Commands

### Test SSH connection (without tunnel):
```powershell
# Test proxy connection
ssh -p 31731 root@ssh7.vast.ai

# Test direct connection
ssh -p 37792 root@194.228.55.129
```

### Test tunnel after connection:
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing
```

---

## Common Issues

### "Permission denied (publickey)"
- **Cause:** No SSH key or key not authorized
- **Fix:** Use password authentication or set up SSH key

### "Connection refused"
- **Cause:** Vast.ai instance may be down or port changed
- **Fix:** Check Vast.ai dashboard, verify instance is running

### "Port 8081 already in use"
- **Cause:** Another tunnel or service using port 8081
- **Fix:** 
  ```powershell
  Get-NetTCPConnection -LocalPort 8081
  Stop-Process -Id <PID> -Force
  ```

---

## Next Steps

1. Try password authentication first (easiest)
2. If that works, set up SSH key for convenience
3. Once tunnel is established, test AI tools in browser

