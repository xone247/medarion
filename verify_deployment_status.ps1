# Quick Deployment Status Verification

$config = Get-Content "cpanel-config.json" -Raw | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password

function Run-SSH-Quick {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    return $result
}

Write-Host "🔍 Checking Deployment Status..." -ForegroundColor Cyan
Write-Host ""

# Check frontend
Write-Host "📁 Frontend Files:" -ForegroundColor Yellow
$frontend = Run-SSH-Quick "ls -la /home/medasnnc/public_html/index.html 2>/dev/null && echo 'EXISTS' || echo 'MISSING'"
if ($frontend -like "*EXISTS*") {
    Write-Host "   ✅ index.html exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ index.html missing" -ForegroundColor Red
}

# Check backend
Write-Host "📁 Backend Files:" -ForegroundColor Yellow
$backend = Run-SSH-Quick "test -f /home/medasnnc/nodevenv/medarion/18/server/server.js; if [ `$? -eq 0 ]; then echo 'EXISTS'; else echo 'MISSING'; fi"
if ($backend -like "*EXISTS*") {
    Write-Host "   ✅ server.js exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ server.js missing" -ForegroundColor Red
}

# Check PM2
Write-Host "⚙️  PM2 Status:" -ForegroundColor Yellow
$pm2 = Run-SSH-Quick "pm2 list 2>/dev/null | grep medarion; if [ `$? -ne 0 ]; then echo 'NOT_RUNNING'; fi"
if ($pm2 -notlike "*NOT_RUNNING*" -and $pm2 -like "*medarion*") {
    Write-Host "   ✅ PM2 process found" -ForegroundColor Green
    Write-Host "   $pm2" -ForegroundColor Gray
} else {
    Write-Host "   ❌ PM2 process not running" -ForegroundColor Red
}

# Check database
Write-Host "💾 Database:" -ForegroundColor Yellow
$dbCheck = Run-SSH-Quick "mysql -u $($config.database.username) -p$($config.database.password) $($config.database.name) -e 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \"$($config.database.name)\";' 2>/dev/null | tail -1"
if ($dbCheck -match '\d') {
    Write-Host "   ✅ Database has tables" -ForegroundColor Green
    Write-Host "   Tables: $dbCheck" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Could not check database" -ForegroundColor Yellow
}

# Check .htaccess
Write-Host "📄 .htaccess:" -ForegroundColor Yellow
$htaccess = Run-SSH-Quick "test -f /home/medasnnc/public_html/.htaccess; if [ `$? -eq 0 ]; then echo 'EXISTS'; else echo 'MISSING'; fi"
if ($htaccess -like "*EXISTS*") {
    Write-Host "   ✅ .htaccess exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ .htaccess missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Website: https://medarion.africa" -ForegroundColor Cyan
Write-Host ""

