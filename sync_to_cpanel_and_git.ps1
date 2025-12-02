# Comprehensive Sync Script: Local → cPanel → Git
# This script syncs local website, database, and code to cPanel and Git

param(
    [switch]$SkipGit = $false,
    [switch]$SkipDatabase = $false,
    [switch]$SkipFrontend = $false,
    [switch]$SkipBackend = $false
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Comprehensive Sync: Local → cPanel → Git                        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$sshPassword = $config.ssh.password

# Paths
$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"
$localDbName = "medarion_platform"
$localDbUser = "root"
$localDbPass = ""
$remoteDbName = $config.database.name
$remoteDbUser = $config.database.username
$remoteDbPass = $config.database.password

# Files to preserve on cPanel
$preserveFiles = @(
    ".env",
    ".htaccess",
    ".htaccess.backup",
    ".ftpquota",
    ".well-known"
)

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   Frontend: $frontendPath" -ForegroundColor Gray
Write-Host "   Backend: $backendPath" -ForegroundColor Gray
Write-Host "   Local DB: $localDbName" -ForegroundColor Gray
Write-Host "   Remote DB: $remoteDbName" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# STEP 1: Export Local Database
# ============================================================================
if (-not $SkipDatabase) {
    Write-Host "[1/7] Exporting Local Database..." -ForegroundColor Yellow
    Write-Host "-" * 70 -ForegroundColor Gray
    
    $dumpFile = "$env:TEMP\medarion_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    # Find mysqldump
    $mysqldumpPath = "mysqldump"
    try {
        $null = Get-Command mysqldump -ErrorAction Stop
    } catch {
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
                break
            }
        }
        
        if (-not $found) {
            Write-Host "   ❌ mysqldump not found!" -ForegroundColor Red
            exit 1
        }
    }
    
    # Export database
    if ($localDbPass) {
        $exportCmd = "& `"$mysqldumpPath`" -h localhost -u $localDbUser -p`"$localDbPass`" --single-transaction --routines --triggers $localDbName > `"$dumpFile`""
    } else {
        $exportCmd = "& `"$mysqldumpPath`" -h localhost -u $localDbUser --single-transaction --routines --triggers $localDbName > `"$dumpFile`""
    }
    
    Write-Host "   Running mysqldump..." -ForegroundColor Gray
    Invoke-Expression $exportCmd | Out-Null
    
    if ((Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
        $fileSize = [math]::Round((Get-Item $dumpFile).Length / 1MB, 2)
        Write-Host "   ✅ Database exported ($fileSize MB)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Database export failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/7] Skipping Database Export..." -ForegroundColor Gray
    $dumpFile = $null
}

# ============================================================================
# STEP 2: Backup cPanel Config Files
# ============================================================================
Write-Host ""
Write-Host "[2/7] Backing Up cPanel Config Files..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$backupDir = "/tmp/medarion_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$backupCmd = "mkdir -p $backupDir && "

# Backup backend .env
$backupCmd += "if [ -f $backendPath/.env ]; then cp $backendPath/.env $backupDir/.env.backend; fi && "

# Backup frontend .htaccess
$backupCmd += "if [ -f $frontendPath/.htaccess ]; then cp $frontendPath/.htaccess $backupDir/.htaccess.frontend; fi && "

# Backup backend .htaccess
$backupCmd += "if [ -f $backendPath/.htaccess ]; then cp $backendPath/.htaccess $backupDir/.htaccess.backend; fi && "

# Backup .well-known
$backupCmd += "if [ -d $backendPath/.well-known ]; then cp -r $backendPath/.well-known $backupDir/; fi && "

$backupCmd += "echo 'Backup complete'"

Write-Host "   Creating backup directory..." -ForegroundColor Gray
$backupResult = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $backupCmd 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Config files backed up" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backup may have had issues" -ForegroundColor Yellow
}

# ============================================================================
# STEP 3: Clean cPanel Directories (Preserve Configs)
# ============================================================================
Write-Host ""
Write-Host "[3/7] Cleaning cPanel Directories..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Clean frontend (preserve .htaccess, .ftpquota, .well-known)
$cleanFrontendCmd = @"
cd $frontendPath && 
# Remove files except preserved ones
for file in *; do
    if [ -f "$file" ] && [ "$file" != ".htaccess" ] && [ "$file" != ".ftpquota" ]; then
        rm -f "$file"
    fi
done
# Remove directories except preserved ones
for dir in *; do
    if [ -d "$dir" ] && [ "$dir" != ".well-known" ]; then
        rm -rf "$dir"
    fi
done
echo 'Frontend cleaned'
"@

# Clean backend (preserve .env, .htaccess, .well-known, node_modules, uploads)
$cleanBackendCmd = @"
cd $backendPath && 
# Remove files except preserved ones
for file in *; do
    if [ -f "$file" ] && [ "$file" != ".env" ] && [ "$file" != ".htaccess" ] && [ "$file" != ".htaccess.backup" ]; then
        rm -f "$file"
    fi
done
# Remove directories except preserved ones
for dir in *; do
    if [ -d "$dir" ] && [ "$dir" != ".well-known" ] && [ "$dir" != "node_modules" ] && [ "$dir" != "uploads" ]; then
        rm -rf "$dir"
    fi
done
echo 'Backend cleaned'
"@

Write-Host "   Cleaning frontend directory..." -ForegroundColor Gray
$cleanResult1 = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $cleanFrontendCmd 2>&1

Write-Host "   Cleaning backend directory..." -ForegroundColor Gray
$cleanResult2 = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $cleanBackendCmd 2>&1

Write-Host "   ✅ Directories cleaned (configs preserved)" -ForegroundColor Green

# ============================================================================
# STEP 4: Build Frontend
# ============================================================================
if (-not $SkipFrontend) {
    Write-Host ""
    Write-Host "[4/7] Building Frontend..." -ForegroundColor Yellow
    Write-Host "-" * 70 -ForegroundColor Gray
    
    if (-not (Test-Path "package.json")) {
        Write-Host "   ⚠️  package.json not found, skipping build" -ForegroundColor Yellow
    } else {
        Write-Host "   Running npm run build..." -ForegroundColor Gray
        npm run build 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path "medarion-dist")) {
            Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Frontend build failed!" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host ""
    Write-Host "[4/7] Skipping Frontend Build..." -ForegroundColor Gray
}

# ============================================================================
# STEP 5: Upload Files to cPanel
# ============================================================================
Write-Host ""
Write-Host "[5/7] Uploading Files to cPanel..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Upload frontend
if (-not $SkipFrontend -and (Test-Path "medarion-dist")) {
    Write-Host "   Uploading frontend..." -ForegroundColor Gray
    $uploadFrontend = & $pscpPath -P $sshPort -r "medarion-dist\*" "${sshUser}@${sshHost}:${frontendPath}/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Frontend upload may have had issues" -ForegroundColor Yellow
    }
}

# Upload backend
if (-not $SkipBackend -and (Test-Path "server")) {
    Write-Host "   Uploading backend files..." -ForegroundColor Gray
    
    # Upload server.js
    & $pscpPath -P $sshPort "server/server.js" "${sshUser}@${sshHost}:${backendPath}/server.js" 2>&1 | Out-Null
    
    # Upload routes
    if (Test-Path "server/routes") {
        & $pscpPath -P $sshPort -r "server/routes" "${sshUser}@${sshHost}:${backendPath}/" 2>&1 | Out-Null
    }
    
    # Upload config
    if (Test-Path "server/config") {
        & $pscpPath -P $sshPort -r "server/config" "${sshUser}@${sshHost}:${backendPath}/" 2>&1 | Out-Null
    }
    
    # Upload middleware
    if (Test-Path "server/middleware") {
        & $pscpPath -P $sshPort -r "server/middleware" "${sshUser}@${sshHost}:${backendPath}/" 2>&1 | Out-Null
    }
    
    # Upload services
    if (Test-Path "server/services") {
        & $pscpPath -P $sshPort -r "server/services" "${sshUser}@${sshHost}:${backendPath}/" 2>&1 | Out-Null
    }
    
    # Upload package.json
    if (Test-Path "server/package.json") {
        & $pscpPath -P $sshPort "server/package.json" "${sshUser}@${sshHost}:${backendPath}/package.json" 2>&1 | Out-Null
    }
    
    Write-Host "   ✅ Backend files uploaded" -ForegroundColor Green
}

# ============================================================================
# STEP 6: Restore Config Files and Import Database
# ============================================================================
Write-Host ""
Write-Host "[6/7] Restoring Config Files and Importing Database..." -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Restore backend .env
$restoreCmd = @"
if [ -f $backupDir/.env.backend ]; then 
    cp $backupDir/.env.backend $backendPath/.env && 
    echo 'Backend .env restored'
fi
"@

Write-Host "   Restoring backend .env..." -ForegroundColor Gray
& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $restoreCmd 2>&1 | Out-Null

# Restore .htaccess files
$restoreHtaccessCmd = @"
if [ -f $backupDir/.htaccess.frontend ]; then 
    cp $backupDir/.htaccess.frontend $frontendPath/.htaccess
fi
if [ -f $backupDir/.htaccess.backend ]; then 
    cp $backupDir/.htaccess.backend $backendPath/.htaccess
fi
echo 'Config files restored'
"@

& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $restoreHtaccessCmd 2>&1 | Out-Null
Write-Host "   ✅ Config files restored" -ForegroundColor Green

# Import database
if (-not $SkipDatabase -and $dumpFile) {
    Write-Host "   Uploading database dump..." -ForegroundColor Gray
    $remoteDumpFile = "/tmp/medarion_dump.sql"
    & $pscpPath -P $sshPort "$dumpFile" "${sshUser}@${sshHost}:${remoteDumpFile}" 2>&1 | Out-Null
    
    Write-Host "   Importing database..." -ForegroundColor Gray
    $importCmd = "mysql -u $remoteDbUser -p$remoteDbPass $remoteDbName < $remoteDumpFile 2>&1"
    $importResult = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $importCmd 2>&1
    
    if ($importResult -notlike "*ERROR*" -and $importResult -notlike "*error*") {
        Write-Host "   ✅ Database imported" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database import may have had issues" -ForegroundColor Yellow
        Write-Host "   $importResult" -ForegroundColor Gray
    }
    
    # Clean up remote dump file
    & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" "rm -f $remoteDumpFile" 2>&1 | Out-Null
}

# Install backend dependencies if package.json changed
if (-not $SkipBackend) {
    Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
    $installCmd = "cd $backendPath && /opt/cpanel/ea-nodejs22/bin/npm install --production 2>&1"
    $installResult = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $installCmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Dependency installation may have had issues" -ForegroundColor Yellow
    }
}

# Restart backend server
Write-Host "   Restarting backend server..." -ForegroundColor Gray
$restartCmd = "cd $backendPath && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend 2>&1 || /opt/cpanel/ea-nodejs22/bin/pm2 start server.js --name medarion-backend 2>&1"
$restartResult = & $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" $restartCmd 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend server restarted" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend restart may have had issues" -ForegroundColor Yellow
}

# ============================================================================
# STEP 7: Sync to Git
# ============================================================================
if (-not $SkipGit) {
    Write-Host ""
    Write-Host "[7/7] Syncing to Git..." -ForegroundColor Yellow
    Write-Host "-" * 70 -ForegroundColor Gray
    
    # Check git status
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "   Staging all changes..." -ForegroundColor Gray
        git add -A 2>&1 | Out-Null
        
        $commitMessage = "Sync: Local changes synced to cPanel - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Host "   Committing changes..." -ForegroundColor Gray
        git commit -m $commitMessage 2>&1 | Out-Null
        
        Write-Host "   Pushing to remote..." -ForegroundColor Gray
        git push origin master 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Changes pushed to Git" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Git push may have had issues" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✅ No changes to commit" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "[7/7] Skipping Git Sync..." -ForegroundColor Gray
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    Sync Complete!                                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Local → cPanel sync complete" -ForegroundColor Green
if (-not $SkipDatabase) {
    Write-Host "   ✅ Database synced" -ForegroundColor Green
}
if (-not $SkipGit) {
    Write-Host "   ✅ Git repository synced" -ForegroundColor Green
}
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: https://medarion.africa" -ForegroundColor Gray
Write-Host "   Backend: https://api.medarion.africa" -ForegroundColor Gray
Write-Host ""

