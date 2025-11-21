# ✅ Vast.ai Instance Setup - Summary

## What's Been Completed

### ✅ 1. SSH Key Created
- Key location: `C:\Users\xone\.ssh\id_ed25519_vast`
- Public key added to Vast.ai account
- SSH connection tested and working

### ✅ 2. Files Uploaded
- `run_api_on_vast.py` - API server file
- `download_model_with_boto3.py` - Model download script

### ✅ 3. Dependencies Installed
- Python 3.12 installed
- pip installed
- torch, transformers, flask, flask-cors, accelerate, safetensors, boto3 installed

### ✅ 4. Model Downloaded and Extracted
- Model downloaded from S3: `s3://medarion7b-model-2025-ue2/medarion-final-model.tar.gz`
- Size: 12.37 GB
- Extracted to: `/workspace/model_api/extracted`
- Extracted size: 13.49 GB
- Model files verified ✅

## What's Remaining

### ⏳ 5. Start API and Test

**SSH to instance:**
```bash
ssh -i "C:\Users\xone\.ssh\id_ed25519_vast" -p 31216 root@ssh1.vast.ai
```

**On the instance, run:**
```bash
cd /workspace

# Check port configuration
grep "PORT = " run_api_on_vast.py

# Start API
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait 30-60 seconds for model to load
sleep 30

# Check if running
ps aux | grep "python3 run_api_on_vast.py" | grep -v grep

# Check logs
tail -50 api.log

# Test locally
curl http://localhost:3001/health
```

**From your PC, test public access:**
```bash
curl http://93.91.156.91:3001/health
```

### ⏳ 6. Update cPanel Configuration

If public access works, update cPanel:

```powershell
.\update_cpanel_direct_connection.ps1
```

Or manually:
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

Restart service:
```bash
systemctl restart medarion-nodejs
```

## Instance Details

- **SSH Host:** ssh1.vast.ai
- **SSH Port:** 31216
- **Public IP:** 93.91.156.91
- **API Port:** 3001
- **Model Location:** `/workspace/model_api/extracted`

## Troubleshooting

### API Not Starting

1. Check logs:
   ```bash
   tail -100 /workspace/api.log
   ```

2. Check if port is in use:
   ```bash
   netstat -tuln | grep 3001
   ```

3. Try running in foreground to see errors:
   ```bash
   cd /workspace
   python3 run_api_on_vast.py
   ```

### Public Access Not Working

1. Check if API is running:
   ```bash
   ps aux | grep python3 | grep run_api_on_vast
   ```

2. Check if port is listening:
   ```bash
   netstat -tuln | grep 3001
   ```

3. Try different port (8080):
   ```bash
   sed -i 's/PORT = 3001/PORT = 8080/' run_api_on_vast.py
   # Restart API
   ```

4. Check Vast.ai firewall/security groups

## Next Steps

1. ✅ SSH to instance
2. ✅ Start API
3. ✅ Test locally
4. ✅ Test public access
5. ✅ Update cPanel
6. ✅ Test from application

Once all steps complete, the AI will be fully operational! 🎉

