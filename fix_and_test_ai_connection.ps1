# Fix and Test AI Connection - Complete Workflow

$ErrorActionPreference = "Continue"

Write-Host "`n🔧 Fixing and Testing AI Connection" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Step 1: Verify API is accessible
Write-Host "`n[1/5] Testing API directly..." -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "https://establish-ought-operation-areas.trycloudflare.com/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ API is working: $($apiHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Verify backend .env configuration
Write-Host "`n[2/5] Checking backend configuration..." -ForegroundColor Yellow
$envPath = "server\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "establish-ought-operation-areas") {
        Write-Host "   ✅ .env configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  .env may need update" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Step 3: Check if backend is running
Write-Host "`n[3/5] Checking backend status..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
    Write-Host "   Status: $($backendHealth.status)" -ForegroundColor White
    Write-Host "   Inference: $($backendHealth.inference)" -ForegroundColor $(if ($backendHealth.inference) { "Green" } else { "Yellow" })
    Write-Host "   Mode: $($backendHealth.mode)" -ForegroundColor White
    
    if ($backendHealth.inference -eq $false) {
        Write-Host "`n   ⚠️  Backend health check shows inference: false" -ForegroundColor Yellow
        Write-Host "   This means the backend can't reach the API" -ForegroundColor Yellow
        Write-Host "   Backend needs to be restarted to pick up changes" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Backend is not responding" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "   (This is OK if backend is not running)" -ForegroundColor Gray
}

# Step 4: Instructions
Write-Host "`n[4/5] Next Steps:" -ForegroundColor Yellow
Write-Host "`n   1. Restart Backend:" -ForegroundColor White
Write-Host "      cd server" -ForegroundColor Gray
Write-Host "      npm start" -ForegroundColor Gray
Write-Host "`n   2. Wait for backend to start (check for logs)" -ForegroundColor White
Write-Host "`n   3. Test health check again:" -ForegroundColor White
Write-Host "      .\test_backend_api_connection.js" -ForegroundColor Gray
Write-Host "`n   4. Check backend logs for:" -ForegroundColor White
Write-Host "      [VastAiService] Health check response" -ForegroundColor Gray
Write-Host "      [VastAiService] Health check result" -ForegroundColor Gray

# Step 5: Test chat endpoint
Write-Host "`n[5/5] Testing chat endpoint (if backend is running)..." -ForegroundColor Yellow
try {
    $chatTest = @{
        query = "Hello, who are you?"
    } | ConvertTo-Json
    
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/query" -Method POST -Body $chatTest -ContentType "application/json" -TimeoutSec 30
    if ($chatResponse.success -and $chatResponse.answer) {
        Write-Host "   ✅ Chat endpoint working!" -ForegroundColor Green
        Write-Host "   Answer preview: $($chatResponse.answer.Substring(0, [Math]::Min(100, $chatResponse.answer.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Chat endpoint returned but no answer" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 503) {
        Write-Host "   ⚠️  Chat endpoint returned 503 (Service Unavailable)" -ForegroundColor Yellow
        Write-Host "   This means inference is false - backend can't reach API" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  Backend not running or error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Diagnostic complete!" -ForegroundColor Green
Write-Host "`n💡 If inference is still false after restart:" -ForegroundColor Cyan
Write-Host "   1. Check backend logs for health check errors" -ForegroundColor White
Write-Host "   2. Verify API URL in .env matches Cloudflare tunnel" -ForegroundColor White
Write-Host "   3. Test API directly: curl https://establish-ought-operation-areas.trycloudflare.com/health" -ForegroundColor White

