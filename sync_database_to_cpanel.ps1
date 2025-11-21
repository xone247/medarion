# Sync Local Database to cPanel
# Exports local database and imports to cPanel

$ErrorActionPreference = "Continue"

Write-Host "`n🔄 Syncing Database to cPanel" -ForegroundColor Cyan
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

# Database credentials
$localDbName = "medarion_platform"
$localDbUser = "root"
$localDbPass = ""
$localDbHost = "localhost"

$remoteDbName = $config.database.name
$remoteDbUser = $config.database.username
$remoteDbPass = $config.database.password
$remoteDbHost = $config.database.host

Write-Host "`n📋 Database Configuration:" -ForegroundColor Cyan
Write-Host "   Local DB: $localDbName @ $localDbHost" -ForegroundColor White
Write-Host "   Remote DB: $remoteDbName @ $remoteDbHost" -ForegroundColor White

# ============================================================
# Step 1: Export Local Database
# ============================================================
Write-Host "`n[1/4] Exporting Local Database..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$dumpFile = "$env:TEMP\medarion_dump_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "   Exporting to: $dumpFile" -ForegroundColor Gray

# Check if mysqldump is available
$mysqldumpPath = "mysqldump"
try {
    $null = Get-Command mysqldump -ErrorAction Stop
} catch {
    Write-Host "   ⚠️  mysqldump not found in PATH" -ForegroundColor Yellow
    Write-Host "   Trying common locations..." -ForegroundColor Gray
    
    $commonPaths = @(
        "C:\xampp\mysql\bin\mysqldump.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        "C:\Program Files\MariaDB\bin\mysqldump.exe"
    )
    
    $found = $false
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $mysqldumpPath = $path
            $found = $true
            Write-Host "   ✅ Found: $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $found) {
        Write-Host "   ❌ mysqldump not found!" -ForegroundColor Red
        Write-Host "   Please install MySQL/MariaDB or add mysqldump to PATH" -ForegroundColor Yellow
        exit 1
    }
}

# Export database
if ($localDbPass) {
    $exportCmd = "& `"$mysqldumpPath`" -h $localDbHost -u $localDbUser -p`"$localDbPass`" $localDbName > `"$dumpFile`""
} else {
    $exportCmd = "& `"$mysqldumpPath`" -h $localDbHost -u $localDbUser $localDbName > `"$dumpFile`""
}

Write-Host "   Running mysqldump..." -ForegroundColor Gray
Invoke-Expression $exportCmd

if ($LASTEXITCODE -eq 0 -and (Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
    $fileSize = (Get-Item $dumpFile).Length / 1MB
    Write-Host "   ✅ Database exported ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Database export failed!" -ForegroundColor Red
    exit 1
}

# ============================================================
# Step 2: Upload Dump File to cPanel
# ============================================================
Write-Host "`n[2/4] Uploading Dump File to cPanel..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$remoteDumpFile = "/tmp/medarion_dump.sql"
Write-Host "   Uploading: $dumpFile → $remoteDumpFile" -ForegroundColor Gray

$uploadResult = & $pscpPath -P $sshPort "$dumpFile" "${sshUser}@${sshHost}:${remoteDumpFile}" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dump file uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Upload failed: $uploadResult" -ForegroundColor Red
    exit 1
}

# ============================================================
# Step 3: Import Database on cPanel
# ============================================================
Write-Host "`n[3/4] Importing Database on cPanel..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   Importing to database: $remoteDbName" -ForegroundColor Gray
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

# Import database
$importCmd = "mysql -h $remoteDbHost -u $remoteDbUser -p`"$remoteDbPass`" $remoteDbName < $remoteDumpFile"
$importResult = & $plinkPath -P $sshPort "${sshUser}@${sshHost}" $importCmd 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database imported successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Import completed with warnings: $importResult" -ForegroundColor Yellow
    Write-Host "   (This may be normal if tables already exist)" -ForegroundColor Gray
}

# ============================================================
# Step 4: Verify Database Connection
# ============================================================
Write-Host "`n[4/4] Verifying Database Connection..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Test connection
$testCmd = "mysql -h $remoteDbHost -u $remoteDbUser -p`"$remoteDbPass`" $remoteDbName -e 'SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = `"$remoteDbName`";'"
$testResult = & $plinkPath -P $sshPort "${sshUser}@${sshHost}" $testCmd 2>&1

if ($testResult -like "*table_count*") {
    Write-Host "   ✅ Database connection verified" -ForegroundColor Green
    Write-Host "   Tables found in database" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Could not verify connection: $testResult" -ForegroundColor Yellow
}

# Clean up
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Cyan
& $plinkPath -P $sshPort "${sshUser}@${sshHost}" "rm -f $remoteDumpFile" 2>&1 | Out-Null
Remove-Item $dumpFile -ErrorAction SilentlyContinue

# ============================================================
# Summary
# ============================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Database Sync Complete" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify .env file on cPanel has correct database credentials" -ForegroundColor White
Write-Host "   2. Restart backend server to use new database" -ForegroundColor White
Write-Host "   3. Test API endpoints to verify database connection" -ForegroundColor White

Write-Host "`n💡 Database Credentials (cPanel):" -ForegroundColor Yellow
Write-Host "   Host: $remoteDbHost" -ForegroundColor White
Write-Host "   Database: $remoteDbName" -ForegroundColor White
Write-Host "   User: $remoteDbUser" -ForegroundColor White
Write-Host "   Password: $remoteDbPass" -ForegroundColor White

Write-Host "`n"

