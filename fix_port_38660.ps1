# Fix port 38660 conflict and start API
# This script finds and kills any process using port 38660, then starts the API

param(
    [string]$VastInstance = "194.228.55.129",
    [string]$VastSSHPort = "38506",
    [string]$VastSSHKey = "$env:USERPROFILE\.ssh\vast_ai_key"
)

Write-Host "`n🔧 Fixing Port 38660 Conflict..." -ForegroundColor Cyan

# Find what's using the port
Write-Host "`n1️⃣ Finding process on port 38660..." -ForegroundColor Yellow
$findCmd = "lsof -i :38660 2>/dev/null || netstat -tuln | grep :38660 || ss -tuln | grep :38660 || echo 'No process found'"
$portInfo = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $findCmd
Write-Host $portInfo

# Kill any process on port 38660
Write-Host "`n2️⃣ Stopping processes on port 38660..." -ForegroundColor Yellow
$killCmd = @"
pkill -f 'run_api_on_vast.py' || true
fuser -k 38660/tcp 2>/dev/null || true
lsof -ti :38660 | xargs kill -9 2>/dev/null || true
sleep 2
"@
ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $killCmd | Out-Null
Write-Host "✅ Port cleared" -ForegroundColor Green

# Verify port is free
Write-Host "`n3️⃣ Verifying port is free..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$checkFree = "lsof -i :38660 2>/dev/null || echo 'Port is free'"
$freeCheck = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $checkFree
Write-Host $freeCheck

# Start API
Write-Host "`n4️⃣ Starting API on port 38660..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 3 && ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep"
$apiStatus = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $startCmd

if ($apiStatus -match "python3") {
    Write-Host "✅ API started successfully!" -ForegroundColor Green
    Write-Host $apiStatus
    
    Write-Host "`n5️⃣ Waiting for API to initialize (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "`n6️⃣ Testing connection..." -ForegroundColor Yellow
    try {
        $health = Invoke-RestMethod -Uri "http://${VastInstance}:38660/health" -TimeoutSec 10
        Write-Host "✅ API is working on port 38660!" -ForegroundColor Green
        Write-Host "Response: $($health | ConvertTo-Json)" -ForegroundColor Gray
    } catch {
        Write-Host "⏳ API is starting (model loading takes 30-60 seconds)" -ForegroundColor Yellow
        Write-Host "   Try again in a minute: curl http://${VastInstance}:38660/health" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ API failed to start. Checking logs..." -ForegroundColor Red
    $logs = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance "tail -20 /workspace/api.log"
    Write-Host $logs
}

Write-Host "`n✅ API should be accessible at:" -ForegroundColor Green
Write-Host "   http://${VastInstance}:38660" -ForegroundColor Cyan

