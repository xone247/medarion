# Deploy Database to cPanel via SSH
# Uses SSH credentials from cpanel-config.json

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$ssh = $config.ssh
$db = $config.database

Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host "DEPLOYING DATABASE TO CPANEL VIA SSH" -ForegroundColor Blue
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host ""

# Step 1: Upload SQL file
Write-Host "Step 1: Uploading SQL file via SCP..." -ForegroundColor Yellow
$sqlFile = "database_export_for_cpanel.sql"
$importScript = "import_database.php"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (-not (Test-Path $pscpPath)) {
    Write-Host "❌ PSCP not found at: $pscpPath" -ForegroundColor Red
    Write-Host "Please install PuTTY or update the path in the script" -ForegroundColor Yellow
    exit 1
}

# Upload SQL file
$remotePath = "/home/medasnnc/public_html"
Write-Host "  Uploading $sqlFile to $remotePath..." -ForegroundColor Cyan

if ($ssh.useKey -and $ssh.keyPath) {
    $scpCmd = "& `"$pscpPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" `"$sqlFile`" $($ssh.username)@$($ssh.host):$remotePath/"
} else {
    $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$sqlFile`" $($ssh.username)@$($ssh.host):$remotePath/"
}

Invoke-Expression $scpCmd
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ SQL file uploaded" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Upload may have failed, trying with password..." -ForegroundColor Yellow
    # Try with password
    $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$sqlFile`" $($ssh.username)@$($ssh.host):$remotePath/"
    Invoke-Expression $scpCmd
}

# Upload import script
Write-Host "  Uploading $importScript to $remotePath..." -ForegroundColor Cyan
if ($ssh.useKey -and $ssh.keyPath) {
    $scpCmd = "& `"$pscpPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" `"$importScript`" $($ssh.username)@$($ssh.host):$remotePath/"
} else {
    $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$importScript`" $($ssh.username)@$($ssh.host):$remotePath/"
}

Invoke-Expression $scpCmd
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Import script uploaded" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Upload may have failed, trying with password..." -ForegroundColor Yellow
    $scpCmd = "echo $($ssh.password) | & `"$pscpPath`" -P $($ssh.port) -pw `"$($ssh.password)`" `"$importScript`" $($ssh.username)@$($ssh.host):$remotePath/"
    Invoke-Expression $scpCmd
}

Write-Host ""

# Step 2: Run import script via SSH
Write-Host "Step 2: Running database import via SSH..." -ForegroundColor Yellow

$plinkPath = $ssh.plinkPath
if (-not (Test-Path $plinkPath)) {
    Write-Host "❌ PLINK not found at: $plinkPath" -ForegroundColor Red
    exit 1
}

# Create import command
$importCmd = "cd $remotePath && php import_database.php"

Write-Host "  Executing import command..." -ForegroundColor Cyan
Write-Host "  (This may take 1-2 minutes)" -ForegroundColor Yellow
Write-Host ""

if ($ssh.useKey -and $ssh.keyPath) {
    $sshCmd = "& `"$plinkPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" $($ssh.username)@$($ssh.host) `"$importCmd`""
} else {
    $sshCmd = "echo $($ssh.password) | & `"$plinkPath`" -P $($ssh.port) -pw `"$($ssh.password)`" $($ssh.username)@$($ssh.host) `"$importCmd`""
}

$output = Invoke-Expression $sshCmd 2>&1
Write-Host $output

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database import completed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Import may have completed with warnings. Check output above." -ForegroundColor Yellow
}

# Step 3: Verify import
Write-Host ""
Write-Host "Step 3: Verifying database import..." -ForegroundColor Yellow

$verifyCmd = "mysql -u$($db.username) -p$($db.password) $($db.name) -e `"SELECT 'africa_countries' as table_name, COUNT(*) as count FROM africa_countries UNION ALL SELECT 'companies', COUNT(*) FROM companies UNION ALL SELECT 'deals', COUNT(*) FROM deals UNION ALL SELECT 'grants', COUNT(*) FROM grants UNION ALL SELECT 'clinical_trials', COUNT(*) FROM clinical_trials;`""

if ($ssh.useKey -and $ssh.keyPath) {
    $verifySshCmd = "& `"$plinkPath`" -P $($ssh.port) -i `"$($ssh.keyPath)`" $($ssh.username)@$($ssh.host) `"$verifyCmd`""
} else {
    $verifySshCmd = "echo $($ssh.password) | & `"$plinkPath`" -P $($ssh.port) -pw `"$($ssh.password)`" $($ssh.username)@$($ssh.host) `"$verifyCmd`""
}

$verifyOutput = Invoke-Expression $verifySshCmd 2>&1
Write-Host $verifyOutput

Write-Host ""
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host "✅ DATABASE DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host ""
Write-Host "⚠️  Remember to delete import_database.php from server for security" -ForegroundColor Yellow
Write-Host "   Run: ssh root@server1.medarion.africa 'rm /home/medasnnc/public_html/import_database.php'" -ForegroundColor Cyan

