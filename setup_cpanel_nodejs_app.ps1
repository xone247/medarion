# Setup Node.js Application in cPanel
# This script provides instructions and commands for setting up the Node.js app in cPanel

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Setting Up Node.js Application in cPanel" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "`n❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

$backendPath = "/home/medasnnc/public_html/server"
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "`n📋 Node.js Application Configuration:" -ForegroundColor Cyan
Write-Host "   Application Root: $backendPath" -ForegroundColor White
Write-Host "   Startup File: server.js" -ForegroundColor White
Write-Host "   Port: 3001" -ForegroundColor White
Write-Host "   Application URL: /server (or /api)" -ForegroundColor White

Write-Host "`n💡 Option 1: Use cPanel Node.js Selector (Recommended)" -ForegroundColor Yellow
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Fill in:" -ForegroundColor White
Write-Host "      • Node.js Version: 18.x or 20.x" -ForegroundColor Gray
Write-Host "      • Application Root: $backendPath" -ForegroundColor Gray
Write-Host "      • Application URL: /server (or leave empty)" -ForegroundColor Gray
Write-Host "      • Application Startup File: server.js" -ForegroundColor Gray
Write-Host "      • Application Port: 3001" -ForegroundColor Gray
Write-Host "   5. Add Environment Variables from .env file" -ForegroundColor White
Write-Host "   6. Click 'Create' and then 'Run npm install'" -ForegroundColor White
Write-Host "   7. Start the application" -ForegroundColor White

Write-Host "`n💡 Option 2: Manual Setup via SSH" -ForegroundColor Yellow
Write-Host "   The backend is already running via nohup" -ForegroundColor White
Write-Host "   But we need to set up Apache routing" -ForegroundColor White

Write-Host "`n🔧 Setting Up Apache Routing..." -ForegroundColor Cyan
Write-Host "   Since .htaccess can't use ProxyPreserveHost," -ForegroundColor Gray
Write-Host "   we need to configure Apache at server level or use Node.js Selector" -ForegroundColor Gray

# Check if we can create a symlink or use a different approach
Write-Host "`n💡 Alternative: Update Frontend to Use Full Backend URL" -ForegroundColor Yellow
Write-Host "   We can configure the frontend to use:" -ForegroundColor White
Write-Host "   https://medarion.africa:3001/api/* (if port is open)" -ForegroundColor Gray
Write-Host "   OR set up Node.js Selector for proper routing" -ForegroundColor Gray

Write-Host "`n📝 Recommended Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Use cPanel Node.js Selector to set up the app properly" -ForegroundColor White
Write-Host "   2. This will handle routing automatically" -ForegroundColor White
Write-Host "   3. The app will be accessible at the configured URL" -ForegroundColor White

Write-Host "`n"

