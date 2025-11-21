# Start Local Development Environment
# Starts both backend and frontend servers

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Starting Local Development Environment" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Check if backend is already running
Write-Host "`n[1/3] Checking backend status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Backend is already running" -ForegroundColor Green
    Write-Host "      Status: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Backend not running, starting..." -ForegroundColor Yellow
    
    # Start backend in new window
    Write-Host "`n[2/3] Starting backend server..." -ForegroundColor Yellow
    $backendScript = @"
cd '$PWD\server'
`$env:VAST_AI_URL='https://establish-ought-operation-areas.trycloudflare.com'
`$env:VAST_AI_API_KEY='medarion-secure-key-2025'
`$env:AI_MODE='vast'
npm start
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript
    Write-Host "   ✅ Backend starting in new window..." -ForegroundColor Green
    Write-Host "   ⏳ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Check backend again
Write-Host "`n[3/3] Verifying backend connection..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Backend is responding!" -ForegroundColor Green
    Write-Host "      Status: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($health.inference -eq $true) {
        Write-Host "      ✅ AI inference enabled!" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  AI inference: $($health.inference)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Backend may still be starting..." -ForegroundColor Yellow
    Write-Host "      Wait a few more seconds and check manually" -ForegroundColor Gray
}

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Backend should be running (check the new window)" -ForegroundColor White
Write-Host "   2. Start frontend in another terminal:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host "   3. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "   4. Test AI chat functionality" -ForegroundColor White

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Environment setup complete!" -ForegroundColor Green

