# 🚀 Complete Setup Guide for New Vast.ai Instance

## Instance Details
- **SSH Host:** ssh1.vast.ai
- **SSH Port:** 31216
- **Public IP:** 93.91.156.91
- **API Port:** 3001

## Step-by-Step Setup

### Step 1: Upload Files

From your PC, upload the necessary files:

```bash
# Upload API file
scp -i "C:\Users\xone\.ssh\id_ed25519_vast" -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/

# Upload model download script
scp -i "C:\Users\xone\.ssh\id_ed25519_vast" -P 31216 download_and_setup_model.sh root@ssh1.vast.ai:/workspace/
```

---

### Step 2: SSH to Instance

```bash
ssh -i "C:\Users\xone\.ssh\id_ed25519_vast" -p 31216 root@ssh1.vast.ai
```

---

### Step 3: Install Dependencies

Once connected, run:

```bash
cd /workspace

# Install Python dependencies
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors boto3

# Install AWS CLI (if needed)
apt-get update
apt-get install -y awscli
```

---

### Step 4: Download and Extract Model

```bash
cd /workspace

# Make script executable
chmod +x download_and_setup_model.sh

# Run the script (downloads from S3 and extracts)
./download_and_setup_model.sh
```

**This will:**
- Download `medarion-final-model.tar.gz` from S3
- Extract it to `/workspace/model_api/extracted`
- Verify the model files

**Time:** 15-30 minutes depending on connection speed

---

### Step 5: Configure API Port

```bash
cd /workspace

# Set port to 3001 (for public access)
sed -i 's/PORT = [0-9]*/PORT = 3001/' run_api_on_vast.py

# Verify
grep "PORT = " run_api_on_vast.py
```

Should show: `PORT = 3001`

---

### Step 6: Start API

```bash
cd /workspace

# Stop any existing API
pkill -f "python3 run_api_on_vast.py" || true
sleep 2

# Start API in background
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait a moment
sleep 5

# Check if running
ps aux | grep "python3 run_api_on_vast.py" | grep -v grep
```

---

### Step 7: Check Logs

```bash
tail -30 api.log
```

Look for:
- `Running on http://0.0.0.0:3001`
- `Model loaded successfully`
- No errors

---

### Step 8: Test API Locally

```bash
curl http://localhost:3001/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

---

### Step 9: Test Public Access

From your PC (new terminal):

```bash
curl http://93.91.156.91:3001/health
```

If this works → **Public access is working!** ✅

---

### Step 10: Update cPanel

If public access works, update cPanel:

**Option A: Use PowerShell script**
```powershell
.\update_cpanel_direct_connection.ps1
```

**Option B: Manual update**
```bash
# SSH to cPanel
ssh root@server1.medarion.africa

# Edit .env
cd /home/medasnnc/nodevenv/medarion/18/bin
nano .env
```

Add/update:
```
VAST_AI_URL=http://93.91.156.91:3001
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

Then restart Node.js service:
```bash
systemctl restart medarion-nodejs
```

---

## Quick Copy-Paste (All Commands)

```bash
# 1. Upload files (from PC)
scp -i "C:\Users\xone\.ssh\id_ed25519_vast" -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/
scp -i "C:\Users\xone\.ssh\id_ed25519_vast" -P 31216 download_and_setup_model.sh root@ssh1.vast.ai:/workspace/

# 2. SSH to instance
ssh -i "C:\Users\xone\.ssh\id_ed25519_vast" -p 31216 root@ssh1.vast.ai

# 3. On instance - install dependencies
cd /workspace
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors boto3
apt-get update && apt-get install -y awscli

# 4. Download and extract model
chmod +x download_and_setup_model.sh
./download_and_setup_model.sh

# 5. Configure port
sed -i 's/PORT = [0-9]*/PORT = 3001/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py

# 6. Start API
pkill -f "python3 run_api_on_vast.py" || true
sleep 2
nohup python3 run_api_on_vast.py > api.log 2>&1 &
sleep 5
ps aux | grep "python3 run_api_on_vast.py" | grep -v grep

# 7. Check logs
tail -30 api.log

# 8. Test
curl http://localhost:3001/health
```

---

## Troubleshooting

### Model Download Fails

If AWS credentials are needed:
```bash
export AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="us-east-2"
```

### API Not Starting

Check logs:
```bash
tail -50 api.log
```

Common issues:
- Model not found → Check `/workspace/model_api/extracted` exists
- Port in use → `pkill -f run_api_on_vast.py` and try again
- Missing dependencies → Re-run pip install

### Public Access Fails

1. Check if port 3001 is actually open:
   ```bash
   netstat -tuln | grep 3001
   ```

2. Try different port (8080):
   ```bash
   sed -i 's/PORT = 3001/PORT = 8080/' run_api_on_vast.py
   # Restart API
   ```

3. Check firewall/security groups on Vast.ai

---

## Success Checklist

- ✅ Model downloaded from S3
- ✅ Model extracted to `/workspace/model_api/extracted`
- ✅ API process running
- ✅ Health check works locally: `curl http://localhost:3001/health`
- ✅ Public access works: `curl http://93.91.156.91:3001/health`
- ✅ cPanel configured with new URL
- ✅ Application can access AI

Once all checked, the AI is fully operational! 🎉

