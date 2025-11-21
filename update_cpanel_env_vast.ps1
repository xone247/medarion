# Update cPanel .env file with Vast.ai configuration

# Try to load config from cpanel-config.json first
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    $configPath = "config.json"
}

if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found. Please create cpanel-config.json" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json

$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$cpanelKey = $config.ssh.keyPath
$cpanelPort = if ($config.ssh.port) { $config.ssh.port } else { 22 }
$usePlink = if ($config.ssh.usePlink) { $config.ssh.usePlink } else { $false }
$plinkPath = if ($config.ssh.plinkPath) { $config.ssh.plinkPath } else { "C:\Program Files\PuTTY\plink.exe" }
$sshPassword = if ($config.ssh.password) { $config.ssh.password } else { $null }
$appPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "`n📝 Updating cPanel .env file..." -ForegroundColor Cyan

# Configuration values
$vastUrl = "http://localhost:3002"  # Changed to 3002 to avoid conflict with Node.js app
$vastApiKey = "medarion-secure-key-2025"

# Read current .env file
Write-Host "`n📋 Reading current .env file..." -ForegroundColor Yellow
$envContent = ssh -i $cpanelKey -p 22 "${cpanelUser}@${cpanelHost}" "cat ${appPath}/.env 2>/dev/null || echo ''" 2>&1

# Update or add VAST_AI_URL
if ($envContent -match "VAST_AI_URL=") {
    $envContent = $envContent -replace "VAST_AI_URL=.*", "VAST_AI_URL=${vastUrl}"
    Write-Host "   ✅ Updated VAST_AI_URL" -ForegroundColor Green
} else {
    $envContent += "`n# Vast.ai Configuration`nVAST_AI_URL=${vastUrl}`n"
    Write-Host "   ✅ Added VAST_AI_URL" -ForegroundColor Green
}

# Update or add VAST_AI_API_KEY
if ($envContent -match "VAST_AI_API_KEY=") {
    $envContent = $envContent -replace "VAST_AI_API_KEY=.*", "VAST_AI_API_KEY=${vastApiKey}"
    Write-Host "   ✅ Updated VAST_AI_API_KEY" -ForegroundColor Green
} else {
    $envContent += "VAST_AI_API_KEY=${vastApiKey}`n"
    Write-Host "   ✅ Added VAST_AI_API_KEY" -ForegroundColor Green
}

# Write updated .env file
Write-Host "`n💾 Writing updated .env file..." -ForegroundColor Yellow
if ($usePlink) {
    if ($sshPassword) {
        $envContent | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" "cat > ${appPath}/.env" 2>&1
    } else {
        $envContent | & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" "cat > ${appPath}/.env" 2>&1
    }
} else {
    $envContent | ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" "cat > ${appPath}/.env" 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ .env file updated successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to update .env file" -ForegroundColor Red
    exit 1
}

# Verify the update
Write-Host "`n🔍 Verifying configuration..." -ForegroundColor Cyan
if ($usePlink) {
    if ($sshPassword) {
        $verify = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" "grep -E 'VAST_AI' ${appPath}/.env" 2>&1
    } else {
        $verify = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" "grep -E 'VAST_AI' ${appPath}/.env" 2>&1
    }
} else {
    $verify = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" "grep -E 'VAST_AI' ${appPath}/.env" 2>&1
}
Write-Host $verify

Write-Host "`n✅ Configuration updated!" -ForegroundColor Green
Write-Host "`n💡 Next: Restart your Node.js application to apply changes" -ForegroundColor Cyan

