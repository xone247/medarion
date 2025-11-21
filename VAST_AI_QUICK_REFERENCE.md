# 🚀 Vast.ai Quick Reference

**For detailed information, see: `VAST_AI_COMPLETE_REFERENCE.md`**

---

## 🔑 Key Information

### Vast.ai Instance
- **IP**: `194.228.55.129`
- **Proxy**: `ssh7.vast.ai`
- **Direct Port**: `37792`
- **Proxy Port**: `31731`
- **API Port**: `8081`

### SSH Key
- **Location**: `$env:USERPROFILE\.ssh\vast_ai_key`

### Configuration
- **Backend `.env`**: `AI_MODE=vast` and `VAST_AI_URL=http://localhost:8081`
- **Local Tunnel**: `localhost:8081` → `Vast.ai:8081`

---

## 🚀 Quick Start

1. **Start SSH Tunnel**:
   ```powershell
   .\start_ssh_tunnel.ps1
   ```

2. **Start Backend**:
   ```powershell
   npm start
   ```

3. **Verify**:
   ```bash
   curl http://localhost:3001/api/ai/health
   ```

---

## 📋 Files

- `run_api_on_vast.py` - Flask API (runs on Vast.ai)
- `start_ssh_tunnel.ps1` - SSH tunnel script
- `server/services/vastAiService.js` - Backend service
- `server/.env` - Backend config

---

## 🔍 Troubleshooting

- **Connection refused**: Check SSH tunnel is running
- **Timeout**: Model may still be loading (2-5 min first time)
- **Wrong service**: Verify `AI_MODE=vast` in `server/.env`

---

**Full details**: See `VAST_AI_COMPLETE_REFERENCE.md`






