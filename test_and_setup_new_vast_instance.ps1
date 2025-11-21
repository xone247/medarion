# Test SSH and Setup AI on New Vast.ai Instance
# Instance: 93.91.156.91 via ssh1.vast.ai:31216

param(
    [string]$VastHost = "ssh1.vast.ai",
    [string]$VastPort = "31216",
    [string]$VastIP = "93.91.156.91",
    [string]$SSHKey = "$env:USERPROFILE\.ssh\id_ed25519_vast",
    [string]$APIPort = "3001"
)

Write-Host "`n🧪 Testing SSH Connection to New Vast.ai Instance..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Configuration
Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Host: $VastHost" -ForegroundColor Gray
Write-Host "   Port: $VastPort" -ForegroundColor Gray
Write-Host "   IP: $VastIP" -ForegroundColor Gray
Write-Host "   API Port: $APIPort" -ForegroundColor Gray

# Check SSH key
$useKey = $false
if (Test-Path $SSHKey) {
    Write-Host "`n✅ SSH key found: $SSHKey" -ForegroundColor Green
    $useKey = $true
} else {
    Write-Host "`n⚠️  SSH key not found: $SSHKey" -ForegroundColor Yellow
    Write-Host "   Will try password authentication" -ForegroundColor Gray
}

# Test 1: Basic SSH connection
Write-Host "`n🔍 Test 1: Basic SSH Connection..." -ForegroundColor Yellow
try {
    if ($useKey) {
        $testCmd = "ssh -i `"$SSHKey`" -p $VastPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@$VastHost 'echo \"SSH connection successful\"'"
    } else {
        $testCmd = "ssh -p $VastPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@$VastHost 'echo \"SSH connection successful\"'"
    }
    
    $result = Invoke-Expression $testCmd 2>&1
    if ($LASTEXITCODE -eq 0 -or $result -match "successful") {
        Write-Host "✅ SSH connection works!" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH connection failed" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SSH test failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Check Python and dependencies
Write-Host "`n🔍 Test 2: Checking Python Environment..." -ForegroundColor Yellow
$checkPython = "python3 --version && pip3 --version && echo '---' && pip3 list | grep -E '(torch|transformers|flask)' | head -5"
if ($useKey) {
    $pythonCheck = ssh -i "$SSHKey" -p $VastPort root@$VastHost $checkPython 2>&1
} else {
    $pythonCheck = ssh -p $VastPort root@$VastHost $checkPython 2>&1
}
Write-Host $pythonCheck

# Test 3: Check workspace directory
Write-Host "`n🔍 Test 3: Checking Workspace..." -ForegroundColor Yellow
$checkWorkspace = "ls -la /workspace 2>&1 | head -10"
if ($useKey) {
    $workspaceCheck = ssh -i "$SSHKey" -p $VastPort root@$VastHost $checkWorkspace 2>&1
} else {
    $workspaceCheck = ssh -p $VastPort root@$VastHost $checkWorkspace 2>&1
}
Write-Host $workspaceCheck

# Upload run_api_on_vast.py
Write-Host "`n📤 Uploading run_api_on_vast.py..." -ForegroundColor Yellow
if (-not (Test-Path "run_api_on_vast.py")) {
    Write-Host "❌ run_api_on_vast.py not found in current directory" -ForegroundColor Red
    exit 1
}

try {
    if ($useKey) {
        scp -i "$SSHKey" -P $VastPort "run_api_on_vast.py" "root@${VastHost}:/workspace/run_api_on_vast.py"
    } else {
        scp -P $VastPort "run_api_on_vast.py" "root@${VastHost}:/workspace/run_api_on_vast.py"
    }
    Write-Host "✅ File uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Upload failed: $_" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing Python Dependencies..." -ForegroundColor Yellow
$installCmd = "cd /workspace && pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors 2>&1 | tail -10"
if ($useKey) {
    $installOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $installCmd
} else {
    $installOutput = ssh -p $VastPort root@$VastHost $installCmd
}
Write-Host $installOutput

# Configure port
Write-Host "`n🔧 Configuring API Port ($APIPort)..." -ForegroundColor Yellow
$configCmd = "cd /workspace && sed -i 's/PORT = [0-9]*/PORT = $APIPort/' run_api_on_vast.py && grep 'PORT = ' run_api_on_vast.py"
if ($useKey) {
    $configOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $configCmd
} else {
    $configOutput = ssh -p $VastPort root@$VastHost $configCmd
}
Write-Host $configOutput

# Stop any existing API
Write-Host "`n🛑 Stopping Existing API (if running)..." -ForegroundColor Yellow
$stopCmd = "pkill -f 'python3 run_api_on_vast.py' 2>/dev/null || true && sleep 2 && ps aux | grep 'run_api_on_vast' | grep -v grep || echo 'No existing process'"
if ($useKey) {
    $stopOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $stopCmd
} else {
    $stopOutput = ssh -p $VastPort root@$VastHost $stopCmd
}
Write-Host $stopOutput

# Start API
Write-Host "`n🚀 Starting API..." -ForegroundColor Yellow
$startCmd = "cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 & sleep 5 && ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep"
if ($useKey) {
    $startOutput = ssh -i "$SSHKey" -p $VastPort root@$VastHost $startCmd
} else {
    $startOutput = ssh -p $VastPort root@$VastHost $startCmd
}
Write-Host $startOutput

if ($startOutput -match "python3") {
    Write-Host "✅ API process started!" -ForegroundColor Green
} else {
    Write-Host "⚠️  API may not have started. Checking logs..." -ForegroundColor Yellow
    $logCmd = "tail -30 /workspace/api.log"
    if ($useKey) {
        $logs = ssh -i "$SSHKey" -p $VastPort root@$VastHost $logCmd
    } else {
        $logs = ssh -p $VastPort root@$VastHost $logCmd
    }
    Write-Host $logs
}

# Wait for API to initialize
Write-Host "`n⏳ Waiting for API to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test API locally on instance
Write-Host "`n🧪 Test 4: Testing API on Instance..." -ForegroundColor Yellow
$testLocalCmd = "curl -s http://localhost:$APIPort/health 2>&1"
if ($useKey) {
    $localTest = ssh -i "$SSHKey" -p $VastPort root@$VastHost $testLocalCmd
} else {
    $localTest = ssh -p $VastPort root@$VastHost $testLocalCmd
}
Write-Host $localTest

if ($localTest -match "ok" -or $localTest -match "status") {
    Write-Host "✅ API is responding on instance!" -ForegroundColor Green
} else {
    Write-Host "⚠️  API may not be ready yet. Check logs:" -ForegroundColor Yellow
    $logCmd = "tail -20 /workspace/api.log"
    if ($useKey) {
        $logs = ssh -i "$SSHKey" -p $VastPort root@$VastHost $logCmd
    } else {
        $logs = ssh -p $VastPort root@$VastHost $logCmd
    }
    Write-Host $logs
}

# Test API from external IP
Write-Host "`n🧪 Test 5: Testing External Connection..." -ForegroundColor Yellow
try {
    $externalTest = Invoke-RestMethod -Uri "http://${VastIP}:${APIPort}/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ External connection works!" -ForegroundColor Green
    Write-Host ($externalTest | ConvertTo-Json)
} catch {
    Write-Host "⚠️  External connection test: $_" -ForegroundColor Yellow
    Write-Host "   This might be normal if port range -1--1 doesn't mean all ports are open" -ForegroundColor Gray
    Write-Host "   Try using SSH tunnel instead" -ForegroundColor Gray
}

# Summary
Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "`n📋 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ SSH connection: Working" -ForegroundColor Green
Write-Host "   ✅ File uploaded: run_api_on_vast.py" -ForegroundColor Green
Write-Host "   ✅ API port: $APIPort" -ForegroundColor Green
Write-Host "`n🔗 Connection URLs:" -ForegroundColor Cyan
Write-Host "   Local (on instance): http://localhost:$APIPort" -ForegroundColor White
Write-Host "   External: http://${VastIP}:${APIPort}" -ForegroundColor White
Write-Host "`n🧪 Test Commands:" -ForegroundColor Cyan
Write-Host "   curl http://${VastIP}:${APIPort}/health" -ForegroundColor White
Write-Host "   curl http://${VastIP}:${APIPort}/ping" -ForegroundColor White
Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. If external connection works, update cPanel:" -ForegroundColor White
Write-Host "      VAST_AI_URL=http://${VastIP}:${APIPort}" -ForegroundColor Cyan
Write-Host "   2. If external doesn't work, use SSH tunnel:" -ForegroundColor White
Write-Host "      ssh -p $VastPort root@$VastHost -L 8080:localhost:$APIPort -N -f" -ForegroundColor Cyan
Write-Host "      Then use: VAST_AI_URL=http://localhost:8080" -ForegroundColor Cyan

