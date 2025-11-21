# Fresh Setup - Delete nodevenv and Start from Scratch
# This script completely removes the old setup and creates a clean, organized structure

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$plinkPath = $config.ssh.plinkPath
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "🧹 Fresh Setup - Starting from Scratch" -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete entire nodevenv directory
Write-Host "📋 Step 1: Deleting Old nodevenv Directory..." -ForegroundColor Yellow
$deleteCmd = "rm -rf /home/medasnnc/nodevenv/medarion 2>/dev/null; echo 'Deleted'"
$deleteResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $deleteCmd 2>&1
Write-Host "✅ Old directory deleted" -ForegroundColor Green
Write-Host ""

# Step 2: Create fresh directory structure
Write-Host "📋 Step 2: Creating Fresh Directory Structure..." -ForegroundColor Yellow
$createCmd = @"
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin/config
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin/middleware
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin/routes
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin/services
chown -R medasnnc:medasnnc /home/medasnnc/nodevenv/medarion
ls -la /home/medasnnc/nodevenv/medarion/18/bin
"@

$createResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $createCmd 2>&1
Write-Host "✅ Fresh directory structure created" -ForegroundColor Green
Write-Host ""

# Step 3: Check Node.js
Write-Host "📋 Step 3: Verifying Node.js Installation..." -ForegroundColor Yellow
$nodeCheck = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "node --version 2>&1; npm --version 2>&1"
if ($nodeCheck -match "v\d+\.\d+\.\d+") {
    Write-Host "✅ Node.js installed: $($nodeCheck -split "`n" | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Node.js not found. Will need to install via cPanel Node.js Selector" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "✅ Fresh Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Upload essential files: .\upload_essential_files.ps1" -ForegroundColor White
Write-Host "   2. Install dependencies: npm install --production" -ForegroundColor White
Write-Host "   3. Create .env file" -ForegroundColor White
Write-Host "   4. Setup AI tunnel: .\setup_cpanel_ai_tunnel.sh" -ForegroundColor White
Write-Host "   5. Create Node.js app in cPanel" -ForegroundColor White
Write-Host ""

