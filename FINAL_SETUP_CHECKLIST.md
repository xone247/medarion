# Final Setup Checklist - No Tunneling Required

## ✅ Script Configuration

The script is configured to:
- **Run on internal port**: 8080
- **Accessible via external port**: 44123
- **Public URL**: `http://93.91.156.86:44123`
- **No tunneling needed!**

## 🚀 Launch Steps (Jupyter Terminal)

### 1. Kill any old API process
```bash
pkill -f 'python3.*run_api_on_vast.py'
```

### 2. Start the API
```bash
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### 3. Wait for model to load (30-60 seconds)
```bash
sleep 30
```

### 4. Verify it's running
```bash
ps aux | grep 'python3.*run_api_on_vast.py' | grep -v grep
```

### 5. Test internal endpoint
```bash
curl http://localhost:8080/health
```
Expected: `{"status":"ok","model":"Mistral-7B"}`

### 6. Test public endpoint (from your PC)
```bash
curl http://93.91.156.86:44123/health
```
Expected: `{"status":"ok","model":"Mistral-7B"}`

### 7. Test chat endpoint (from your PC)
```bash
curl -X POST http://93.91.156.86:44123/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
```

## 📝 Backend Configuration

Update `server/.env`:
```env
VAST_AI_URL=http://93.91.156.86:44123
VAST_AI_API_KEY=medarion-secure-key-2025
```

## ✅ Verification Checklist

- [ ] API is running on port 8080 (internal)
- [ ] Health check works: `curl http://localhost:8080/health`
- [ ] Public health check works: `curl http://93.91.156.86:44123/health`
- [ ] Chat endpoint works from your PC
- [ ] Backend `.env` updated with public URL
- [ ] Backend can connect to API

## 🎯 Final Endpoint

**For your application:**
```
http://93.91.156.86:44123
```

**Endpoints available:**
- `GET http://93.91.156.86:44123/health`
- `GET http://93.91.156.86:44123/ping`
- `POST http://93.91.156.86:44123/generate`
- `POST http://93.91.156.86:44123/chat`

**All endpoints require header:**
```
X-API-Key: medarion-secure-key-2025
```

## 🐛 Troubleshooting

### If public endpoint doesn't work:
1. Check API is running: `ps aux | grep run_api_on_vast`
2. Check logs: `tail -30 /workspace/api.log`
3. Verify port mapping in Vast.ai dashboard
4. Try Cloudflare tunnel as alternative (see VAST_AI_CLOUDFLARE_SETUP.md)

### If connection refused:
- API might still be loading the model (wait 1-2 minutes)
- Check firewall/security settings in Vast.ai dashboard

