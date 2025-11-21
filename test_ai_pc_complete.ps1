# Complete AI Test on PC
# Tests all endpoints with progress indicators

$ErrorActionPreference = "Continue"

function Write-Progress-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    $percent = [math]::Round(($Step / $Total) * 100)
    Write-Progress -Activity "Testing AI on PC" -Status $Message -PercentComplete $percent
    Write-Host "`n[$Step/$Total] $Message" -ForegroundColor Cyan
}

Write-Host "`n🧪 Complete AI Test on PC" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$apiKey = "medarion-secure-key-2025"
$baseUrl = "http://localhost:3001"

# Check if tunnel is running
Write-Progress-Step -Step 1 -Total 6 -Message "Checking SSH Tunnel..."
$tunnelProcess = Get-Process -Name "ssh" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*3001:localhost:3001*" -or $_.CommandLine -like "*-L 3001*"
}

if (-not $tunnelProcess) {
    Write-Host "   ⚠️  Tunnel not running. Starting tunnel..." -ForegroundColor Yellow
    $vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
    if (Test-Path $vastKey) {
        Start-Process -FilePath "ssh" -ArgumentList "-i", "$vastKey", "-p", "31216", "-L", "3001:localhost:3001", "-N", "-f", "root@ssh1.vast.ai" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "   ✅ Tunnel started" -ForegroundColor Green
    } else {
        Write-Host "   ❌ SSH key not found: $vastKey" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ Tunnel is running (PID: $($tunnelProcess.Id))" -ForegroundColor Green
}

# Test 1: Health Endpoint
Write-Progress-Step -Step 2 -Total 6 -Message "Testing Health Endpoint..."
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 10
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
    $healthWorking = $true
} catch {
    Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
    $healthWorking = $false
    exit 1
}

# Test 2: Ping Endpoint
Write-Progress-Step -Step 3 -Total 6 -Message "Testing Ping Endpoint..."
try {
    $ping = Invoke-RestMethod -Uri "$baseUrl/ping" -Method Get -TimeoutSec 10
    Write-Host "   ✅ Ping successful!" -ForegroundColor Green
    Write-Host "   Response: $ping" -ForegroundColor Gray
    $pingWorking = $true
} catch {
    Write-Host "   ⚠️  Ping failed: $_" -ForegroundColor Yellow
    $pingWorking = $false
}

# Test 3: Chat Endpoint (Simple)
Write-Progress-Step -Step 4 -Total 6 -Message "Testing Chat Endpoint (Simple Request)..."
$chatBody1 = @{
    messages = @(
        @{
            role = "user"
            content = "Say hello in one word"
        }
    )
    max_tokens = 5
    temperature = 0.7
} | ConvertTo-Json -Compress

try {
    $chat1 = Invoke-RestMethod -Uri "$baseUrl/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $apiKey
        } `
        -Body $chatBody1 `
        -TimeoutSec 30
    
    Write-Host "   ✅ Chat endpoint working!" -ForegroundColor Green
    $response1 = $chat1.choices[0].message.content
    Write-Host "   Response: $response1" -ForegroundColor Gray
    $chatWorking = $true
} catch {
    Write-Host "   ❌ Chat failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error details: $errorBody" -ForegroundColor Yellow
    }
    $chatWorking = $false
    exit 1
}

# Test 4: Chat Endpoint (Longer)
Write-Progress-Step -Step 5 -Total 6 -Message "Testing Chat Endpoint (Longer Response)..."
$chatBody2 = @{
    messages = @(
        @{
            role = "user"
            content = "What is artificial intelligence? Answer in one sentence."
        }
    )
    max_tokens = 50
    temperature = 0.7
} | ConvertTo-Json -Compress

try {
    $chat2 = Invoke-RestMethod -Uri "$baseUrl/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $apiKey
        } `
        -Body $chatBody2 `
        -TimeoutSec 60
    
    Write-Host "   ✅ Longer chat working!" -ForegroundColor Green
    $response2 = $chat2.choices[0].message.content
    Write-Host "   Response: $($response2.Substring(0, [Math]::Min(100, $response2.Length)))..." -ForegroundColor Gray
    $chatLongWorking = $true
} catch {
    Write-Host "   ⚠️  Longer chat failed: $_" -ForegroundColor Yellow
    $chatLongWorking = $false
}

# Test 5: Generate Endpoint
Write-Progress-Step -Step 6 -Total 6 -Message "Testing Generate Endpoint..."
$generateBody = @{
    prompt = "The future of technology is"
    max_new_tokens = 20
    temperature = 0.7
} | ConvertTo-Json -Compress

try {
    $generate = Invoke-RestMethod -Uri "$baseUrl/generate" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $apiKey
        } `
        -Body $generateBody `
        -TimeoutSec 30
    
    Write-Host "   ✅ Generate endpoint working!" -ForegroundColor Green
    Write-Host "   Response: $($generate.response.Substring(0, [Math]::Min(80, $generate.response.Length)))..." -ForegroundColor Gray
    $generateWorking = $true
} catch {
    Write-Host "   ⚠️  Generate failed: $_" -ForegroundColor Yellow
    $generateWorking = $false
}

Write-Progress -Activity "Testing AI on PC" -Completed

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   Health: $(if ($healthWorking) { '✅ Working' } else { '❌ Failed' })" -ForegroundColor $(if ($healthWorking) { 'Green' } else { 'Red' })
Write-Host "   Ping: $(if ($pingWorking) { '✅ Working' } else { '⚠️  Failed' })" -ForegroundColor $(if ($pingWorking) { 'Green' } else { 'Yellow' })
Write-Host "   Chat (Simple): $(if ($chatWorking) { '✅ Working' } else { '❌ Failed' })" -ForegroundColor $(if ($chatWorking) { 'Green' } else { 'Red' })
Write-Host "   Chat (Longer): $(if ($chatLongWorking) { '✅ Working' } else { '⚠️  Failed' })" -ForegroundColor $(if ($chatLongWorking) { 'Green' } else { 'Yellow' })
Write-Host "   Generate: $(if ($generateWorking) { '✅ Working' } else { '⚠️  Failed' })" -ForegroundColor $(if ($generateWorking) { 'Green' } else { 'Yellow' })

if ($healthWorking -and $chatWorking) {
    Write-Host "`n✅ AI is working perfectly on your PC!" -ForegroundColor Green
    Write-Host "   Ready to deploy website!" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some tests failed. Please check errors above." -ForegroundColor Yellow
}

