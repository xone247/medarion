# Export Local Database to Production
# This script exports data from local XAMPP MySQL and imports it to production

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Export Local Database to Production                  ║" -ForegroundColor Cyan
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

$localDb = "medarion_platform"
$localUser = "root"
$localPass = "" # XAMPP default is empty
$prodDb = $config.database.name
$prodUser = $config.database.username
$prodPass = $config.database.password
$prodHost = $config.database.host

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Local DB: $localDb" -ForegroundColor Gray
Write-Host "   Production DB: $prodDb" -ForegroundColor Gray
Write-Host ""

# Step 1: Check local database
Write-Host "1️⃣  Checking local database..." -ForegroundColor Yellow
$tables = mysql -u $localUser medarion_platform -e "SHOW TABLES;" 2>&1 | Select-String -Pattern "Tables_in" -NotMatch | Where-Object { $_.ToString().Trim() -ne "" }
if ($tables.Count -eq 0) {
    Write-Host "   ⚠️  No tables found in local database" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ Found $($tables.Count) tables" -ForegroundColor Green

# Step 2: Export data (structure + data)
Write-Host "2️⃣  Exporting local database..." -ForegroundColor Yellow
$exportFile = "medarion_local_export_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$exportPath = Join-Path $PWD $exportFile

# Export with data
$exportCmd = "mysqldump -u $localUser --databases $localDb --add-drop-database --add-drop-table --routines --triggers > `"$exportPath`" 2>&1"
Write-Host "   Running: mysqldump..." -ForegroundColor Gray
Invoke-Expression $exportCmd

if (-not (Test-Path $exportPath) -or (Get-Item $exportPath).Length -eq 0) {
    Write-Host "   ❌ Export failed" -ForegroundColor Red
    exit 1
}

$fileSize = [math]::Round((Get-Item $exportPath).Length / 1KB, 2)
Write-Host "   ✅ Exported to $exportFile ($fileSize KB)" -ForegroundColor Green

# Step 3: Upload to server
Write-Host "3️⃣  Uploading to server..." -ForegroundColor Yellow
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$password = $config.ssh.password
$host = $config.ssh.host
$remotePath = "/home/medasnnc/medarion/$exportFile"

echo $password | & $pscpPath -P 22 -pw $password "$exportPath" "root@${host}:${remotePath}" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ File uploaded" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Upload may have had issues" -ForegroundColor Yellow
}

# Step 4: Import to production database
Write-Host "4️⃣  Importing to production database..." -ForegroundColor Yellow
$importCmd = "cd /home/medasnnc/medarion && mysql -u $prodUser -p$prodPass $prodDb < $exportFile 2>&1"
$importResult = & ".\run_ssh_command.ps1" -Command $importCmd

if ($importResult -like "*ERROR*" -or $importResult -like "*error*") {
    Write-Host "   ⚠️  Import had some issues:" -ForegroundColor Yellow
    Write-Host "   $importResult" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Import completed" -ForegroundColor Green
}

# Step 5: Verify import
Write-Host "5️⃣  Verifying import..." -ForegroundColor Yellow
$verifyCmd = "mysql -u $prodUser -p$prodPass $prodDb -e 'SELECT COUNT(*) as count FROM companies; SELECT COUNT(*) as count FROM deals; SELECT COUNT(*) as count FROM users;' 2>&1"
$verifyResult = & ".\run_ssh_command.ps1" -Command $verifyCmd
Write-Host "   $verifyResult" -ForegroundColor Gray

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Export Complete!                               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Files:" -ForegroundColor Cyan
Write-Host "   Local: $exportFile" -ForegroundColor Gray
Write-Host "   Remote: $remotePath" -ForegroundColor Gray
Write-Host ""

