#!/usr/bin/env pwsh
# Test Vast.ai API from local PC

$VAST_URL = "http://93.91.156.91:3001"
$API_KEY = "medarion-secure-key-2025"

Write-Host "`n🧪 Testing Vast.ai API from Local PC" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   URL: $VAST_URL" -ForegroundColor White
Write-Host "   API Key: $API_KEY" -ForegroundColor White

# Test 1: Health Check
Write-Host "`n1️⃣  Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$VAST_URL/health" -Method Get -TimeoutSec 10
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Ping Endpoint
Write-Host "`n2️⃣  Testing Ping Endpoint..." -ForegroundColor Cyan
try {
    $ping = Invoke-RestMethod -Uri "$VAST_URL/ping" -Method Get -TimeoutSec 10
    Write-Host "   ✅ Ping successful!" -ForegroundColor Green
    Write-Host "   Response: $($ping | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Ping failed: $_" -ForegroundColor Red
}

# Test 3: Chat Endpoint (Simple)
Write-Host "`n3️⃣  Testing Chat Endpoint (Simple Request)..." -ForegroundColor Cyan
Write-Host "   Sending: 'Say hello in one word'" -ForegroundColor Gray
try {
    $chatBody = @{
        messages = @(
            @{
                role = "user"
                content = "Say hello in one word"
            }
        )
        max_tokens = 10
        temperature = 0.7
    } | ConvertTo-Json

    $chatResponse = Invoke-RestMethod -Uri "$VAST_URL/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $API_KEY
        } `
        -Body $chatBody `
        -TimeoutSec 60

    Write-Host "   ✅ Chat request successful!" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Gray
    $chatResponse | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
} catch {
    Write-Host "   ❌ Chat request failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error details: $responseBody" -ForegroundColor Yellow
    }
}

# Test 4: Chat Endpoint (Longer)
Write-Host "`n4️⃣  Testing Chat Endpoint (Longer Response)..." -ForegroundColor Cyan
Write-Host "   Sending: 'What is artificial intelligence?'" -ForegroundColor Gray
try {
    $chatBody2 = @{
        messages = @(
            @{
                role = "user"
                content = "What is artificial intelligence? Answer in one sentence."
            }
        )
        max_tokens = 50
        temperature = 0.7
    } | ConvertTo-Json

    $chatResponse2 = Invoke-RestMethod -Uri "$VAST_URL/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $API_KEY
        } `
        -Body $chatBody2 `
        -TimeoutSec 60

    Write-Host "   ✅ Chat request successful!" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Gray
    $chatResponse2 | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
} catch {
    Write-Host "   ❌ Chat request failed: $_" -ForegroundColor Red
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "`n💡 If all tests passed, the API is ready for cPanel integration!" -ForegroundColor Cyan

