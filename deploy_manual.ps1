# Deploy run_api_on_vast.py to Vast.ai
# Run this script and enter password when prompted

$vastIP = "93.91.156.91"
$vastPort = 52695
$localFile = "run_api_on_vast.py"
$remotePath = "/workspace/run_api_on_vast.py"

Write-Host "
🛑 Step 1: Stopping API and removing old file..." -ForegroundColor Yellow
ssh -p $vastPort root@${vastIP} "pkill -f 'run_api_on_vast.py'; rm -f $remotePath"

Write-Host "
📤 Step 2: Uploading new file..." -ForegroundColor Yellow
Write-Host "   (Enter password when prompted)" -ForegroundColor Gray
scp -P $vastPort "$localFile" root@${vastIP}:${remotePath}

Write-Host "
🚀 Step 3: Starting new API..." -ForegroundColor Yellow
ssh -p $vastPort root@${vastIP} "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &"

Write-Host "
✅ Deployment complete!" -ForegroundColor Green
Write-Host "   Test with: Invoke-WebRequest -Uri 'http://localhost:8081/health'" -ForegroundColor Gray
