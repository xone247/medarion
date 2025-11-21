# Setup API on New Vast.ai Instance (93.91.156.91)
# This script uploads and configures the API on the new instance

param(
    [string]$VastInstance = "ssh1.vast.ai",
    [string]$VastSSHPort = "31216",
    [string]$VastSSHKey = "$env:USERPROFILE\.ssh\vast_ai_key",
    [string]$UseDirect = $true
)

Write-Host "`n🚀 Setting up API on New Vast.ai Instance..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check SSH key
if (-not (Test-Path $VastSSHKey)) {
    Write-Host "`n❌ SSH key not found: $VastSSHKey" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Instance: $VastInstance" -ForegroundColor Gray
Write-Host "   SSH Port: $VastSSHPort" -ForegroundColor Gray
Write-Host "   Connection: $(if ($UseDirect) { 'Direct (93.91.156.91:3001)' } else { 'Tunnel (localhost:8080)' })" -ForegroundColor Gray

# Determine port
$apiPort = if ($UseDirect) { 3001 } else { 8080 }
Write-Host "   API Port: $apiPort" -ForegroundColor Gray

# Upload file
Write-Host "`n📤 Uploading run_api_on_vast.py..." -ForegroundColor Yellow
try {
    scp -i $VastSSHKey -P $VastSSHPort "run_api_on_vast.py" "root@${VastInstance}:/workspace/run_api_on_vast.py"
    Write-Host "✅ Uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Upload failed: $_" -ForegroundColor Red
    exit 1
}

# Setup commands
Write-Host "`n🔧 Setting up API..." -ForegroundColor Yellow
$setupCmd = @"
cd /workspace
pkill -f run_api_on_vast.py 2>/dev/null || true
sleep 2
sed -i 's/PORT = [0-9]*/PORT = $apiPort/' run_api_on_vast.py
grep 'PORT = ' run_api_on_vast.py
"@

try {
    $setupOutput = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $setupCmd
    Write-Host $setupOutput
} catch {
    Write-Host "⚠️  Setup warning: $_" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
$installCmd = "pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors 2>&1 | tail -3"
$installOutput = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $installCmd
Write-Host $installOutput

# Start API
Write-Host "`n🚀 Starting API..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 3 && ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep"
$startOutput = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance $startCmd
Write-Host $startOutput

if ($startOutput -match "python3") {
    Write-Host "✅ API started!" -ForegroundColor Green
} else {
    Write-Host "⚠️  API may not have started. Check logs:" -ForegroundColor Yellow
    $logs = ssh -i $VastSSHKey -p $VastSSHPort root@$VastInstance "tail -20 /workspace/api.log"
    Write-Host $logs
}

# Test connection
Write-Host "`n🧪 Testing connection..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

if ($UseDirect) {
    $testUrl = "http://93.91.156.91:$apiPort/health"
} else {
    $testUrl = "http://localhost:$apiPort/health"
}

try {
    $response = Invoke-RestMethod -Uri $testUrl -TimeoutSec 10
    Write-Host "✅ Connection successful!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "⚠️  Connection test: $_" -ForegroundColor Yellow
    if ($UseDirect) {
        Write-Host "   Direct connection failed. Try using tunnel instead." -ForegroundColor Gray
    }
}

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
if ($UseDirect) {
    Write-Host "   1. Test: curl http://93.91.156.91:$apiPort/health" -ForegroundColor White
    Write-Host "   2. Update cPanel: VAST_AI_URL=http://93.91.156.91:$apiPort" -ForegroundColor White
} else {
    Write-Host "   1. Start tunnel: ssh -p $VastSSHPort root@$VastInstance -L 8080:localhost:8080 -N -f" -ForegroundColor White
    Write-Host "   2. Test: curl http://localhost:8080/health" -ForegroundColor White
    Write-Host "   3. Update cPanel: VAST_AI_URL=http://localhost:8080" -ForegroundColor White
}

