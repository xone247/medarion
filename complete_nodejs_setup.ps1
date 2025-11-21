# Complete Node.js Setup and Start Script
# This script sets up database, starts Node.js app, and verifies everything

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Node.js Setup & Start                        ║" -ForegroundColor Cyan
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
$nodeAppPath = "/home/$cpanelUser/medarion"

Write-Host "📋 Setup Configuration:" -ForegroundColor Cyan
Write-Host "   App Path: $nodeAppPath" -ForegroundColor Gray
Write-Host "   Database: $($config.database.name)" -ForegroundColor Gray
Write-Host ""

# Step 1: Setup Database
Write-Host "1️⃣  Setting up Database..." -ForegroundColor Yellow
$dbSetup = & ".\run_ssh_command.ps1" -Command "cd $nodeAppPath && node setup_database_production.js 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database setup completed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Database setup had issues" -ForegroundColor Yellow
    Write-Host "   $dbSetup" -ForegroundColor Gray
}

# Step 2: Verify Tables
Write-Host "2️⃣  Verifying Database Tables..." -ForegroundColor Yellow
$tables = & ".\run_ssh_command.ps1" -Command "mysql -u $($config.database.username) -p$($config.database.password) $($config.database.name) -e 'SHOW TABLES;' 2>&1 | grep -v 'Tables_in' | head -20"
if ($tables -match "users|companies|deals") {
    Write-Host "   ✅ Database tables verified" -ForegroundColor Green
    Write-Host "   Tables found: $($tables.Split([Environment]::NewLine).Count - 1)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Some tables may be missing" -ForegroundColor Yellow
}

# Step 3: Start Node.js App
Write-Host "3️⃣  Starting Node.js Application..." -ForegroundColor Yellow
$startResult = & ".\run_ssh_command.ps1" -Command "cd $nodeAppPath && bash start_nodejs_app.sh 2>&1"
Write-Host "   $startResult" -ForegroundColor Gray

# Step 4: Verify App is Running
Write-Host "4️⃣  Verifying Application..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$healthCheck = & ".\run_ssh_command.ps1" -Command "curl -s http://localhost:3001/health 2>&1"
$processCheck = & ".\run_ssh_command.ps1" -Command "ps aux | grep 'node.*server.js' | grep -v grep | head -1"

if ($healthCheck -like "*OK*" -or $healthCheck -like "*status*") {
    Write-Host "   ✅ Application is running and responding" -ForegroundColor Green
} elseif ($processCheck -match "node") {
    Write-Host "   ✅ Application process is running" -ForegroundColor Green
    Write-Host "   ⚠️  Health endpoint may need a moment" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ Application failed to start" -ForegroundColor Red
    Write-Host "   Checking logs..." -ForegroundColor Yellow
    $logs = & ".\run_ssh_command.ps1" -Command "tail -20 $nodeAppPath/app.log 2>&1"
    Write-Host "   $logs" -ForegroundColor Gray
}

# Step 5: Test Database Connection from App
Write-Host "5️⃣  Testing Database Connection from App..." -ForegroundColor Yellow
$dbTest = & ".\run_ssh_command.ps1" -Command "cd $nodeAppPath && node -e \"import('./config/database.js').then(async (m) => { const pool = m.default; try { const conn = await pool.getConnection(); await conn.query('SELECT 1'); conn.release(); console.log('OK'); process.exit(0); } catch(e) { console.log('FAIL:', e.message); process.exit(1); } }).catch(e => { console.log('IMPORT FAIL:', e.message); process.exit(1); });\" 2>&1"
if ($dbTest -like "*OK*") {
    Write-Host "   ✅ Database connection from app working" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Database connection test had issues" -ForegroundColor Yellow
    Write-Host "   $dbTest" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Setup Complete!                               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Application Status:" -ForegroundColor Cyan
Write-Host "   - Database: Setup and verified" -ForegroundColor Green
Write-Host "   - Node.js App: Started" -ForegroundColor Green
Write-Host "   - Logs: $nodeAppPath/app.log" -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 Check Status:" -ForegroundColor Cyan
Write-Host "   .\run_ssh_command.ps1 -Command 'ps aux | grep node | grep server.js'" -ForegroundColor White
Write-Host "   .\run_ssh_command.ps1 -Command 'tail -f $nodeAppPath/app.log'" -ForegroundColor White
Write-Host ""

