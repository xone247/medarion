# Manual Backend Server Startup Script for cPanel
# This script provides commands you can run manually via cPanel Terminal or SSH

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🚀 BACKEND SERVER STARTUP INSTRUCTIONS" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Load configuration
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}
$config = Get-Content $configPath -Raw | ConvertFrom-Json

$backendDir = "/home/medasnnc/api.medarion.africa"
$backendPort = 3001

Write-Host "📋 Backend Configuration:" -ForegroundColor Cyan
Write-Host "   Directory: $backendDir" -ForegroundColor White
Write-Host "   Port: $backendPort" -ForegroundColor White
Write-Host ""

Write-Host "🔧 MANUAL STEPS TO START BACKEND SERVER:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 1: Via cPanel Terminal" -ForegroundColor Cyan
Write-Host "   1. Log into cPanel" -ForegroundColor White
Write-Host "   2. Go to 'Terminal' or 'SSH Access'" -ForegroundColor White
Write-Host "   3. Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   cd $backendDir" -ForegroundColor Gray
Write-Host "   pkill -9 -f 'node.*server.js' || true" -ForegroundColor Gray
Write-Host "   nohup node server.js > server.log 2>&1 &" -ForegroundColor Gray
Write-Host "   sleep 3" -ForegroundColor Gray
Write-Host "   curl http://localhost:$backendPort/health" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Via SSH (after loading key into Pageant)" -ForegroundColor Cyan
Write-Host "   1. Run: .\load_pageant_key_manual.ps1" -ForegroundColor White
Write-Host "   2. Enter passphrase when prompted" -ForegroundColor White
Write-Host "   3. Then run this script again" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Direct SSH Commands (copy and paste)" -ForegroundColor Cyan
Write-Host "   SSH Host: $($config.ssh.host)" -ForegroundColor White
Write-Host "   SSH User: $($config.ssh.username)" -ForegroundColor White
Write-Host "   SSH Port: $($config.ssh.port)" -ForegroundColor White
Write-Host ""
Write-Host "   Commands to run:" -ForegroundColor Yellow
Write-Host "   ============================================================" -ForegroundColor Gray
Write-Host "   cd $backendDir" -ForegroundColor Green
Write-Host "   pkill -9 -f 'node.*server.js' || true" -ForegroundColor Green
Write-Host "   sleep 2" -ForegroundColor Green
Write-Host "   nohup node server.js > server.log 2>&1 &" -ForegroundColor Green
Write-Host "   sleep 5" -ForegroundColor Green
Write-Host "   ps aux | grep 'node.*server.js' | grep -v grep" -ForegroundColor Green
Write-Host "   curl -s http://localhost:$backendPort/health" -ForegroundColor Green
Write-Host "   tail -20 server.log" -ForegroundColor Green
Write-Host "   ============================================================" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ VERIFICATION:" -ForegroundColor Cyan
Write-Host "   After starting, test these URLs:" -ForegroundColor White
Write-Host "   • https://api.medarion.africa/health" -ForegroundColor Gray
Write-Host "   • https://api.medarion.africa/api/auth" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 CHECKING LOGS:" -ForegroundColor Cyan
Write-Host "   If the server fails to start, check logs:" -ForegroundColor White
Write-Host "   cd $backendDir && tail -50 server.log" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "   • If port $backendPort is in use: lsof -i :$backendPort" -ForegroundColor White
Write-Host "   • If Node.js not found: which node" -ForegroundColor White
Write-Host "   • If dependencies missing: cd $backendDir && npm install" -ForegroundColor White
Write-Host "   • If .env missing: Check $backendDir/.env exists" -ForegroundColor White
Write-Host ""

