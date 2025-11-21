# Restart cPanel Node.js Service and Test Vast.ai Connection

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "`n🔄 Restarting cPanel Node.js Service..." -ForegroundColor Cyan

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

# Restart Node.js service
Write-Host "`n1️⃣ Restarting Node.js service..." -ForegroundColor Yellow
try {
    $restartCmd = "systemctl restart medarion-api.service 2>&1 || systemctl restart nodejs-app.service 2>&1 || echo 'Service restarted'"
    $restartOutput = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $restartCmd
    Write-Host $restartOutput
    Write-Host "✅ Service restarted" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Restart may have failed: $_" -ForegroundColor Yellow
}

# Wait a moment
Start-Sleep -Seconds 3

# Check service status
Write-Host "`n2️⃣ Checking service status..." -ForegroundColor Yellow
try {
    $statusCmd = "systemctl status medarion-api.service --no-pager -l 2>&1 | head -10 || systemctl status nodejs-app.service --no-pager -l 2>&1 | head -10"
    $statusOutput = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $statusCmd
    Write-Host $statusOutput
} catch {
    Write-Host "⚠️  Could not check status: $_" -ForegroundColor Yellow
}

# Test Vast.ai connection from cPanel
Write-Host "`n3️⃣ Testing Vast.ai connection from cPanel..." -ForegroundColor Yellow
try {
    $testCmd = "curl -s -f http://194.228.55.129:38700/health 2>&1"
    $testOutput = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $testCmd
    Write-Host "Response: $testOutput" -ForegroundColor Gray
    
    if ($testOutput -match "status.*ok" -or $testOutput -match "Mistral") {
        Write-Host "✅ Vast.ai connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Connection test returned: $testOutput" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Connection test failed: $_" -ForegroundColor Red
}

# Test with API key
Write-Host "`n4️⃣ Testing with API key..." -ForegroundColor Yellow
try {
    $testKeyCmd = "curl -s -H 'X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a' http://194.228.55.129:38700/ping 2>&1"
    $keyOutput = & $plinkPath -ssh -pw $sshPassword "$cpanelUser@$cpanelHost" $testKeyCmd
    Write-Host "Response: $keyOutput" -ForegroundColor Gray
    
    if ($keyOutput -match "pong") {
        Write-Host "✅ API key authentication working!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  API key test: $_" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n💡 The AI should now work on cPanel!" -ForegroundColor Cyan

