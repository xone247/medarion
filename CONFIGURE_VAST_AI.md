# 🔧 Configure Application to Use Vast.ai API

## ✅ Integration Complete!

The application has been updated to support Vast.ai API. Here's how to configure it:

## 📋 Step 1: Set Environment Variable

Add this to your `.env` file (or set as environment variable):

```bash
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
```

**OR** just set one of them:
- `AI_MODE=vast` (will use default `http://localhost:8081`)
- `VAST_AI_URL=http://localhost:8081` (will automatically use Vast.ai)

## 📋 Step 2: Start SSH Tunnel

**IMPORTANT:** The SSH tunnel must be running for the application to connect to Vast.ai!

```powershell
.\start_ssh_tunnel.ps1
```

Select **1** for Direct SSH, and **keep the terminal open**.

## 📋 Step 3: Restart Server

Restart your Node.js server to load the new configuration:

```powershell
# Stop the server (Ctrl+C), then restart
npm start
# or
node server/server.js
```

## ✅ Step 4: Verify Connection

Test the AI health endpoint:

```bash
curl http://localhost:3000/api/ai/health
```

You should see:
```json
{
  "status": "OK",
  "rag": true,
  "inference": true,
  "mode": "vast"
}
```

## 🧪 Step 5: Test AI Tools

1. Go to your application
2. Navigate to **AI Tools** page
3. Try any AI tool (e.g., "Medarion Assistant")
4. It should now use the Vast.ai API!

## 📊 Priority Order

The application checks AI services in this order:
1. **Vast.ai** (if `AI_MODE=vast` or `VAST_AI_URL` is set)
2. **SageMaker** (if `AI_MODE=cloud` or `SAGEMAKER_ENDPOINT_NAME` is set)
3. **vLLM/Ollama** (if `VLLM_BASE_URL` or `MISTRAL_7B_ENDPOINT` is set)

## 🔍 Troubleshooting

### Connection Refused
- Make sure SSH tunnel is running
- Check tunnel is on port 8081
- Verify Vast.ai API server is running

### AI Not Responding
- Check server logs for errors
- Verify `VAST_AI_URL` is correct
- Test API directly: `python test_ai_directly.py`

### Still Using SageMaker/vLLM
- Make sure `AI_MODE=vast` is set
- Restart the server after changing env vars
- Check server logs for which service is being used

---

**Status**: ✅ **READY TO USE**

