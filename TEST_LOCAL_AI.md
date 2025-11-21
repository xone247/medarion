# Test AI Locally Before cPanel Deployment

## 📋 Current Configuration

**API URL**: `https://establish-ought-operation-areas.trycloudflare.com`
**API Key**: `medarion-secure-key-2025`

## 🔧 Step 1: Update Backend Configuration

### Update `server/.env`:

```env
# Vast.ai Configuration
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025

# OR use VAST_API_KEY (both work)
VAST_API_KEY=medarion-secure-key-2025

# AI Mode
AI_MODE=vast
```

## 🧪 Step 2: Test Backend Connection

### Test Health Endpoint:
```bash
# From your PC
curl http://localhost:3001/api/ai/health
```

Expected:
```json
{
  "status": "OK",
  "rag": true,
  "inference": true,
  "mode": "vast"
}
```

### Test Chat Endpoint:
```bash
curl -X POST http://localhost:3001/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Say hello"}'
```

## 🚀 Step 3: Start Backend Server

```bash
cd server
npm start
# OR
node index.js
```

## ✅ Step 4: Test in Browser

1. Start frontend: `npm run dev` (in root directory)
2. Open browser: `http://localhost:5173` (or your frontend port)
3. Test AI chat functionality
4. Check browser console for any errors
5. Check backend logs for API calls

## 🔍 Step 5: Verify Everything Works

### Check Backend Logs:
Look for:
```
[AI Query] Using Vast.ai fine-tuned Medarion model, URL: https://establish-ought-operation-areas.trycloudflare.com
[VastAiService] Calling /chat endpoint
[VastAiService] Response received
```

### Check Browser Console:
- No 503 errors
- No connection errors
- AI responses are clean (no gibberish)
- Responses identify as Medarion

## 🐛 Troubleshooting

### If health check fails:
1. Check backend is running: `ps aux | grep node`
2. Check .env file has correct URL
3. Check backend logs for errors

### If chat doesn't work:
1. Verify API is accessible: `curl https://establish-ought-operation-areas.trycloudflare.com/health`
2. Check backend logs for API errors
3. Verify API key is correct
4. Check browser network tab for request/response

### If responses are gibberish:
1. Check API logs on Vast.ai: `tail -50 /workspace/api.log`
2. Verify fine-tuned model is loaded
3. Check cleaning patterns are working

## 📝 Checklist Before Moving to cPanel

- [ ] Backend .env updated with Cloudflare URL
- [ ] Backend starts without errors
- [ ] Health endpoint returns `inference: true`
- [ ] Chat endpoint works from backend
- [ ] Frontend can connect to backend
- [ ] AI responses are clean (no gibberish)
- [ ] AI identifies as Medarion
- [ ] No errors in browser console
- [ ] No errors in backend logs

## 🎯 Next Steps (After Local Testing)

Once everything works locally:
1. Build production frontend: `npm run build`
2. Prepare cPanel deployment
3. Update cPanel .env with same configuration
4. Deploy to cPanel
5. Test on live site

