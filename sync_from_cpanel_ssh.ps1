# Sync Files from cPanel to Local (SSH Method)
# Uses SSH to create archive and download it
# Preserves local database and server connection settings

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$SkipBackup = $false
)

Write-Host "🔄 Syncing Files from cPanel to Local (SSH Method)" -ForegroundColor Cyan
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
    Write-Host "❌ SSH configuration not found in $ConfigFile" -ForegroundColor Red
    Write-Host "   Please configure SSH settings in $ConfigFile" -ForegroundColor Yellow
    exit 1
}

# Check if PLINK is available
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
if (-not (Test-Path $plinkPath)) {
    Write-Host "❌ PLINK not found at: $plinkPath" -ForegroundColor Red
    Write-Host "   Please install PuTTY from: https://www.putty.org/" -ForegroundColor Yellow
    exit 1
}

# Check if PSCP is available
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (-not (Test-Path $pscpPath)) {
    Write-Host "❌ PSCP not found at: $pscpPath" -ForegroundColor Red
    Write-Host "   Please install PuTTY from: https://www.putty.org/" -ForegroundColor Yellow
    exit 1
}

# Define files/directories to preserve (local config files)
$preserveFiles = @(
    "server\.env",
    "config\database.php",
    "api\database.php",
    "vite-plugin-api-proxy.ts"
)

# Create backup directory
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
    Write-Host "✅ Config files backed up to: $backupDir" -ForegroundColor Green
    Write-Host ""
}

# Determine remote path
$remotePath = $config.ftp.remotePath
if (-not $remotePath -or $remotePath -eq "/public_html") {
    # Use cPanel username if available, otherwise use SSH username
    $cpanelUser = $config.cpanel.username
    if ($cpanelUser) {
        $remotePath = "/home/$cpanelUser/public_html"
    } else {
        $remotePath = "/home/$($config.ssh.username)/public_html"
    }
    Write-Host "   Using remote path: $remotePath" -ForegroundColor Gray
}

# Create temporary download directory
$downloadDir = "cpanel_download_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null

Write-Host "📥 Downloading files from cPanel via SSH..." -ForegroundColor Cyan
Write-Host "   Host: $($config.ssh.host)" -ForegroundColor Gray
Write-Host "   Remote Path: $remotePath" -ForegroundColor Gray
Write-Host ""

# Create archive name
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$remoteArchive = "/tmp/medarion_sync_$timestamp.tar.gz"
$localArchive = "$downloadDir\medarion_sync.tar.gz"

# Build SSH command
$sshHost = "$($config.ssh.username)@$($config.ssh.host)"
$archiveCmd = "cd $remotePath && tar -czf $remoteArchive --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='medarion-dist' . 2>&1"

Write-Host "   Creating archive on server..." -ForegroundColor Yellow

# Execute SSH command to create archive
try {
    if ($config.ssh.useKey -and $config.ssh.keyPath -and (Test-Path $config.ssh.keyPath)) {
        $sshResult = & $plinkPath -i $config.ssh.keyPath -batch $sshHost $archiveCmd 2>&1
    } elseif ($config.ssh.password) {
        $sshResult = echo $config.ssh.password | & $plinkPath -batch -pw $config.ssh.password $sshHost $archiveCmd 2>&1
    } else {
        Write-Host "❌ No SSH authentication method configured" -ForegroundColor Red
        Write-Host "   Please set useKey/keyPath or password in SSH config" -ForegroundColor Yellow
        Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Archive creation output: $sshResult" -ForegroundColor Yellow
        # Continue anyway, might still work
    } else {
        Write-Host "   ✅ Archive created on server" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Warning: $($_.Exception.Message)" -ForegroundColor Yellow
    # Continue anyway
}

# Download archive
Write-Host "   Downloading archive..." -ForegroundColor Yellow
try {
    if ($config.ssh.useKey -and $config.ssh.keyPath -and (Test-Path $config.ssh.keyPath)) {
        & $pscpPath -i $config.ssh.keyPath -batch "$sshHost`:$remoteArchive" $localArchive 2>&1 | Out-Null
    } elseif ($config.ssh.password) {
        & $pscpPath -batch -pw $config.ssh.password "$sshHost`:$remoteArchive" $localArchive 2>&1 | Out-Null
    }
    
    if (-not (Test-Path $localArchive)) {
        Write-Host "❌ Failed to download archive" -ForegroundColor Red
        Write-Host "   Please check SSH connection and permissions" -ForegroundColor Yellow
        Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    Write-Host "   ✅ Archive downloaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Error downloading archive: $_" -ForegroundColor Red
    Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

# Extract archive
Write-Host "   Extracting archive..." -ForegroundColor Yellow

# Try different extraction methods
$extracted = $false

# Method 1: Git tar (if Git is installed)
$gitTarPath = "C:\Program Files\Git\usr\bin\tar.exe"
if (Test-Path $gitTarPath) {
    try {
        & $gitTarPath -xzf $localArchive -C $downloadDir 2>&1 | Out-Null
        $extracted = $true
        Write-Host "   ✅ Extracted using Git tar" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Git tar extraction failed" -ForegroundColor Yellow
    }
}

# Method 2: 7-Zip (if available)
if (-not $extracted) {
    $sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
    if (Test-Path $sevenZipPath) {
        try {
            # 7-Zip can extract tar.gz in two steps
            $tempTar = "$downloadDir\temp.tar"
            & $sevenZipPath x $localArchive -o"$downloadDir" -y | Out-Null
            if (Test-Path "$downloadDir\medarion_sync.tar") {
                & $sevenZipPath x "$downloadDir\medarion_sync.tar" -o"$downloadDir" -y | Out-Null
                $extracted = $true
                Write-Host "   ✅ Extracted using 7-Zip" -ForegroundColor Green
            }
        } catch {
            Write-Host "   ⚠️  7-Zip extraction failed" -ForegroundColor Yellow
        }
    }
}

if (-not $extracted) {
    Write-Host "❌ Could not extract archive automatically" -ForegroundColor Red
    Write-Host "   Archive location: $localArchive" -ForegroundColor Yellow
    Write-Host "   Please extract it manually to: $downloadDir" -ForegroundColor Yellow
    Write-Host "   Then run this script again with -SkipDownload flag" -ForegroundColor Yellow
    exit 1
}

# Clean up remote archive
Write-Host "   Cleaning up remote archive..." -ForegroundColor Yellow
try {
    $cleanupCmd = "rm -f $remoteArchive"
    if ($config.ssh.useKey -and $config.ssh.keyPath -and (Test-Path $config.ssh.keyPath)) {
        & $plinkPath -i $config.ssh.keyPath -batch $sshHost $cleanupCmd 2>&1 | Out-Null
    } elseif ($config.ssh.password) {
        echo $config.ssh.password | & $plinkPath -batch -pw $config.ssh.password $sshHost $cleanupCmd 2>&1 | Out-Null
    }
} catch {
    Write-Host "   ⚠️  Could not clean up remote archive (non-critical)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Files downloaded. Preparing to replace local files..." -ForegroundColor Cyan
Write-Host ""

# Get list of files to exclude
$excludePatterns = @(
    "node_modules",
    ".git",
    "*.log",
    ".env",
    "local_config_backup_*",
    "cpanel_download_*",
    "medarion-dist"
)

# Function to check if file should be excluded
function Should-Exclude {
    param([string]$filePath)
    
    # Normalize path for comparison
    $normalizedPath = $filePath -replace '\\', '/'
    
    # Check preserve files (exact match or in that directory)
    foreach ($preserve in $preserveFiles) {
        $normalizedPreserve = $preserve -replace '\\', '/'
        # Check if the file path matches the preserve file exactly or is in a subdirectory we want to keep
        if ($normalizedPath -eq $normalizedPreserve -or 
            $normalizedPath -like "$normalizedPreserve/*") {
            return $true
        }
    }
    
    # Check exclude patterns (only match full directory names or file extensions)
    foreach ($pattern in $excludePatterns) {
        # For directory patterns, check if path contains the pattern as a directory
        if ($pattern -notlike "*.*") {
            # Directory pattern - check for /pattern/ or \pattern\ or at start/end
            if ($normalizedPath -match "(^|[/\\])$([regex]::Escape($pattern))([/\\]|$)") {
                return $true
            }
        } else {
            # File extension pattern
            if ($normalizedPath -like "*$pattern") {
                return $true
            }
        }
    }
    
    return $false
}

# Replace local files with downloaded files
Write-Host "🔄 Replacing local files with cPanel files..." -ForegroundColor Yellow
Write-Host "   (Preserving local config files)" -ForegroundColor Gray
Write-Host ""

$replacedCount = 0
$skippedCount = 0

# Get all files from download directory
$downloadedFiles = Get-ChildItem -Path $downloadDir -Recurse -File

# Debug: Show first few files to understand structure
if ($downloadedFiles.Count -gt 0) {
    Write-Host "   Found $($downloadedFiles.Count) files in download directory" -ForegroundColor Gray
    Write-Host "   Sample files:" -ForegroundColor Gray
    $downloadedFiles | Select-Object -First 5 | ForEach-Object {
        $relPath = $_.FullName.Substring($downloadDir.Length + 1)
        Write-Host "     $relPath" -ForegroundColor DarkGray
    }
    Write-Host ""
}

foreach ($file in $downloadedFiles) {
    # Calculate relative path from download directory
    $relativePath = $file.FullName.Substring($downloadDir.Length + 1)
    
    # Normalize path separators
    $relativePath = $relativePath -replace '\\', '/'
    
    # Handle case where archive extracted files directly (no subdirectory)
    # The relative path should already be correct
    
    # Handle case where archive extracted to a subdirectory (like medarion_sync/)
    $pathParts = $relativePath -split '/'
    if ($pathParts.Count -gt 1 -and ($pathParts[0] -eq "medarion_sync" -or $pathParts[0] -eq "public_html")) {
        # Skip the first directory level
        $relativePath = ($pathParts[1..($pathParts.Count-1)] -join '/')
    }
    
    # Convert back to Windows path
    $localPath = $relativePath -replace '/', '\'
    
    # Skip if should be excluded
    if (Should-Exclude $localPath) {
        $skippedCount++
        continue
    }
    
    # Skip if path is empty or contains archive/temp names
    if ([string]::IsNullOrWhiteSpace($localPath) -or 
        $localPath -like "*medarion_sync*" -or 
        $localPath -like "*public_html*" -or
        $localPath -like "*.tar.gz" -or
        $localPath -like "*.tar") {
        continue
    }
    
    # Ensure directory exists
    $localDir = Split-Path $localPath -Parent
    if ($localDir -and -not (Test-Path $localDir)) {
        New-Item -ItemType Directory -Path $localDir -Force | Out-Null
    }
    
    # Copy file
    try {
        Copy-Item $file.FullName $localPath -Force
        $replacedCount++
        if ($replacedCount % 50 -eq 0) {
            Write-Host "   Processed $replacedCount files..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ⚠️  Failed to copy: $localPath - $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Replaced $replacedCount files" -ForegroundColor Green
Write-Host "   Skipped $skippedCount files (preserved)" -ForegroundColor Gray
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

# Clean up download directory and archive (keep for debugging if files weren't replaced)
if ($replacedCount -eq 0) {
    Write-Host "⚠️  No files were replaced. Keeping download directory for inspection: $downloadDir" -ForegroundColor Yellow
    Write-Host "   Please check the directory structure and file paths." -ForegroundColor Yellow
} else {
    Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Yellow
    Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}
Write-Host ""

Write-Host "✅ Sync from cPanel complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   - Files downloaded from: $remotePath" -ForegroundColor Gray
Write-Host "   - Local files replaced: $replacedCount" -ForegroundColor Gray
Write-Host "   - Config files preserved: $($preserveFiles.Count)" -ForegroundColor Gray
if (-not $SkipBackup) {
    Write-Host "   - Backup location: $backupDir" -ForegroundColor Gray
}
Write-Host ""
Write-Host "💡 Your local database and server connections are preserved." -ForegroundColor Green
Write-Host "   You can now work locally and push changes back to cPanel." -ForegroundColor Green
Write-Host ""

