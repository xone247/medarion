# Test AI Directly on Server (Jupyter Terminal)

## Option 1: Test in Jupyter Terminal (No Tunnel Needed)

### Test Health Endpoint
```bash
curl http://localhost:8081/health
```

### Test Chat Endpoint - Simple Question
```bash
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, who are you?"}]}'
```

### Test Chat Endpoint - Healthcare Question
```bash
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What are the key challenges in African healthcare markets?"}]}'
```

### Test Chat Endpoint - Technical Question
```bash
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Explain the difference between clinical trials and regulatory approval."}]}'
```

## Option 2: Test from Your PC (Requires Tunnel)

### 1. Start SSH Tunnel
```powershell
.\start_vast_tunnel_auto.ps1
```

### 2. Test Health
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/health"
```

### 3. Test Chat
```powershell
$body = '{"messages":[{"role":"user","content":"Hello, who are you?"}]}'
Invoke-WebRequest -Uri "http://localhost:8081/chat" -Method POST -Body $body -ContentType "application/json"
```

## Expected Results

✅ **Good Response:**
- Contains actual words (not just punctuation)
- Relevant to the question
- Coherent and detailed
- Length: 50-2000 characters depending on question

❌ **Bad Response:**
- Only punctuation (.,!?;:)
- Gibberish characters
- Too short (< 10 characters)
- Not relevant to question

## Check VRAM Usage
```bash
nvidia-smi
# Should show ~14GB VRAM for FP16 model
```

