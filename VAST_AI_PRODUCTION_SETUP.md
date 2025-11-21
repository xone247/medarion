# 🔧 VAST AI Production Setup

## Current Status

✅ **VAST AI Service**: Configured in code
✅ **Environment Variables**: Added to production `.env`
⚠️ **SSH Tunnel**: Needs to be running for connection

## Configuration Added

**File**: `/home/medasnnc/medarion/.env`

```env
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
```

## How It Works

1. **Frontend** → Calls `/api/ai/query` endpoint
2. **Backend** (`server/routes/ai.js`) → Checks `AI_MODE=vast`
3. **VastAiService** → Connects to `http://localhost:8081`
4. **SSH Tunnel** → Forwards `localhost:8081` to Vast.ai instance

## ⚠️ Important: SSH Tunnel Required

The production server needs an SSH tunnel to connect to Vast.ai:

```bash
# On your local machine, run:
.\start_ssh_tunnel.ps1
```

**OR** set up a persistent SSH tunnel on the production server.

## Testing

### 1. Check AI Health
```bash
curl http://localhost:3001/api/ai/health
```

Expected:
```json
{
  "status": "OK",
  "rag": true,
  "inference": true,
  "mode": "vast"
}
```

### 2. Test AI Query
```bash
curl -X POST http://localhost:3001/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are healthcare trends in Nigeria?", "topK": 5}'
```

### 3. Test Direct Vast.ai Connection
```bash
curl http://localhost:8081/health
curl http://localhost:8081/ping
```

## Troubleshooting

### If `inference: false`
- SSH tunnel is not running
- Vast.ai API server is not accessible
- Check tunnel connection: `curl http://localhost:8081/ping`

### If AI Tools Return Errors
- Check server logs: `tail -f /home/medasnnc/medarion/app.log`
- Verify SSH tunnel is active
- Test Vast.ai health endpoint directly

## Next Steps

1. ✅ Environment variables added
2. ✅ Node.js app restarted
3. ⚠️ **Set up SSH tunnel** (required for connection)
4. ✅ Test AI health endpoint
5. ✅ Test AI tools in browser

---

**Status**: Configuration complete, SSH tunnel needed for connection

