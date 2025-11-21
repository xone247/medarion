# ✅ Verify Port Forward is Working

## Quick Verification Commands

### 1. Check if forwarder is running
```bash
sleep 2
ps aux | grep port_forward.py | grep -v grep
```

Should show a process like:
```
root  4211  ... python3 /workspace/port_forward.py
```

### 2. Check the logs
```bash
cat forward.log
```

Should show:
```
✅ Forwarding 38660 -> localhost:3001
```

### 3. Test local connection (from Vast.ai)
```bash
curl http://localhost:38660/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

### 4. Test external connection (from your computer)
Open a new terminal on your computer and run:
```bash
curl http://194.228.55.129:38660/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

### 5. Test ping endpoint
```bash
curl http://194.228.55.129:38660/ping
```

Should return: `pong`

---

## ✅ Success Checklist

- [ ] Forwarder process is running
- [ ] Logs show "Forwarding 38660 -> localhost:3001"
- [ ] `curl http://localhost:38660/health` works
- [ ] `curl http://194.228.55.129:38660/health` works from your computer

---

## 🚀 Next Step: Update cPanel

Once all tests pass, update cPanel to use the direct connection:

```bash
# On cPanel, update .env file:
VAST_AI_URL=http://194.228.55.129:38660
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

Then restart Node.js service:
```bash
systemctl restart medarion-api.service
```

---

## 🐛 Troubleshooting

### If forwarder is not running:
```bash
# Check error
cat forward.log

# Restart
nohup python3 /workspace/port_forward.py > forward.log 2>&1 &
```

### If connection fails:
```bash
# Verify API is still running on 3001
curl http://localhost:3001/health

# Check if forwarder is listening
lsof -i :38660
```

### If port 38660 is in use:
```bash
fuser -k 38660/tcp
nohup python3 /workspace/port_forward.py > forward.log 2>&1 &
```

