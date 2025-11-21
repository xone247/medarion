# Deploy SSH tunnel setup to cPanel
# This script uploads and runs the tunnel setup on cPanel

# Try to load config from cpanel-config.json first, then config.json
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    $configPath = "config.json"
}

if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found. Please provide cPanel SSH details:" -ForegroundColor Red
    Write-Host "   Create cpanel-config.json with:" -ForegroundColor Yellow
    Write-Host '   {"ssh":{"host":"server1.medarion.africa","username":"root","port":22,"keyPath":"C:\\path\\to\\key.ppk"}}' -ForegroundColor Gray
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

Write-Host "`n🚀 Deploying SSH Tunnel Setup to cPanel..." -ForegroundColor Cyan
Write-Host "   Host: $cpanelHost" -ForegroundColor Gray
Write-Host "   User: $cpanelUser" -ForegroundColor Gray

# Check if SSH key exists
if (-not (Test-Path $cpanelKey)) {
    Write-Host "`n❌ SSH key not found: $cpanelKey" -ForegroundColor Red
    exit 1
}

# Check if Vast.ai SSH key exists
$vastKey = "$env:USERPROFILE\.ssh\id_ed25519_vast"
if (-not (Test-Path $vastKey)) {
    Write-Host "`n❌ Vast.ai SSH key not found: $vastKey" -ForegroundColor Red
    Write-Host "   Please ensure you have the Vast.ai SSH key" -ForegroundColor Yellow
    exit 1
}

# Upload Vast.ai SSH key to cPanel
Write-Host "`n📤 Uploading Vast.ai SSH key to cPanel..." -ForegroundColor Cyan
$vastKeyRemote = "/root/.ssh/id_ed25519_vast"

# First, create .ssh directory if it doesn't exist
$createSshDir = "mkdir -p /root/.ssh && chmod 700 /root/.ssh"
if ($usePlink) {
    if ($sshPassword) {
        echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $createSshDir 2>&1 | Out-Null
    } else {
        & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $createSshDir 2>&1 | Out-Null
    }
} else {
    ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $createSshDir 2>&1 | Out-Null
}

if ($usePlink) {
    # Use pscp (PuTTY's SCP) with absolute path
    $pscpPath = $plinkPath -replace "plink.exe", "pscp.exe"
    if ($sshPassword) {
        echo $sshPassword | & $pscpPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "$vastKey" "${cpanelUser}@${cpanelHost}:${vastKeyRemote}" 2>&1
    } else {
        & $pscpPath -P $cpanelPort -i $cpanelKey "$vastKey" "${cpanelUser}@${cpanelHost}:${vastKeyRemote}" 2>&1
    }
} else {
    scp -i $cpanelKey -P $cpanelPort "$vastKey" "${cpanelUser}@${cpanelHost}:${vastKeyRemote}" 2>&1
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Upload failed, continuing anyway..." -ForegroundColor Yellow
}

# Upload setup script
Write-Host "`n📤 Uploading tunnel setup script..." -ForegroundColor Cyan
$scriptRemote = "/root/setup_cpanel_vast_tunnel.sh"
if ($usePlink) {
    $pscpPath = $plinkPath -replace "plink.exe", "pscp.exe"
    if ($sshPassword) {
        echo $sshPassword | & $pscpPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "setup_cpanel_vast_tunnel.sh" "${cpanelUser}@${cpanelHost}:${scriptRemote}" 2>&1
    } else {
        & $pscpPath -P $cpanelPort -i $cpanelKey "setup_cpanel_vast_tunnel.sh" "${cpanelUser}@${cpanelHost}:${scriptRemote}" 2>&1
    }
} else {
    scp -i $cpanelKey -P $cpanelPort setup_cpanel_vast_tunnel.sh "${cpanelUser}@${cpanelHost}:${scriptRemote}" 2>&1
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Upload failed!" -ForegroundColor Red
    exit 1
}

# Make script executable and run it
Write-Host "`n🚀 Running setup script on cPanel..." -ForegroundColor Cyan
$runCmd = "chmod +x $scriptRemote && $scriptRemote"
if ($usePlink) {
    if ($sshPassword) {
        echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $runCmd 2>&1
    } else {
        & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $runCmd 2>&1
    }
} else {
    ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $runCmd 2>&1
}

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update .env file on cPanel with:" -ForegroundColor White
Write-Host "      VAST_AI_URL=http://localhost:3001" -ForegroundColor Gray
Write-Host "   2. Restart your Node.js application" -ForegroundColor White
Write-Host "   3. Test the AI connection" -ForegroundColor White

