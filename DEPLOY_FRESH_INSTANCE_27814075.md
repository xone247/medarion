# Deployment Guide - Fresh Instance 27814075

## 📊 Instance Details
- **Instance ID**: 27814075
- **GPU**: RTX A5000 (24GB VRAM)
- **Current VRAM**: 0.4/24.0 GB (fresh, ready)
- **Disk**: 50GB (sufficient for model)
- **CPU**: AMD EPYC 7K62 48-Core
- **RAM**: 64.4 GB

## 🚀 Deployment Steps

### Step 1: Upload File

From your PC (PowerShell):
```powershell
cd C:\xampp\htdocs\medarion
scp -P 52695 run_api_on_vast.py root@93.91.156.91:/workspace/
```
(Enter password when prompted)

### Step 2: Verify Upload

In Jupyter Terminal:
```bash
cd /workspace
ls -lh run_api_on_vast.py
# Should show file size ~28KB
```

### Step 3: Start API

In Jupyter Terminal:
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Step 4: Monitor Startup

```bash
tail -f api.log
```

**Expected output:**
1. ✅ Workspace setup
2. ✅ Model download from S3 (~13GB, 5-10 minutes)
3. ✅ Model extraction
4. ✅ Dependencies installation (bitsandbytes, accelerate)
5. ✅ Model loading with 8-bit quantization
6. ✅ API starting on port 8081

**Press Ctrl+C** to stop watching logs.

### Step 5: Verify Deployment

```bash
# Check if API is running
ps aux | grep 'run_api_on_vast.py' | grep -v grep

# Check VRAM usage (should be ~7-8GB)
nvidia-smi

# Check API logs for any errors
tail -50 api.log

# Test health endpoint
curl http://localhost:8081/health
```

**Expected VRAM:**
- Before: 0.4 GB
- After: ~7-8 GB (8-bit quantization)
- Headroom: ~16 GB free ✅

### Step 6: Start SSH Tunnel (From Your PC)

```powershell
.\start_vast_tunnel_auto.ps1
```

Or manually:
```powershell
ssh -p 52695 root@93.91.156.91 -L 8081:localhost:8081 -N
```

### Step 7: Test from Your PC

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8081/health"

# Chat test
$body = '{"messages":[{"role":"user","content":"Hello, who are you?"}]}'
$response = Invoke-WebRequest -Uri "http://localhost:8081/chat" -Method POST -Body $body -ContentType "application/json"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

## ✅ Success Criteria

- ✅ API running on port 8081
- ✅ VRAM: ~7-8GB (not maxed out)
- ✅ Health endpoint returns 200 OK
- ✅ Chat endpoint returns proper responses
- ✅ No errors in logs

## 🔧 Troubleshooting

### If model download fails:
```bash
# Check AWS credentials in file
grep "AWS_ACCESS_KEY_ID" run_api_on_vast.py

# Check network connectivity
ping s3.us-east-2.amazonaws.com
```

### If VRAM is too high:
```bash
# Check for multiple processes
ps aux | grep python | grep -v grep

# Should only see one run_api_on_vast.py process
```

### If port 8081 is in use:
```bash
# Check what's using the port
netstat -tuln | grep 8081

# Or check in logs - API will find alternative port
grep "port" api.log
```

### If API doesn't start:
```bash
# Check full error log
tail -100 api.log

# Common issues:
# - Missing Python packages (auto-installed)
# - Model download failed
# - Port conflict
```

## 📝 Notes

- **First run**: Takes 10-15 minutes (model download + extraction)
- **Subsequent runs**: Takes 2-3 minutes (model already downloaded)
- **VRAM**: Should stabilize at ~7-8GB with 8-bit quantization
- **Quality**: 8-bit provides excellent quality with good headroom

## 🎯 Expected Performance

- **VRAM Usage**: ~7-8GB (leaves ~16GB headroom)
- **Quality**: Excellent (8-bit quantization)
- **Speed**: Fast (Flash Attention 2 / SDPA)
- **Responses**: Detailed and natural

