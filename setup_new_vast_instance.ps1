# Setup New Vast.ai PyTorch Instance
# Instance: 27844189
# SSH Port: 44939 (22/tcp mapped)
# Port Range: 44033-44939
# API Port: 44050 (in allowed range)

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Setting Up New Vast.ai Instance" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
$vastHost = "ssh1.vast.ai"
$vastSSHPort = 44939  # SSH port from instance info
$apiPort = 44050      # Public port for API (in range 44033-44939)

if (-not (Test-Path $vastKey)) {
    Write-Host "`n❌ SSH key not found: $vastKey" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Instance Info:" -ForegroundColor Yellow
Write-Host "   Instance ID: 27844189" -ForegroundColor Gray
Write-Host "   SSH Port: $vastSSHPort" -ForegroundColor Gray
Write-Host "   API Port: $apiPort" -ForegroundColor Gray
Write-Host "   Port Range: 44033-44939" -ForegroundColor Gray

# Step 1: Upload files
Write-Host "`n[1/5] Uploading files..." -ForegroundColor Yellow
try {
    scp -i $vastKey -P $vastSSHPort "run_api_on_vast.py" "root@${vastHost}:/workspace/run_api_on_vast.py" 2>&1 | Out-Null
    scp -i $vastKey -P $vastSSHPort "install_vast_dependencies.sh" "root@${vastHost}:/workspace/install_vast_dependencies.sh" 2>&1 | Out-Null
    Write-Host "   ✅ Files uploaded" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Make install script executable
Write-Host "`n[2/5] Making install script executable..." -ForegroundColor Yellow
$chmodResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" "chmod +x /workspace/install_vast_dependencies.sh" 2>&1
Write-Host "   ✅ Script is executable" -ForegroundColor Green

# Step 3: Install dependencies
Write-Host "`n[3/5] Installing dependencies (this may take a while)..." -ForegroundColor Yellow
Write-Host "   This will install: PyTorch, Flask, Transformers" -ForegroundColor Gray
$installResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" "cd /workspace && bash install_vast_dependencies.sh" 2>&1
Write-Host $installResult -ForegroundColor White

# Step 4: Verify model directory exists
Write-Host "`n[4/5] Checking model directory..." -ForegroundColor Yellow
$modelCheck = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" "if [ -d '/workspace/model_api/extracted' ]; then echo '✅ Model directory exists'; ls -la /workspace/model_api/extracted | head -5; else echo '⚠️  Model directory not found - you need to download and extract the model'; fi" 2>&1
Write-Host $modelCheck -ForegroundColor White

# Step 5: Start API
Write-Host "`n[5/5] Starting API on port $apiPort..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 3 && ps aux | grep 'python3.*run_api_on_vast.py' | grep -v grep"
$startResult = ssh -i $vastKey -p $vastSSHPort "root@${vastHost}" $startCmd 2>&1

if ($startResult -match "python3.*run_api_on_vast") {
    Write-Host "   ✅ API is running!" -ForegroundColor Green
    Write-Host "`n🧪 Testing API..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    
    # Test via SSH tunnel (we'll need to set up tunnel first)
    Write-Host "   💡 To test, set up SSH tunnel:" -ForegroundColor Yellow
    Write-Host "      ssh -i `"$vastKey`" -p $vastSSHPort -L 8081:localhost:$apiPort root@${vastHost} -N" -ForegroundColor White
} else {
    Write-Host "   ⚠️  API may not have started" -ForegroundColor Yellow
    Write-Host "   Check logs: ssh -i `"$vastKey`" -p $vastSSHPort root@${vastHost} 'tail -30 /workspace/api.log'" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Download and extract your fine-tuned Medarion model to /workspace/model_api/extracted" -ForegroundColor White
Write-Host "   2. Set up SSH tunnel for local testing" -ForegroundColor White
Write-Host "   3. Update server/.env with VAST_AI_URL=http://localhost:8081" -ForegroundColor White
Write-Host "   4. Test the AI connection" -ForegroundColor White

