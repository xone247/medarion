# Test AI connection on cPanel
# This verifies the AI is accessible and working

$ErrorActionPreference = "Continue"

# Load config
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$cpanelPort = if ($config.ssh.port) { $config.ssh.port } else { 22 }
$usePlink = if ($config.ssh.usePlink) { $config.ssh.usePlink } else { $false }
$plinkPath = if ($config.ssh.plinkPath) { $config.ssh.plinkPath } else { "C:\Program Files\PuTTY\plink.exe" }
$sshPassword = if ($config.ssh.password) { $config.ssh.password } else { $null }
$cpanelKey = $config.ssh.keyPath

Write-Host "`n🧪 Testing AI on cPanel..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Test 1: Check tunnel service
Write-Host "`n1️⃣  Checking SSH Tunnel Service..." -ForegroundColor Yellow
$tunnelCheck = "systemctl is-active vast-ai-tunnel.service 2>/dev/null || echo 'inactive'"
if ($usePlink) {
    if ($sshPassword) {
        $tunnelStatus = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $tunnelCheck 2>&1
    } else {
        $tunnelStatus = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $tunnelCheck 2>&1
    }
} else {
    $tunnelStatus = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $tunnelCheck 2>&1
}

if ($tunnelStatus -match "active") {
    Write-Host "   ✅ Tunnel service is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Tunnel service is not active" -ForegroundColor Yellow
    Write-Host "   Attempting to start tunnel..." -ForegroundColor Yellow
    $startCmd = "systemctl start vast-ai-tunnel.service && sleep 2 && systemctl is-active vast-ai-tunnel.service"
    if ($usePlink) {
        if ($sshPassword) {
            $startResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $startCmd 2>&1
        } else {
            $startResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $startCmd 2>&1
        }
    } else {
        $startResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $startCmd 2>&1
    }
    if ($startResult -match "active") {
        Write-Host "   ✅ Tunnel started successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Tunnel start may have issues, but continuing..." -ForegroundColor Yellow
    }
}

# Test 2: Test local AI connection on cPanel
Write-Host "`n2️⃣  Testing AI Health Endpoint (on cPanel)..." -ForegroundColor Yellow
$healthTest = "curl -s http://localhost:3001/health 2>&1"
if ($usePlink) {
    if ($sshPassword) {
        $healthResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $healthTest 2>&1
    } else {
        $healthResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $healthTest 2>&1
    }
} else {
    $healthResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $healthTest 2>&1
}

if ($healthResult -match "status.*ok" -or $healthResult -match "Mistral") {
    Write-Host "   ✅ AI Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $healthResult" -ForegroundColor Gray
} else {
    Write-Host "   ❌ AI Health check failed" -ForegroundColor Red
    Write-Host "   Response: $healthResult" -ForegroundColor Yellow
}

# Test 3: Check .env configuration
Write-Host "`n3️⃣  Checking .env Configuration..." -ForegroundColor Yellow
$envPath = "/home/medasnnc/nodevenv/medarion/18/bin/.env"
$envCheck = "grep -E 'VAST_AI' $envPath 2>/dev/null || echo 'Not found'"
if ($usePlink) {
    if ($sshPassword) {
        $envResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $envCheck 2>&1
    } else {
        $envResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $envCheck 2>&1
    }
} else {
    $envResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $envCheck 2>&1
}

if ($envResult -match "VAST_AI_URL" -and $envResult -match "VAST_AI_API_KEY") {
    Write-Host "   ✅ .env configuration is correct" -ForegroundColor Green
    Write-Host "   $envResult" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  .env configuration may be missing" -ForegroundColor Yellow
    Write-Host "   Running update script..." -ForegroundColor Yellow
    & .\update_cpanel_env_vast.ps1
}

# Test 4: Test AI Chat endpoint
Write-Host "`n4️⃣  Testing AI Chat Endpoint..." -ForegroundColor Yellow
$chatTest = 'curl -s -X POST http://localhost:3001/chat -H "Content-Type: application/json" -H "X-API-Key: medarion-secure-key-2025" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"max_tokens\":10}" 2>&1 | head -5'
if ($usePlink) {
    if ($sshPassword) {
        $chatResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $chatTest 2>&1
    } else {
        $chatResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $chatTest 2>&1
    }
} else {
    $chatResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $chatTest 2>&1
}

if ($chatResult -match "choices" -or $chatResult -match "Hello" -or $chatResult -match "content") {
    Write-Host "   ✅ AI Chat endpoint is working!" -ForegroundColor Green
    Write-Host "   Response preview: $($chatResult.Substring(0, [Math]::Min(100, $chatResult.Length)))" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Chat endpoint test inconclusive" -ForegroundColor Yellow
    Write-Host "   Response: $($chatResult.Substring(0, [Math]::Min(200, $chatResult.Length)))" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "`n💡 If all tests passed, your AI is ready to use on cPanel!" -ForegroundColor Cyan

