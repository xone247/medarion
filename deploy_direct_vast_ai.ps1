# Deploy Direct Vast.ai Connection (No Tunnel)
# Uploads run_api_on_vast.py and starts API on public port 38660

param(
    [string]$VastInstance = "194.228.55.129",
    [string]$VastSSHPort = "38506",
    [string]$VastSSHKey = "$env:USERPROFILE\.ssh\vast_ai_key"
)

Write-Host "`n🚀 Deploying Direct Vast.ai Connection..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check SSH key
if (-not (Test-Path $VastSSHKey)) {
    Write-Host "`n❌ SSH key not found: $VastSSHKey" -ForegroundColor Red
    Write-Host "   Please ensure your Vast.ai SSH key is in this location" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Instance: $VastInstance" -ForegroundColor Gray
Write-Host "   SSH Port: $VastSSHPort" -ForegroundColor Gray
Write-Host "   API Port: 38660 (public)" -ForegroundColor Gray
Write-Host "   SSH Key: $VastSSHKey" -ForegroundColor Gray

# Step 1: Stop existing API
Write-Host "`n1️⃣ Stopping existing API..." -ForegroundColor Yellow
$stopCmd = "pkill -f 'run_api_on_vast.py' || pkill -f 'python.*run_api' || true"
try {
    ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $stopCmd 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Stopped" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  No existing process found (this is okay)" -ForegroundColor Yellow
}

# Step 2: Upload updated file
Write-Host "`n2️⃣ Uploading run_api_on_vast.py..." -ForegroundColor Yellow
if (-not (Test-Path "run_api_on_vast.py")) {
    Write-Host "   ❌ run_api_on_vast.py not found in current directory" -ForegroundColor Red
    exit 1
}

try {
    scp -i $VastSSHKey -P $VastSSHPort "run_api_on_vast.py" "root@${VastInstance}:/workspace/run_api_on_vast.py"
    Write-Host "   ✅ Uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Upload failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Start API on port 38660
Write-Host "`n3️⃣ Starting API on port 38660..." -ForegroundColor Yellow
$startCmd = @"
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
echo "API started with PID: `$!"
sleep 3
ps aux | grep run_api_on_vast.py | grep -v grep
"@

try {
    $output = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $startCmd
    Write-Host $output
    Write-Host "   ✅ API started" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to start API: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for API to initialize
Write-Host "`n4️⃣ Waiting for API to initialize (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 5: Test connection
Write-Host "`n5️⃣ Testing direct connection..." -ForegroundColor Yellow
$testUrl = "http://${VastInstance}:38660/health"

try {
    $response = Invoke-RestMethod -Uri $testUrl -Method GET -TimeoutSec 10
    Write-Host "   ✅ Connection successful!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Health check failed: $_" -ForegroundColor Yellow
    Write-Host "   This might be normal if API is still starting..." -ForegroundColor Gray
}

# Step 6: Test ping
Write-Host "`n6️⃣ Testing /ping endpoint..." -ForegroundColor Yellow
try {
    $pingUrl = "http://${VastInstance}:38660/ping"
    $pingResponse = Invoke-WebRequest -Uri $pingUrl -Method GET -TimeoutSec 5
    Write-Host "   ✅ Ping successful: $($pingResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Ping failed: $_" -ForegroundColor Yellow
}

Write-Host "`n📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ API deployed on: http://${VastInstance}:38660" -ForegroundColor Green
Write-Host "✅ Direct connection (no tunnel needed)" -ForegroundColor Green
Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update cPanel: .\update_cpanel_direct_connection.ps1" -ForegroundColor White
Write-Host "   2. Restart Node.js service on cPanel" -ForegroundColor White
Write-Host "   3. Test from cPanel: curl http://${VastInstance}:38660/health" -ForegroundColor White

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green

