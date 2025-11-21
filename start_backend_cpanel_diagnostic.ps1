# Comprehensive Backend Server Diagnostic and Startup Script
# This script diagnoses issues and starts the backend server on cPanel

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "🔍 BACKEND SERVER DIAGNOSTIC AND STARTUP" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Load configuration
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}
$config = Get-Content $configPath -Raw | ConvertFrom-Json

$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$backendDir = "/home/medasnnc/api.medarion.africa"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $sshHost" -ForegroundColor White
Write-Host "   User: $sshUser" -ForegroundColor White
Write-Host "   Backend Dir: $backendDir" -ForegroundColor White
Write-Host ""

# Function to run SSH command
function Run-SSH {
    param([string]$Cmd)
    $result = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $Cmd 2>&1
    return $result
}

# Step 1: Check Node.js
Write-Host "[1/7] Checking Node.js Installation..." -ForegroundColor Yellow
$nodeVersion = Run-SSH "node --version 2>&1"
if ($nodeVersion -match "v\d+") {
    Write-Host "   ✅ Node.js: $($nodeVersion.Trim())" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Error: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Step 2: Check if backend directory exists
Write-Host "`n[2/7] Checking Backend Directory..." -ForegroundColor Yellow
$dirCheck = Run-SSH "test -d $backendDir && echo 'exists' || echo 'missing'"
if ($dirCheck -match "exists") {
    Write-Host "   ✅ Backend directory exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Check if server.js exists
Write-Host "`n[3/7] Checking server.js..." -ForegroundColor Yellow
$serverCheck = Run-SSH "test -f $backendDir/server.js && echo 'exists' || echo 'missing'"
if ($serverCheck -match "exists") {
    Write-Host "   ✅ server.js exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ server.js not found!" -ForegroundColor Red
    exit 1
}

# Step 4: Check .env file
Write-Host "`n[4/7] Checking .env file..." -ForegroundColor Yellow
$envCheck = Run-SSH "test -f $backendDir/.env && echo 'exists' || echo 'missing'"
if ($envCheck -match "exists") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file not found - will create it" -ForegroundColor Yellow
}

# Step 5: Check node_modules
Write-Host "`n[5/7] Checking node_modules..." -ForegroundColor Yellow
$modulesCheck = Run-SSH "test -d $backendDir/node_modules && echo 'exists' || echo 'missing'"
if ($modulesCheck -match "exists") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found - will install dependencies" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..." -ForegroundColor Cyan
    $installResult = Run-SSH "cd $backendDir && npm install --production 2>&1 | tail -5"
    Write-Host "   Install output: $installResult" -ForegroundColor Gray
}

# Step 6: Stop any existing processes
Write-Host "`n[6/7] Stopping Existing Processes..." -ForegroundColor Yellow
$stopResult = Run-SSH "pkill -9 -f 'node.*server.js' 2>&1; sleep 2; ps aux | grep 'node.*server.js' | grep -v grep || echo 'No processes running'"
Write-Host "   ✅ Existing processes stopped" -ForegroundColor Green

# Step 7: Start backend server
Write-Host "`n[7/7] Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   Starting server in background..." -ForegroundColor Cyan

# Start server and capture output
$startCmd = "cd $backendDir && nohup node server.js > server.log 2>&1 & echo `$! > server.pid && sleep 5 && ps aux | grep 'node.*server.js' | grep -v grep && echo 'STARTED' || echo 'FAILED'"
$startResult = Run-SSH $startCmd

if ($startResult -match "STARTED") {
    Write-Host "   ✅ Backend server started successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend server failed to start!" -ForegroundColor Red
    Write-Host "   Checking logs..." -ForegroundColor Yellow
    $logOutput = Run-SSH "cd $backendDir && tail -30 server.log 2>&1"
    Write-Host "   Log output:" -ForegroundColor Yellow
    Write-Host $logOutput -ForegroundColor Red
    exit 1
}

# Step 8: Verify server is responding
Write-Host "`n[8/8] Verifying Server Health..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$healthCheck = Run-SSH "curl -s http://localhost:3001/health 2>&1 | head -5"
if ($healthCheck -match "status.*OK|OK") {
    Write-Host "   ✅ Backend is responding!" -ForegroundColor Green
    Write-Host "   Response: $healthCheck" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Backend may still be starting..." -ForegroundColor Yellow
    Write-Host "   Response: $healthCheck" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ DIAGNOSTIC COMPLETE" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   • Check logs: cd $backendDir && tail -f server.log" -ForegroundColor White
Write-Host "   • Test endpoint: curl http://localhost:3001/health" -ForegroundColor White
Write-Host "   • Test via subdomain: https://api.medarion.africa/health" -ForegroundColor White
Write-Host ""


