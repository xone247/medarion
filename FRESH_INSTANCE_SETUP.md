# Fresh Vast.ai Instance Setup Guide

## ✅ Optimized Code Features

The `run_api_on_vast.py` file includes:

1. **4-bit Quantization** - Reduces VRAM from ~14GB to ~4-5GB
2. **Proper Chat Response Extraction** - Handles Mistral format correctly
3. **Port 8081** - Matches tunnel configuration
4. **Memory Management** - Automatic cleanup
5. **No Invalid Parameters** - All generation flags are valid

## 🚀 Quick Start (Fresh Instance)

### 1. Upload File to Vast.ai

From your PC:
```powershell
cd C:\xampp\htdocs\medarion
scp -P 52695 run_api_on_vast.py root@93.91.156.91:/workspace/
```
(Enter password when prompted)

### 2. In Jupyter Terminal

```bash
# Navigate to workspace
cd /workspace

# Make sure file is there
ls -lh run_api_on_vast.py

# Start API (will download model if needed)
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Monitor startup
tail -f api.log
# Press Ctrl+C to stop watching
```

### 3. Wait for Setup

The script will:
- ✅ Download model from AWS S3 (~13GB, takes 5-10 minutes)
- ✅ Extract model files
- ✅ Install dependencies (bitsandbytes, accelerate)
- ✅ Load model with 4-bit quantization (~4-5GB VRAM)
- ✅ Start API on port 8081

### 4. Check Status

```bash
# Check if API is running
ps aux | grep 'run_api_on_vast.py' | grep -v grep

# Check VRAM usage (should be ~4-5GB, not 23GB!)
nvidia-smi

# Check API logs
tail -50 api.log

# Test health endpoint
curl http://localhost:8081/health
```

### 5. Start SSH Tunnel (From Your PC)

```powershell
.\start_vast_tunnel_auto.ps1
```

Or manually:
```powershell
ssh -p 52695 root@93.91.156.91 -L 8081:localhost:8081 -N
```

### 6. Test from Your PC

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8081/health"

# Chat test
$body = '{"messages":[{"role":"user","content":"Hello, who are you?"}]}'
Invoke-WebRequest -Uri "http://localhost:8081/chat" -Method POST -Body $body -ContentType "application/json"
```

## 📊 Expected Results

### VRAM Usage
- **Before (FP16)**: ~14GB
- **After (4-bit)**: ~4-5GB ✅
- **Maxed Out**: 23.4GB ❌ (should never happen)

### API Response
- **Before**: Gibberish (punctuation only)
- **After**: Proper responses with actual words ✅

### Port
- **API**: 8081 ✅
- **Tunnel**: 8081 ✅
- **Match**: Yes ✅

## 🔧 Troubleshooting

### If VRAM is still high:
```bash
# Check for multiple processes
ps aux | grep 'run_api_on_vast.py' | grep -v grep

# Should show only ONE process
# If multiple, stop all:
pkill -f 'run_api_on_vast.py'

# Restart
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### If API doesn't start:
```bash
# Check logs
tail -100 api.log

# Common issues:
# - Model download failed (check AWS credentials)
# - Port in use (check with: netstat -tuln | grep 8081)
# - Missing dependencies (script installs automatically)
```

### If responses are still gibberish:
```bash
# Check if 4-bit quantization loaded
grep "4-bit" api.log

# Should see: "Model loaded in 4-bit mode!"
# If not, check bitsandbytes installation
```

## 📝 Key Features

1. **Automatic Setup** - Downloads and extracts model automatically
2. **Memory Efficient** - 4-bit quantization reduces VRAM by ~70%
3. **Proper Response Extraction** - Handles Mistral chat template correctly
4. **Error Handling** - Graceful handling of errors
5. **Memory Management** - Automatic cleanup after each request

## 🎯 Success Criteria

✅ API starts on port 8081
✅ VRAM usage is ~4-5GB (not 23GB)
✅ Health endpoint returns 200 OK
✅ Chat endpoint returns proper responses (not gibberish)
✅ No warnings about invalid parameters

