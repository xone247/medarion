# Direct Sync from cPanel - Copies files directly without tar archive
# Uses SCP to copy files directly from cPanel to local

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$SkipBackup = $false
)

Write-Host "🔄 Direct Sync from cPanel to Local" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

# Check if SSH config exists
if (-not $config.ssh) {
    Write-Host "❌ SSH configuration not found" -ForegroundColor Red
    exit 1
}

# Check if PSCP is available
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (-not (Test-Path $pscpPath)) {
    Write-Host "❌ PSCP not found at: $pscpPath" -ForegroundColor Red
    exit 1
}

# Define files to preserve
$preserveFiles = @(
    "server\.env",
    "config\database.php",
    "api\database.php",
    "vite-plugin-api-proxy.ts"
)

# Create backup
$backupDir = "local_config_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (-not $SkipBackup) {
    Write-Host "📦 Backing up local config files..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    foreach ($file in $preserveFiles) {
        if (Test-Path $file) {
            $backupPath = Join-Path $backupDir $file
            $backupDirPath = Split-Path $backupPath -Parent
            if (-not (Test-Path $backupDirPath)) {
                New-Item -ItemType Directory -Path $backupDirPath -Force | Out-Null
            }
            Copy-Item $file $backupPath -Force
            Write-Host "   ✅ Backed up: $file" -ForegroundColor Green
        }
    }
    Write-Host "✅ Config files backed up" -ForegroundColor Green
    Write-Host ""
}

# Determine remote path
$cpanelUser = $config.cpanel.username
$remotePath = if ($cpanelUser) { "/home/$cpanelUser/public_html" } else { "/home/$($config.ssh.username)/public_html" }

Write-Host "📥 Syncing files from cPanel..." -ForegroundColor Cyan
Write-Host "   Host: $($config.ssh.host)" -ForegroundColor Gray
Write-Host "   Remote Path: $remotePath" -ForegroundColor Gray
Write-Host ""

$sshHost = "$($config.ssh.username)@$($config.ssh.host)"

# Directories to sync (excluding node_modules, .git, etc.)
$syncDirs = @(
    "src",
    "public",
    "api",
    "config",
    "server"
)

$replacedCount = 0
$skippedCount = 0

foreach ($dir in $syncDirs) {
    $remoteDir = "$remotePath/$dir"
    $localDir = $dir
    
    Write-Host "   Syncing: $dir..." -ForegroundColor Yellow
    
    # Use PSCP to recursively copy directory
    try {
        if ($config.ssh.useKey -and $config.ssh.keyPath -and (Test-Path $config.ssh.keyPath)) {
            & $pscpPath -i $config.ssh.keyPath -r -batch "$sshHost`:$remoteDir/*" $localDir 2>&1 | Out-Null
        } elseif ($config.ssh.password) {
            & $pscpPath -r -batch -pw $config.ssh.password "$sshHost`:$remoteDir/*" $localDir 2>&1 | Out-Null
        }
        
        $dirFiles = (Get-ChildItem -Path $localDir -Recurse -File -ErrorAction SilentlyContinue).Count
        $replacedCount += $dirFiles
        Write-Host "     ✅ Synced $dirFiles files" -ForegroundColor Green
    } catch {
        Write-Host "     ⚠️  Failed to sync $dir : $_" -ForegroundColor Yellow
    }
}

# Also sync root files
Write-Host "   Syncing root files..." -ForegroundColor Yellow
$rootFiles = @("package.json", "vite.config.ts", "tsconfig.json", ".htaccess", "index.html")
foreach ($file in $rootFiles) {
    $remoteFile = "$remotePath/$file"
    try {
        if ($config.ssh.useKey -and $config.ssh.keyPath -and (Test-Path $config.ssh.keyPath)) {
            & $pscpPath -i $config.ssh.keyPath -batch "$sshHost`:$remoteFile" $file 2>&1 | Out-Null
        } elseif ($config.ssh.password) {
            & $pscpPath -batch -pw $config.ssh.password "$sshHost`:$remoteFile" $file 2>&1 | Out-Null
        }
        if (Test-Path $file) {
            $replacedCount++
            Write-Host "     ✅ Synced: $file" -ForegroundColor Green
        }
    } catch {
        # File might not exist, that's OK
    }
}

Write-Host ""
Write-Host "✅ Synced $replacedCount files" -ForegroundColor Green
Write-Host ""

# Restore local config files
if (-not $SkipBackup) {
    Write-Host "🔧 Restoring local config files..." -ForegroundColor Yellow
    
    foreach ($file in $preserveFiles) {
        $backupPath = Join-Path $backupDir $file
        if (Test-Path $backupPath) {
            Copy-Item $backupPath $file -Force
            Write-Host "   ✅ Restored: $file" -ForegroundColor Green
        }
    }
    
    Write-Host "✅ Local config files restored" -ForegroundColor Green
    Write-Host ""
}

Write-Host "✅ Direct sync complete!" -ForegroundColor Green
Write-Host ""

