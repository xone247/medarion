# Local Testing Checklist - Before cPanel Deployment

## ✅ Configuration Status

- **API URL**: `https://establish-ought-operation-areas.trycloudflare.com`
- **API Key**: `medarion-secure-key-2025`
- **Backend**: `http://localhost:3001`
- **Frontend**: `http://localhost:5173` (or your port)

## 🧪 Testing Steps

### 1. Run Complete Test
```powershell
.\test_local_ai_complete.ps1
```

This will test:
- ✅ Direct API connection
- ✅ Direct API chat
- ✅ Backend health
- ✅ Backend chat
- ✅ Configuration verification

### 2. Start Backend
```bash
cd server
npm start
```

**Expected logs:**
```
🔧 VastAiService initialized: {
  baseUrl: 'https://establish-ought-operation-areas.trycloudflare.com',
  ...
}
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Test in Browser

1. Open `http://localhost:5173`
2. Log in to your application
3. Navigate to AI chat/assistant
4. Send a test message: "Who are you?"
5. Verify response:
   - ✅ Identifies as Medarion
   - ✅ No gibberish
   - ✅ Clean, coherent response
   - ✅ Healthcare-focused (if applicable)

### 5. Check Browser Console

**Should see:**
- No 503 errors
- No connection errors
- API calls to backend
- Successful responses

**Should NOT see:**
- ❌ "AI service unavailable"
- ❌ Connection refused
- ❌ 502/503 errors
- ❌ CORS errors

### 6. Check Backend Logs

**Should see:**
```
[AI Query] Using Vast.ai fine-tuned Medarion model, URL: https://establish-ought-operation-areas.trycloudflare.com
[VastAiService] Calling /chat endpoint
[VastAiService] Response received
[AI Query] Vast.ai response received, length: X
```

## ✅ Pre-Deployment Checklist

Before moving to cPanel, verify:

- [ ] Direct API test passes
- [ ] Backend health shows `inference: true`
- [ ] Backend chat returns clean responses
- [ ] Frontend can connect to backend
- [ ] AI chat works in browser
- [ ] Responses identify as Medarion
- [ ] No gibberish in responses
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Configuration is correct in `server/.env`

## 🚀 After Local Testing Passes

Once everything works locally:

1. **Build production frontend:**
   ```bash
   npm run build
   ```

2. **Prepare cPanel deployment:**
   - Update cPanel `.env` with same configuration
   - Deploy files to cPanel
   - Test on live site

3. **cPanel Configuration:**
   ```env
   VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
   VAST_AI_API_KEY=medarion-secure-key-2025
   AI_MODE=vast
   ```

## 🐛 Troubleshooting

### Backend not connecting:
- Check `.env` file has correct URL
- Restart backend server
- Check backend logs for errors

### AI not responding:
- Verify API is running on Vast.ai
- Check Cloudflare tunnel is active
- Test direct API connection

### Gibberish responses:
- Check API logs on Vast.ai
- Verify fine-tuned model is loaded
- Check cleaning patterns are working

## 📊 Success Indicators

✅ **All tests pass**
✅ **Clean responses (no gibberish)**
✅ **Medarion identity preserved**
✅ **No errors in logs**
✅ **Fast response times**

Once all indicators are green, you're ready for cPanel deployment! 🎉

