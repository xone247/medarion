# 🚀 Manual Vast.ai Script Update Guide

## Quick Reference

### SSH Connection
```bash
ssh -i ~/.ssh/vast_ai_key -p 37792 root@194.228.55.129
```

### Upload Script (from local machine)
```bash
scp -i ~/.ssh/vast_ai_key -P 37792 run_api_on_vast.py root@194.228.55.129:/workspace/model_api/
```

---

## 📋 Step-by-Step Instructions

### Step 1: Upload Updated Script

**From your local machine (PowerShell):**
```powershell
cd C:\xampp\htdocs\medarion
scp -i $env:USERPROFILE\.ssh\vast_ai_key -P 37792 run_api_on_vast.py root@194.228.55.129:/workspace/model_api/
```

### Step 2: SSH into Vast.ai

```bash
ssh -i ~/.ssh/vast_ai_key -p 37792 root@194.228.55.129
```

### Step 3: Navigate to Workspace

```bash
cd /workspace/model_api
```

### Step 4: Stop Existing API Server (if running)

```bash
# Find the process
ps aux | grep run_api_on_vast.py

# Stop it
pkill -f 'run_api_on_vast.py'

# Or if running in screen
screen -r
# Press Ctrl+C to stop
```

### Step 5: Verify Model Files Exist

```bash
# Check extracted model files
ls -lh extracted/*.safetensors

# Check tar.gz file
ls -lh model.tar.gz
```

**Expected output:**
- 3 safetensors files (model-00001, model-00002, model-00003)
- model.tar.gz file (13GB)

### Step 6: Start API Server

**Option A: Foreground (see output directly)**
```bash
python3 run_api_on_vast.py
```

**Option B: Background (with logging)**
```bash
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

**Option C: Screen Session (recommended)**
```bash
screen -S vast_api
python3 run_api_on_vast.py
# Press Ctrl+A then D to detach
```

### Step 7: Monitor Progress

**If running in background:**
```bash
tail -f api.log
```

**If running in screen:**
```bash
screen -r vast_api
```

---

## ✅ What to Expect

### During Startup:

1. **Checking TAR.GZ** (Step 1)
   ```
   ✅ TAR.GZ found: 13.00 GB
   ⏭️  Skipping download (file already exists)
   ```

2. **Checking extracted model** (Step 2)
   ```
   ✅ Model already extracted
   ✅ Found 3 safetensors files
   ✅ Found config.json and inference.py
   ⏭️  Skipping extraction
   ```

3. **Checking GPU** (Step 3)
   ```
   ✅ NVIDIA RTX A5000 (24.00 GB VRAM)
   ```

4. **Loading Model** (Step 4) - **Takes 2-5 minutes**
   ```
   📥 Loading Model (2-5 minutes)...
   ✅ Model loaded!
   💾 VRAM: 14.23 GB / 24.00 GB
   ```

5. **Starting API Server** (Step 5)
   ```
   🌐 Endpoints:
      GET  /health   - Health check
      GET  /ping     - Ping test
      POST /generate - Simple generation
      POST /chat     - OpenAI-compatible chat
   
   ✅ Server starting...
   ```

---

## 🔍 Verification

### Check API is Running

**On Vast.ai:**
```bash
ps aux | grep run_api_on_vast.py
```

**Test locally (requires SSH tunnel):**
```bash
curl http://localhost:8081/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "gpu": "NVIDIA RTX A5000",
  "vram_used": "14.23 GB",
  "vram_total": "24.00 GB"
}
```

---

## 🎯 Key Improvements in Updated Script

### Generation Parameters:
- **max_tokens**: `100` → `8000` (80x increase for comprehensive answers)
- **temperature**: `0.7` → `0.3` (more professional, focused)
- **top_p**: Added `0.9` (nucleus sampling for quality)
- **repetition_penalty**: Added `1.15` (reduces repetition)
- **no_repeat_ngram_size**: Added `3` (prevents 3-gram repetition)
- **length_penalty**: Added `1.1` (encourages longer responses)

### Script Improvements:
- **boto3 optional**: Script works even if boto3 is not installed (since files exist)
- **Better error handling**: More informative messages
- **Skip download/extraction**: Automatically detects existing files

---

## ⚠️ Troubleshooting

### Issue: "boto3 not found"
**Solution**: This is OK! The script will skip download if model files exist.

### Issue: "Port already in use"
**Solution**: Script auto-detects available port (8080-8089). Check logs for actual port.

### Issue: "Model loading takes too long"
**Solution**: Normal! First load takes 2-5 minutes. Subsequent restarts are faster.

### Issue: "API not responding"
**Solution**: 
1. Check if process is running: `ps aux | grep run_api_on_vast.py`
2. Check logs: `tail -f api.log`
3. Verify SSH tunnel is active on localhost:8081

---

## 📝 After API Server Starts

1. **Wait for model to load** (2-5 minutes)
2. **Verify API is responding**: `curl http://localhost:8081/health`
3. **Restart your backend server** to use new configuration:
   ```powershell
   cd C:\xampp\htdocs\medarion\server
   npm start
   ```

---

## 🎉 Success Indicators

✅ Script runs without errors  
✅ Model files found (no download)  
✅ Model loaded successfully  
✅ API server starts on port 8080 or 8081  
✅ Health endpoint responds  
✅ AI responses are longer and more professional  

---

**Last Updated**: Current session  
**Status**: ✅ Ready for Manual Deployment

