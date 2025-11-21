# Complete cPanel Setup - Orchestrates Everything
# This script sets up the entire application infrastructure on cPanel

Write-Host "🚀 Complete cPanel Application Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Phase 1: Fresh Start
Write-Host "📋 Phase 1: Fresh Start" -ForegroundColor Yellow
Write-Host "   Deleting old setup and creating fresh structure..." -ForegroundColor Gray
& ".\fresh_setup_cpanel.ps1"
Write-Host ""

# Phase 2: Upload Files
Write-Host "📋 Phase 2: Upload Essential Files" -ForegroundColor Yellow
Write-Host "   Uploading 21 essential files..." -ForegroundColor Gray
& ".\upload_essential_files.ps1"
Write-Host ""

# Phase 3: Install Dependencies
Write-Host "📋 Phase 3: Install Dependencies" -ForegroundColor Yellow
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$plinkPath = $config.ssh.plinkPath
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "   Running npm install..." -ForegroundColor Gray
$npmCmd = "cd $nodeAppPath && npm install --production"
$npmResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $npmCmd 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  npm install had issues. Check output:" -ForegroundColor Yellow
    Write-Host "   $npmResult" -ForegroundColor Gray
}
Write-Host ""

# Phase 4: Create .env File
Write-Host "📋 Phase 4: Create .env File" -ForegroundColor Yellow
$envContent = @"
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$($config.database.name)
DB_USER=$($config.database.username)
DB_PASSWORD=$($config.database.password)
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
VAST_AI_URL=http://localhost:8081
"@

$envCmd = "cat > $nodeAppPath/.env << 'ENVEOF'
$envContent
ENVEOF
"
$envResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $envCmd 2>&1
Write-Host "✅ .env file created" -ForegroundColor Green
Write-Host ""

# Phase 5: Setup AI Tunnel
Write-Host "📋 Phase 5: Setup AI Tunnel" -ForegroundColor Yellow
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (Test-Path "setup_cpanel_ai_tunnel.sh") {
    Write-Host "   Uploading tunnel setup script..." -ForegroundColor Gray
    echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "setup_cpanel_ai_tunnel.sh" "$sshUser@${sshHost}:/tmp/setup_cpanel_ai_tunnel.sh" 2>&1 | Out-Null
    
    Write-Host "   Running tunnel setup..." -ForegroundColor Gray
    $tunnelCmd = "chmod +x /tmp/setup_cpanel_ai_tunnel.sh && /tmp/setup_cpanel_ai_tunnel.sh"
    $tunnelResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $tunnelCmd 2>&1
    
    if ($tunnelResult -match "SUCCESS|running") {
        Write-Host "✅ AI tunnel setup complete" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AI tunnel setup may need manual attention" -ForegroundColor Yellow
        Write-Host "   Check: systemctl status vast-ai-tunnel.service" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Tunnel setup script not found. Skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Phase 6: Setup Node.js Service via SSH
Write-Host "📋 Phase 6: Setup Node.js Service via SSH" -ForegroundColor Yellow
if (Test-Path "setup_nodejs_service.sh") {
    Write-Host "   Uploading service setup script..." -ForegroundColor Gray
    echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "setup_nodejs_service.sh" "$sshUser@${sshHost}:/tmp/setup_nodejs_service.sh" 2>&1 | Out-Null
    
    Write-Host "   Running service setup..." -ForegroundColor Gray
    $serviceCmd = "chmod +x /tmp/setup_nodejs_service.sh && /tmp/setup_nodejs_service.sh"
    $serviceResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $serviceCmd 2>&1
    
    if ($serviceResult -match "SUCCESS|running|started") {
        Write-Host "✅ Node.js service setup complete" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Service setup may need manual attention" -ForegroundColor Yellow
        Write-Host "   Check: systemctl status medarion-api.service" -ForegroundColor Gray
        Write-Host "   Output: $serviceResult" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Service setup script not found. Skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service Management:" -ForegroundColor Cyan
Write-Host "   Status:  systemctl status medarion-api.service" -ForegroundColor White
Write-Host "   Start:   systemctl start medarion-api.service" -ForegroundColor White
Write-Host "   Stop:    systemctl stop medarion-api.service" -ForegroundColor White
Write-Host "   Restart: systemctl restart medarion-api.service" -ForegroundColor White
Write-Host "   Logs:    journalctl -u medarion-api.service -f" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Application:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "📚 Complete documentation: CPANEL_COMPLETE_SETUP_MAP.md" -ForegroundColor Cyan
Write-Host ""

