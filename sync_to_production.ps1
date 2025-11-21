# Quick Sync to Production - Easy Updates
# This script syncs your local changes to production quickly

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$FrontendOnly = $false,
    [switch]$BackendOnly = $false,
    [switch]$SkipBuild = $false
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Quick Sync to Production                               ║" -ForegroundColor Cyan
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

if (-not $config.ssh) {
    Write-Host "❌ SSH not configured" -ForegroundColor Red
    exit 1
}

$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$cpanelUser = if ($config.cpanel) { $config.cpanel.username } else { "medasnnc" }
$publicHtml = "/home/$cpanelUser/public_html"
$nodeAppPath = "/home/$cpanelUser/medarion"

Write-Host "📋 Sync Configuration:" -ForegroundColor Cyan
Write-Host "   Target: $sshHost" -ForegroundColor Gray
Write-Host "   Frontend: $publicHtml" -ForegroundColor Gray
Write-Host "   Backend: $nodeAppPath" -ForegroundColor Gray
Write-Host ""

# Determine what to sync
$syncFrontend = -not $BackendOnly
$syncBackend = -not $FrontendOnly

if ($FrontendOnly) {
    Write-Host "📦 Syncing: Frontend Only" -ForegroundColor Yellow
} elseif ($BackendOnly) {
    Write-Host "📦 Syncing: Backend Only" -ForegroundColor Yellow
} else {
    Write-Host "📦 Syncing: Frontend + Backend" -ForegroundColor Yellow
}
Write-Host ""

# Step 1: Build Frontend (if needed)
if ($syncFrontend -and -not $SkipBuild) {
    Write-Host "🔨 Building Frontend..." -ForegroundColor Yellow
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend built" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Step 2: Prepare Backend (if needed)
if ($syncBackend -and -not $SkipBuild) {
    if (-not (Test-Path "cpanel-nodejs-app")) {
        Write-Host "🔨 Preparing Backend..." -ForegroundColor Yellow
        & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly 2>&1 | Out-Null
        Write-Host "✅ Backend prepared" -ForegroundColor Green
        Write-Host ""
    }
}

# Step 3: Upload Files
Write-Host "📤 Uploading Files..." -ForegroundColor Yellow

# Check for pscp
$pscpPaths = @(
    "${env:ProgramFiles}\PuTTY\pscp.exe",
    "${env:ProgramFiles(x86)}\PuTTY\pscp.exe",
    "$env:LOCALAPPDATA\Programs\PuTTY\pscp.exe"
)

$pscpPath = $null
foreach ($path in $pscpPaths) {
    if (Test-Path $path) {
        $pscpPath = $path
        break
    }
}

if (-not $pscpPath) {
    Write-Host "❌ pscp not found. Install PuTTY or use manual upload." -ForegroundColor Red
    exit 1
}

$keyPath = $config.ssh.keyPath
$password = $config.ssh.password
$sshPort = $config.ssh.port

# Upload Frontend
if ($syncFrontend -and (Test-Path "medarion-dist")) {
    Write-Host "   Uploading frontend..." -ForegroundColor Gray
    
    $frontendTar = "medarion-dist-sync.zip"
    Compress-Archive -Path "medarion-dist\*" -DestinationPath $frontendTar -Force
    
    if ($keyPath -and (Test-Path $keyPath)) {
        & $pscpPath -i $keyPath -P $sshPort $frontendTar "${sshUser}@${sshHost}:$publicHtml/" 2>&1 | Out-Null
    } else {
        echo $password | & $pscpPath -P $sshPort -pw $password $frontendTar "${sshUser}@${sshHost}:$publicHtml/" 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        $extractCmd = "cd $publicHtml && unzip -o $frontendTar && rm -f $frontendTar && chown -R $cpanelUser:$cpanelUser . && echo 'Frontend synced'"
        & ".\run_ssh_command.ps1" -Command $extractCmd | Out-Null
        Write-Host "   ✅ Frontend synced" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Frontend sync had issues" -ForegroundColor Yellow
    }
    
    Remove-Item $frontendTar -ErrorAction SilentlyContinue
}

# Upload Backend
if ($syncBackend -and (Test-Path "cpanel-nodejs-app")) {
    Write-Host "   Uploading backend..." -ForegroundColor Gray
    
    $backendTar = "cpanel-nodejs-app-sync.zip"
    Compress-Archive -Path "cpanel-nodejs-app\*" -DestinationPath $backendTar -Force
    
    if ($keyPath -and (Test-Path $keyPath)) {
        & $pscpPath -i $keyPath -P $sshPort $backendTar "${sshUser}@${sshHost}:$nodeAppPath/" 2>&1 | Out-Null
    } else {
        echo $password | & $pscpPath -P $sshPort -pw $password $backendTar "${sshUser}@${sshHost}:$nodeAppPath/" 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        $extractCmd = "cd $nodeAppPath && unzip -o $backendTar && rm -f $backendTar && chown -R $cpanelUser:$cpanelUser . && echo 'Backend synced'"
        & ".\run_ssh_command.ps1" -Command $extractCmd | Out-Null
        
        # Install new dependencies if package.json changed
        Write-Host "   Installing dependencies..." -ForegroundColor Gray
        & ".\run_ssh_command.ps1" -Command "cd $nodeAppPath && npm install --production" | Out-Null
        
        Write-Host "   ✅ Backend synced" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend sync had issues" -ForegroundColor Yellow
    }
    
    Remove-Item $backendTar -ErrorAction SilentlyContinue
}

Write-Host ""

# Step 4: Restart Node.js App (if backend synced)
if ($syncBackend) {
    Write-Host "🔄 Restarting Node.js App..." -ForegroundColor Yellow
    Write-Host "   💡 Restart via cPanel Node.js Selector" -ForegroundColor Gray
    Write-Host ""
}

# Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Sync Complete!                               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Synced:" -ForegroundColor Cyan
if ($syncFrontend) { Write-Host "   - Frontend → $publicHtml" -ForegroundColor Green }
if ($syncBackend) { Write-Host "   - Backend → $nodeAppPath" -ForegroundColor Green }
Write-Host ""

Write-Host "💡 Quick Commands:" -ForegroundColor Cyan
Write-Host "   # Sync frontend only" -ForegroundColor Gray
Write-Host "   .\sync_to_production.ps1 -FrontendOnly" -ForegroundColor White
Write-Host ""
Write-Host "   # Sync backend only" -ForegroundColor Gray
Write-Host "   .\sync_to_production.ps1 -BackendOnly" -ForegroundColor White
Write-Host ""
Write-Host "   # Sync without rebuilding" -ForegroundColor Gray
Write-Host "   .\sync_to_production.ps1 -SkipBuild" -ForegroundColor White
Write-Host ""

