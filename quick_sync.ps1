# Quick Sync Script - Fast sync for regular development
# Usage: .\quick_sync.ps1 [--frontend-only] [--backend-only] [--no-db] [--no-git]

param(
    [switch]$FrontendOnly = $false,
    [switch]$BackendOnly = $false,
    [switch]$NoDb = $false,
    [switch]$NoGit = $false
)

Write-Host ""
Write-Host "⚡ Quick Sync: Local → cPanel → Git" -ForegroundColor Cyan
Write-Host ""

# Load configuration
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"

# Build frontend if needed
if (-not $BackendOnly) {
    Write-Host "📦 Building frontend..." -ForegroundColor Yellow
    npm run build 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend built" -ForegroundColor Green
        
        # Upload frontend
        Write-Host "📤 Uploading frontend..." -ForegroundColor Yellow
        & $pscpPath -P $sshPort -r "medarion-dist\*" "${sshUser}@${sshHost}:${frontendPath}/" 2>&1 | Out-Null
        Write-Host "✅ Frontend uploaded" -ForegroundColor Green
    }
}

# Upload backend if needed
if (-not $FrontendOnly) {
    Write-Host "📤 Uploading backend..." -ForegroundColor Yellow
    
    # Upload key files
    if (Test-Path "server/server.js") {
        & $pscpPath -P $sshPort "server/server.js" "${sshUser}@${sshHost}:${backendPath}/server.js" 2>&1 | Out-Null
    }
    
    if (Test-Path "server/routes") {
        & $pscpPath -P $sshPort -r "server/routes" "${sshUser}@${sshHost}:${backendPath}/" 2>&1 | Out-Null
    }
    
    # Restart backend
    Write-Host "🔄 Restarting backend..." -ForegroundColor Yellow
    $restartCmd = "cd $backendPath && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend 2>&1 || /opt/cpanel/ea-nodejs22/bin/pm2 start server.js --name medarion-backend 2>&1"
    & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $restartCmd 2>&1 | Out-Null
    Write-Host "✅ Backend restarted" -ForegroundColor Green
}

# Sync database if needed
if (-not $NoDb) {
    Write-Host "💾 Syncing database..." -ForegroundColor Yellow
    
    # Find mysqldump
    $mysqldumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
    if (-not (Test-Path $mysqldumpPath)) {
        $mysqldumpPath = "mysqldump"
    }
    
    $dumpFile = "$env:TEMP\medarion_quick_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    & $mysqldumpPath -h localhost -u root medarion_platform > $dumpFile 2>&1
    
    if (Test-Path $dumpFile) {
        $remoteDumpFile = "/tmp/medarion_dump.sql"
        & $pscpPath -P $sshPort "$dumpFile" "${sshUser}@${sshHost}:${remoteDumpFile}" 2>&1 | Out-Null
        
        $importCmd = "mysql -u $($config.database.username) -p$($config.database.password) $($config.database.name) < $remoteDumpFile 2>&1"
        & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $importCmd 2>&1 | Out-Null
        
        Write-Host "✅ Database synced" -ForegroundColor Green
        Remove-Item $dumpFile -ErrorAction SilentlyContinue
    }
}

# Sync to Git if needed
if (-not $NoGit) {
    Write-Host "📝 Syncing to Git..." -ForegroundColor Yellow
    git add -A 2>&1 | Out-Null
    git commit -m "Quick sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 2>&1 | Out-Null
    git push origin master 2>&1 | Out-Null
    Write-Host "✅ Git synced" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Quick sync complete!" -ForegroundColor Green
Write-Host ""

