# Step 1: Cleanup cPanel
# This script cleans the cPanel environment before deployment

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 1: Cleanup cPanel                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load config
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$dbName = $config.database.name
$dbUser = $config.database.username
$dbPass = $config.database.password

# Function to run SSH command
function Run-SSH-Auto {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*" -and $result -notlike "*publickey*") {
        return $result
    }
    return $result
}

# Function to upload file
function Upload-File-Auto {
    param([string]$Local, [string]$Remote)
    if (-not (Test-Path $Local)) {
        return $false
    }
    echo $password | & $pscpPath -P $sshPort -pw $password "$Local" "$sshUser@${sshHost}:${Remote}" 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# Function to download file
function Download-File-Auto {
    param([string]$Remote, [string]$Local)
    $pscpPath = "C:\Program Files\PuTTY\pscp.exe"
    echo $password | & $pscpPath -P $sshPort -pw $password "$sshUser@${sshHost}:${Remote}" "$Local" 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

Write-Host "📋 Cleaning cPanel..." -ForegroundColor Yellow
Write-Host ""

# Check if database exists before backing up
Write-Host "🔍 Checking if database exists..." -ForegroundColor Yellow
$dbCheckResult = Run-SSH-Auto "mysql -u $dbUser -p$dbPass -e 'SHOW DATABASES LIKE `"$dbName`";' 2>/dev/null"
$dbCheck = if ($dbCheckResult -like "*$dbName*") { "EXISTS" } else { "NOT_EXISTS" }

if ($dbCheck -like "*EXISTS*") {
    Write-Host "   ✅ Database exists, creating backup..." -ForegroundColor Green
    
    # Backup database before cleanup
    Write-Host "Backing up database before cleanup..." -ForegroundColor Yellow
    $dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "medarion_backup_$dateStr.sql"
    $backupCmd = "mysqldump -u $dbUser -p$dbPass $dbName > /tmp/$backupFile; echo BACKUP_SUCCESS"
    $backupResult = Run-SSH-Auto $backupCmd

    if ($backupResult -like "*BACKUP_SUCCESS*") {
    # Download backup to local
    Write-Host "   📥 Downloading backup..." -ForegroundColor Gray
    $localBackupDir = "backups"
    if (-not (Test-Path $localBackupDir)) {
        New-Item -ItemType Directory -Path $localBackupDir -Force | Out-Null
    }
    
    if (Download-File-Auto "/tmp/$backupFile" "$localBackupDir/$backupFile") {
        Write-Host "   ✅ Database backed up: $localBackupDir/$backupFile" -ForegroundColor Green
        # Remove remote backup
        Run-SSH-Auto "rm /tmp/$backupFile" | Out-Null
    } else {
        Write-Host "   ⚠️  Backup created on server but download failed" -ForegroundColor Yellow
        Write-Host "      Backup location: /tmp/$backupFile" -ForegroundColor Gray
    }
    } else {
        Write-Host "   ⚠️  Database backup failed (continuing anyway)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Database does not exist, skipping backup" -ForegroundColor Gray
}
Write-Host ""

# Create cleanup script using here-string
$cleanupFile = [System.IO.Path]::GetTempFileName()
$cleanupScript = @"
pm2 stop all
pm2 delete all
pkill -f node.*server.js
rm -rf /home/medasnnc/public_html/*
rm -rf /home/medasnnc/public_html/.*
rm -rf /home/medasnnc/nodevenv/medarion
rm -rf /home/medasnnc/medarion
find /home/medasnnc -name "*medarion*" -type d -exec rm -rf {} +
find /home/medasnnc -name "*medarion*" -type f -delete
mysql -u $dbUser -p$dbPass -e "DROP DATABASE IF EXISTS $dbName;"
mysql -u $dbUser -p$dbPass -e "CREATE DATABASE IF NOT EXISTS $dbName;"
mkdir -p /home/medasnnc/public_html
mkdir -p /home/medasnnc/nodevenv/medarion/18/server
mkdir -p /home/medasnnc/medarion
chown -R medasnnc:medasnnc /home/medasnnc/public_html
chown -R medasnnc:medasnnc /home/medasnnc/nodevenv
chmod -R 755 /home/medasnnc/public_html
echo Cleanup finished
"@

Set-Content -Path $cleanupFile -Value $cleanupScript

# Upload and execute
Write-Host "   📤 Uploading cleanup script..." -ForegroundColor Gray
if (Upload-File-Auto $cleanupFile "/tmp/cleanup.sh") {
    Write-Host "   ✅ Cleanup script uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload cleanup script" -ForegroundColor Red
    Remove-Item $cleanupFile -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "   🔨 Executing cleanup..." -ForegroundColor Gray
$result = Run-SSH-Auto "chmod +x /tmp/cleanup.sh; bash /tmp/cleanup.sh; rm /tmp/cleanup.sh"

Remove-Item $cleanupFile -ErrorAction SilentlyContinue

if ($result -like "*finished*" -or $result -like "*Cleanup*") {
    Write-Host "   ✅ Cleanup completed successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Cleanup may have had issues" -ForegroundColor Yellow
    Write-Host "   Output: $result" -ForegroundColor Gray
}

# Verify cleanup
Write-Host ""
Write-Host "🔍 Verifying cleanup..." -ForegroundColor Yellow
$verifyResult = Run-SSH-Auto "test -d /home/medasnnc/public_html"
$verify = if ($LASTEXITCODE -eq 0) { "EXISTS" } else { "MISSING" }
if ($verify -like "*EXISTS*") {
    Write-Host "   ✅ Directories recreated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Directories may not exist" -ForegroundColor Yellow
}

# Update state
if ($LASTEXITCODE -eq 0) {
    Update-StepStatus "step1_cleanup" "completed"
    Write-Host ""
    Write-Host "✅ Step 1 Complete: Cleanup finished" -ForegroundColor Green
} else {
    Update-StepStatus "step1_cleanup" "failed" "Cleanup script execution failed"
    Write-Host ""
    Write-Host "❌ Step 1 Failed: Cleanup had errors" -ForegroundColor Red
    exit 1
}
Write-Host ""

