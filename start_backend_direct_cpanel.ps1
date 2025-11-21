# Start Backend Server Directly on cPanel
# Uses direct node command to start the server

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Starting Backend Server on cPanel" -ForegroundColor Cyan
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
# Step 1: Check Node.js Availability
# ============================================================
Write-Host "`n[1/5] Checking Node.js..." -ForegroundColor Yellow
$nodeCheck = Run-SSH-Command "which node || echo 'not_found'" -ShowOutput $false
if ($nodeCheck -and $nodeCheck -notlike "*not_found*") {
    $nodeVersion = Run-SSH-Command "node --version" -ShowOutput $false
    Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js via cPanel Node.js Selector" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# Step 2: Check Backend Directory and Files
# ============================================================
Write-Host "`n[2/5] Checking Backend Files..." -ForegroundColor Yellow
$dirCheck = Run-SSH-Command "cd $backendPath && pwd && ls -la server.js package.json 2>/dev/null | head -5" -ShowOutput $true
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend directory and files exist" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend files not found!" -ForegroundColor Red
    exit 1
}

# ============================================================
# Step 3: Check .env File
# ============================================================
Write-Host "`n[3/5] Checking .env File..." -ForegroundColor Yellow
$envCheck = Run-SSH-Command "cd $backendPath && test -f .env && echo 'exists' || echo 'missing'" -ShowOutput $false
if ($envCheck -and $envCheck -like "*exists*") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file missing, but continuing..." -ForegroundColor Yellow
}

# ============================================================
# Step 4: Stop Any Existing Processes
# ============================================================
Write-Host "`n[4/5] Stopping Existing Processes..." -ForegroundColor Yellow
Run-SSH-Command "pkill -f 'node.*server.js' 2>/dev/null || true" -ShowOutput $false
Start-Sleep -Seconds 2

# Check if port is free
$portCheck = Run-SSH-Command "lsof -i :3001 2>/dev/null || echo 'port_free'" -ShowOutput $false
if ($portCheck -and $portCheck -like "*port_free*") {
    Write-Host "   ✅ Port 3001 is free" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Port 3001 may be in use" -ForegroundColor Yellow
    Run-SSH-Command "fuser -k 3001/tcp 2>/dev/null || true" -ShowOutput $false
    Start-Sleep -Seconds 2
}

# ============================================================
# Step 5: Start Backend Server
# ============================================================
Write-Host "`n[5/5] Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   Using nohup to run in background..." -ForegroundColor Gray

# Start with nohup and redirect output to log file
$startCmd = "cd $backendPath && nohup node server.js > server.log 2>&1 & echo `$!"
$pidResult = Run-SSH-Command $startCmd -ShowOutput $false

if ($pidResult -and $pidResult -match "^\s*[0-9]+\s*$") {
    $pid = $pidResult.Trim()
    Write-Host "   ✅ Backend started (PID: $pid)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Starting backend (checking status...)" -ForegroundColor Yellow
}

# Wait a moment for server to start
Start-Sleep -Seconds 5

# ============================================================
# Verification
# ============================================================
Write-Host "`n🔍 Verifying Backend Status..." -ForegroundColor Cyan
Write-Host "-" * 70 -ForegroundColor Gray

# Check process
$processCheck = Run-SSH-Command "ps aux | grep 'node.*server.js' | grep -v grep" -ShowOutput $false
if ($processCheck -and $processCheck.Trim() -ne "") {
    Write-Host "   ✅ Backend process is running" -ForegroundColor Green
    Write-Host "   Process: $($processCheck.Trim())" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Backend process not found" -ForegroundColor Red
}

# Check port
$portCheck = Run-SSH-Command "netstat -tlnp 2>/dev/null | grep ':3001' || ss -tlnp 2>/dev/null | grep ':3001' || lsof -i :3001 2>/dev/null || echo 'not_listening'" -ShowOutput $false
if ($portCheck -and $portCheck -notlike "*not_listening*" -and $portCheck.Trim() -ne "") {
    Write-Host "   ✅ Port 3001 is listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 3001 is not listening" -ForegroundColor Red
}

# Test health endpoint
Write-Host "`n   Testing health endpoint..." -ForegroundColor Gray
$healthCheck = Run-SSH-Command "curl -s http://localhost:3001/health 2>/dev/null || echo 'not_responding'" -ShowOutput $false
if ($healthCheck -and $healthCheck -notlike "*not_responding*" -and ($healthCheck -like "*ok*" -or $healthCheck -like "*status*")) {
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $healthCheck" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Health check failed or server still starting" -ForegroundColor Yellow
    Write-Host "   Response: $healthCheck" -ForegroundColor Gray
    
    # Show logs
    Write-Host "`n📋 Recent Server Logs:" -ForegroundColor Cyan
    $logs = Run-SSH-Command "cd $backendPath && tail -30 server.log 2>/dev/null || echo 'no_logs'" -ShowOutput $true
}

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Backend Server Startup Complete" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n📋 Status:" -ForegroundColor Cyan
$finalProcess = Run-SSH-Command "ps aux | grep 'node.*server.js' | grep -v grep | wc -l" -ShowOutput $false
if ($finalProcess -and $finalProcess.Trim() -match "^\s*[1-9]") {
    Write-Host "   ✅ Backend: Running" -ForegroundColor White
} else {
    Write-Host "   ❌ Backend: Not Running" -ForegroundColor White
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check logs: cd $backendPath && tail -50 server.log" -ForegroundColor White
    Write-Host "   2. Check for errors in server.js" -ForegroundColor White
    Write-Host "   3. Verify .env file has correct values" -ForegroundColor White
    Write-Host "   4. Check Node.js version compatibility" -ForegroundColor White
}

Write-Host "`n🌐 Test URLs:" -ForegroundColor Cyan
Write-Host "   • Backend Health: https://medarion.africa/server/health" -ForegroundColor White
Write-Host "   • Backend API: https://medarion.africa/server/api/ai/query" -ForegroundColor White

Write-Host "`n"

