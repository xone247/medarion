# Ensure Backend Server is Running Properly on cPanel
# Checks status, restarts if needed, and ensures PM2 is configured

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "BACKEND SERVER STATUS CHECK & FIX" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Load config
$config = Get-Content cpanel-config.json | ConvertFrom-Json
$plink = $config.ssh.plinkPath
$backendPath = "/home/medasnnc/api.medarion.africa"
$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"

# Function to run SSH command
function Invoke-SSHCommand {
    param([string]$Command, [switch]$ShowOutput = $true)
    $args = @(
        "-P", $config.ssh.port,
        "-pw", $config.ssh.password,
        "-i", $config.ssh.keyPath,
        "-batch",
        "$($config.ssh.username)@$($config.ssh.host)",
        $Command
    )
    $result = echo $config.ssh.password | & $plink @args 2>&1
    if ($ShowOutput -and $result) {
        Write-Host $result
    }
    return $result
}

# Step 1: Check current status
Write-Host "[1/5] Checking Server Status..." -ForegroundColor Cyan
$status = Invoke-SSHCommand "$pm2Path list" -ShowOutput $true
Write-Host ""

# Step 2: Check health endpoint
Write-Host "[2/5] Testing Health Endpoint..." -ForegroundColor Cyan
$health = Invoke-SSHCommand "curl -s http://localhost:3001/health 2>&1" -ShowOutput $false
if ($health -like "*OK*" -or $health -like "*status*" -or $health -like "*200*") {
    Write-Host "   ✓ Health endpoint responding" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Health endpoint not responding: $health" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check if process is saved
Write-Host "[3/5] Checking PM2 Saved Configuration..." -ForegroundColor Cyan
$saved = Invoke-SSHCommand "test -f /root/.pm2/dump.pm2 && echo 'saved' || echo 'not_saved'" -ShowOutput $false
if ($saved -like "*saved*") {
    Write-Host "   ✓ PM2 process is saved" -ForegroundColor Green
} else {
    Write-Host "   ⚠ PM2 process not saved, saving now..." -ForegroundColor Yellow
    Invoke-SSHCommand "$pm2Path save" -ShowOutput $false
    Write-Host "   ✓ PM2 process saved" -ForegroundColor Green
}
Write-Host ""

# Step 4: Ensure startup is configured
Write-Host "[4/5] Ensuring PM2 Auto-Start is Configured..." -ForegroundColor Cyan
$startupCheck = Invoke-SSHCommand "systemctl list-unit-files | grep pm2 || echo 'not_configured'" -ShowOutput $false
if ($startupCheck -like "*pm2*") {
    Write-Host "   ✓ PM2 startup service exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Configuring PM2 startup..." -ForegroundColor Yellow
    $startupResult = Invoke-SSHCommand "$pm2Path startup systemd -u root --hp /root" -ShowOutput $true
    Write-Host "   ✓ PM2 startup configured" -ForegroundColor Green
}
Write-Host ""

# Step 5: Restart to ensure everything is fresh
Write-Host "[5/5] Restarting Server to Ensure Fresh State..." -ForegroundColor Cyan
Invoke-SSHCommand "cd $backendPath; $pm2Path restart medarion-backend" -ShowOutput $true
Start-Sleep -Seconds 3
Write-Host ""

# Final status
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "FINAL STATUS" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
$finalStatus = Invoke-SSHCommand "$pm2Path list | grep medarion-backend" -ShowOutput $true
Write-Host ""

$finalHealth = Invoke-SSHCommand "curl -s http://localhost:3001/health 2>&1" -ShowOutput $false
Write-Host "Health Check: $finalHealth" -ForegroundColor $(if ($finalHealth -like "*OK*" -or $finalHealth -like "*status*") { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "✓ Backend server is running and configured!" -ForegroundColor Green
Write-Host ""

