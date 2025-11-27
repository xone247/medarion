# Simple Production Sync: Git to cPanel
# Uses existing SSH command helper

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "PRODUCTION SYNC: Git to cPanel" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Load config
$config = Get-Content cpanel-config.json | ConvertFrom-Json
$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"
$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"

# Step 1: Build frontend
Write-Host "1. Building Frontend..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Frontend built successfully" -ForegroundColor Green
    }
}
Write-Host ""

# Step 2: Sync frontend
Write-Host "2. Syncing Frontend..." -ForegroundColor Cyan
if (Test-Path "medarion-dist") {
    $pscp = $config.ssh.plinkPath -replace "plink.exe", "pscp.exe"
    $pscpCmd = "-P $($config.ssh.port) -pw $($config.ssh.password) -i $($config.ssh.keyPath) -r medarion-dist/* $($config.ssh.username)@$($config.ssh.host):$frontendPath/"
    Start-Process -FilePath $pscp -ArgumentList $pscpCmd -NoNewWindow -Wait
    Write-Host "   Frontend synced" -ForegroundColor Green
}
Write-Host ""

# Step 3: Sync backend
Write-Host "3. Syncing Backend..." -ForegroundColor Cyan
if (Test-Path "server") {
    $pscp = $config.ssh.plinkPath -replace "plink.exe", "pscp.exe"
    $pscpCmd = "-P $($config.ssh.port) -pw $($config.ssh.password) -i $($config.ssh.keyPath) -r server/* $($config.ssh.username)@$($config.ssh.host):$backendPath/"
    Start-Process -FilePath $pscp -ArgumentList $pscpCmd -NoNewWindow -Wait
    Write-Host "   Backend synced" -ForegroundColor Green
}
Write-Host ""

# Step 4: Install dependencies and restart
Write-Host "4. Installing Dependencies and Restarting Server..." -ForegroundColor Cyan
$cmd = "cd $backendPath; npm install --production; $pm2Path restart medarion-backend 2>/dev/null || $pm2Path start server.js --name medarion-backend --log server.log"
& .\run_ssh_command.ps1 $cmd
Write-Host "   Server updated" -ForegroundColor Green
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SYNC COMPLETE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "Test: https://medarion.africa" -ForegroundColor Yellow
Write-Host ""

