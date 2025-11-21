# Update Vast.ai API with Reference Implementation

## What Changed

Updated `run_api_on_vast.py` to match the working reference implementation from `D:\medarion-merged\inference.py`.

## Key Updates

### 1. Model Loading
- Changed from `dtype` to `torch_dtype` (for compatibility)
- Added proper device handling
- Matches exact loading pattern from working inference.py

### 2. Chat Template Handling
- Better error handling with try/except
- Improved fallback formatting (matches inference.py exactly)
- Proper System/User/Assistant formatting

### 3. Generation Parameters (Critical Fix)
- **max_tokens**: Changed from 1024 to 4000 (matches reference)
- **top_p**: Changed from 0.9 to 1.0 (matches reference)
- **repetition_penalty**: Changed from 1.15 to 1.1 (matches reference)
- **Conditional parameters**: `temperature if temperature > 0 else None`
- **do_sample**: `temperature > 0` (conditional sampling)

### 4. Token Extraction
- Properly extracts only generated tokens (skips input tokens)
- Matches inference.py exactly

### 5. Response Format
- Includes usage statistics (prompt_tokens, completion_tokens, total_tokens)
- Matches OpenAI-compatible format from inference.py

## Why This Should Fix Gibberish

The reference `inference.py` is the **working** implementation that produces proper responses. The key differences that likely caused gibberish:

1. **Generation parameters**: Our parameters were too restrictive/aggressive
2. **Token extraction**: May have been including input tokens in response
3. **Chat template**: Better formatting prevents model confusion

## Deployment Steps

### 1. Upload Updated File to Vast.ai

```bash
# Option 1: Using SCP (if SSH key is set up)
scp run_api_on_vast.py root@vast.ai:/workspace/

# Option 2: Using Vast.ai file manager/Jupyter
# Upload run_api_on_vast.py to /workspace/ directory
```

### 2. Restart API on Vast.ai

```bash
# Kill old process
pkill -f "python3.*run_api_on_vast.py"

# Start new process
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Wait for model to load (30-60 seconds)
sleep 30

# Check logs
tail -50 api.log
```

### 3. Verify API is Working

```bash
# Test health endpoint
curl -H "X-API-Key: medarion-secure-key-2025" http://localhost:5000/health

# Test chat endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Hello, who are you?"}]}' \
  http://localhost:5000/chat
```

Expected: Should return proper text response, not gibberish.

### 4. Test from Backend

```powershell
$body = @{ query = "Hello, who are you?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/query" -Method POST -Body $body -ContentType "application/json"
```

## Expected Results

✅ **Before**: Gibberish like `! . ..` or `() . . . !`
✅ **After**: Proper responses like "Hello! I'm Medarion, an AI assistant..."

## Files Updated

- `run_api_on_vast.py` - Now matches working reference implementation

## Reference Files

- `D:\medarion-merged\inference.py` - Working SageMaker inference script
- `D:\medarion-merged\config.json` - Model configuration
- `D:\medarion-merged\generation_config.json` - Generation config

---

**This should fix the gibberish issue by using the exact same generation parameters and logic as the working reference!** ✅

