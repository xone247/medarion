# Frontend AI Connection - Complete Setup

## Connection Chain

```
Frontend (Browser)
    ↓
Vite Dev Server (localhost:5173)
    ↓
Vite Proxy Plugin (/api/ai/*)
    ↓
Backend Server (localhost:3001)
    ↓
Vast.ai API (Cloudflare Tunnel)
    ↓
Fine-tuned Medarion Model
```

## Configuration

### Frontend (`src/services/ai/index.ts`)
- Uses `getApiUrl('/api/ai/query')` to get the correct endpoint
- In dev: Routes through Vite proxy to `localhost:3001`
- In prod: Routes through Apache/Nginx proxy to backend
- Sends: `{ query: "user question", topK: 5 }`
- Receives: `{ success: true, answer: "...", sources: [...] }`

### Vite Proxy (`vite-plugin-api-proxy.ts`)
- Intercepts `/api/ai/*` requests
- Proxies to `http://localhost:3001`
- Preserves headers and body
- 2-minute timeout for AI requests

### Backend (`server/routes/ai.js`)
- Receives request at `/api/ai/query`
- Connects to Vast.ai via `vastAiService.invoke()`
- Cleans response to remove gibberish
- Returns cleaned answer to frontend

### Backend Service (`server/services/vastAiService.js`)
- Connects to: `https://establish-ought-operation-areas.trycloudflare.com`
- Sends OpenAI-compatible format
- Cleans response (stops at training patterns, removes artifacts)
- Returns: `{ choices: [{ message: { content: "..." } }] }`

## Response Cleaning (Multi-Layer)

### Layer 1: Python API (`run_api_on_vast.py`)
- Stops at training data patterns
- Removes JavaScript code
- Cleans trailing gibberish

### Layer 2: Backend Service (`vastAiService.js`)
- Stops at training patterns
- Removes control characters
- Removes emoji and zero-width chars
- Normalizes whitespace

### Layer 3: Backend Route (`ai.js`)
- Enhanced pattern detection
- Removes gibberish patterns (`! . ../`)
- Validates response quality (rejects if <30% valid chars)
- Final cleanup before sending to frontend

## Testing

### 1. Test Backend Directly
```powershell
$body = @{ query = "Hello, who are you?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/query" -Method POST -Body $body -ContentType "application/json"
```

### 2. Test Through Frontend
1. Open browser: `http://localhost:5173`
2. Open DevTools Console (F12)
3. Navigate to AI chat
4. Send a message
5. Check console for:
   - `[AI Service] Sending request to backend: ...`
   - `[AI Service] Response received: ...`
   - `[API Proxy Plugin] Proxying: ...`

### 3. Check Network Tab
- Look for `/api/ai/query` request
- Check request payload
- Check response status (should be 200)
- Check response body (should have `answer` field)

## Troubleshooting

### Frontend Shows "AI service unavailable"
- **Cause**: Backend health check shows `inference: false`
- **Fix**: Check backend logs, verify API connection

### Frontend Gets 503 Error
- **Cause**: Backend can't reach Vast.ai API
- **Fix**: Check Cloudflare tunnel, verify API URL in `.env`

### Responses Are Gibberish
- **Cause**: Cleaning logic not working or model output corrupted
- **Fix**: 
  1. Check backend logs for cleaning messages
  2. Verify all three cleaning layers are active
  3. Check Python API logs on Vast.ai

### Frontend Can't Connect to Backend
- **Cause**: Vite proxy not working or backend not running
- **Fix**:
  1. Verify backend is running: `http://localhost:3001/api/ai/health`
  2. Check Vite proxy logs in console
  3. Verify `vite-plugin-api-proxy.ts` is configured correctly

## Current Status

✅ **Frontend**: Configured correctly
✅ **Vite Proxy**: Working
✅ **Backend**: Running with inference enabled
✅ **API**: Accessible via Cloudflare tunnel
✅ **Cleaning**: Multi-layer protection active

---

**Everything is properly connected!** 🎉

