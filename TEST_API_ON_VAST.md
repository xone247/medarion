# Testing Vast.ai API

## ✅ API Status
Your API is running on Vast.ai:
- **Port**: 44050
- **Status**: Running (confirmed by your output)

## 🧪 Test Commands (Run in Jupyter Terminal)

### 1. Health Check
```bash
curl http://localhost:44050/health
```
Expected: `{"status":"ok","model":"Mistral-7B"}`

### 2. Chat Test
```bash
curl -X POST http://localhost:44050/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
```

### 3. Check API Logs
```bash
tail -20 /workspace/api.log
```

## 🔗 For Local Testing (SSH Tunnel)

Since port 44050 might not be publicly accessible, use SSH tunnel:

### Option 1: Manual Tunnel (PowerShell)
```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_vast" -p 44939 -L 8081:localhost:44050 root@ssh1.vast.ai -N
```

### Option 2: Check Correct SSH Port
The SSH port might be different. Check your Vast.ai dashboard for the correct SSH port.

### Option 3: Use Public Port Mapping
If port 44050 needs to be mapped publicly:
1. Go to Vast.ai dashboard
2. Find your instance (27844189)
3. Check "Open Ports" section
4. Map port 44050 if not already mapped

## 📝 Update Backend Configuration

Once tunnel is working, update `server/.env`:
```
VAST_AI_URL=http://localhost:8081
```

Or if public IP works:
```
VAST_AI_URL=http://93.91.156.86:44050
```

## ✅ Verification

After setting up tunnel, test from your PC:
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET

# Chat test
$body = '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
Invoke-RestMethod -Uri "http://localhost:8081/chat" -Method POST -Body $body -ContentType "application/json" -Headers @{"X-API-Key"="medarion-secure-key-2025"}
```

