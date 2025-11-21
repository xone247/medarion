# Testing Direct API Responses

This guide explains how to test the AI API directly (bypassing backend cleaning) to see if the raw responses are good enough to use.

## Quick Test: Direct API in Frontend

1. **Open browser console** (F12)
2. **Enable direct API mode:**
   ```javascript
   localStorage.setItem('medarionUseDirectApi', 'true')
   ```
3. **Refresh the page**
4. **Test the chat** - responses will come directly from the API
5. **Check console logs** - you'll see `[AI Service] Using DIRECT API mode`

## Disable Direct API Mode

```javascript
localStorage.removeItem('medarionUseDirectApi')
```

## Backend Passthrough Mode

If direct API responses are good, you can enable passthrough mode in the backend:

1. **Add to `server/.env`:**
   ```
   AI_PASSTHROUGH_MODE=true
   ```

2. **Restart backend:**
   ```bash
   cd server
   npm start
   ```

3. **Backend will return API responses as-is** (only minimal cleanup for control characters)

## Comparison

- **Direct API**: Raw responses from Vast.ai API (no backend processing)
- **Backend Passthrough**: API responses with minimal cleanup (control chars only)
- **Backend Normal**: API responses with full cleaning and validation

## Decision

After testing:
- **If direct API responses are good**: Enable passthrough mode permanently
- **If backend cleaning is needed**: Keep current setup
- **If both are bad**: Check API logs on Vast.ai for generation issues

