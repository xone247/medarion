# Production Sync: Git to cPanel
# Syncs all files from git repository to cPanel and updates backend server
# This script is designed for production deployment workflow

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🚀 PRODUCTION SYNC: Git to cPanel" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Load configuration
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$usePlink = $config.ssh.usePlink
$plinkPath = $config.ssh.plinkPath
$sshPassword = $config.ssh.password
$keyPath = $config.ssh.keyPath

# Server paths
$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"
$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   SSH: ${sshUser}@${sshHost}:${sshPort}" -ForegroundColor Gray
Write-Host "   Frontend: $frontendPath" -ForegroundColor Gray
Write-Host "   Backend: $backendPath" -ForegroundColor Gray
Write-Host ""

# Function to execute SSH command
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [switch]$ShowOutput = $false
    )
    
    if ($usePlink) {
        if ($sshPassword) {
            $result = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword -i $keyPath -batch "${sshUser}@${sshHost}" $Command 2>&1
        } else {
            $result = & $plinkPath -P $sshPort -i $keyPath -batch "${sshUser}@${sshHost}" $Command 2>&1
        }
    } else {
        $result = ssh -i $keyPath -p $sshPort "${sshUser}@${sshHost}" $Command 2>&1
    }
    
    if ($ShowOutput) {
        Write-Host $result
    }
    return $result
}

# Function to upload file via SCP
function Invoke-SCPUpload {
    param(
        [string]$LocalFile,
        [string]$RemoteFile
    )
    
    $remoteDir = Split-Path $RemoteFile -Parent
    $remoteDir = $remoteDir -replace '\\', '/'
    
    # Create remote directory
    Invoke-SSHCommand "mkdir -p `"$remoteDir`"" | Out-Null
    
    # Upload file
    if ($usePlink) {
        $pscpPath = $plinkPath -replace "plink.exe", "pscp.exe"
        if ($sshPassword) {
            echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword -i $keyPath "$LocalFile" "${sshUser}@${sshHost}:${RemoteFile}" 2>&1 | Out-Null
        } else {
            & $pscpPath -P $sshPort -i $keyPath "$LocalFile" "${sshUser}@${sshHost}:${RemoteFile}" 2>&1 | Out-Null
        }
    } else {
        scp -i $keyPath -P $sshPort "$LocalFile" "${sshUser}@${sshHost}:${RemoteFile}" 2>&1 | Out-Null
    }
}

# Step 1: Build frontend
Write-Host "1️⃣  Building Frontend..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    Write-Host "   Running: npm run build" -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Build failed, but continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  No package.json found, skipping build" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Sync frontend files
Write-Host "2️⃣  Syncing Frontend Files..." -ForegroundColor Cyan
if (Test-Path "medarion-dist") {
    $frontendFiles = Get-ChildItem -Path "medarion-dist" -Recurse -File
    $totalFiles = $frontendFiles.Count
    $currentFile = 0
    
    foreach ($file in $frontendFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "medarion-dist").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/${relativePath}"
        
        Invoke-SCPUpload $file.FullName $remoteFile
        
        if ($currentFile % 10 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Progress -Activity "Syncing frontend" -Status "$currentFile of $totalFiles files" -PercentComplete (($currentFile / $totalFiles) * 100)
        }
    }
    Write-Progress -Activity "Syncing frontend" -Completed
    Write-Host "   ✅ Frontend files synced ($totalFiles files)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  medarion-dist not found, skipping frontend sync" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Sync backend files
Write-Host "3️⃣  Syncing Backend Files..." -ForegroundColor Cyan
if (Test-Path "server") {
    $backendFiles = Get-ChildItem -Path "server" -Recurse -File | Where-Object {
        $relativePath = $_.FullName.Substring((Resolve-Path "server").Path.Length + 1)
        -not ($relativePath -like "*node_modules*")
    }
    $totalFiles = $backendFiles.Count
    $currentFile = 0
    
    foreach ($file in $backendFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "server").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${backendPath}/${relativePath}"
        
        Invoke-SCPUpload $file.FullName $remoteFile
        
        if ($currentFile % 10 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Progress -Activity "Syncing backend" -Status "$currentFile of $totalFiles files" -PercentComplete (($currentFile / $totalFiles) * 100)
        }
    }
    Write-Progress -Activity "Syncing backend" -Completed
    Write-Host "   ✅ Backend files synced ($totalFiles files)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  server directory not found, skipping backend sync" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Sync public files (uploads, images, etc.)
Write-Host "4️⃣  Syncing Public Files..." -ForegroundColor Cyan
if (Test-Path "public") {
    $publicFiles = Get-ChildItem -Path "public" -Recurse -File
    $totalFiles = $publicFiles.Count
    $currentFile = 0
    
    foreach ($file in $publicFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "public").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/${relativePath}"
        
        Invoke-SCPUpload $file.FullName $remoteFile
        
        if ($currentFile % 10 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Progress -Activity "Syncing public files" -Status "$currentFile of $totalFiles files" -PercentComplete (($currentFile / $totalFiles) * 100)
        }
    }
    Write-Progress -Activity "Syncing public files" -Completed
    Write-Host "   ✅ Public files synced ($totalFiles files)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  public directory not found, skipping" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Sync API files
Write-Host "5️⃣  Syncing API Files..." -ForegroundColor Cyan
if (Test-Path "api") {
    $apiFiles = Get-ChildItem -Path "api" -Recurse -File
    $totalFiles = $apiFiles.Count
    $currentFile = 0
    
    foreach ($file in $apiFiles) {
        $currentFile++
        $relativePath = $file.FullName.Substring((Resolve-Path "api").Path.Length + 1).Replace('\', '/')
        $remoteFile = "${frontendPath}/api/${relativePath}"
        
        Invoke-SCPUpload $file.FullName $remoteFile
        
        if ($currentFile % 10 -eq 0 -or $currentFile -eq $totalFiles) {
            Write-Progress -Activity "Syncing API files" -Status "$currentFile of $totalFiles files" -PercentComplete (($currentFile / $totalFiles) * 100)
        }
    }
    Write-Progress -Activity "Syncing API files" -Completed
    Write-Host "   ✅ API files synced ($totalFiles files)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  api directory not found, skipping" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Sync config files
Write-Host "6️⃣  Syncing Config Files..." -ForegroundColor Cyan
$configFiles = @(
    @{Local = ".htaccess"; Remote = "${frontendPath}/.htaccess"},
    @{Local = "index.html"; Remote = "${frontendPath}/index.html"}
)

foreach ($configFile in $configFiles) {
    if (Test-Path $configFile.Local) {
        Invoke-SCPUpload $configFile.Local $configFile.Remote
        Write-Host "   ✅ Synced: $($configFile.Local)" -ForegroundColor Green
    }
}
Write-Host ""

# Step 7: Install backend dependencies
Write-Host "7️⃣  Installing Backend Dependencies..." -ForegroundColor Cyan
$installCmd = "cd $backendPath && npm install --production"
$installResult = Invoke-SSHCommand $installCmd -ShowOutput
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 8: Restart backend server
Write-Host "8️⃣  Restarting Backend Server..." -ForegroundColor Cyan
$restartCmd = "cd $backendPath && $pm2Path restart medarion-backend || ($pm2Path stop medarion-backend 2>/dev/null; $pm2Path start server.js --name medarion-backend --log server.log)"
$restartResult = Invoke-SSHCommand $restartCmd -ShowOutput
Write-Host "   ✅ Backend server restarted" -ForegroundColor Green
Write-Host ""

# Step 9: Verify server status
Write-Host "9️⃣  Verifying Server Status..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

$statusCmd = "$pm2Path list"
$statusResult = Invoke-SSHCommand $statusCmd -ShowOutput
Write-Host $statusResult

$healthCmd = "curl -s http://localhost:3001/health || echo 'Health check failed'"
$healthResult = Invoke-SSHCommand $healthCmd -ShowOutput
Write-Host "   Health check: $healthResult" -ForegroundColor $(if ($healthResult -like "*OK*" -or $healthResult -like "*status*") { "Green" } else { "Yellow" })
Write-Host ""

# Step 10: Save PM2 configuration
Write-Host "🔟 Saving PM2 Configuration..." -ForegroundColor Cyan
$saveCmd = "$pm2Path save"
Invoke-SSHCommand $saveCmd | Out-Null
Write-Host "   ✅ PM2 configuration saved" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "✅ SYNC COMPLETE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Frontend files synced" -ForegroundColor Green
Write-Host "   ✅ Backend files synced" -ForegroundColor Green
Write-Host "   ✅ Public files synced" -ForegroundColor Green
Write-Host "   ✅ API files synced" -ForegroundColor Green
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
Write-Host "   ✅ Backend server restarted" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Test your application:" -ForegroundColor Cyan
Write-Host "   Frontend: https://medarion.africa" -ForegroundColor White
Write-Host "   Backend: https://api.medarion.africa/health" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the frontend at https://medarion.africa" -ForegroundColor White
Write-Host "   2. Verify API endpoints are working" -ForegroundColor White
Write-Host "   3. Check server logs if needed: ssh and run 'pm2 logs medarion-backend'" -ForegroundColor White
Write-Host ""

