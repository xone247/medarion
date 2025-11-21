# Check and Start Backend Server on cPanel
# Verifies backend status and starts it if needed

$ErrorActionPreference = "Continue"

Write-Host "`n🔍 Checking Backend Server Status on cPanel" -ForegroundColor Cyan
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
$password = $config.ssh.password

$backendPath = "/home/medasnnc/public_html/server"

# Function to run SSH command
function Run-SSH-Command {
    param([string]$Cmd, [switch]$ShowOutput = $true)
    $result = & $plinkPath -P $sshPort "${sshUser}@${sshHost}" $Cmd 2>&1
    if ($ShowOutput -and $result) {
        Write-Host $result -ForegroundColor Gray
    }
    return $result
}

# ============================================================
# Step 1: Check if Backend Process is Running
# ============================================================
Write-Host "`n[1/4] Checking Backend Process..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$processCheck = Run-SSH-Command "ps aux | grep 'node.*server.js' | grep -v grep" -ShowOutput $false
if ($processCheck -and $processCheck -notlike "*not found*" -and $processCheck.Trim() -ne "") {
    Write-Host "   ✅ Backend process is running" -ForegroundColor Green
    Write-Host "   Process: $processCheck" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Backend process is NOT running" -ForegroundColor Red
}

# ============================================================
# Step 2: Check if Port 3001 is Listening
# ============================================================
Write-Host "`n[2/4] Checking Port 3001..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$portCheck = Run-SSH-Command "netstat -tlnp 2>/dev/null | grep ':3001' || ss -tlnp 2>/dev/null | grep ':3001' || lsof -i :3001 2>/dev/null || echo 'not_listening'" -ShowOutput $false
if ($portCheck -and $portCheck -notlike "*not_listening*" -and $portCheck.Trim() -ne "") {
    Write-Host "   ✅ Port 3001 is listening" -ForegroundColor Green
    Write-Host "   Status: $portCheck" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Port 3001 is NOT listening" -ForegroundColor Red
}

# ============================================================
# Step 3: Test Backend Health Endpoint
# ============================================================
Write-Host "`n[3/4] Testing Backend Health Endpoint..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$healthCheck = Run-SSH-Command "curl -s http://localhost:3001/health 2>/dev/null || echo 'not_responding'" -ShowOutput $false
if ($healthCheck -and $healthCheck -notlike "*not_responding*" -and ($healthCheck -like "*ok*" -or $healthCheck -like "*status*")) {
    Write-Host "   ✅ Backend health check passed" -ForegroundColor Green
    Write-Host "   Response: $healthCheck" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    Write-Host "   Response: $healthCheck" -ForegroundColor Gray
}

# ============================================================
# Step 4: Check Backend Logs
# ============================================================
Write-Host "`n[4/4] Checking Backend Logs..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$logCheck = Run-SSH-Command "cd $backendPath && tail -20 server.log 2>/dev/null || echo 'no_log_file'" -ShowOutput $false
if ($logCheck -and $logCheck -notlike "*no_log_file*") {
    Write-Host "   📋 Recent log entries:" -ForegroundColor Cyan
    Write-Host $logCheck -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  No log file found" -ForegroundColor Yellow
}

# ============================================================
# Decision: Start Backend if Not Running
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Stop any existing processes
Write-Host "`n[1/3] Stopping any existing processes..." -ForegroundColor Yellow
Run-SSH-Command "pkill -f 'node.*server.js' || true" -ShowOutput $false
Start-Sleep -Seconds 2

# Check if PM2 is available
Write-Host "`n[2/3] Checking for PM2..." -ForegroundColor Yellow
$pm2Check = Run-SSH-Command "which pm2 || echo 'not_found'" -ShowOutput $false
$hasPm2 = $pm2Check -and $pm2Check -notlike "*not_found*"

if ($hasPm2) {
    Write-Host "   ✅ PM2 found, using PM2 to start server" -ForegroundColor Green
    Run-SSH-Command "cd $backendPath && pm2 stop medarion-backend 2>/dev/null || true" -ShowOutput $false
    Run-SSH-Command "cd $backendPath && pm2 start server.js --name medarion-backend" -ShowOutput $true
    Run-SSH-Command "pm2 save" -ShowOutput $false
    Write-Host "   ✅ Backend started with PM2" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  PM2 not found, using nohup" -ForegroundColor Yellow
    Write-Host "   Starting backend with nohup..." -ForegroundColor Gray
    
    # Start with nohup
    Run-SSH-Command "cd $backendPath && nohup node server.js > server.log 2>&1 &" -ShowOutput $false
    Start-Sleep -Seconds 3
    
    # Verify it started
    $verifyProcess = Run-SSH-Command "ps aux | grep 'node.*server.js' | grep -v grep" -ShowOutput $false
    if ($verifyProcess -and $verifyProcess.Trim() -ne "") {
        Write-Host "   ✅ Backend started with nohup" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to start backend" -ForegroundColor Red
    }
}

# ============================================================
# Final Verification
# ============================================================
Write-Host "`n[3/3] Verifying Backend is Running..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$finalHealthCheck = Run-SSH-Command "curl -s http://localhost:3001/health 2>/dev/null || echo 'not_responding'" -ShowOutput $false
if ($finalHealthCheck -and $finalHealthCheck -notlike "*not_responding*" -and ($finalHealthCheck -like "*ok*" -or $finalHealthCheck -like "*status*")) {
    Write-Host "   ✅ Backend is running and responding!" -ForegroundColor Green
    Write-Host "   Response: $finalHealthCheck" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Backend may still be starting..." -ForegroundColor Yellow
    Write-Host "   Response: $finalHealthCheck" -ForegroundColor Gray
    
    # Show recent logs
    Write-Host "`n📋 Recent logs:" -ForegroundColor Cyan
    $recentLogs = Run-SSH-Command "cd $backendPath && tail -30 server.log 2>/dev/null || echo 'no_logs'" -ShowOutput $true
}

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Backend Server Status Check Complete" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n📋 Current Status:" -ForegroundColor Cyan
$processStatus = Run-SSH-Command "ps aux | grep 'node.*server.js' | grep -v grep | wc -l" -ShowOutput $false
if ($processStatus -and $processStatus.Trim() -match "^\s*[1-9]") {
    Write-Host "   ✅ Backend Process: Running" -ForegroundColor White
} else {
    Write-Host "   ❌ Backend Process: Not Running" -ForegroundColor White
}

$portStatus = Run-SSH-Command "netstat -tlnp 2>/dev/null | grep ':3001' || ss -tlnp 2>/dev/null | grep ':3001' || echo 'not_listening'" -ShowOutput $false
if ($portStatus -and $portStatus -notlike "*not_listening*") {
    Write-Host "   ✅ Port 3001: Listening" -ForegroundColor White
} else {
    Write-Host "   ❌ Port 3001: Not Listening" -ForegroundColor White
}

Write-Host "`n🌐 Test URLs:" -ForegroundColor Cyan
Write-Host "   • Backend Health: https://medarion.africa/server/health" -ForegroundColor White
Write-Host "   • Backend API: https://medarion.africa/server/api/ai/query" -ForegroundColor White

Write-Host "`n💡 Useful Commands:" -ForegroundColor Yellow
Write-Host "   Check logs: cd $backendPath && tail -f server.log" -ForegroundColor White
if ($hasPm2) {
    Write-Host "   PM2 status: pm2 status" -ForegroundColor White
    Write-Host "   PM2 logs: pm2 logs medarion-backend" -ForegroundColor White
}

Write-Host "`n"

