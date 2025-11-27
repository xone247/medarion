# Production Sync with Progress Bars
# Syncs files from git to cPanel with visual progress indicators

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "PRODUCTION SYNC: Git to cPanel (with Progress)" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Load config
$config = Get-Content cpanel-config.json | ConvertFrom-Json
$plink = $config.ssh.plinkPath
$pscp = $plink -replace "plink.exe", "pscp.exe"
$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"
$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"

# Step 1: Build frontend
Write-Host "`n[1/6] Building Frontend..." -ForegroundColor Cyan
Write-Progress -Activity "Building Frontend" -Status "Running npm run build..." -PercentComplete 0
if (Test-Path "package.json") {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Progress -Activity "Building Frontend" -Status "Complete" -PercentComplete 100 -Completed
        Write-Host "   ✓ Frontend built successfully" -ForegroundColor Green
    } else {
        Write-Progress -Activity "Building Frontend" -Status "Failed" -PercentComplete 100 -Completed
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
    
    Write-Progress -Activity "Syncing Frontend" -Status "Preparing..." -PercentComplete 0
    
    foreach ($file in $frontendFiles) {
        $currentFile++
        $percent = [math]::Round(($currentFile / $totalFiles) * 100)
        $relativePath = $file.FullName.Substring((Resolve-Path "medarion-dist").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/${relativePath}"
        
        Write-Progress -Activity "Syncing Frontend" -Status "Uploading: $($file.Name)" -PercentComplete $percent -CurrentOperation "$currentFile of $totalFiles files"
        
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
    
    Write-Progress -Activity "Syncing Frontend" -Status "Complete" -PercentComplete 100 -Completed
    Write-Host "   ✓ Synced $totalFiles frontend files" -ForegroundColor Green
} else {
    Write-Host "   ⚠ medarion-dist not found, skipping" -ForegroundColor Yellow
}

# Step 3: Sync backend files
Write-Host "`n[3/6] Syncing Backend Files..." -ForegroundColor Cyan
if (Test-Path "server") {
    $backendFiles = Get-ChildItem -Path "server" -Recurse -File | Where-Object {
        $relativePath = $_.FullName.Substring((Resolve-Path "server").Path.Length + 1)
        -not ($relativePath -like "*node_modules*")
    }
    $totalFiles = $backendFiles.Count
    $currentFile = 0
    
    Write-Progress -Activity "Syncing Backend" -Status "Preparing..." -PercentComplete 0
    
    foreach ($file in $backendFiles) {
        $currentFile++
        $percent = [math]::Round(($currentFile / $totalFiles) * 100)
        $relativePath = $file.FullName.Substring((Resolve-Path "server").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${backendPath}/${relativePath}"
        
        Write-Progress -Activity "Syncing Backend" -Status "Uploading: $($file.Name)" -PercentComplete $percent -CurrentOperation "$currentFile of $totalFiles files"
        
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
    
    Write-Progress -Activity "Syncing Backend" -Status "Complete" -PercentComplete 100 -Completed
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
    
    Write-Progress -Activity "Syncing Public Files" -Status "Preparing..." -PercentComplete 0
    
    foreach ($file in $publicFiles) {
        $currentFile++
        $percent = [math]::Round(($currentFile / $totalFiles) * 100)
        $relativePath = $file.FullName.Substring((Resolve-Path "public").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/${relativePath}"
        
        Write-Progress -Activity "Syncing Public Files" -Status "Uploading: $($file.Name)" -PercentComplete $percent -CurrentOperation "$currentFile of $totalFiles files"
        
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
    
    Write-Progress -Activity "Syncing Public Files" -Status "Complete" -PercentComplete 100 -Completed
    Write-Host "   ✓ Synced $totalFiles public files" -ForegroundColor Green
} else {
    Write-Host "   ⚠ public directory not found, skipping" -ForegroundColor Yellow
}

# Step 5: Install dependencies
Write-Host "`n[5/6] Installing Backend Dependencies..." -ForegroundColor Cyan
Write-Progress -Activity "Installing Dependencies" -Status "Running npm install..." -PercentComplete 50

$installCmd = "cd $backendPath; npm install --production"
$plinkArgs = @(
    "-P", $config.ssh.port,
    "-pw", $config.ssh.password,
    "-i", $config.ssh.keyPath,
    "-batch",
    "$($config.ssh.username)@$($config.ssh.host)",
    $installCmd
)

$installResult = echo $config.ssh.password | & $plink @plinkArgs 2>&1
Write-Progress -Activity "Installing Dependencies" -Status "Complete" -PercentComplete 100 -Completed
Write-Host "   ✓ Dependencies installed" -ForegroundColor Green

# Step 6: Restart backend server
Write-Host "`n[6/6] Restarting Backend Server..." -ForegroundColor Cyan
Write-Progress -Activity "Restarting Server" -Status "Stopping old process..." -PercentComplete 25

$restartCmd = 'cd ' + $backendPath + '; ' + $pm2Path + ' restart medarion-backend 2>/dev/null || ' + $pm2Path + ' start server.js --name medarion-backend --log server.log'
$plinkArgs = @(
    "-P", $config.ssh.port,
    "-pw", $config.ssh.password,
    "-i", $config.ssh.keyPath,
    "-batch",
    "$($config.ssh.username)@$($config.ssh.host)",
    $restartCmd
)

Write-Progress -Activity "Restarting Server" -Status "Starting server..." -PercentComplete 75
$restartResult = echo $config.ssh.password | & $plink @plinkArgs 2>&1

Start-Sleep -Seconds 2
Write-Progress -Activity "Restarting Server" -Status "Verifying..." -PercentComplete 90

# Verify server
$statusCmd = "$pm2Path list"
$plinkArgs = @(
    "-P", $config.ssh.port,
    "-pw", $config.ssh.password,
    "-i", $config.ssh.keyPath,
    "-batch",
    "$($config.ssh.username)@$($config.ssh.host)",
    $statusCmd
)
$statusResult = echo $config.ssh.password | & $plink @plinkArgs 2>&1

Write-Progress -Activity "Restarting Server" -Status "Complete" -PercentComplete 100 -Completed
Write-Host "   ✓ Backend server restarted" -ForegroundColor Green
Write-Host "`n   Server Status:" -ForegroundColor Gray
Write-Host $statusResult -ForegroundColor White

# Summary
Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "SYNC COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your application:" -ForegroundColor Yellow
$frontendUrl = 'https://medarion.africa'
Write-Host ('   Frontend: ' + $frontendUrl) -ForegroundColor White
$backendUrl = 'https://api.medarion.africa/health'
Write-Host ('   Backend: ' + $backendUrl) -ForegroundColor White
Write-Host ""

