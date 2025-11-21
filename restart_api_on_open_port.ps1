# Restart API on Vast.ai with new port (44047)
# This uploads the updated script and restarts the API

$ErrorActionPreference = "Continue"

Write-Host "`n🔄 Restarting API on Open Port (44047)..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$vastSSHPort = 44939  # SSH port (22/tcp mapped)
$vastHost = "ssh1.vast.ai"
$newPort = 44047

if (-not (Test-Path $vastKey)) {
    Write-Host "`n❌ SSH key not found: $vastKey" -ForegroundColor Red
    exit 1
}

# Step 1: Upload updated script
Write-Host "`n[1/3] Uploading updated script..." -ForegroundColor Yellow
try {
    scp -i $vastKey -P $vastSSHPort "run_api_on_vast.py" "root@${vastHost}:/workspace/run_api_on_vast.py" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Script uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Upload completed (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Stop existing API
Write-Host "`n[2/3] Stopping existing API..." -ForegroundColor Yellow
$stopCmd = "pkill -f 'python3.*run_api_on_vast.py' 2>&1 || echo 'No process to stop'"
$stopResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $stopCmd 2>&1
Write-Host "   $stopResult" -ForegroundColor Gray
Start-Sleep -Seconds 2

# Step 3: Start API on new port
Write-Host "`n[3/3] Starting API on port $newPort..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 3 && ps aux | grep 'python3.*run_api_on_vast.py' | grep -v grep"
$startResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $startCmd 2>&1

if ($startResult -match "python3.*run_api_on_vast") {
    Write-Host "   ✅ API is running on port $newPort!" -ForegroundColor Green
    
    Write-Host "`n🧪 Testing API..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    
    try {
        $health = Invoke-RestMethod -Uri "http://93.91.156.86:$newPort/health" -Method GET -TimeoutSec 10
        Write-Host "   ✅ API is accessible publicly!" -ForegroundColor Green
        Write-Host "   $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Public test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   API may still be starting..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  API may not have started" -ForegroundColor Yellow
    Write-Host "   Check logs: ssh -i `"$vastKey`" -p $vastSSHPort root@${vastHost} 'tail -30 /workspace/api.log'" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Restart complete!" -ForegroundColor Green
Write-Host "`n🌐 Public API URL: http://93.91.156.86:$newPort" -ForegroundColor Cyan
Write-Host "`n📝 Update backend .env:" -ForegroundColor Yellow
Write-Host "   VAST_AI_URL=http://93.91.156.86:$newPort" -ForegroundColor White

