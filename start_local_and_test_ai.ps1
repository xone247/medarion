# Start Local Environment and Test AI
# This script starts the local servers and tests the AI connection

$ErrorActionPreference = "Continue"

function Write-Progress-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    $percent = [math]::Round(($Step / $Total) * 100)
    Write-Progress -Activity "Starting Local Environment" -Status $Message -PercentComplete $percent
    Write-Host "`n[$Step/$Total] $Message" -ForegroundColor Cyan
}

Write-Host "`n🚀 Starting Local Environment & Testing AI" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Step 1: Check prerequisites
Write-Progress-Step -Step 1 -Total 6 -Message "Checking Prerequisites..."
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Stop existing processes
Write-Progress-Step -Step 2 -Total 6 -Message "Stopping Existing Processes..."
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Existing processes stopped" -ForegroundColor Green

# Step 3: Start SSH Tunnel to Vast.ai
Write-Progress-Step -Step 3 -Total 6 -Message "Starting Vast.ai SSH Tunnel..."
$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$tunnelPort = 8081  # Use 8081 to avoid conflict with backend on 3001
$tunnelProcess = Get-NetTCPConnection -LocalPort $tunnelPort -ErrorAction SilentlyContinue

if (-not $tunnelProcess) {
    if (Test-Path $vastKey) {
        Write-Host "   🔑 Using SSH key: $vastKey" -ForegroundColor Gray
        Start-Process -FilePath "ssh" -ArgumentList "-i", "$vastKey", "-p", "31216", "-L", "${tunnelPort}:localhost:3001", "-N", "-f", "root@ssh1.vast.ai" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "   ✅ SSH tunnel started (localhost:$tunnelPort -> Vast.ai:3001)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  SSH key not found. Starting tunnel manually..." -ForegroundColor Yellow
        # Update tunnel script to use 8081
        $tunnelScript = Join-Path $PSScriptRoot "start_vast_tunnel_auto.ps1"
        (Get-Content $tunnelScript) -replace '\$LOCAL_PORT = 3001', "`$LOCAL_PORT = $tunnelPort" | Set-Content $tunnelScript
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; .\start_vast_tunnel_auto.ps1" -WindowStyle Normal
        Start-Sleep -Seconds 3
        Write-Host "   ✅ Tunnel window opened (check for authentication)" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ SSH tunnel already running on port $tunnelPort" -ForegroundColor Green
}

# Step 4: Ensure server/.env has correct VAST_AI_URL
Write-Host "   🔧 Checking server/.env configuration..." -ForegroundColor Gray
$envFile = Join-Path $PSScriptRoot "server\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -notmatch "VAST_AI_URL=http://localhost:8081") {
        Write-Host "      ⚠️  Updating VAST_AI_URL in server/.env..." -ForegroundColor Yellow
        if ($envContent -match "VAST_AI_URL=") {
            $envContent = $envContent -replace "VAST_AI_URL=.*", "VAST_AI_URL=http://localhost:8081"
        } else {
            $envContent += "`nVAST_AI_URL=http://localhost:8081`n"
        }
        Set-Content -Path $envFile -Value $envContent -NoNewline
        Write-Host "      ✅ Updated VAST_AI_URL=http://localhost:8081" -ForegroundColor Green
    } else {
        Write-Host "      ✅ VAST_AI_URL is correctly set" -ForegroundColor Green
    }
} else {
    Write-Host "      ⚠️  server/.env not found - backend will use defaults" -ForegroundColor Yellow
}

# Step 5: Start Backend Server
Write-Progress-Step -Step 5 -Total 6 -Message "Starting Backend Server..."
$backendPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend Server (Node.js) - Port 3001' -ForegroundColor Green; Write-Host ''; `$env:NODE_ENV='development'; node server.js" -WindowStyle Normal
Write-Host "   ✅ Backend server window opened" -ForegroundColor Green
Start-Sleep -Seconds 5

# Wait for backend to be ready
Write-Host "   ⏳ Waiting for backend..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 1; $i -le 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✅ Backend is running! (took $i seconds)" -ForegroundColor Green
        $backendReady = $true
        break
    } catch {
        Write-Host "   ⏳ Waiting... ($i/15)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
    }
}
Write-Host ""

if (-not $backendReady) {
    Write-Host "   ⚠️  Backend may still be starting - check the backend window" -ForegroundColor Yellow
}

# Step 6: Start Frontend Server
Write-Progress-Step -Step 6 -Total 7 -Message "Starting Frontend Server..."
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-Command", "cd '$PSScriptRoot'; Write-Host '🚀 Frontend Server (Vite) - Port 5173' -ForegroundColor Green; Write-Host ''; npm run dev" -WindowStyle Normal
Write-Host "   ✅ Frontend server window opened" -ForegroundColor Green
Start-Sleep -Seconds 8

# Wait for frontend to be ready
Write-Host "   ⏳ Waiting for frontend..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✅ Frontend is running! (took $i seconds)" -ForegroundColor Green
        $frontendReady = $true
        break
    } catch {
        Write-Host "   ⏳ Waiting... ($i/20)" -ForegroundColor Gray -NoNewline
        Write-Host "`r" -NoNewline
    }
}
Write-Host ""

# Step 7: Test AI Connection
Write-Progress-Step -Step 7 -Total 7 -Message "Testing AI Connection..."
Write-Host "`n🧪 Testing AI Endpoints:" -ForegroundColor Yellow

# Test Health (via backend API)
Write-Host "   [1/3] Testing /health via backend..." -ForegroundColor Gray
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/health" -Method GET -TimeoutSec 5
    if ($healthResponse.status -eq "ok") {
        Write-Host "      ✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Health check returned: $($healthResponse | ConvertTo-Json)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Ping (via backend API)
Write-Host "   [2/3] Testing /ping via backend..." -ForegroundColor Gray
try {
    $pingResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/ping" -Method GET -TimeoutSec 5
    Write-Host "      ✅ Ping successful: $($pingResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Ping failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Chat (via backend API)
Write-Host "   [3/3] Testing /chat via backend..." -ForegroundColor Gray
try {
    $chatBody = @{
        messages = @(
            @{
                role = "user"
                content = "Say hello in one sentence"
            }
        )
        max_tokens = 50
        temperature = 0.7
    } | ConvertTo-Json

    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/chat" -Method POST -Body $chatBody -ContentType "application/json" -TimeoutSec 60
    if ($chatResponse.response) {
        Write-Host "      ✅ Chat test successful!" -ForegroundColor Green
        Write-Host "      Response: $($chatResponse.response.Substring(0, [Math]::Min(100, $chatResponse.response.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "      ⚠️  Chat returned: $($chatResponse | ConvertTo-Json)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ❌ Chat test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Progress -Activity "Starting Local Environment" -Completed

# Final Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Local Environment Started!" -ForegroundColor Green
Write-Host "`n📋 Server URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   • AI API:   http://localhost:3001/api/ai" -ForegroundColor White
Write-Host "`n🧪 Test AI:" -ForegroundColor Cyan
Write-Host "   • Health:   http://localhost:3001/api/ai/health" -ForegroundColor White
Write-Host "   • Chat:     Use the chat interface in your app" -ForegroundColor White
Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "   2. Test the AI chat functionality" -ForegroundColor White
Write-Host "   3. Once confirmed working, we'll build and deploy" -ForegroundColor White
Write-Host "`n⚠️  Keep all PowerShell windows open while testing!" -ForegroundColor Yellow
Write-Host ""

