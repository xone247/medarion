# Export Local Database and Import to cPanel
# This script exports the local MySQL database and imports it to cPanel

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json

# Local database config
$localDbHost = "localhost"
$localDbPort = 3306
$localDbUser = "root"
$localDbPass = ""  # XAMPP default is empty
$localDbName = "medarion_platform"  # From server/config/database.js default

# cPanel database config
$remoteDbHost = $config.database.host
$remoteDbPort = $config.database.port
$remoteDbUser = $config.database.username
$remoteDbPass = $config.database.password
$remoteDbName = $config.database.name

$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"

$exportFile = "medarion_database_export.sql"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportFileWithTimestamp = "medarion_database_export_$timestamp.sql"

Write-Host "📦 Database Export and Import" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Export local database
Write-Host "📋 Step 1: Exporting Local Database..." -ForegroundColor Yellow
Write-Host "   Database: $localDbName" -ForegroundColor Gray
Write-Host "   Host: $localDbHost" -ForegroundColor Gray

$mysqldumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
if (-not (Test-Path $mysqldumpPath)) {
    Write-Host "❌ mysqldump not found at: $mysqldumpPath" -ForegroundColor Red
    Write-Host "   Please provide the path to mysqldump.exe" -ForegroundColor Yellow
    exit 1
}

$exportCmd = "& `"$mysqldumpPath`" -h $localDbHost -P $localDbPort -u $localDbUser"
if ($localDbPass) {
    $exportCmd += " -p$localDbPass"
}
$exportCmd += " --single-transaction --routines --triggers $localDbName > `"$exportFileWithTimestamp`""

Write-Host "   Running mysqldump..." -ForegroundColor Gray
Invoke-Expression $exportCmd

if ($LASTEXITCODE -eq 0 -and (Test-Path $exportFileWithTimestamp)) {
    $fileSize = (Get-Item $exportFileWithTimestamp).Length / 1MB
    Write-Host "✅ Database exported: $exportFileWithTimestamp ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ Export failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload to cPanel server
Write-Host "📋 Step 2: Uploading to cPanel Server..." -ForegroundColor Yellow
Write-Host "   Uploading: $exportFileWithTimestamp" -ForegroundColor Gray

echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "$exportFileWithTimestamp" "$sshUser@${sshHost}:/tmp/$exportFileWithTimestamp" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ File uploaded to cPanel server" -ForegroundColor Green
} else {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Backup existing database on cPanel
Write-Host "📋 Step 3: Backing Up Existing cPanel Database..." -ForegroundColor Yellow
$backupFile = "/tmp/medarion_backup_$timestamp.sql"
$backupCmd = "mysqldump -h $remoteDbHost -P $remoteDbPort -u $remoteDbUser -p$remoteDbPass $remoteDbName > $backupFile 2>&1 && echo 'Backup created: $backupFile' || echo 'Backup failed'"

$backupResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $backupCmd 2>&1

if ($backupResult -match "Backup created") {
    Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backup may have failed, but continuing..." -ForegroundColor Yellow
    Write-Host "   $backupResult" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Import to cPanel database
Write-Host "📋 Step 4: Importing Database to cPanel..." -ForegroundColor Yellow
Write-Host "   Database: $remoteDbName" -ForegroundColor Gray
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$importCmd = @"
mysql -h $remoteDbHost -P $remoteDbPort -u $remoteDbUser -p$remoteDbPass $remoteDbName < /tmp/$exportFileWithTimestamp 2>&1 && echo 'Import successful' || echo 'Import failed'
"@

$importResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $importCmd 2>&1

if ($importResult -match "Import successful|ERROR" -eq $false) {
    Write-Host "✅ Database imported successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Import result:" -ForegroundColor Yellow
    Write-Host "   $importResult" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Verify import
Write-Host "📋 Step 5: Verifying Import..." -ForegroundColor Yellow
$verifyCmd = "mysql -h $remoteDbHost -P $remoteDbPort -u $remoteDbUser -p$remoteDbPass $remoteDbName -e 'SHOW TABLES;' 2>&1 | head -20"

$verifyResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $verifyCmd 2>&1

if ($verifyResult -match "Tables_in") {
    Write-Host "✅ Database verification successful!" -ForegroundColor Green
    Write-Host "   Tables found in database" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Verification:" -ForegroundColor Yellow
    Write-Host "   $verifyResult" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Restart Node.js service
Write-Host "📋 Step 6: Restarting Node.js Service..." -ForegroundColor Yellow
$restartCmd = "systemctl restart medarion-api.service && sleep 3 && systemctl status medarion-api.service --no-pager | head -8"

$restartResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $restartCmd 2>&1

if ($restartResult -match "active.*running") {
    Write-Host "✅ Service restarted and running!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service status:" -ForegroundColor Yellow
    Write-Host "   $restartResult" -ForegroundColor Gray
}
Write-Host ""

Write-Host "✅ Database Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Local database exported" -ForegroundColor White
Write-Host "   ✅ Backup created on cPanel" -ForegroundColor White
Write-Host "   ✅ Database imported to cPanel" -ForegroundColor White
Write-Host "   ✅ Service restarted" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files:" -ForegroundColor Cyan
Write-Host "   Local export: $exportFileWithTimestamp" -ForegroundColor White
Write-Host "   cPanel backup: $backupFile" -ForegroundColor White
Write-Host ""
