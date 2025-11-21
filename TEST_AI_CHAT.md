# Testing AI Chat on Website

## Current Setup

✅ **API (Vast.ai)**: Running and accessible
- Inference ready: `true`
- Device: `cuda:0`
- URL: `https://establish-ought-operation-areas.trycloudflare.com`

✅ **Backend**: Should be running on `http://localhost:3001`
- Check health: `http://localhost:3001/api/ai/health`
- Should show: `"inference": true`

✅ **Frontend**: Vite dev server starting
- URL: `http://localhost:5173`
- Browser should open automatically

## Testing Steps

### 1. Verify Backend is Running

Open a new terminal and check:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health"
```

Expected response:
```json
{
  "status": "OK",
  "rag": true,
  "inference": true,  // Should be TRUE
  "mode": "vast"
}
```

If `inference` is `false`:
- Check backend console for errors
- Look for `[VastAiService] Health check response` logs
- Restart backend: `cd server && npm start`

### 2. Access the Website

1. Browser should open automatically to `http://localhost:5173`
2. If not, open manually: `http://localhost:5173`

### 3. Log In

- Use your existing account credentials
- Or create a new account if needed

### 4. Navigate to AI Chat

- Look for "AI Tools" in the navigation
- Or find the chat interface/widget
- Or go to the AI assistant page

### 5. Test AI Chat

Try these questions:
- "Hello, who are you?"
- "What is Medarion?"
- "Tell me about healthcare in Africa"

### 6. Check for Issues

**If AI doesn't respond:**
1. Open browser console (F12)
2. Check for errors:
   - 503 errors = Backend can't reach API
   - 500 errors = Backend error
   - Network errors = Connection issue

3. Check Network tab:
   - Look for `/api/ai/query` requests
   - Check response status and content

**If you see "AI service unavailable":**
- Backend health check shows `inference: false`
- Check backend console for health check errors
- Verify API is accessible: `curl https://establish-ought-operation-areas.trycloudflare.com/health`

**If responses are gibberish:**
- This should be fixed with the updated cleaning logic
- Check backend logs for response processing
- Verify fine-tuned Medarion model is loaded

## Expected Behavior

✅ **Working:**
- AI responds with coherent answers
- Identifies as "Medarion"
- Provides healthcare-focused responses
- No gibberish or training data artifacts

❌ **Not Working:**
- "AI service unavailable" message
- 503 errors in console
- No response at all
- Gibberish responses

## Troubleshooting

### Backend Not Starting
```bash
cd server
npm start
```

### Frontend Not Starting
```bash
npm run dev
```

### Backend Shows inference: false
1. Check backend console for health check logs
2. Verify API URL in `server/.env`:
   ```
   VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
   VAST_AI_API_KEY=medarion-secure-key-2025
   AI_MODE=vast
   ```
3. Test API directly:
   ```powershell
   Invoke-RestMethod -Uri "https://establish-ought-operation-areas.trycloudflare.com/health"
   ```

### API Not Accessible
- Check if API is running on Vast.ai
- Restart Cloudflare tunnel if needed
- See `FIX_CLOUDFLARE_TUNNEL.md` for details

---

**Once everything is working, you can test the full AI chat functionality!** 🎉

