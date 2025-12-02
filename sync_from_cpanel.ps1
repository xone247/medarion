# Sync Files from cPanel to Local
# Downloads files from cPanel and replaces local files
# Preserves local database and server connection settings

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$SkipBackup = $false
)

Write-Host "🔄 Syncing Files from cPanel to Local" -ForegroundColor Cyan
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

# Check if FTP config exists
if (-not $config.ftp) {
    Write-Host "❌ FTP configuration not found in $ConfigFile" -ForegroundColor Red
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

# Create temporary download directory
$downloadDir = "cpanel_download_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null

Write-Host "📥 Downloading files from cPanel..." -ForegroundColor Cyan
Write-Host "   Host: $($config.ftp.host)" -ForegroundColor Gray
Write-Host "   Remote Path: $($config.ftp.remotePath)" -ForegroundColor Gray
Write-Host ""

# Check if WinSCP is available (preferred for SFTP)
$useWinSCP = $false
$winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"
if (Test-Path $winscpPath) {
    $useWinSCP = $true
    Write-Host "   Using WinSCP for download..." -ForegroundColor Gray
} else {
    Write-Host "   WinSCP not found, trying alternative methods..." -ForegroundColor Yellow
}

# Download files using WinSCP
if ($useWinSCP) {
    try {
        # Create WinSCP script
        $winscpScript = @"
option batch abort
option confirm off
open sftp://$($config.ftp.username):$($config.ftp.password)@$($config.ftp.host) -hostkey="*"
cd $($config.ftp.remotePath)
lcd $downloadDir
synchronize local . .
close
exit
"@
        
        $winscpScriptFile = "winscp_download_script.txt"
        $winscpScript | Out-File -FilePath $winscpScriptFile -Encoding ASCII
        
        Write-Host "   Downloading files (this may take a while)..." -ForegroundColor Yellow
        & $winscpPath /script=$winscpScriptFile /log=winscp_download.log
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Files downloaded successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Download failed. Check winscp_download.log for details." -ForegroundColor Red
            Remove-Item $winscpScriptFile -ErrorAction SilentlyContinue
            Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
            exit 1
        }
        
        Remove-Item $winscpScriptFile -ErrorAction SilentlyContinue
    } catch {
        Write-Host "❌ Error downloading files: $_" -ForegroundColor Red
        Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
} else {
    # Alternative: Use PSCP (PuTTY) if available
    $pscpPath = "C:\Program Files\PuTTY\pscp.exe"
    if (Test-Path $pscpPath) {
        Write-Host "   Using PSCP for download..." -ForegroundColor Gray
        try {
            # PSCP doesn't support recursive directory download easily
            # We'll need to use SSH commands instead
            Write-Host "   ⚠️  PSCP doesn't support recursive download easily." -ForegroundColor Yellow
            Write-Host "   Please use WinSCP or provide SSH access for full sync." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   Alternatively, you can:" -ForegroundColor Yellow
            Write-Host "   1. Use WinSCP GUI to download files manually" -ForegroundColor Yellow
            Write-Host "   2. Or use SSH to create a tar archive and download it" -ForegroundColor Yellow
            Write-Host ""
            
            # Try using SSH to create archive and download
            $plinkPath = "C:\Program Files\PuTTY\plink.exe"
            if (Test-Path $plinkPath -and $config.ssh) {
                Write-Host "   Attempting SSH-based download..." -ForegroundColor Yellow
                
                $remoteArchive = "/tmp/medarion_sync_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar.gz"
                $localArchive = "$downloadDir\medarion_sync.tar.gz"
                
                # Create archive on server
                $archiveCmd = "cd $($config.ftp.remotePath) && tar -czf $remoteArchive . 2>&1"
                
                if ($config.ssh.useKey -and $config.ssh.keyPath) {
                    $sshCmd = "& `"$plinkPath`" -i `"$($config.ssh.keyPath)`" $($config.ssh.username)@$($config.ssh.host) `"$archiveCmd`""
                } else {
                    $sshCmd = "echo $($config.ssh.password) | & `"$plinkPath`" $($config.ssh.username)@$($config.ssh.host) -pw $($config.ssh.password) `"$archiveCmd`""
                }
                
                Write-Host "   Creating archive on server..." -ForegroundColor Yellow
                Invoke-Expression $sshCmd
                
                # Download archive
                if ($config.ssh.useKey -and $config.ssh.keyPath) {
                    & $pscpPath -i $config.ssh.keyPath "$($config.ssh.username)@$($config.ssh.host):$remoteArchive" $localArchive
                } else {
                    & $pscpPath -pw $config.ssh.password "$($config.ssh.username)@$($config.ssh.host):$remoteArchive" $localArchive
                }
                
                if (Test-Path $localArchive) {
                    Write-Host "   Extracting archive..." -ForegroundColor Yellow
                    # Extract using 7-Zip or tar if available
                    $tarPath = "C:\Program Files\Git\usr\bin\tar.exe"
                    if (Test-Path $tarPath) {
                        & $tarPath -xzf $localArchive -C $downloadDir
                    } else {
                        Write-Host "   ⚠️  tar not found. Please extract $localArchive manually to $downloadDir" -ForegroundColor Yellow
                        Write-Host "   Or install 7-Zip and extract the archive." -ForegroundColor Yellow
                    }
                    
                    # Clean up remote archive
                    $cleanupCmd = "rm -f $remoteArchive"
                    if ($config.ssh.useKey -and $config.ssh.keyPath) {
                        & $plinkPath -i $config.ssh.keyPath $config.ssh.username@$config.ssh.host $cleanupCmd
                    } else {
                        echo $config.ssh.password | & $plinkPath $config.ssh.username@$config.ssh.host -pw $config.ssh.password $cleanupCmd
                    }
                }
            } else {
                Write-Host "❌ SSH configuration not found or PSCP/PLINK not available." -ForegroundColor Red
                Write-Host "   Please install WinSCP for easier file sync." -ForegroundColor Yellow
                Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
                exit 1
            }
        } catch {
            Write-Host "❌ Error with PSCP download: $_" -ForegroundColor Red
            Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
            exit 1
        }
    } else {
        Write-Host "❌ Neither WinSCP nor PSCP found." -ForegroundColor Red
        Write-Host "   Please install WinSCP from: https://winscp.net/" -ForegroundColor Yellow
        Write-Host "   Or install PuTTY from: https://www.putty.org/" -ForegroundColor Yellow
        Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Files downloaded. Preparing to replace local files..." -ForegroundColor Cyan
Write-Host ""

# Get list of files to exclude (preserve files + common excludes)
$excludePatterns = @(
    "node_modules",
    ".git",
    "*.log",
    ".env",
    "local_config_backup_*",
    "cpanel_download_*",
    "winscp_*",
    "medarion-dist"
)

# Function to check if file should be excluded
function Should-Exclude {
    param([string]$filePath)
    
    # Check preserve files
    foreach ($preserve in $preserveFiles) {
        if ($filePath -like "*$preserve*") {
            return $true
        }
    }
    
    # Check exclude patterns
    foreach ($pattern in $excludePatterns) {
        if ($filePath -like "*$pattern*") {
            return $true
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

foreach ($file in $downloadedFiles) {
    # Calculate relative path
    $relativePath = $file.FullName.Substring($downloadDir.Length + 1)
    $localPath = $relativePath
    
    # Skip if should be excluded
    if (Should-Exclude $localPath) {
        $skippedCount++
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

# Clean up download directory
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item $downloadDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Sync from cPanel complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   - Files downloaded from: $($config.ftp.remotePath)" -ForegroundColor Gray
Write-Host "   - Local files replaced: $replacedCount" -ForegroundColor Gray
Write-Host "   - Config files preserved: $($preserveFiles.Count)" -ForegroundColor Gray
if (-not $SkipBackup) {
    Write-Host "   - Backup location: $backupDir" -ForegroundColor Gray
}
Write-Host ""
Write-Host "💡 Your local database and server connections are preserved." -ForegroundColor Green
Write-Host "   You can now work locally and push changes back to cPanel." -ForegroundColor Green
Write-Host ""

