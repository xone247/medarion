# Verify Vast.ai Tunnel on cPanel
# Tests all endpoints to ensure everything is working

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "`n🧪 Verifying Vast.ai Tunnel on cPanel..." -ForegroundColor Cyan

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$sshPassword = $config.ssh.password

$plinkPath = "C:\Program Files\PuTTY\plink.exe"

Write-Host "`n📋 Testing Connection..." -ForegroundColor Yellow

# Test 1: Check if tunnel process is running
Write-Host "`n1️⃣ Checking tunnel process..." -ForegroundColor Cyan
$checkTunnel = "ps aux | grep 'ssh.*ssh2.vast.ai.*8081:localhost:3001' | grep -v grep"
try {
    $tunnelStatus = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $checkTunnel
    if ($tunnelStatus) {
        Write-Host "   ✅ Tunnel process is running" -ForegroundColor Green
        Write-Host "   $tunnelStatus" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Tunnel process not found" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Could not check tunnel status: $_" -ForegroundColor Yellow
}

# Test 2: Check if SSH key exists
Write-Host "`n2️⃣ Checking SSH key..." -ForegroundColor Cyan
$checkKey = "test -f /root/.ssh/vast_ai_key && echo 'exists' || echo 'missing'"
try {
    $keyStatus = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $checkKey
    if ($keyStatus -match "exists") {
        Write-Host "   ✅ SSH key found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ SSH key missing - need to upload it" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Could not check SSH key: $_" -ForegroundColor Yellow
}

# Test 3: Test health endpoint
Write-Host "`n3️⃣ Testing /health endpoint..." -ForegroundColor Cyan
$testHealth = "curl -s -f http://localhost:8081/health"
try {
    $healthResponse = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $testHealth
    if ($healthResponse) {
        Write-Host "   ✅ Health check successful!" -ForegroundColor Green
        Write-Host "   Response: $healthResponse" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Health check error: $_" -ForegroundColor Red
}

# Test 4: Test ping endpoint
Write-Host "`n4️⃣ Testing /ping endpoint..." -ForegroundColor Cyan
$testPing = "curl -s -f http://localhost:8081/ping"
try {
    $pingResponse = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $testPing
    if ($pingResponse -eq "pong") {
        Write-Host "   ✅ Ping successful!" -ForegroundColor Green
        Write-Host "   Response: $pingResponse" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Ping response: $pingResponse" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Ping error: $_" -ForegroundColor Red
}

# Test 5: Check port 8081
Write-Host "`n5️⃣ Checking port 8081..." -ForegroundColor Cyan
$checkPort = "netstat -tuln | grep ':8081' || ss -tuln | grep ':8081'"
try {
    $portStatus = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $checkPort
    if ($portStatus) {
        Write-Host "   ✅ Port 8081 is listening" -ForegroundColor Green
        Write-Host "   $portStatus" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Port 8081 is not listening" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Could not check port: $_" -ForegroundColor Yellow
}

Write-Host "`n📊 Verification Complete!" -ForegroundColor Cyan

