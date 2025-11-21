# Check Server Environment
# This script connects to the server and checks what's already available

$ErrorActionPreference = "Continue"

# Load config
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password
$plinkPath = $config.ssh.plinkPath
$keyPath = $config.ssh.keyPath
$useKey = $config.ssh.useKey

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Checking Server Environment                            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "SSH Configuration:" -ForegroundColor Yellow
Write-Host "  Server: $sshUser@${sshHost}:$sshPort" -ForegroundColor White
Write-Host "  Plink: $plinkPath" -ForegroundColor White
if ($useKey -and (Test-Path $keyPath)) {
    Write-Host "  Using Key: $keyPath" -ForegroundColor Green
} else {
    Write-Host "  Using Password Authentication" -ForegroundColor Yellow
}
Write-Host ""

# Function to run SSH command
function Run-SSH-Check {
    param([string]$Cmd)
    # Use private key if available, otherwise use password
    if ($config.ssh.useKey -and (Test-Path $config.ssh.keyPath)) {
        $result = & $plinkPath -P $sshPort -i $config.ssh.keyPath "$sshUser@${sshHost}" $Cmd 2>&1
    } else {
        $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    }
    return $result
}

Write-Host "Connecting to $sshUser@${sshHost}:$sshPort..." -ForegroundColor Yellow
Write-Host ""

# System Info
Write-Host "=== SYSTEM INFORMATION ===" -ForegroundColor Cyan
$sysInfo = Run-SSH-Check "whoami; hostname; uname -a"
Write-Host $sysInfo -ForegroundColor White
Write-Host ""

# Node.js
Write-Host "=== NODE.JS ===" -ForegroundColor Cyan
$nodeVersion = Run-SSH-Check 'node --version 2>/dev/null; if [ $? -ne 0 ]; then echo "Not installed"; fi'
Write-Host "Node.js: $nodeVersion" -ForegroundColor White
$npmVersion = Run-SSH-Check 'npm --version 2>/dev/null; if [ $? -ne 0 ]; then echo "Not installed"; fi'
Write-Host "NPM: $npmVersion" -ForegroundColor White
Write-Host ""

# PM2
Write-Host "=== PM2 ===" -ForegroundColor Cyan
$pm2Version = Run-SSH-Check 'pm2 --version 2>/dev/null; if [ $? -ne 0 ]; then echo "Not installed"; fi'
Write-Host "PM2: $pm2Version" -ForegroundColor White
$pm2List = Run-SSH-Check 'pm2 list 2>/dev/null; if [ $? -ne 0 ]; then echo "PM2 not running or no processes"; fi'
Write-Host $pm2List -ForegroundColor White
Write-Host ""

# Apache Modules
Write-Host "=== APACHE MODULES ===" -ForegroundColor Cyan
$apacheModules = Run-SSH-Check 'apache2ctl -M 2>/dev/null | grep -E "(rewrite|proxy|headers|deflate|expires)"; if [ $? -ne 0 ]; then httpd -M 2>/dev/null | grep -E "(rewrite|proxy|headers|deflate|expires)"; fi; if [ $? -ne 0 ]; then echo "Cannot check Apache modules"; fi'
Write-Host $apacheModules -ForegroundColor White
Write-Host ""

# MySQL
Write-Host "=== MYSQL ===" -ForegroundColor Cyan
$mysqlVersion = Run-SSH-Check 'mysql --version 2>/dev/null; if [ $? -ne 0 ]; then echo "Not installed"; fi'
Write-Host "MySQL: $mysqlVersion" -ForegroundColor White
Write-Host ""

# Port 3001
Write-Host "=== PORT 3001 ===" -ForegroundColor Cyan
$portCheck = Run-SSH-Check 'netstat -tuln 2>/dev/null | grep :3001; if [ $? -ne 0 ]; then ss -tuln 2>/dev/null | grep :3001; fi; if [ $? -ne 0 ]; then echo "Port 3001 is free"; fi'
Write-Host $portCheck -ForegroundColor White
Write-Host ""

# Existing Directories
Write-Host "=== EXISTING DIRECTORIES ===" -ForegroundColor Cyan
$publicHtml = Run-SSH-Check 'ls -la /home/medasnnc/public_html 2>/dev/null | head -10; if [ $? -ne 0 ]; then echo "public_html does not exist or is empty"; fi'
Write-Host "public_html:" -ForegroundColor Yellow
Write-Host $publicHtml -ForegroundColor White
Write-Host ""

$nodevenv = Run-SSH-Check 'ls -la /home/medasnnc/nodevenv/medarion 2>/dev/null | head -10; if [ $? -ne 0 ]; then echo "nodevenv/medarion does not exist"; fi'
Write-Host "nodevenv/medarion:" -ForegroundColor Yellow
Write-Host $nodevenv -ForegroundColor White
Write-Host ""

$medarionDir = Run-SSH-Check 'ls -la /home/medasnnc/medarion 2>/dev/null | head -10; if [ $? -ne 0 ]; then echo "medarion directory does not exist"; fi'
Write-Host "medarion:" -ForegroundColor Yellow
Write-Host $medarionDir -ForegroundColor White
Write-Host ""

# Database
Write-Host "=== DATABASE ===" -ForegroundColor Cyan
$dbCheckCmd = "mysql -u $($config.database.username) -p$($config.database.password) -e 'SHOW DATABASES LIKE \"$($config.database.name)\";' 2>/dev/null"
$dbCheck = Run-SSH-Check $dbCheckCmd
if ($dbCheck -like "*$($config.database.name)*") {
    Write-Host "Database '$($config.database.name)' EXISTS" -ForegroundColor Green
    $tableCountCmd = 'mysql -u ' + $config.database.username + ' -p' + $config.database.password + ' ' + $config.database.name + ' -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \"' + $config.database.name + '\";" -s -N 2>/dev/null'
    $tableCount = Run-SSH-Check $tableCountCmd
    Write-Host "Tables: $tableCount" -ForegroundColor White
} else {
    Write-Host "Database '$($config.database.name)' does NOT exist" -ForegroundColor Yellow
}
Write-Host ""

# .htaccess
Write-Host "=== .htaccess ===" -ForegroundColor Cyan
$htaccess = Run-SSH-Check 'test -f /home/medasnnc/public_html/.htaccess; if [ $? -eq 0 ]; then echo "EXISTS"; else echo "NOT FOUND"; fi'
Write-Host ".htaccess: $htaccess" -ForegroundColor White
if ($htaccess -like "*EXISTS*") {
    $htaccessContent = Run-SSH-Check 'head -20 /home/medasnnc/public_html/.htaccess'
    Write-Host "Content preview:" -ForegroundColor Yellow
    Write-Host $htaccessContent -ForegroundColor Gray
}
Write-Host ""

# Vast.ai Tunnel
Write-Host "=== VAST.AI TUNNEL ===" -ForegroundColor Cyan
$tunnelScript = Run-SSH-Check 'test -f ~/vast_tunnel/start_tunnel.sh; if [ $? -eq 0 ]; then echo "EXISTS"; else echo "NOT FOUND"; fi'
Write-Host "Tunnel script: $tunnelScript" -ForegroundColor White
$tunnelProcess = Run-SSH-Check 'ps aux | grep ssh | grep -E "vast|93.91.156.91"; if [ $? -ne 0 ]; then echo "No tunnel process running"; fi'
Write-Host "Tunnel process: $tunnelProcess" -ForegroundColor White
Write-Host ""

Write-Host "ENVIRONMENT CHECK COMPLETE" -ForegroundColor Green
Write-Host ""

