# Starting Backend Server

## Quick Start

```bash
cd server
npm start
```

The server will start on `http://localhost:3001`

## Verify It's Running

After starting, test the health endpoint:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health"
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

## Troubleshooting

### Backend Won't Start

1. **Check if dependencies are installed:**
   ```bash
   cd server
   npm install
   ```

2. **Check if port 3001 is already in use:**
   ```powershell
   Get-NetTCPConnection -LocalPort 3001
   ```
   If something is using it, either:
   - Stop that process
   - Or change the port in `server.js`

3. **Check for errors in console:**
   - Look for error messages when starting
   - Common issues:
     - Missing `.env` file
     - Missing dependencies
     - Port already in use
     - Database connection issues

### Backend Starts But Shows inference: false

1. **Check backend console for logs:**
   - Look for: `[VastAiService] Health check response`
   - Look for: `[VastAiService] Health check result`

2. **Verify API is accessible:**
   ```powershell
   Invoke-RestMethod -Uri "https://establish-ought-operation-areas.trycloudflare.com/health"
   ```

3. **Check `server/.env` file:**
   ```
   VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
   VAST_AI_API_KEY=medarion-secure-key-2025
   AI_MODE=vast
   ```

### Common Errors

**Error: Cannot find module**
- Solution: Run `npm install` in the `server` directory

**Error: Port 3001 already in use**
- Solution: Kill the process using port 3001 or change the port

**Error: EADDRINUSE**
- Solution: Port is already in use, find and stop the process

**Error: Missing .env file**
- Solution: Create `server/.env` with the required variables

---

**Once backend is running, you can test the AI chat!** 🚀

