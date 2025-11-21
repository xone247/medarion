# 🚀 Vast.ai Script Improvements - Deployment Guide

## ✅ What Was Updated

The Vast.ai script (`run_api_on_vast.py`) and backend configuration have been updated to provide **smarter, longer, and more professional** AI responses.

---

## 📋 Changes Summary

### 1. **Vast.ai Script (`run_api_on_vast.py`)**

#### Generation Parameters (Chat Endpoint):
- **max_tokens**: `100` → `8000` (80x increase for comprehensive answers)
- **temperature**: `0.7` → `0.3` (more professional, focused responses)
- **top_p**: Added `0.9` (nucleus sampling for better quality)
- **repetition_penalty**: Added `1.15` (reduces repetition)
- **no_repeat_ngram_size**: Added `3` (prevents 3-gram repetition)
- **length_penalty**: Added `1.1` (encourages longer, detailed responses)

#### Generation Parameters (Generate Endpoint):
- **max_tokens**: `100` → `4000` (40x increase)
- **temperature**: `0.7` → `0.3`
- **top_p**: Added `0.9`
- **repetition_penalty**: Added `1.1`
- **no_repeat_ngram_size**: Added `3`

### 2. **Backend System Prompt (`server/routes/ai.js`)**

**Before:**
```
You are Medarion, a concise assistant for African healthcare markets. Use provided CONTEXT to answer.
```

**After:**
```
You are Medarion, an expert AI assistant specializing in African healthcare markets, investment analysis, and strategic business intelligence. Your role is to provide comprehensive, professional, and insightful responses that help healthcare companies, investors, and stakeholders make informed decisions.

Key Guidelines:
- Provide detailed, well-structured answers with clear explanations
- Use professional business language appropriate for executives and investors
- Include relevant context, examples, and actionable insights when applicable
- Structure responses with clear sections, bullet points, or numbered lists when helpful
- Be thorough but concise - aim for comprehensive coverage without unnecessary verbosity
- When context is provided, integrate it naturally into your response
- Focus on accuracy, relevance, and practical value

Your responses should demonstrate deep knowledge of:
- African healthcare market dynamics and trends
- Investment and funding landscapes
- Regulatory environments and compliance requirements
- Market opportunities and challenges
- Strategic business insights and recommendations

Always maintain a professional, authoritative tone while remaining accessible and clear.
```

### 3. **Backend AI Configuration (`server/routes/ai.js`)**

- **temperature**: `0.2` → `0.3` (slightly higher for better balance)
- **max_tokens**: `8000` (maintained)
- **top_p**: Added `0.9`
- **repetition_penalty**: Added `1.15`

### 4. **VastAiService (`server/services/vastAiService.js`)**

- **Default temperature**: `0.7` → `0.3`
- **Default max_tokens**: `4000` → `8000`
- **Added support**: `top_p` and `repetition_penalty` parameters

---

## 🚀 Deployment Steps

### Step 1: Upload Updated Script to Vast.ai

**Option A: Using SCP (from your local machine)**
```powershell
# Upload the updated script
scp -i $env:USERPROFILE\.ssh\vast_ai_key -P 37792 run_api_on_vast.py root@194.228.55.129:/workspace/model_api/
```

**Option B: Using SSH and Manual Upload**
```powershell
# SSH into Vast.ai
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 37792 root@194.228.55.129

# Navigate to workspace
cd /workspace/model_api

# Create backup of old script
cp run_api_on_vast.py run_api_on_vast.py.backup

# Then manually copy the new script content (or use nano/vim to edit)
```

### Step 2: Restart Vast.ai API Server

**On Vast.ai instance:**
```bash
# Stop the current API server (if running)
# Find the process
ps aux | grep "run_api_on_vast.py"

# Kill the process (replace PID with actual process ID)
kill <PID>

# Or if running in a screen session
screen -r  # Attach to screen session
# Press Ctrl+C to stop
# Then restart:
python3 run_api_on_vast.py
```

**Or start in a new screen session:**
```bash
screen -S vast_api
cd /workspace/model_api
python3 run_api_on_vast.py
# Press Ctrl+A then D to detach
```

### Step 3: Restart Backend Server

**On your local machine:**
```powershell
# Stop the current backend server (Ctrl+C)
# Then restart:
cd server
npm start
```

---

## 🧪 Testing

### 1. Test Vast.ai API Directly

```bash
# Health check
curl http://localhost:8081/health

# Test chat endpoint with new parameters
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What are the key healthcare investment trends in Nigeria?"}
    ],
    "max_tokens": 8000,
    "temperature": 0.3
  }'
```

### 2. Test from Backend

```bash
# Health check
curl http://localhost:3001/api/ai/health

# Test AI query
curl -X POST http://localhost:3001/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key healthcare investment trends in Nigeria?",
    "topK": 5
  }'
```

### 3. Test from Frontend

1. Navigate to `/ai-tools` page
2. Click on "Medarion AI Assistant"
3. Ask a question like: "What are the key healthcare investment trends in Nigeria?"
4. Verify the response is:
   - **Longer** (comprehensive, detailed)
   - **Professional** (business-appropriate language)
   - **Well-structured** (clear sections, bullet points)
   - **No repetition** (smooth, professional flow)

---

## 📊 Expected Improvements

### Before:
- Short, concise answers (100-200 tokens)
- Casual tone
- Sometimes repetitive
- Basic information only

### After:
- **Comprehensive answers** (up to 8000 tokens)
- **Professional business tone**
- **Reduced repetition** (repetition_penalty + no_repeat_ngram_size)
- **Better structure** (clear sections, bullet points)
- **More detailed insights** (length_penalty encourages elaboration)
- **Higher quality** (top_p nucleus sampling)

---

## 🔍 Verification Checklist

- [ ] Updated `run_api_on_vast.py` uploaded to Vast.ai
- [ ] Vast.ai API server restarted with new script
- [ ] Backend server restarted
- [ ] SSH tunnel is active (localhost:8081)
- [ ] Health check passes: `curl http://localhost:8081/health`
- [ ] Test query returns longer, professional response
- [ ] No repetition in responses
- [ ] Responses are well-structured

---

## ⚠️ Important Notes

1. **Model Loading Time**: After restarting the API server, the model will take 2-5 minutes to load. Wait for the "✅ Model loaded!" message.

2. **Port Check**: The script auto-detects available ports (8080-8089). If port 8081 is in use, it will use the next available port. Update your SSH tunnel accordingly.

3. **Memory Usage**: With `max_tokens: 8000`, responses can be very long. Monitor GPU memory if you experience issues.

4. **Response Time**: Longer responses (8000 tokens) will take longer to generate (30-120 seconds depending on complexity).

5. **Temperature Balance**: `0.3` provides a good balance between professionalism and naturalness. You can adjust to `0.2` for more deterministic responses or `0.4` for slightly more creative responses.

---

## 🔄 Rollback (If Needed)

If you need to rollback to the previous version:

1. **On Vast.ai:**
   ```bash
   cd /workspace/model_api
   cp run_api_on_vast.py.backup run_api_on_vast.py
   # Restart API server
   ```

2. **Backend:** The backend changes are backward compatible, but you can revert:
   - `server/routes/ai.js`: Restore old system prompt
   - `server/services/vastAiService.js`: Restore old defaults

---

## 📝 Configuration Tuning

If you want to adjust the parameters further:

### For Even Longer Responses:
- Increase `max_tokens` to `10000` or `12000`
- Increase `length_penalty` to `1.2`

### For More Professional Tone:
- Decrease `temperature` to `0.2`
- Increase `repetition_penalty` to `1.2`

### For More Creative Responses:
- Increase `temperature` to `0.4` or `0.5`
- Decrease `repetition_penalty` to `1.1`

---

**Last Updated**: Current session  
**Status**: ✅ Ready for Deployment  
**Files Modified**: 
- `run_api_on_vast.py`
- `server/routes/ai.js`
- `server/services/vastAiService.js`

