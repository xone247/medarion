# Setup Local Testing for Medarion AI
# This script updates the backend .env and tests the connection

$ErrorActionPreference = "Continue"

Write-Host "`n🧪 Setting Up Local AI Testing" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$serverEnvPath = "server\.env"
$apiUrl = "https://establish-ought-operation-areas.trycloudflare.com"
$apiKey = "medarion-secure-key-2025"

# Step 1: Check if .env exists
Write-Host "`n[1/4] Checking server/.env..." -ForegroundColor Yellow
if (Test-Path $serverEnvPath) {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $envContent = Get-Content $serverEnvPath -Raw
    
    # Check if VAST_AI_URL is already set
    if ($envContent -match "VAST_AI_URL") {
        Write-Host "   ⚠️  VAST_AI_URL already exists, updating..." -ForegroundColor Yellow
        $envContent = $envContent -replace "VAST_AI_URL=.*", "VAST_AI_URL=$apiUrl"
    } else {
        Write-Host "   ➕ Adding VAST_AI_URL..." -ForegroundColor Yellow
        $envContent += "`n# Vast.ai Configuration`nVAST_AI_URL=$apiUrl`n"
    }
    
    # Check if API key is set
    if ($envContent -match "VAST_AI_API_KEY|VAST_API_KEY") {
        Write-Host "   ⚠️  API key already exists, updating..." -ForegroundColor Yellow
        $envContent = $envContent -replace "(VAST_AI_API_KEY|VAST_API_KEY)=.*", "VAST_AI_API_KEY=$apiKey"
    } else {
        Write-Host "   ➕ Adding API key..." -ForegroundColor Yellow
        $envContent += "VAST_AI_API_KEY=$apiKey`n"
    }
    
    # Check if AI_MODE is set
    if ($envContent -match "AI_MODE") {
        Write-Host "   ⚠️  AI_MODE already exists, updating..." -ForegroundColor Yellow
        $envContent = $envContent -replace "AI_MODE=.*", "AI_MODE=vast"
    } else {
        Write-Host "   ➕ Adding AI_MODE..." -ForegroundColor Yellow
        $envContent += "AI_MODE=vast`n"
    }
    
    Set-Content -Path $serverEnvPath -Value $envContent
    Write-Host "   ✅ .env updated" -ForegroundColor Green
} else {
    Write-Host "   ➕ Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
# Vast.ai Configuration
VAST_AI_URL=$apiUrl
VAST_AI_API_KEY=$apiKey
AI_MODE=vast
"@
    Set-Content -Path $serverEnvPath -Value $envContent
    Write-Host "   ✅ .env file created" -ForegroundColor Green
}

# Step 2: Test API connection
Write-Host "`n[2/4] Testing API connection..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ API is accessible!" -ForegroundColor Green
    Write-Host "      $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ API connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Make sure API is running on Vast.ai" -ForegroundColor Yellow
}

# Step 3: Test chat endpoint
Write-Host "`n[3/4] Testing chat endpoint..." -ForegroundColor Yellow
$chatBody = @{
    messages = @(
        @{ role = "user"; content = "Say hello" }
    )
    max_tokens = 100
    temperature = 0.7
} | ConvertTo-Json -Depth 10

try {
    $chat = Invoke-RestMethod -Uri "$apiUrl/chat" -Method POST -Body $chatBody -ContentType "application/json" -Headers @{"X-API-Key"=$apiKey} -TimeoutSec 30
    $content = $chat.choices[0].message.content
    Write-Host "   ✅ Chat endpoint working!" -ForegroundColor Green
    Write-Host "      Response: '$content'" -ForegroundColor Gray
    if ($content -notmatch "###|function\s*\(" -and $content.Length -gt 5) {
        Write-Host "      ✅ Response is clean!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Chat test: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 4: Instructions
Write-Host "`n[4/4] Next Steps:" -ForegroundColor Yellow
Write-Host "`n   1. Start backend server:" -ForegroundColor White
Write-Host "      cd server" -ForegroundColor Gray
Write-Host "      npm start" -ForegroundColor Gray
Write-Host "`n   2. Start frontend (in new terminal):" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host "`n   3. Test in browser:" -ForegroundColor White
Write-Host "      Open http://localhost:5173 (or your frontend port)" -ForegroundColor Gray
Write-Host "      Test AI chat functionality" -ForegroundColor Gray
Write-Host "`n   4. Check logs:" -ForegroundColor White
Write-Host "      Backend: Look for '[AI Query] Using Vast.ai fine-tuned Medarion model'" -ForegroundColor Gray
Write-Host "      Browser: Check console for errors" -ForegroundColor Gray

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Local testing setup complete!" -ForegroundColor Green
Write-Host "`n💡 After testing locally, we'll prepare for cPanel deployment" -ForegroundColor Cyan

