# Auto Sync to cPanel - Run after git commits
# This script automatically syncs changes from git to cPanel production

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🚀 AUTO SYNC: Git to cPanel Production" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Load config
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$plink = $config.ssh.plinkPath
$pscp = $plink -replace "plink.exe", "pscp.exe"
$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"
$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"

# Helper function for SSH commands
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [switch]$ShowOutput = $false
    )
    
    $plinkArgs = @(
        "-P", $config.ssh.port,
        "-pw", $config.ssh.password,
        "-i", $config.ssh.keyPath,
        "-batch",
        "$($config.ssh.username)@$($config.ssh.host)",
        $Command
    )
    
    $result = echo $config.ssh.password | & $plink @plinkArgs 2>&1
    
    if ($ShowOutput) {
        Write-Host $result
    }
    return $result
}

# Step 1: Build frontend
Write-Host "[1/6] Building Frontend..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Frontend built successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Build had warnings, continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠ No package.json found, skipping build" -ForegroundColor Yellow
}

# Step 2: Sync frontend files
Write-Host "`n[2/6] Syncing Frontend Files..." -ForegroundColor Cyan
if (Test-Path "medarion-dist") {
    $frontendFiles = Get-ChildItem -Path "medarion-dist" -Recurse -File
    $totalFiles = $frontendFiles.Count
    $currentFile = 0
    
    foreach ($file in $frontendFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "medarion-dist").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/${relativePath}"
        
        if ($currentFile % 50 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Host "   Progress: $currentFile / $totalFiles files" -ForegroundColor Gray
        }
        
        # Upload file
        $pscpArgs = @(
            "-P", $config.ssh.port,
            "-pw", $config.ssh.password,
            "-i", $config.ssh.keyPath,
            $file.FullName,
            "$($config.ssh.username)@$($config.ssh.host):${remoteFile}"
        )
        
        $null = echo $config.ssh.password | & $pscp @pscpArgs 2>&1
    }
    
    Write-Host "   ✓ Synced $totalFiles frontend files" -ForegroundColor Green
} else {
    Write-Host "   ⚠ medarion-dist not found, skipping" -ForegroundColor Yellow
}

# Step 3: Sync backend files (excluding node_modules)
Write-Host "`n[3/6] Syncing Backend Files..." -ForegroundColor Cyan
if (Test-Path "server") {
    $backendFiles = Get-ChildItem -Path "server" -Recurse -File | Where-Object {
        $relativePath = $_.FullName.Substring((Resolve-Path "server").Path.Length + 1)
        -not ($relativePath -like "*node_modules*") -and
        -not ($relativePath -like "*.log")
    }
    $totalFiles = $backendFiles.Count
    $currentFile = 0
    
    foreach ($file in $backendFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "server").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${backendPath}/${relativePath}"
        
        if ($currentFile % 50 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Host "   Progress: $currentFile / $totalFiles files" -ForegroundColor Gray
        }
        
        # Upload file
        $pscpArgs = @(
            "-P", $config.ssh.port,
            "-pw", $config.ssh.password,
            "-i", $config.ssh.keyPath,
            $file.FullName,
            "$($config.ssh.username)@$($config.ssh.host):${remoteFile}"
        )
        
        $null = echo $config.ssh.password | & $pscp @pscpArgs 2>&1
    }
    
    Write-Host "   ✓ Synced $totalFiles backend files" -ForegroundColor Green
} else {
    Write-Host "   ⚠ server directory not found, skipping" -ForegroundColor Yellow
}

# Step 4: Sync public files
Write-Host "`n[4/6] Syncing Public Files..." -ForegroundColor Cyan
if (Test-Path "public") {
    $publicFiles = Get-ChildItem -Path "public" -Recurse -File
    $totalFiles = $publicFiles.Count
    $currentFile = 0
    
    foreach ($file in $publicFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "public").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/${relativePath}"
        
        if ($currentFile % 50 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Host "   Progress: $currentFile / $totalFiles files" -ForegroundColor Gray
        }
        
        # Upload file
        $pscpArgs = @(
            "-P", $config.ssh.port,
            "-pw", $config.ssh.password,
            "-i", $config.ssh.keyPath,
            $file.FullName,
            "$($config.ssh.username)@$($config.ssh.host):${remoteFile}"
        )
        
        $null = echo $config.ssh.password | & $pscp @pscpArgs 2>&1
    }
    
    Write-Host "   ✓ Synced $totalFiles public files" -ForegroundColor Green
} else {
    Write-Host "   ⚠ public directory not found, skipping" -ForegroundColor Yellow
}

# Step 5: Install backend dependencies
Write-Host "`n[5/6] Installing Backend Dependencies..." -ForegroundColor Cyan
$installResult = Invoke-SSHCommand "cd $backendPath && npm install --production" -ShowOutput $false
Write-Host "   ✓ Dependencies installed" -ForegroundColor Green

# Step 6: Restart backend server
Write-Host "`n[6/6] Restarting Backend Server..." -ForegroundColor Cyan
$restartResult = Invoke-SSHCommand "$pm2Path restart medarion-backend 2>/dev/null || $pm2Path start server.js --name medarion-backend --log server.log" -ShowOutput $false
Start-Sleep -Seconds 2

# Verify server status
$statusResult = Invoke-SSHCommand "$pm2Path list" -ShowOutput $true
Write-Host "   ✓ Backend server restarted" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "✅ SYNC COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Test your application:" -ForegroundColor Yellow
Write-Host "   Frontend: https://medarion.africa" -ForegroundColor White
Write-Host "   Backend:  https://api.medarion.africa/health" -ForegroundColor White
Write-Host ""

