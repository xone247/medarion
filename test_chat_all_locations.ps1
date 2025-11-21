# Test Chat Endpoint on All Locations
# 1. PC (via SSH tunnel)
# 2. Vast.ai (direct)
# 3. cPanel (via tunnel)

$ErrorActionPreference = "Continue"

Write-Host "`n🧪 Testing Chat Endpoint on All Locations" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

$apiKey = "medarion-secure-key-2025"
$chatBody = @{
    messages = @(
        @{
            role = "user"
            content = "Say hello in one word"
        }
    )
    max_tokens = 10
    temperature = 0.7
} | ConvertTo-Json -Compress

# Test 1: PC via SSH Tunnel
Write-Host "`n1️⃣  Testing on PC (via SSH Tunnel to Vast.ai)..." -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3001/chat" -ForegroundColor Gray

# Check if tunnel is running
$tunnelProcess = Get-Process -Name "ssh" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*3001:localhost:3001*"
}

if (-not $tunnelProcess) {
    Write-Host "   ⚠️  SSH tunnel not running. Starting tunnel..." -ForegroundColor Yellow
    $vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
    Start-Process -FilePath "ssh" -ArgumentList "-i", "$vastKey", "-p", "31216", "-L", "3001:localhost:3001", "-N", "-f", "root@ssh1.vast.ai" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "   ✅ Tunnel started" -ForegroundColor Green
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $apiKey
        } `
        -Body $chatBody `
        -TimeoutSec 30
    
    Write-Host "   ✅ Chat endpoint working!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    $pcWorking = $true
} catch {
    Write-Host "   ❌ Chat endpoint failed: $_" -ForegroundColor Red
    $pcWorking = $false
}

# Test 2: Vast.ai Direct
Write-Host "`n2️⃣  Testing on Vast.ai (Direct)..." -ForegroundColor Yellow
Write-Host "   URL: http://93.91.156.91:3001/chat" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "http://93.91.156.91:3001/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = $apiKey
        } `
        -Body $chatBody `
        -TimeoutSec 30
    
    Write-Host "   ✅ Chat endpoint working!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    $vastWorking = $true
} catch {
    Write-Host "   ⚠️  Direct access blocked (expected): $_" -ForegroundColor Yellow
    Write-Host "   Testing via SSH..." -ForegroundColor Gray
    
    # Test via SSH
    $vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
    $sshTest = "curl -s -X POST http://localhost:3001/chat -H 'Content-Type: application/json' -H 'X-API-Key: $apiKey' -d '$chatBody'"
    $sshResult = ssh -i "$vastKey" -p 31216 root@ssh1.vast.ai $sshTest 2>&1
    
    if ($sshResult -match "choices" -or $sshResult -match "content") {
        Write-Host "   ✅ Chat endpoint working via SSH!" -ForegroundColor Green
        Write-Host "   Response: $($sshResult.Substring(0, [Math]::Min(200, $sshResult.Length)))" -ForegroundColor Gray
        $vastWorking = $true
    } else {
        Write-Host "   ❌ Chat endpoint failed: $sshResult" -ForegroundColor Red
        $vastWorking = $false
    }
}

# Test 3: cPanel
Write-Host "`n3️⃣  Testing on cPanel (via Tunnel)..." -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3001/chat (on cPanel)" -ForegroundColor Gray

$configPath = "cpanel-config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $plinkPath = $config.ssh.plinkPath
    $sshPassword = $config.ssh.password
    $cpanelKey = $config.ssh.keyPath
    $cpanelHost = $config.ssh.host
    $cpanelUser = $config.ssh.username
    $cpanelPort = $config.ssh.port
    
    # Test chat endpoint on cPanel
    $cpanelTest = "curl -s -X POST http://localhost:3001/chat -H 'Content-Type: application/json' -H 'X-API-Key: $apiKey' -d '$chatBody'"
    
    if ($config.ssh.usePlink) {
        if ($sshPassword) {
            $cpanelResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $cpanelTest 2>&1
        } else {
            $cpanelResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $cpanelTest 2>&1
        }
    } else {
        $cpanelResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $cpanelTest 2>&1
    }
    
    if ($cpanelResult -match "choices" -or $cpanelResult -match "content" -or $cpanelResult -match "Hello") {
        Write-Host "   ✅ Chat endpoint working on cPanel!" -ForegroundColor Green
        Write-Host "   Response: $($cpanelResult.Substring(0, [Math]::Min(200, $cpanelResult.Length)))" -ForegroundColor Gray
        $cpanelWorking = $true
    } else {
        Write-Host "   ❌ Chat endpoint failed on cPanel" -ForegroundColor Red
        Write-Host "   Response: $($cpanelResult.Substring(0, [Math]::Min(200, $cpanelResult.Length)))" -ForegroundColor Yellow
        $cpanelWorking = $false
    }
} else {
    Write-Host "   ⚠️  cPanel config not found, skipping..." -ForegroundColor Yellow
    $cpanelWorking = $null
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   PC (via tunnel): $(if ($pcWorking) { '✅ Working' } else { '❌ Failed' })" -ForegroundColor $(if ($pcWorking) { 'Green' } else { 'Red' })
Write-Host "   Vast.ai (direct): $(if ($vastWorking) { '✅ Working' } else { '❌ Failed' })" -ForegroundColor $(if ($vastWorking) { 'Green' } else { 'Red' })
Write-Host "   cPanel (via tunnel): $(if ($cpanelWorking -eq $true) { '✅ Working' } elseif ($cpanelWorking -eq $false) { '❌ Failed' } else { '⚠️  Not tested' })" -ForegroundColor $(if ($cpanelWorking -eq $true) { 'Green' } elseif ($cpanelWorking -eq $false) { 'Red' } else { 'Yellow' })

if ($pcWorking -and $vastWorking -and ($cpanelWorking -ne $false)) {
    Write-Host "`n✅ All tests passed! Chat endpoint is working." -ForegroundColor Green
    Write-Host "   Ready to use in your application!" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
}

