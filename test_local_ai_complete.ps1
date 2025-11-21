# Complete Local AI Test
# Tests backend connection to Vast.ai API

$ErrorActionPreference = "Continue"

Write-Host "`n🧪 Complete Local AI Test" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$apiUrl = "https://establish-ought-operation-areas.trycloudflare.com"
$apiKey = "medarion-secure-key-2025"
$backendUrl = "http://localhost:3001"

# Test 1: Direct API Health
Write-Host "`n[1/5] Testing Direct API (Vast.ai)..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ API Health: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Direct API Chat
Write-Host "`n[2/5] Testing Direct API Chat..." -ForegroundColor Yellow
$chatBody = @{
    messages = @(
        @{ role = "user"; content = "Who are you? Say it in one sentence." }
    )
    max_tokens = 100
} | ConvertTo-Json -Depth 10

try {
    $chat = Invoke-RestMethod -Uri "$apiUrl/chat" -Method POST -Body $chatBody -ContentType "application/json" -Headers @{"X-API-Key"=$apiKey} -TimeoutSec 30
    $content = $chat.choices[0].message.content
    Write-Host "   ✅ Chat Response: '$content'" -ForegroundColor Green
    if ($content -match "Medarion|medarion") {
        Write-Host "   ✅ Identity confirmed: Mentions Medarion" -ForegroundColor Green
    }
    if ($content -notmatch "###|function\s*\(" -and $content.Length -gt 10) {
        Write-Host "   ✅ Response is clean (no gibberish)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Backend Health
Write-Host "`n[3/5] Testing Backend Health..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "$backendUrl/api/ai/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Backend Health: $($backendHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
    if ($backendHealth.inference -eq $true) {
        Write-Host "   ✅ AI inference is enabled" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  AI inference not enabled" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Backend not running: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Start backend: cd server && npm start" -ForegroundColor Yellow
}

# Test 4: Backend Chat
Write-Host "`n[4/5] Testing Backend Chat..." -ForegroundColor Yellow
$backendQuery = @{ query = "Who are you?" } | ConvertTo-Json

try {
    $backendChat = Invoke-RestMethod -Uri "$backendUrl/api/ai/query" -Method POST -Body $backendQuery -ContentType "application/json" -TimeoutSec 30
    $answer = $backendChat.answer
    Write-Host "   ✅ Backend Response: '$answer'" -ForegroundColor Green
    if ($answer -match "Medarion|medarion") {
        Write-Host "   ✅ Identity confirmed in backend response" -ForegroundColor Green
    }
    if ($answer -notmatch "###|function\s*\(" -and $answer.Length -gt 10) {
        Write-Host "   ✅ Response is clean (no gibberish)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Make sure backend is running" -ForegroundColor Yellow
}

# Test 5: Verify Configuration
Write-Host "`n[5/5] Verifying Configuration..." -ForegroundColor Yellow
$envPath = "server\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "VAST_AI_URL.*establish-ought-operation-areas") {
        Write-Host "   ✅ VAST_AI_URL is configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  VAST_AI_URL may need update" -ForegroundColor Yellow
    }
    if ($envContent -match "VAST_AI_API_KEY|VAST_API_KEY") {
        Write-Host "   ✅ API key is configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API key may be missing" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  .env file not found" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "`n💡 If all tests pass, your local setup is ready!" -ForegroundColor Cyan
Write-Host "   Next: Test in browser, then prepare for cPanel deployment" -ForegroundColor Cyan

