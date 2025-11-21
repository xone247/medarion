# Vast.ai API Setup - Ready for New PyTorch Instance

## ✅ Script Status

The `run_api_on_vast.py` script has been **restored to working state** with the following features:

### 🔧 Fixed Issues
1. **Indentation errors** - All fixed
2. **Model loading** - Uses the same approach as the working diagnostic script
3. **Pattern detection** - Stops at training data patterns (`### Instruction:`, `### Response:`) and JavaScript code
4. **Fine-tuned Medarion model** - Configured to trust the fine-tuned output

### 📋 Script Features

- **Model Loading**: Loads at module level (same as diagnostic script that worked)
- **Port**: Uses standard port 3001 (works with `-1--1` port range)
- **API Security**: Supports Vast.ai native API keys and custom keys
- **Response Cleaning**: 
  - Stops at training data patterns BEFORE cleaning
  - Gentle cleanup after pattern detection
  - Preserves valid Medarion responses

### 🚀 Setup Steps for New PyTorch Instance

1. **SSH into the new instance**
   ```bash
   ssh -p [PORT] root@ssh[1-9].vast.ai
   ```

2. **Upload the script**
   ```bash
   scp -i ~/.ssh/id_ed25519_vast -P [PORT] run_api_on_vast.py root@ssh[1-9].vast.ai:/workspace/
   ```

3. **Download and extract model from S3**
   ```bash
   cd /workspace
   mkdir -p model_api/extracted
   # Download from S3 (use your S3 credentials)
   # Extract the model to /workspace/model_api/extracted
   ```

4. **Install dependencies** (if needed)
   ```bash
   pip install torch flask transformers
   ```

5. **Start the API**
   ```bash
   cd /workspace
   nohup python3 run_api_on_vast.py > api.log 2>&1 &
   ```

6. **Verify it's running**
   ```bash
   ps aux | grep run_api_on_vast
   curl http://localhost:3001/health
   ```

### 🔗 Connection Setup

Once the API is running on Vast.ai:

1. **For Local Testing**: Use SSH tunnel
   ```bash
   ssh -i ~/.ssh/id_ed25519_vast -p [PORT] -L 8081:localhost:3001 root@ssh[1-9].vast.ai -N
   ```

2. **For cPanel**: Set up persistent SSH tunnel (see `CPANEL_BACKEND_AND_AI_SETUP.md`)

3. **Update environment variables**:
   - Local: `server/.env` → `VAST_AI_URL=http://localhost:8081`
   - cPanel: `.env` → `VAST_AI_URL=http://localhost:3002` (or your tunnel port)

### 📝 Important Notes

- **24GB GPU**: Should run perfectly with this setup
- **Fine-tuned Model**: The script is configured to trust the Medarion fine-tuned output
- **Pattern Detection**: Automatically stops at training data artifacts and JavaScript code
- **Port 3001**: Standard port, works with `-1--1` port range (all ports open)

### 🧪 Testing

After setup, test with:
```bash
# Health check
curl http://localhost:3001/health

# Chat test
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":100}'
```

---

**Status**: ✅ Ready for deployment to new PyTorch instance

