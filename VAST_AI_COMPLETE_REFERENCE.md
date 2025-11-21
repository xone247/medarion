# 🚀 Vast.ai AI Integration - Complete Reference

**This document contains all information about connecting to Vast.ai for AI functionality in the Medarion project. Use this as a reference in future conversations.**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Vast.ai Instance Details](#vastai-instance-details)
3. [SSH Connection](#ssh-connection)
4. [API Server Setup](#api-server-setup)
5. [Application Integration](#application-integration)
6. [Configuration Files](#configuration-files)
7. [API Endpoints](#api-endpoints)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [File Structure](#file-structure)

---

## 🎯 Overview

The Medarion application uses **Vast.ai** to host a **Mistral 7B** AI model for all AI-powered features. The setup includes:

- **Vast.ai GPU Instance**: Hosts the AI model and Flask API
- **SSH Tunnel**: Connects local application to Vast.ai API
- **Node.js Backend**: Routes AI requests to Vast.ai
- **Frontend**: AI Tools page that uses the backend API

**Priority Order**: Vast.ai → SageMaker → vLLM/Ollama

---

## 🖥️ Vast.ai Instance Details

### Current Instance
- **IP Address**: `194.228.55.129`
- **Proxy Host**: `ssh7.vast.ai`
- **Direct SSH Port**: `37792`
- **Proxy SSH Port**: `31731`
- **API Port**: `8081` (on Vast.ai instance)
- **Local Tunnel Port**: `8081` (on your PC)

### Instance Specifications
- **GPU**: RTX A5000
- **VRAM**: 24 GB
- **Model**: Mistral 7B (14GB memory requirement)
- **Status**: ✅ Active and running

### Model Location
- **S3 Bucket**: `medarion7b-model-2025-ue2`
- **Model File**: `medarion-final-model.tar.gz`
- **AWS Region**: `us-east-2`
- **AWS Credentials**: Stored in `run_api_on_vast.py`

---

## 🔗 SSH Connection

### SSH Connection Methods

#### Method 1: Direct SSH (Recommended)
```powershell
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 37792 root@194.228.55.129
```

#### Method 2: Proxy SSH
```powershell
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 31731 root@ssh7.vast.ai
```

### SSH Tunnel Setup

**Script**: `start_ssh_tunnel.ps1`

**Purpose**: Creates SSH tunnel from `localhost:8081` → `Vast.ai:8081`

**Usage**:
```powershell
.\start_ssh_tunnel.ps1
```

**What it does**:
- Checks for SSH key at `$env:USERPROFILE\.ssh\vast_ai_key`
- Prompts for connection method (Direct or Proxy)
- Creates port forwarding: `localhost:8081` → `Vast.ai:8081`
- **IMPORTANT**: Keep the terminal window open to maintain tunnel

**Manual SSH Tunnel**:
```powershell
# Direct
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 37792 root@194.228.55.129 -L 8081:localhost:8081

# Proxy
ssh -i $env:USERPROFILE\.ssh\vast_ai_key -p 31731 root@ssh7.vast.ai -L 8081:localhost:8081
```

### SSH Key Location
- **Path**: `$env:USERPROFILE\.ssh\vast_ai_key`
- **Public Key**: `vast_ai_public_key.txt` (in project root)
- **Note**: Key must be added to Vast.ai instance's `~/.ssh/authorized_keys`

---

## 🐍 API Server Setup

### Flask API Server

**File**: `run_api_on_vast.py`

**Location**: Vast.ai instance at `/workspace/model_api/`

**What it does**:
1. Downloads model from S3 (if not already downloaded)
2. Extracts model files
3. Loads Mistral 7B model onto GPU
4. Starts Flask API server on port 8081

**To Start on Vast.ai**:
```bash
# SSH into Vast.ai instance
ssh -p 37792 root@194.228.55.129

# Navigate to workspace
cd /workspace

# Run the API server
python3 run_api_on_vast.py
```

**Features**:
- Auto-detects available port (8080-8089)
- Downloads model from S3 if missing
- Skips download/extraction if already present
- Installs `accelerate` automatically if needed
- Handles model loading with proper device mapping

**Model Loading**:
- Uses `AutoModelForCausalLM.from_pretrained()` with `device_map="auto"`
- Automatically detects `model.safetensors.index.json`
- Loads 3 safetensors files: `model-00001-of-00003.safetensors`, etc.
- Uses `torch.float16` for memory efficiency

---

## 🔧 Application Integration

### Backend Service

**File**: `server/services/vastAiService.js`

**Purpose**: Node.js service that connects to Vast.ai Flask API

**Configuration**:
```javascript
baseUrl: process.env.VAST_AI_URL || 'http://localhost:8081'
timeout: 120000 // 2 minutes
```

**Methods**:
- `healthCheck()` - Verifies API is accessible
- `invoke(messages, options)` - Sends chat request (OpenAI-compatible)
- `generate(prompt, systemPrompt, options)` - Simple text generation

### Backend Routes

**Files**:
- `server/routes/ai.js` - Main AI query endpoint
- `server/routes/ai-data-generation.js` - AI data generation
- `server/routes/ai-data-updates.js` - AI data updates

**Priority Logic**:
```javascript
// Checks in this order:
1. Vast.ai (if AI_MODE=vast or VAST_AI_URL is set)
2. SageMaker (if AI_MODE=cloud)
3. vLLM/Ollama (if VLLM_BASE_URL is set)
```

### Environment Variables

**File**: `server/.env`

**Required Variables**:
```env
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
```

**Note**: Either `AI_MODE=vast` OR `VAST_AI_URL` being set will enable Vast.ai.

### Frontend Integration

**File**: `src/services/ai/index.ts`

**All AI Tools** use the backend API which routes to Vast.ai:
- `assessMarketRisk()`
- `analyzeCompetitors()`
- `benchmarkValuation()`
- `generateDueDiligenceSummary()`
- `detectTrends()`
- `generateFundraisingStrategy()`
- `askMedarion()` ⭐ Main AI assistant
- `marketEntryReport()`
- `generateImpactReport()`
- `summarizeDeals()`
- `suggestGrantTargets()`
- `matchInvestors()`
- `draftIntroEmail()`

**Flow**: Frontend → Backend API (`/api/ai/query`) → VastAiService → SSH Tunnel → Vast.ai Flask API

---

## 📄 Configuration Files

### 1. `run_api_on_vast.py` (Vast.ai Instance)

**Location**: Vast.ai instance `/workspace/run_api_on_vast.py`

**Key Configuration**:
```python
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'  # Store in environment variable
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'  # Store in environment variable
AWS_REGION = 'us-east-2'
BUCKET = "medarion7b-model-2025-ue2"
TARGZ_KEY = "medarion-final-model.tar.gz"
API_HOST = "0.0.0.0"
API_PORT = 8080  # Auto-finds alternative if in use
```

### 2. `server/services/vastAiService.js` (Backend)

**Key Configuration**:
```javascript
this.baseUrl = process.env.VAST_AI_URL || 'http://localhost:8081';
this.timeout = 120000; // 2 minutes
```

### 3. `server/.env` (Backend)

**Required**:
```env
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
```

### 4. `start_ssh_tunnel.ps1` (Local)

**Key Configuration**:
```powershell
$VAST_IP = "194.228.55.129"
$VAST_PROXY = "ssh7.vast.ai"
$DIRECT_PORT = 37792
$PROXY_PORT = 31731
$LOCAL_PORT = 8081
$REMOTE_PORT = 8081
$SSH_KEY = "$env:USERPROFILE\.ssh\vast_ai_key"
```

---

## 🌐 API Endpoints

### Vast.ai Flask API Endpoints

**Base URL**: `http://localhost:8081` (via SSH tunnel)

#### 1. `GET /health`
**Purpose**: Health check and GPU status

**Response**:
```json
{
  "status": "healthy",
  "gpu": "NVIDIA RTX A5000",
  "vram_used": "14.23 GB",
  "vram_total": "23.55 GB"
}
```

#### 2. `GET /ping`
**Purpose**: Simple connectivity test

**Response**:
```json
{
  "message": "pong"
}
```

#### 3. `POST /generate`
**Purpose**: Simple text generation

**Request**:
```json
{
  "prompt": "Your prompt here",
  "max_tokens": 200,
  "temperature": 0.7
}
```

#### 4. `POST /chat` ⭐ **PRIMARY ENDPOINT**
**Purpose**: OpenAI-compatible chat endpoint

**Request**:
```json
{
  "messages": [
    {"role": "system", "content": "You are Medarion..."},
    {"role": "user", "content": "Your question here"}
  ],
  "max_tokens": 4000,
  "temperature": 0.2
}
```

**Response**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "AI response here..."
    }
  }],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 234,
    "total_tokens": 279
  }
}
```

**Note**: This endpoint decodes only newly generated tokens (not input prompt) to prevent truncation.

### Backend API Endpoints

#### `POST /api/ai/query`
**Purpose**: Main AI query endpoint used by frontend

**Request**:
```json
{
  "messages": [...],
  "max_tokens": 4000,
  "temperature": 0.2
}
```

**Flow**: Frontend → Backend → VastAiService → SSH Tunnel → Vast.ai `/chat`

---

## ✅ Testing & Verification

### 1. Check SSH Tunnel

```powershell
# Test if tunnel is active
Test-NetConnection localhost -Port 8081
```

Should return: `TcpTestSucceeded : True`

### 2. Test Vast.ai API Directly

**File**: `test_ai_directly.py`

```powershell
python test_ai_directly.py
```

Tests:
- `/health` endpoint
- `/ping` endpoint
- `/generate` endpoint
- `/chat` endpoint

### 3. Test Backend Health

```bash
curl http://localhost:3001/api/ai/health
```

Expected response:
```json
{
  "status": "OK",
  "rag": true,
  "inference": true,
  "mode": "vast"
}
```

### 4. Test from Frontend

1. Navigate to `/ai-tools` page
2. Click on any AI tool (e.g., "Medarion Assistant")
3. Enter a query
4. Should receive AI response from Vast.ai

### 5. Check Server Logs

**Backend logs** should show:
```
🔧 VastAiService initialized: { baseUrl: 'http://localhost:8081', timeout: 120000 }
```

**Vast.ai logs** (via SSH):
```bash
# On Vast.ai instance
tail -f /workspace/model_api/logs.txt  # if logging to file
# Or check Flask console output
```

---

## 🔍 Troubleshooting

### Issue: "Connection refused" or "ECONNREFUSED"

**Causes**:
1. SSH tunnel is not running
2. Vast.ai API server is not running
3. Wrong port configuration

**Solutions**:
1. Start SSH tunnel: `.\start_ssh_tunnel.ps1`
2. SSH into Vast.ai and start API: `python3 run_api_on_vast.py`
3. Verify port 8081 is correct in all configs

### Issue: "Vast.ai API request timeout"

**Causes**:
1. Model is still loading (first time takes 2-5 minutes)
2. Request is too large
3. Network issues

**Solutions**:
1. Wait for model to finish loading (check Vast.ai console)
2. Reduce `max_tokens` in request
3. Check SSH tunnel is stable

### Issue: "AI response truncated at beginning"

**Status**: ✅ **FIXED**

**Solution**: The `/chat` endpoint now decodes only newly generated tokens (not input prompt). This was fixed in `run_api_on_vast.py`.

### Issue: "Port 8080 is in use"

**Status**: ✅ **HANDLED**

**Solution**: `run_api_on_vast.py` automatically finds available port (8080-8089) and uses it.

### Issue: "Worker died" or Model Loading Errors

**Causes**:
1. Missing `accelerate` library
2. Incorrect model file structure
3. GPU memory issues

**Solutions**:
1. `run_api_on_vast.py` auto-installs `accelerate`
2. Verify model files: `model.safetensors.index.json` and 3 safetensors files
3. Check GPU VRAM: Should have at least 15GB free

### Issue: Backend Still Using SageMaker/vLLM

**Causes**:
1. `AI_MODE` not set to `vast`
2. `VAST_AI_URL` not set
3. Server not restarted after config change

**Solutions**:
1. Set `AI_MODE=vast` in `server/.env`
2. Set `VAST_AI_URL=http://localhost:8081` in `server/.env`
3. Restart Node.js server: `npm start`

### Issue: SSH Connection Fails

**Causes**:
1. SSH key not found
2. Wrong port
3. Vast.ai instance not running

**Solutions**:
1. Check SSH key: `Test-Path $env:USERPROFILE\.ssh\vast_ai_key`
2. Try both Direct (37792) and Proxy (31731) ports
3. Verify instance is active on Vast.ai dashboard

---

## 📁 File Structure

### Key Files

```
medarion/
├── run_api_on_vast.py              # Flask API server (runs on Vast.ai)
├── start_ssh_tunnel.ps1            # SSH tunnel script (local)
├── test_ai_directly.py             # Direct API testing (local)
├── server/
│   ├── .env                        # Backend config (AI_MODE=vast)
│   ├── services/
│   │   └── vastAiService.js        # Vast.ai service (Node.js)
│   └── routes/
│       ├── ai.js                    # Main AI routes
│       ├── ai-data-generation.js    # AI data generation
│       └── ai-data-updates.js      # AI data updates
└── src/
    └── services/
        └── ai/
            └── index.ts             # Frontend AI service
```

### Documentation Files

```
├── VAST_AI_API_ENDPOINTS.md        # API endpoint documentation
├── CONFIGURE_VAST_AI.md             # Configuration guide
├── AI_REQUEST_FLOW.md               # Request flow diagram
├── AI_TOOLS_VAST_INTEGRATION.md    # Integration details
└── VAST_AI_COMPLETE_REFERENCE.md   # This file
```

---

## 🚀 Quick Start Checklist

### Initial Setup (One-Time)

- [ ] Vast.ai instance is active and running
- [ ] SSH key is added to Vast.ai instance
- [ ] Model is uploaded to S3: `medarion-final-model.tar.gz`
- [ ] `run_api_on_vast.py` is uploaded to Vast.ai instance
- [ ] Backend `.env` has `AI_MODE=vast` and `VAST_AI_URL=http://localhost:8081`

### Daily Startup

1. **Start SSH Tunnel**:
   ```powershell
   .\start_ssh_tunnel.ps1
   ```
   - Select option 1 (Direct SSH)
   - **Keep terminal open**

2. **Start Vast.ai API** (if not already running):
   ```bash
   # SSH into Vast.ai
   ssh -p 37792 root@194.228.55.129
   
   # Start API
   cd /workspace
   python3 run_api_on_vast.py
   ```

3. **Start Backend Server**:
   ```powershell
   npm start
   # or
   npm run server:dev
   ```

4. **Start Frontend** (if needed):
   ```powershell
   npm run dev
   ```

5. **Verify**:
   ```bash
   curl http://localhost:3001/api/ai/health
   ```

---

## 📊 Request Flow Diagram

```
Frontend (Browser)
    ↓
src/services/ai/index.ts
    ↓
POST /api/ai/query
    ↓
server/routes/ai.js
    ↓
server/services/vastAiService.js
    ↓
SSH Tunnel (localhost:8081 → Vast.ai:8081)
    ↓
Vast.ai Flask API (run_api_on_vast.py)
    ↓
POST /chat
    ↓
Mistral 7B Model (GPU)
    ↓
Response (OpenAI-compatible format)
    ↓
Back to Frontend
```

---

## 🔐 Security Notes

1. **AWS Credentials**: Stored in `run_api_on_vast.py` (on Vast.ai instance only)
2. **SSH Key**: Stored at `$env:USERPROFILE\.ssh\vast_ai_key` (local)
3. **API Access**: Only accessible via SSH tunnel (localhost:8081)
4. **No Public IP**: Vast.ai API is not exposed publicly, only via tunnel

---

## 📝 Important Notes

1. **SSH Tunnel Must Stay Open**: The tunnel terminal must remain open for API to work
2. **Model Loading Time**: First API start takes 2-5 minutes to load model
3. **Port Auto-Detection**: Vast.ai API auto-finds available port (8080-8089)
4. **Response Truncation**: Fixed - only generated tokens are returned
5. **Priority**: Vast.ai is checked first if `AI_MODE=vast` or `VAST_AI_URL` is set
6. **Timeout**: 2 minutes for AI generation requests
7. **GPU Memory**: Model uses ~14GB VRAM, instance has 24GB (plenty of headroom)

---

## 🔄 Updates & Changes

### Recent Fixes

1. **Response Truncation** (Fixed):
   - Changed `/chat` endpoint to decode only newly generated tokens
   - Prevents truncation at beginning of responses

2. **Port Conflicts** (Fixed):
   - Auto-detects available port (8080-8089)
   - Updates `API_PORT` variable automatically

3. **CORS Issues** (Fixed):
   - Backend CORS updated to accept ngrok URLs
   - Vast.ai API has CORS enabled

4. **AbortSignal.timeout** (Fixed):
   - Replaced with `AbortController` + `setTimeout` for Node.js compatibility

---

## 📞 Support

If you encounter issues:

1. Check SSH tunnel is running
2. Verify Vast.ai API is running (SSH into instance)
3. Check backend logs for errors
4. Test API directly: `python test_ai_directly.py`
5. Verify environment variables in `server/.env`

---

**Last Updated**: Current session
**Status**: ✅ Fully Integrated and Working
**Model**: Mistral 7B on RTX A5000 (24GB VRAM)
**API Port**: 8081 (auto-detected if in use)


