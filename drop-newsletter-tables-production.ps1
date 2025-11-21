# PowerShell script to drop newsletter tables on production server
# Uses SSH to connect and execute SQL commands

$ErrorActionPreference = "Continue"

Write-Host "`n🗑️  Dropping Newsletter Tables on Production Server" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load configuration
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Configuration file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$sshConfig = $config.ssh
$dbConfig = $config.database

Write-Host "`n[1] Configuration Loaded" -ForegroundColor Yellow
Write-Host "   SSH Host: $($sshConfig.host)" -ForegroundColor Gray
Write-Host "   SSH User: $($sshConfig.username)" -ForegroundColor Gray
Write-Host "   Database: $($dbConfig.name)" -ForegroundColor Gray

# Check if plink exists
$plinkPath = $sshConfig.plinkPath
if (-not (Test-Path $plinkPath)) {
    Write-Host "`n❌ PuTTY plink not found at: $plinkPath" -ForegroundColor Red
    Write-Host "   Please install PuTTY or update the path in cpanel-config.json" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[2] Connecting to server via SSH..." -ForegroundColor Yellow

# Create SQL commands
$sqlCommands = @"
DROP TABLE IF EXISTS \`newsletter_campaigns\`;
DROP TABLE IF EXISTS \`newsletter_email_config\`;
DROP TABLE IF EXISTS \`newsletter_subscriptions\`;
SELECT 'Newsletter tables dropped successfully' AS status;
"@

# Create temporary SQL file
$tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8
Write-Host "   Created temporary SQL file: $tempSqlFile" -ForegroundColor Gray

try {
    # Build plink command
    $keyPath = $sshConfig.keyPath
    $sshHost = $sshConfig.host
    $sshUser = $sshConfig.username
    $sshPort = $sshConfig.port
    $dbUser = $dbConfig.username
    $dbPass = $dbConfig.password
    $dbName = $dbConfig.name
    
    # Create SQL file content (using here-string to avoid escaping issues)
    $sqlContent = @"
DROP TABLE IF EXISTS newsletter_campaigns;
DROP TABLE IF EXISTS newsletter_email_config;
DROP TABLE IF EXISTS newsletter_subscriptions;
SELECT 'Newsletter tables dropped successfully' AS status;
"@
    
    # Write SQL to temp file
    $localSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
    $sqlContent | Out-File -FilePath $localSqlFile -Encoding UTF8 -NoNewline
    
    # Remote SQL file path
    $remoteSqlFile = "/tmp/drop_newsletter_tables_$(Get-Date -Format 'yyyyMMddHHmmss').sql"
    
    Write-Host "   Created SQL file: $localSqlFile" -ForegroundColor Gray
    Write-Host "   Remote path: $remoteSqlFile" -ForegroundColor Gray
    
    # Upload SQL file using pscp
    $pscpPath = "C:\Program Files\PuTTY\pscp.exe"
    if (Test-Path $pscpPath) {
        Write-Host "`n[3a] Uploading SQL file to server..." -ForegroundColor Yellow
        $pscpCommand = "& `"$pscpPath`" -i `"$keyPath`" -P $sshPort `"$localSqlFile`" $sshUser@${sshHost}:$remoteSqlFile"
        Invoke-Expression $pscpCommand | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ SQL file uploaded" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Upload may have failed, continuing anyway..." -ForegroundColor Yellow
        }
    }
    
    # Execute SQL file via SSH
    $mysqlCommand = "mysql -u '$dbUser' -p'$dbPass' '$dbName' < '$remoteSqlFile' && rm '$remoteSqlFile'"
    
    # SSH command using plink
    $plinkCommand = "& `"$plinkPath`" -ssh -i `"$keyPath`" -P $sshPort $sshUser@$sshHost `"$mysqlCommand`""
    
    Write-Host "`n[3b] Executing SQL commands on production server..." -ForegroundColor Yellow
    Write-Host "   Command: mysql -u $dbUser -p*** $dbName < $remoteSqlFile" -ForegroundColor Gray
    
    # Execute via plink
    $result = Invoke-Expression $plinkCommand 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $result -match "successfully") {
        Write-Host "`n✅ Newsletter tables dropped successfully!" -ForegroundColor Green
        Write-Host "   Tables removed:" -ForegroundColor Gray
        Write-Host "   • newsletter_campaigns" -ForegroundColor Gray
        Write-Host "   • newsletter_email_config" -ForegroundColor Gray
        Write-Host "   • newsletter_subscriptions" -ForegroundColor Gray
    } else {
        Write-Host "`n⚠️  Command executed, but output may indicate issues:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Gray
        
        # Check if tables don't exist (which is fine)
        if ($result -match "doesn't exist" -or $result -match "Unknown table") {
            Write-Host "`n✅ Tables already removed or don't exist (this is OK)" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "`n❌ Error executing command: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Full error: $_" -ForegroundColor Gray
    exit 1
} finally {
    # Clean up temp files
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $localSqlFile) {
        Remove-Item $localSqlFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "`n   Cleaned up temporary files" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Newsletter cleanup complete!" -ForegroundColor Green

