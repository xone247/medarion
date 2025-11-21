# Complete Setup for New Vast.ai Instance
# Downloads model from S3, extracts, and configures API for public access

param(
    [string]$VastHost = "ssh1.vast.ai",
    [string]$VastPort = "31216",
    [string]$VastIP = "93.91.156.91",
    [string]$SSHKey = "$env:USERPROFILE\.ssh\id_ed25519_vast",
    [string]$APIPort = "3001"
)

Write-Host "`n🚀 Complete Vast.ai Instance Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "`nThis will:" -ForegroundColor Yellow
Write-Host "  1. Test SSH connection" -ForegroundColor White
Write-Host "  2. Upload run_api_on_vast.py" -ForegroundColor White
Write-Host "  3. Install Python dependencies" -ForegroundColor White
Write-Host "  4. Download model from S3" -ForegroundColor White
Write-Host "  5. Extract model" -ForegroundColor White
Write-Host "  6. Configure API for public access" -ForegroundColor White
Write-Host "  7. Start API" -ForegroundColor White
Write-Host "  8. Test public access" -ForegroundColor White

# Check SSH key
if (-not (Test-Path $SSHKey)) {
    Write-Host "`n❌ SSH key not found: $SSHKey" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Using SSH key: $SSHKey" -ForegroundColor Green

# Step 1: Test SSH
Write-Host "`n[1/8] Testing SSH Connection..." -ForegroundColor Yellow
try {
    $testResult = ssh -i "$SSHKey" -p $VastPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@$VastHost "echo 'SSH OK' && python3 --version && aws --version 2>&1 || echo 'AWS CLI not installed'" 2>&1
    if ($testResult -match "SSH OK" -or $testResult -match "Python") {
        Write-Host "   ✅ SSH connection successful" -ForegroundColor Green
        Write-Host $testResult
    } else {
        Write-Host "   ⚠️  Connection: $testResult" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ SSH test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Upload run_api_on_vast.py
Write-Host "`n[2/8] Uploading run_api_on_vast.py..." -ForegroundColor Yellow
if (-not (Test-Path "run_api_on_vast.py")) {
    Write-Host "   ❌ File not found!" -ForegroundColor Red
    exit 1
}

try {
    scp -i "$SSHKey" -P $VastPort "run_api_on_vast.py" "root@${VastHost}:/workspace/run_api_on_vast.py" 2>&1 | Out-Null
    Write-Host "   ✅ File uploaded" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Upload: $_" -ForegroundColor Yellow
}

# Step 3: Install dependencies
Write-Host "`n[3/8] Installing Python Dependencies..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray
$installCmd = @"
cd /workspace && \
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors boto3 2>&1 | tail -5
"@

try {
    $installOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $installCmd 2>&1
    Write-Host $installOutput
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Installation: $_" -ForegroundColor Yellow
}

# Step 4: Install AWS CLI (if needed)
Write-Host "`n[4/8] Checking AWS CLI..." -ForegroundColor Yellow
$checkAwsCmd = "which aws || (apt-get update && apt-get install -y awscli)"
try {
    $awsCheck = ssh -i "$SSHKey" -p $VastPort root@$VastHost $checkAwsCmd 2>&1
    Write-Host "   ✅ AWS CLI ready" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  AWS CLI: $_" -ForegroundColor Yellow
}

# Step 5: Download model from S3
Write-Host "`n[5/8] Downloading Model from S3..." -ForegroundColor Yellow
Write-Host "   This will take 10-20 minutes depending on connection..." -ForegroundColor Gray

$downloadModelCmd = @"
cd /workspace && \
mkdir -p model_api && \
cd model_api && \
if [ -f "medarion-final-model.tar.gz" ]; then
    echo "Model file already exists, skipping download"
    ls -lh medarion-final-model.tar.gz
else
    echo "Downloading model from S3..."
    aws s3 cp s3://medarion7b-model-2025-ue2/medarion-final-model.tar.gz . --region us-east-2 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Download complete"
        ls -lh medarion-final-model.tar.gz
    else
        echo "❌ Download failed"
        exit 1
    fi
fi
"@

try {
    Write-Host "   Downloading..." -ForegroundColor Gray
    $downloadOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $downloadModelCmd 2>&1
    Write-Host $downloadOutput
    
    if ($downloadOutput -match "Download complete" -or $downloadOutput -match "already exists") {
        Write-Host "   ✅ Model download ready" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Check download status above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Download failed: $_" -ForegroundColor Red
    Write-Host "   You may need to configure AWS credentials" -ForegroundColor Yellow
}

# Step 6: Extract model
Write-Host "`n[6/8] Extracting Model..." -ForegroundColor Yellow
Write-Host "   This will take 5-10 minutes..." -ForegroundColor Gray

$extractModelCmd = @"
cd /workspace/model_api && \
if [ -d "extracted" ] && [ "$(ls -A extracted 2>/dev/null)" ]; then
    echo "Model already extracted"
    ls -lh extracted/ | head -5
else
    echo "Extracting model..."
    mkdir -p extracted && \
    tar -xzf medarion-final-model.tar.gz -C extracted --strip-components=1 2>&1 | tail -5
    if [ $? -eq 0 ]; then
        echo "✅ Extraction complete"
        ls -lh extracted/ | head -5
        du -sh extracted/
    else
        echo "❌ Extraction failed"
        exit 1
    fi
fi
"@

try {
    Write-Host "   Extracting..." -ForegroundColor Gray
    $extractOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $extractModelCmd 2>&1
    Write-Host $extractOutput
    
    if ($extractOutput -match "Extraction complete" -or $extractOutput -match "already extracted") {
        Write-Host "   ✅ Model extracted" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Check extraction status above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Extraction failed: $_" -ForegroundColor Red
}

# Step 7: Configure and start API
Write-Host "`n[7/8] Configuring and Starting API..." -ForegroundColor Yellow

# Configure port
$configCmd = "cd /workspace && sed -i 's/PORT = [0-9]*/PORT = $APIPort/' run_api_on_vast.py && grep 'PORT = ' run_api_on_vast.py"
try {
    $configOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $configCmd 2>&1
    Write-Host "   Port configured: $configOutput" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Configuration: $_" -ForegroundColor Yellow
}

# Stop existing API
Write-Host "   Stopping existing API..." -ForegroundColor Gray
$stopCmd = "pkill -f 'python3 run_api_on_vast.py' 2>/dev/null || true && sleep 2"
ssh -i "$SSHKey" -p $VastPort root@$VastHost $stopCmd 2>&1 | Out-Null

# Start API
Write-Host "   Starting API..." -ForegroundColor Gray
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 5 && ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep"
try {
    $startOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $startCmd 2>&1
    Write-Host $startOutput
    
    if ($startOutput -match "python3") {
        Write-Host "   ✅ API started!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API may not have started. Checking logs..." -ForegroundColor Yellow
        $logCmd = "tail -30 /workspace/api.log"
        $logs = ssh -i "$SSHKey" -p $VastPort root@$VastHost $logCmd 2>&1
        Write-Host $logs
    }
} catch {
    Write-Host "   ❌ Start failed: $_" -ForegroundColor Red
}

# Step 8: Test API
Write-Host "`n[8/8] Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test locally on instance
Write-Host "   Testing on instance..." -ForegroundColor Gray
$testLocalCmd = "curl -s http://localhost:$APIPort/health 2>&1"
try {
    $localTest = ssh -i "$SSHKey" -p $VastPort root@$VastHost $testLocalCmd 2>&1
    Write-Host $localTest
    if ($localTest -match "ok" -or $localTest -match "status") {
        Write-Host "   ✅ API responding on instance!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Local test: $_" -ForegroundColor Yellow
}

# Test external/public access
Write-Host "   Testing public access..." -ForegroundColor Gray
try {
    $externalTest = Invoke-RestMethod -Uri "http://${VastIP}:${APIPort}/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Public access works!" -ForegroundColor Green
    Write-Host ($externalTest | ConvertTo-Json)
} catch {
    Write-Host "   ⚠️  Public test: $_" -ForegroundColor Yellow
    Write-Host "   This might be normal if port range -1--1 doesn't mean all ports are open" -ForegroundColor Gray
    Write-Host "   Try testing from your browser: http://${VastIP}:${APIPort}/health" -ForegroundColor Cyan
}

# Summary
Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "`n📋 Connection Info:" -ForegroundColor Yellow
Write-Host "   Instance: $VastHost:$VastPort" -ForegroundColor White
Write-Host "   Public IP: $VastIP" -ForegroundColor White
Write-Host "   API Port: $APIPort" -ForegroundColor White
Write-Host "`n🔗 URLs:" -ForegroundColor Yellow
Write-Host "   Health: http://${VastIP}:${APIPort}/health" -ForegroundColor Cyan
Write-Host "   Ping: http://${VastIP}:${APIPort}/ping" -ForegroundColor Cyan
Write-Host "`n📝 Next: Update cPanel Configuration" -ForegroundColor Yellow
Write-Host "   Run: .\update_cpanel_direct_connection.ps1" -ForegroundColor Cyan
Write-Host "   Or manually set: VAST_AI_URL=http://${VastIP}:${APIPort}" -ForegroundColor Gray

