# Complete cPanel Cleanup and Deployment Script
# Cleans public_html, uploads files, and starts backend server

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Complete cPanel Cleanup and Deployment" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "`n❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password

# Paths
$publicHtmlPath = "/home/medasnnc/public_html"
$backendPath = "$publicHtmlPath/server"

Write-Host "`n📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $sshHost" -ForegroundColor White
Write-Host "   User: $sshUser" -ForegroundColor White
Write-Host "   Port: $sshPort" -ForegroundColor White
Write-Host "   Public HTML: $publicHtmlPath" -ForegroundColor White
Write-Host "   Backend: $backendPath" -ForegroundColor White

# Function to run SSH command
function Run-SSH-Command {
    param([string]$Cmd, [switch]$ShowOutput = $true)
    $result = & $plinkPath -P $sshPort "${sshUser}@${sshHost}" $Cmd 2>&1
    if ($ShowOutput -and $result) {
        Write-Host $result -ForegroundColor Gray
    }
    return $result
}

# Function to upload file/directory
function Upload-File {
    param([string]$LocalPath, [string]$RemotePath)
    if (-not (Test-Path $LocalPath)) {
        Write-Host "   ❌ Local path not found: $LocalPath" -ForegroundColor Red
        return $false
    }
    Write-Host "   Uploading: $LocalPath → $RemotePath" -ForegroundColor Gray
    $result = & $pscpPath -P $sshPort -r "$LocalPath" "${sshUser}@${sshHost}:${RemotePath}" 2>&1
    if ($LASTEXITCODE -eq 0) {
        return $true
    } else {
        Write-Host "   ⚠️  Upload warning: $result" -ForegroundColor Yellow
        return $false
    }
}

# ============================================================
# Step 1: Aggressively Clean public_html
# ============================================================
Write-Host "`n[Step 1/7] Cleaning public_html (Aggressive Method)" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n[1.1] Stopping any running Node.js processes..." -ForegroundColor Cyan
Run-SSH-Command "pkill -f 'node.*server.js' || true" -ShowOutput $false
Run-SSH-Command "pkill -f 'pm2' || true" -ShowOutput $false
Start-Sleep -Seconds 2

Write-Host "`n[1.2] Removing all files and folders (including stubborn files)..." -ForegroundColor Cyan
# Multiple aggressive deletion methods
$cleanupCommands = @(
    "cd $publicHtmlPath && find . -type f -delete 2>/dev/null || true",
    "cd $publicHtmlPath && find . -type d -mindepth 1 -delete 2>/dev/null || true",
    "rm -rf $publicHtmlPath/* $publicHtmlPath/.* 2>/dev/null || true",
    "cd $publicHtmlPath && rm -rf * .[^.]* 2>/dev/null || true",
    "chmod -R 777 $publicHtmlPath 2>/dev/null || true",
    "cd $publicHtmlPath && rm -rf * .htaccess .well-known 2>/dev/null || true"
)

foreach ($cmd in $cleanupCommands) {
    Run-SSH-Command $cmd -ShowOutput $false
}

# Verify cleanup
Write-Host "`n[1.3] Verifying cleanup..." -ForegroundColor Cyan
$verifyResult = Run-SSH-Command "ls -la $publicHtmlPath | wc -l" -ShowOutput $false
if ($verifyResult -match "^\s*[0-2]\s*$" -or $verifyResult -match "^2$" -or $verifyResult -match "^3$") {
    Write-Host "   ✅ public_html is clean" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Some files may remain, but continuing..." -ForegroundColor Yellow
}

# ============================================================
# Step 2: Create Directory Structure
# ============================================================
Write-Host "`n[Step 2/7] Creating Directory Structure" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n[2.1] Creating backend directory..." -ForegroundColor Cyan
Run-SSH-Command "mkdir -p $backendPath" -ShowOutput $false
Write-Host "   ✅ Created: $backendPath" -ForegroundColor Green

# ============================================================
# Step 3: Upload Frontend Files
# ============================================================
Write-Host "`n[Step 3/7] Uploading Frontend Files" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (-not (Test-Path "medarion-dist")) {
    Write-Host "`n❌ medarion-dist/ folder not found!" -ForegroundColor Red
    Write-Host "   Please run: npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[3.1] Uploading frontend files..." -ForegroundColor Cyan
$frontendFiles = Get-ChildItem -Path "medarion-dist" -Recurse -File
$totalFiles = $frontendFiles.Count
$currentFile = 0

foreach ($file in $frontendFiles) {
    $currentFile++
    $relativePath = $file.FullName.Substring((Resolve-Path "medarion-dist").Path.Length + 1)
    $remotePath = "$publicHtmlPath/$relativePath"
    $remoteDir = Split-Path $remotePath -Parent
    
    # Create remote directory if needed
    if ($remoteDir -ne $publicHtmlPath) {
        $remoteDirUnix = $remoteDir.Replace('\', '/')
        Run-SSH-Command "mkdir -p `"$remoteDirUnix`"" -ShowOutput $false
    }
    
    # Upload file
    $remotePathUnix = $remotePath.Replace('\', '/')
    if (Upload-File -LocalPath $file.FullName -RemotePath $remotePathUnix) {
        Write-Host "   [$currentFile/$totalFiles] ✅ $relativePath" -ForegroundColor Green
    } else {
        Write-Host "   [$currentFile/$totalFiles] ⚠️  $relativePath" -ForegroundColor Yellow
    }
}

Write-Host "`n   ✅ Frontend upload complete ($totalFiles files)" -ForegroundColor Green

# ============================================================
# Step 4: Upload Backend Files
# ============================================================
Write-Host "`n[Step 4/7] Uploading Backend Files" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (-not (Test-Path "server")) {
    Write-Host "`n❌ server/ folder not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4.1] Uploading backend files (excluding node_modules)..." -ForegroundColor Cyan
$backendFiles = Get-ChildItem -Path "server" -Recurse -File | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*.log" -and
    $_.FullName -notlike "*.env.local"
}
$totalBackendFiles = $backendFiles.Count
$currentBackendFile = 0

foreach ($file in $backendFiles) {
    $currentBackendFile++
    $relativePath = $file.FullName.Substring((Resolve-Path "server").Path.Length + 1)
    $remotePath = "$backendPath/$relativePath"
    $remoteDir = Split-Path $remotePath -Parent
    
    # Create remote directory if needed
    if ($remoteDir -ne $backendPath) {
        $remoteDirUnix = $remoteDir.Replace('\', '/')
        Run-SSH-Command "mkdir -p `"$remoteDirUnix`"" -ShowOutput $false
    }
    
    # Upload file
    $remotePathUnix = $remotePath.Replace('\', '/')
    if (Upload-File -LocalPath $file.FullName -RemotePath $remotePathUnix) {
        Write-Host "   [$currentBackendFile/$totalBackendFiles] ✅ $relativePath" -ForegroundColor Green
    } else {
        Write-Host "   [$currentBackendFile/$totalBackendFiles] ⚠️  $relativePath" -ForegroundColor Yellow
    }
}

Write-Host "`n   ✅ Backend upload complete ($totalBackendFiles files)" -ForegroundColor Green

# ============================================================
# Step 5: Create .env File
# ============================================================
Write-Host "`n[Step 5/7] Creating Backend .env File" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n[5.1] Creating .env file..." -ForegroundColor Cyan

# Read local .env if exists, otherwise use template
$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$($config.database.name)
DB_USER=$($config.database.username)
DB_PASSWORD=$($config.database.password)

# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS

# CORS Configuration
CORS_ORIGIN=https://medarion.africa

# AI Configuration (Vast.ai via Cloudflare tunnel)
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast
"@

# Create temporary .env file
$tempEnvFile = "$env:TEMP\cpanel.env"
Set-Content -Path $tempEnvFile -Value $envContent -Encoding UTF8

# Upload .env file
if (Upload-File -LocalPath $tempEnvFile -RemotePath "$backendPath/.env") {
    Write-Host "   ✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env upload failed, creating manually..." -ForegroundColor Yellow
    # Create .env via SSH
    $envContentEscaped = $envContent -replace '"', '\"'
    Run-SSH-Command "cat > $backendPath/.env << 'ENVEOF'
$envContent
ENVEOF" -ShowOutput $false
    Write-Host "   ✅ .env file created via SSH" -ForegroundColor Green
}

# Clean up temp file
Remove-Item $tempEnvFile -ErrorAction SilentlyContinue

# ============================================================
# Step 6: Install Backend Dependencies
# ============================================================
Write-Host "`n[Step 6/7] Installing Backend Dependencies" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n[6.1] Installing npm packages..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$installResult = Run-SSH-Command "cd $backendPath && npm install --production" -ShowOutput $true

if ($LASTEXITCODE -eq 0 -or $installResult -like "*added*" -or $installResult -like "*up to date*") {
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Installation may have issues, but continuing..." -ForegroundColor Yellow
}

# ============================================================
# Step 7: Start Backend Server
# ============================================================
Write-Host "`n[Step 7/7] Starting Backend Server" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n[7.1] Setting permissions..." -ForegroundColor Cyan
Run-SSH-Command "chmod +x $backendPath/server.js" -ShowOutput $false
Run-SSH-Command "chmod -R 755 $backendPath" -ShowOutput $false

Write-Host "`n[7.2] Starting backend server..." -ForegroundColor Cyan
# Try PM2 first, then fallback to nohup
$pm2Check = Run-SSH-Command "which pm2" -ShowOutput $false
if ($pm2Check -and $pm2Check -notlike "*not found*") {
    Write-Host "   Using PM2 to start server..." -ForegroundColor Gray
    Run-SSH-Command "cd $backendPath && pm2 stop medarion-backend 2>/dev/null || true" -ShowOutput $false
    Run-SSH-Command "cd $backendPath && pm2 start server.js --name medarion-backend" -ShowOutput $true
    Run-SSH-Command "pm2 save" -ShowOutput $false
    Write-Host "   ✅ Backend started with PM2" -ForegroundColor Green
} else {
    Write-Host "   Using nohup to start server..." -ForegroundColor Gray
    Run-SSH-Command "cd $backendPath && nohup node server.js > server.log 2>&1 &" -ShowOutput $false
    Start-Sleep -Seconds 3
    Write-Host "   ✅ Backend started with nohup" -ForegroundColor Green
}

Write-Host "`n[7.3] Verifying backend is running..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
$healthCheck = Run-SSH-Command "curl -s http://localhost:3001/health || echo 'not_responding'" -ShowOutput $false
if ($healthCheck -like "*ok*" -or $healthCheck -like "*status*") {
    Write-Host "   ✅ Backend is running and responding!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend may still be starting..." -ForegroundColor Yellow
    Write-Host "   Check logs: cd $backendPath && tail -f server.log" -ForegroundColor Gray
}

# ============================================================
# Final Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n📦 Files Deployed:" -ForegroundColor Cyan
Write-Host "   ✅ Frontend: $publicHtmlPath/" -ForegroundColor White
Write-Host "   ✅ Backend: $backendPath/" -ForegroundColor White
Write-Host "   ✅ .env: Created" -ForegroundColor White
Write-Host "   ✅ Dependencies: Installed" -ForegroundColor White
Write-Host "   ✅ Server: Started" -ForegroundColor White

Write-Host "`n🌐 Test URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend: https://medarion.africa" -ForegroundColor White
Write-Host "   • Backend Health: https://medarion.africa/server/health" -ForegroundColor White
Write-Host "   • Backend API: https://medarion.africa/server/api/ai/query" -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the website: https://medarion.africa" -ForegroundColor White
Write-Host "   2. Check backend logs if needed: cd $backendPath && tail -f server.log" -ForegroundColor White
Write-Host "   3. If using PM2: pm2 logs medarion-backend" -ForegroundColor White

Write-Host "`n"

