# Comprehensive Deployment Verification Script
# This script checks everything to ensure deployment is correct

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Deployment Verification                               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found" -ForegroundColor Red
    exit 1
}

try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration" -ForegroundColor Red
    exit 1
}

$cpanelUser = if ($config.cpanel) { $config.cpanel.username } else { "medasnnc" }
$publicHtml = "/home/$cpanelUser/public_html"
$nodeAppPath = "/home/$cpanelUser/medarion"

$allGood = $true

# 1. Check Frontend
Write-Host "1️⃣  Checking Frontend..." -ForegroundColor Yellow
$frontendCheck = & ".\run_ssh_command.ps1" -Command "test -f $publicHtml/index.html && test -d $publicHtml/assets && echo 'OK' || echo 'FAIL'"
if ($frontendCheck -like "*OK*") {
    Write-Host "   ✅ Frontend files present" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend files missing" -ForegroundColor Red
    $allGood = $false
}

# 2. Check Backend
Write-Host "2️⃣  Checking Backend..." -ForegroundColor Yellow
$backendCheck = & ".\run_ssh_command.ps1" -Command "test -f $nodeAppPath/server.js && test -f $nodeAppPath/package.json && test -d $nodeAppPath/node_modules && echo 'OK' || echo 'FAIL'"
if ($backendCheck -like "*OK*") {
    Write-Host "   ✅ Backend files present" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend files missing" -ForegroundColor Red
    $allGood = $false
}

# 3. Check .env
Write-Host "3️⃣  Checking Environment Configuration..." -ForegroundColor Yellow
$envCheck = & ".\run_ssh_command.ps1" -Command "test -f $nodeAppPath/.env && grep -q 'DB_HOST=localhost' $nodeAppPath/.env && echo 'OK' || echo 'FAIL'"
if ($envCheck -like "*OK*") {
    Write-Host "   ✅ .env file configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env file missing or incorrect" -ForegroundColor Red
    $allGood = $false
}

# 4. Check Node.js
Write-Host "4️⃣  Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = & ".\run_ssh_command.ps1" -Command "node --version 2>&1"
if ($nodeCheck -like "*v*") {
    Write-Host "   ✅ Node.js installed: $nodeCheck" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found" -ForegroundColor Red
    $allGood = $false
}

# 5. Check Database Connection
Write-Host "5️⃣  Checking Database Connection..." -ForegroundColor Yellow
Write-Host "   Creating test script..." -ForegroundColor Gray

$testScript = @"
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
try {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'medasnnc_medarion',
    password: process.env.DB_PASSWORD || 'Neorage94',
    database: process.env.DB_NAME || 'medasnnc_medarion',
    port: parseInt(process.env.DB_PORT || '3306')
  });
  await conn.query('SELECT 1');
  await conn.end();
  console.log('OK');
  process.exit(0);
} catch (e) {
  console.log('FAIL:', e.message);
  process.exit(1);
}
"@

$testScript | Out-File "verify_db.js" -Encoding UTF8

$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$password = $config.ssh.password
echo $password | & $pscpPath -P 22 -pw $password "verify_db.js" "root@$($config.ssh.host):$nodeAppPath/" 2>&1 | Out-Null

$dbTest = & ".\run_ssh_command.ps1" -Command "cd $nodeAppPath && node verify_db.js 2>&1"
& ".\run_ssh_command.ps1" -Command "rm -f $nodeAppPath/verify_db.js" | Out-Null
Remove-Item "verify_db.js" -ErrorAction SilentlyContinue

if ($dbTest -like "*OK*") {
    Write-Host "   ✅ Database connection working" -ForegroundColor Green
} else {
    Write-Host "   ❌ Database connection failed" -ForegroundColor Red
    Write-Host "      $dbTest" -ForegroundColor Gray
    $allGood = $false
}

# 6. Check Permissions
Write-Host "6️⃣  Checking Permissions..." -ForegroundColor Yellow
$permCheck = & ".\run_ssh_command.ps1" -Command "stat -c '%U:%G' $publicHtml/index.html $nodeAppPath/server.js 2>&1 | head -2"
if ($permCheck -like "*medasnnc*") {
    Write-Host "   ✅ Permissions correct" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Permissions may need fixing" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor $(if ($allGood) { "Green" } else { "Red" })
Write-Host "║              Verification Summary                         ║" -ForegroundColor $(if ($allGood) { "Green" } else { "Red" })
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor $(if ($allGood) { "Green" } else { "Red" })
Write-Host ""

if ($allGood) {
    Write-Host "✅ All checks passed! Deployment is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Step:" -ForegroundColor Cyan
    Write-Host "   Create Node.js app in cPanel → Node.js Selector" -ForegroundColor White
} else {
    Write-Host "❌ Some checks failed. Please review the errors above." -ForegroundColor Red
    exit 1
}

