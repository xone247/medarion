# Test Local Vast.ai Connection
# This script tests the connection before deploying to cPanel

Write-Host "`n🧪 Testing Local Vast.ai Connection" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VAST_IP = "ssh2.vast.ai"
$VAST_PORT = "14075"
$LOCAL_PORT = 8081
$REMOTE_PORT = 3001
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\vast_ai_key"
$API_KEY = "47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a"

# Step 1: Check SSH key
Write-Host "📋 Step 1: Checking SSH key..." -ForegroundColor Yellow
if (Test-Path $SSH_KEY_PATH) {
    Write-Host "   ✅ SSH key found: $SSH_KEY_PATH" -ForegroundColor Green
} else {
    Write-Host "   ❌ SSH key not found: $SSH_KEY_PATH" -ForegroundColor Red
    Write-Host "   Please ensure your Vast.ai SSH key is in this location" -ForegroundColor Gray
    exit 1
}

# Step 2: Check if port 8081 is in use
Write-Host "`n📋 Step 2: Checking port 8081..." -ForegroundColor Yellow
$existingTunnel = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($existingTunnel) {
    Write-Host "   ⚠️  Port $LOCAL_PORT is in use" -ForegroundColor Yellow
    $process = Get-Process -Id $existingTunnel.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
        $response = Read-Host "   Stop existing process? (y/n)"
        if ($response -eq 'y') {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "   ✅ Process stopped" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Keeping existing process" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ✅ Port $LOCAL_PORT is free" -ForegroundColor Green
}

# Step 3: Start SSH tunnel
Write-Host "`n📋 Step 3: Starting SSH tunnel..." -ForegroundColor Yellow
Write-Host "   Connection: ${VAST_IP}:${VAST_PORT}" -ForegroundColor Gray
Write-Host "   Forwarding: localhost:${LOCAL_PORT} → localhost:${REMOTE_PORT}" -ForegroundColor Gray
Write-Host ""

$sshCommand = "ssh -i `"$SSH_KEY_PATH`" -p $VAST_PORT root@${VAST_IP} -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} -N -o StrictHostKeyChecking=no -o ServerAliveInterval=60"

# Start tunnel in background
$tunnelJob = Start-Job -ScriptBlock {
    param($cmd)
    Invoke-Expression $cmd
} -ArgumentList $sshCommand

Write-Host "   🚀 Tunnel starting in background..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if tunnel is running
$tunnelCheck = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($tunnelCheck) {
    Write-Host "   ✅ Tunnel appears to be running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Tunnel may not have started. Check job status." -ForegroundColor Yellow
}

# Step 4: Test health endpoint (no auth required)
Write-Host "`n📋 Step 4: Testing /health endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:${LOCAL_PORT}/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Health check successful!" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This might mean:" -ForegroundColor Yellow
    Write-Host "   • Tunnel is still connecting (wait a few seconds)" -ForegroundColor Gray
    Write-Host "   • API is not running on Vast.ai" -ForegroundColor Gray
    Write-Host "   • Firewall is blocking the connection" -ForegroundColor Gray
}

# Step 5: Test ping endpoint
Write-Host "`n📋 Step 5: Testing /ping endpoint..." -ForegroundColor Yellow
try {
    $pingResponse = Invoke-WebRequest -Uri "http://localhost:${LOCAL_PORT}/ping" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Ping successful!" -ForegroundColor Green
    Write-Host "   Response: $($pingResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Ping failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test chat endpoint (with API key)
Write-Host "`n📋 Step 6: Testing /chat endpoint (with API key)..." -ForegroundColor Yellow
# Chat endpoint expects messages array format
$chatBody = @{
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test message. Please respond briefly."
        }
    )
} | ConvertTo-Json -Depth 10

$chatHeaders = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $API_KEY
}

try {
    Write-Host "   ⏳ Sending chat request (this may take 30-60 seconds)..." -ForegroundColor Gray
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:${LOCAL_PORT}/chat" -Method POST -Body $chatBody -Headers $chatHeaders -TimeoutSec 60 -ErrorAction Stop
    Write-Host "   ✅ Chat test successful!" -ForegroundColor Green
    if ($chatResponse.response) {
        $responseText = $chatResponse.response
        $previewLength = [Math]::Min(150, $responseText.Length)
        Write-Host "   Response: $($responseText.Substring(0, $previewLength))..." -ForegroundColor Gray
        Write-Host "   Full length: $($responseText.Length) characters" -ForegroundColor Gray
    } else {
        Write-Host "   Response: $($chatResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Chat test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Error details: $responseBody" -ForegroundColor Gray
        } catch {
            Write-Host "   Could not read error details" -ForegroundColor Gray
        }
    }
}

# Step 7: Test Node.js backend connection
Write-Host "`n📋 Step 7: Testing Node.js backend connection..." -ForegroundColor Yellow
$nodeServer = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($nodeServer) {
    Write-Host "   ✅ Node.js server is running on port 3001" -ForegroundColor Green
    
    try {
        $backendHealth = Invoke-WebRequest -Uri "http://localhost:3001/api/ai/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ Backend AI health check successful!" -ForegroundColor Green
        Write-Host "   Response: $($backendHealth.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Backend AI health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   (This is okay if the backend hasn't been configured yet)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  Node.js server not running on port 3001" -ForegroundColor Yellow
    Write-Host "   Start it with: npm run dev (in server directory)" -ForegroundColor Gray
}

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Tunnel Status:" -ForegroundColor Yellow
$tunnelStatus = Get-NetTCPConnection -LocalPort $LOCAL_PORT -ErrorAction SilentlyContinue
if ($tunnelStatus) {
    Write-Host "   ✅ Running on port $LOCAL_PORT" -ForegroundColor Green
} else {
    Write-Host "   ❌ Not running" -ForegroundColor Red
}

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. If all tests passed, you're ready to deploy to cPanel!" -ForegroundColor White
Write-Host "   2. Run: .\deploy_vast_tunnel_cpanel.ps1" -ForegroundColor Cyan
Write-Host "   3. Or manually SSH to cPanel and run setup_vast_tunnel_cpanel.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛑 To stop the tunnel:" -ForegroundColor Yellow
Write-Host "   Stop-Job -Id $($tunnelJob.Id); Remove-Job -Id $($tunnelJob.Id)" -ForegroundColor Gray
Write-Host "   Or: Get-Process | Where-Object {`$_.CommandLine -like '*ssh*ssh2.vast.ai*'} | Stop-Process" -ForegroundColor Gray

