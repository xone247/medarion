# Server Start Method - Always Use This

## ✅ Preferred Method (Background Start)

This is the method that works reliably. Always use this when restarting servers.

### Commands to Run:

```powershell
# Stop all existing processes first
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Start Backend in background
cd C:\xampp\htdocs\medarion
$env:NODE_OPTIONS="--max-old-space-size=512"
npm run server:dev

# Start Frontend in background (in same or separate terminal)
cd C:\xampp\htdocs\medarion
$env:NODE_OPTIONS="--max-old-space-size=512"
npm run dev
```

### Why This Works:
- Starts servers directly in background
- Uses proper npm scripts from package.json
- Backend uses nodemon for auto-reload
- Frontend uses Vite with HMR enabled
- No PowerShell execution policy issues
- Servers run in background, allowing terminal to continue

### Verification:
```powershell
# Check if servers are running
netstat -ano | findstr ":3001" | findstr "LISTENING"  # Backend
netstat -ano | findstr ":5173" | findstr "LISTENING"  # Frontend
```

### URLs:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

---
**Note:** This method is preferred over using `npm start` with concurrently or opening separate PowerShell windows, as it's more reliable and doesn't require PowerShell execution policy changes.

