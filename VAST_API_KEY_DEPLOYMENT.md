# 🔑 Vast.ai API Key Deployment Instructions

## API Key
```
47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

## ✅ Configured on cPanel

The API key has been added to:
- `/home/medasnnc/nodevenv/medarion/18/bin/.env`
- Node.js service restarted

## 📋 Next: Configure on Vast.ai Instance

### Option 1: Environment Variable (Recommended)

When starting the API on Vast.ai:

```bash
export VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"
python3 run_api_on_vast.py
```

### Option 2: One-Line Command

```bash
VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" python3 run_api_on_vast.py
```

### Option 3: Systemd Service (Persistent)

If you have a systemd service, update it:

```ini
[Service]
Environment="VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"
```

Then restart:
```bash
systemctl daemon-reload
systemctl restart your-vast-api-service
```

### Option 4: Create .env File on Vast.ai

```bash
echo 'VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"' > /workspace/.env
```

Then modify `run_api_on_vast.py` to load from `.env` if needed.

---

## 🧪 Testing

### Test from cPanel:

```bash
curl -H "X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" http://194.228.55.129:3001/health
```

Should return: `{"status":"ok","model":"Mistral-7B"}`

### Test AI Query:

```bash
curl -X POST http://localhost:3001/api/ai/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: f3819ac4f5091030bb5c585e836336af76bf495b78e99361a6060d2cd9a24c6e" \
  -d '{"query":"Hello, who are you?"}'
```

---

## ✅ Configuration Summary

**cPanel (.env):**
```env
AI_MODE=vast
VAST_AI_URL=http://194.228.55.129:3001
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

**Vast.ai Instance:**
```bash
export VAST_API_KEY="47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"
```

---

## 🔒 Security Notes

✅ API key is configured on cPanel
✅ All endpoints require authentication
✅ Key is sent in `X-API-Key` header
✅ Keep the key secure and don't share publicly

---

## 📝 Next Steps

1. ✅ cPanel configured
2. ⏳ Configure on Vast.ai instance (see instructions above)
3. ⏳ Restart Vast.ai API with the key
4. ⏳ Test connection from cPanel
5. ⏳ Verify AI is working

