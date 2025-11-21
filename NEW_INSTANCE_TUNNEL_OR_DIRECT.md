# 🔧 New Instance: Tunnel vs Direct Connection

## Instance Details
- **IP:** 93.91.156.91
- **SSH Port:** 31216 (for tunnel via ssh1.vast.ai)
- **Port Range:** -1--1 (all ports open)

## Two Options

### Option 1: Direct Connection (Recommended - Simpler)

Since port range is -1--1 (all ports open), you can connect directly:

**Setup:**
```bash
# On new instance, run API on port 3001
cd /workspace
sed -i 's/PORT = 3001/PORT = 3001/' run_api_on_vast.py  # Already set
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

**Access:**
- Direct: `http://93.91.156.91:3001`
- No tunnel needed!

**cPanel Config:**
```env
VAST_AI_URL=http://93.91.156.91:3001
```

---

### Option 2: SSH Tunnel (If Direct Doesn't Work)

If direct connection is blocked, use tunnel:

**Start Tunnel (from your PC):**
```bash
ssh -p 31216 root@ssh1.vast.ai -L 8080:localhost:8080 -N -f
```

**On Vast.ai instance, run API on port 8080:**
```bash
cd /workspace
sed -i 's/PORT = 3001/PORT = 8080/' run_api_on_vast.py
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

**Access:**
- Via tunnel: `http://localhost:8080` (from your PC)
- From cPanel: Need to set up tunnel on cPanel too

**cPanel Config (if using tunnel on cPanel):**
```env
VAST_AI_URL=http://localhost:8080
```

---

## Recommended: Try Direct First

Since port range is -1--1, try direct connection first:

### Step 1: Setup API on New Instance
```bash
# SSH to new instance
ssh -p 31216 root@ssh1.vast.ai

# Install dependencies
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors

# Upload run_api_on_vast.py (from your PC)
scp -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/

# On instance, start API
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Step 2: Test Direct Connection
```bash
# From your PC
curl http://93.91.156.91:3001/health
```

If this works, you're done! No tunnel needed.

### Step 3: Update cPanel
```env
VAST_AI_URL=http://93.91.156.91:3001
```

---

## If Direct Doesn't Work

Then use the tunnel approach with port 8080.

