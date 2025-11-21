# Deploy run_api_on_vast.py to Vast.ai using tunnel connection method
# This script uses the same SSH connection as the tunnel

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🚀 DEPLOY run_api_on_vast.py TO VAST.AI" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Configuration (same as tunnel)
$VAST_IP = "194.228.55.129"
$VAST_PORT = 37792
$SSH_KEY = "$env:USERPROFILE\.ssh\vast_ai_key"
$LOCAL_FILE = "run_api_on_vast.py"
$REMOTE_PATH = "/workspace/run_api_on_vast.py"

# Check if file exists
if (-not (Test-Path $LOCAL_FILE)) {
    Write-Host "❌ File not found: $LOCAL_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Local file: $LOCAL_FILE" -ForegroundColor Cyan
Write-Host "📁 Remote path: $REMOTE_PATH" -ForegroundColor Cyan
Write-Host ""

# Step 1: Connect and stop API, delete old file
Write-Host "🛑 Step 1: Stopping API and removing old file..." -ForegroundColor Yellow
$stopCmd = "pkill -f 'run_api_on_vast.py' 2>/dev/null; rm -f $REMOTE_PATH; echo 'CLEANUP_DONE'"

if (Test-Path $SSH_KEY) {
    Write-Host "   Using SSH key: $SSH_KEY" -ForegroundColor Green
    $stopResult = ssh -i $SSH_KEY -p $VAST_PORT root@${VAST_IP} $stopCmd 2>&1
} else {
    Write-Host "   Using password authentication" -ForegroundColor Yellow
    $stopResult = ssh -p $VAST_PORT root@${VAST_IP} $stopCmd 2>&1
}

Write-Host "   Result: $stopResult" -ForegroundColor Gray
Write-Host ""

# Step 2: Upload file
Write-Host "📤 Step 2: Uploading new file..." -ForegroundColor Yellow

if (Test-Path $SSH_KEY) {
    $uploadCmd = "scp -i `"$SSH_KEY`" -P $VAST_PORT `"$LOCAL_FILE`" root@${VAST_IP}:${REMOTE_PATH}"
} else {
    $uploadCmd = "scp -P $VAST_PORT `"$LOCAL_FILE`" root@${VAST_IP}:${REMOTE_PATH}"
}

Write-Host "   Command: $uploadCmd" -ForegroundColor Gray
Invoke-Expression $uploadCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ File uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Upload failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "   Please check your SSH connection" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Restart API
Write-Host "🚀 Step 3: Starting new API..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 2 && ps aux | grep 'run_api_on_vast.py' | grep -v grep"

if (Test-Path $SSH_KEY) {
    $startResult = ssh -i $SSH_KEY -p $VAST_PORT root@${VAST_IP} $startCmd 2>&1
} else {
    $startResult = ssh -p $VAST_PORT root@${VAST_IP} $startCmd 2>&1
}

Write-Host "   Result: $startResult" -ForegroundColor Gray

if ($startResult -match "python3.*run_api_on_vast") {
    Write-Host "   ✅ API started successfully!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  API may not have started. Check manually." -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Test
Write-Host "🧪 Step 4: Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "      Status: $($health.status)" -ForegroundColor Gray
    Write-Host "      GPU: $($health.gpu)" -ForegroundColor Gray
    
    # Test chat
    $testChat = @{
        messages = @(
            @{ role = "user"; content = "Say hello in one sentence." }
        )
    } | ConvertTo-Json -Depth 10
    
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:8081/chat" -Method POST -Body $testChat -ContentType "application/json" -TimeoutSec 30
    $content = $chatResponse.choices[0].message.content
    
    Write-Host ""
    Write-Host "   📝 Chat Response: $($content.Substring(0, [Math]::Min(100, $content.Length)))" -ForegroundColor White
    
    if ($content -match '[a-zA-Z]{3,}') {
        Write-Host "   ✅ AI is working correctly!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Response may still be gibberish" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "      API may still be starting up" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

