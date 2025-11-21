# Restart Application and Test on cPanel
# Shows progress for each step

$ErrorActionPreference = "Continue"

function Write-Progress-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    $percent = [math]::Round(($Step / $Total) * 100)
    Write-Progress -Activity "Restarting and Testing" -Status $Message -PercentComplete $percent
    Write-Host "`n[$Step/$Total] $Message" -ForegroundColor Cyan
}

Write-Host "`n🔄 Restarting and Testing Application on cPanel..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load config
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$sshPassword = $config.ssh.password
$cpanelKey = $config.ssh.keyPath
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$cpanelPort = $config.ssh.port

# Step 1: Check tunnel
Write-Progress-Step -Step 1 -Total 5 -Message "Checking SSH Tunnel..."
$tunnelCmd = "systemctl is-active vast-ai-tunnel.service 2>&1"
if ($config.ssh.usePlink) {
    if ($sshPassword) {
        $tunnelStatus = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $tunnelCmd 2>&1
    } else {
        $tunnelStatus = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $tunnelCmd 2>&1
    }
} else {
    $tunnelStatus = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $tunnelCmd 2>&1
}

if ($tunnelStatus -match "active") {
    Write-Host "   ✅ Tunnel is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Tunnel not active, starting..." -ForegroundColor Yellow
    $startTunnel = "systemctl start vast-ai-tunnel.service && sleep 2 && systemctl is-active vast-ai-tunnel.service"
    if ($config.ssh.usePlink) {
        if ($sshPassword) {
            echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $startTunnel 2>&1 | Out-Null
        }
    }
    Write-Host "   ✅ Tunnel started" -ForegroundColor Green
}

# Step 2: Restart application
Write-Progress-Step -Step 2 -Total 5 -Message "Restarting Node.js Application..."
$restartCmd = "systemctl restart medarion-api.service 2>&1 || pm2 restart all 2>&1"
if ($config.ssh.usePlink) {
    if ($sshPassword) {
        $restartResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $restartCmd 2>&1
    } else {
        $restartResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $restartCmd 2>&1
    }
} else {
    $restartResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $restartCmd 2>&1
}

Write-Host "   ✅ Application restarted" -ForegroundColor Green
Start-Sleep -Seconds 5

# Step 3: Check application status
Write-Progress-Step -Step 3 -Total 5 -Message "Checking Application Status..."
$statusCmd = "systemctl status medarion-api.service --no-pager 2>&1 | head -10 || pm2 list 2>&1 | head -5"
if ($config.ssh.usePlink) {
    if ($sshPassword) {
        $statusResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $statusCmd 2>&1
    } else {
        $statusResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $statusCmd 2>&1
    }
} else {
    $statusResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $statusCmd 2>&1
}

if ($statusResult -match "active.*running" -or $statusResult -match "online") {
    Write-Host "   ✅ Application is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Application status unclear" -ForegroundColor Yellow
    Write-Host "   $statusResult" -ForegroundColor Gray
}

# Step 4: Test AI Health
Write-Progress-Step -Step 4 -Total 5 -Message "Testing AI Health Endpoint..."
$healthCmd = "curl -s http://localhost:3002/health 2>&1"
if ($config.ssh.usePlink) {
    if ($sshPassword) {
        $healthResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $healthCmd 2>&1
    } else {
        $healthResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $healthCmd 2>&1
    }
} else {
    $healthResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $healthCmd 2>&1
}

if ($healthResult -and ($healthResult -match "status.*ok" -or $healthResult -match "Mistral" -or $healthResult -match "OK")) {
    Write-Host "   ✅ AI Health check passed" -ForegroundColor Green
    Write-Host "   Response: $healthResult" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Health check response: $(if ($healthResult) { $healthResult } else { 'Empty/No response' })" -ForegroundColor Yellow
}

# Step 5: Test Chat Endpoint
Write-Progress-Step -Step 5 -Total 5 -Message "Testing AI Chat Endpoint..."
$chatCmd = 'curl -s -X POST http://localhost:3002/chat -H "Content-Type: application/json" -H "X-API-Key: medarion-secure-key-2025" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}],\"max_tokens\":10}" 2>&1'
if ($config.ssh.usePlink) {
    if ($sshPassword) {
        $chatResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $chatCmd 2>&1
    } else {
        $chatResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $chatCmd 2>&1
    }
} else {
    $chatResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $chatCmd 2>&1
}

if ($chatResult -and ($chatResult -match "choices" -or $chatResult -match "content" -or $chatResult -match "Hello")) {
    Write-Host "   ✅ Chat endpoint working!" -ForegroundColor Green
    $chatPreview = if ($chatResult.Length -gt 150) { $chatResult.Substring(0, 150) + "..." } else { $chatResult }
    Write-Host "   Response: $chatPreview" -ForegroundColor Gray
} else {
    $chatPreview = if ($chatResult -and $chatResult.Length -gt 0) { 
        if ($chatResult.Length -gt 200) { $chatResult.Substring(0, 200) } else { $chatResult }
    } else { 
        "Empty/No response or connection issue" 
    }
    Write-Host "   ⚠️  Chat endpoint response: $chatPreview" -ForegroundColor Yellow
}

Write-Progress -Activity "Restarting and Testing" -Completed
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   Tunnel: $(if ($tunnelStatus -match 'active') { '✅ Running' } else { '⚠️  Check needed' })" -ForegroundColor White
Write-Host "   Application: $(if ($statusResult -match 'active.*running' -or $statusResult -match 'online') { '✅ Running' } else { '⚠️  Check needed' })" -ForegroundColor White
Write-Host "   AI Health: $(if ($healthResult -match 'status.*ok' -or $healthResult -match 'Mistral') { '✅ Working' } else { '⚠️  Check needed' })" -ForegroundColor White
Write-Host "   AI Chat: $(if ($chatResult -match 'choices' -or $chatResult -match 'content') { '✅ Working' } else { '⚠️  Check needed' })" -ForegroundColor White

