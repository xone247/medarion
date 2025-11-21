# Deploy Website to cPanel (Essential Files Only)
# Shows progress for each step

$ErrorActionPreference = "Continue"

function Write-Progress-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    $percent = [math]::Round(($Step / $Total) * 100)
    Write-Progress -Activity "Deploying Website to cPanel" -Status $Message -PercentComplete $percent
    Write-Host "`n[$Step/$Total] $Message" -ForegroundColor Cyan
}

Write-Host "`n🚀 Deploying Website to cPanel..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load config
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "`n❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$cpanelPort = if ($config.ssh.port) { $config.ssh.port } else { 22 }
$usePlink = if ($config.ssh.usePlink) { $config.ssh.usePlink } else { $false }
$plinkPath = if ($config.ssh.plinkPath) { $config.ssh.plinkPath } else { "C:\Program Files\PuTTY\plink.exe" }
$sshPassword = if ($config.ssh.password) { $config.ssh.password } else { $null }
$cpanelKey = $config.ssh.keyPath

$localPath = Get-Location
$remotePath = "/home/medasnnc/nodevenv/medarion/18/bin"
$backupPath = "/home/medasnnc/backups"

# Essential items only (no AI config, no test files, no docs)
$essentialItems = @(
    "server",
    "public",
    "package.json",
    "package-lock.json"
)

Write-Host "`n📋 Files to Deploy:" -ForegroundColor Yellow
$essentialItems | ForEach-Object { Write-Host "   ✅ $_" -ForegroundColor Green }

# Step 1: Backup
Write-Progress-Step -Step 1 -Total 5 -Message "Creating Backup..."
$backupCmd = "mkdir -p $backupPath && tar -czf $backupPath/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $remotePath . 2>/dev/null && echo '✅ Backup created'"
if ($usePlink) {
    if ($sshPassword) {
        $backupResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $backupCmd 2>&1
    } else {
        $backupResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $backupCmd 2>&1
    }
} else {
    $backupResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $backupCmd 2>&1
}
Write-Host "   $backupResult" -ForegroundColor Gray

# Step 2: Sync files
Write-Progress-Step -Step 2 -Total 5 -Message "Syncing Essential Files..."

$itemCount = 0
$totalItems = $essentialItems.Count

foreach ($item in $essentialItems) {
    $itemCount++
    $sourcePath = Join-Path $localPath $item
    if (Test-Path $sourcePath) {
        Write-Host "   📤 [$itemCount/$totalItems] Syncing: $item" -ForegroundColor Yellow
        Write-Progress -Activity "Syncing Files" -Status "Syncing: $item" -PercentComplete (($itemCount / $totalItems) * 100)
        
        if (Test-Path $sourcePath -PathType Container) {
            # Directory
            $destPath = "${remotePath}/${item}"
            $mkdirCmd = "mkdir -p `"$destPath`""
            if ($usePlink) {
                if ($sshPassword) {
                    echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $mkdirCmd 2>&1 | Out-Null
                }
            }
            
            # Sync directory files
            $files = Get-ChildItem -Path $sourcePath -Recurse -File
            $fileCount = 0
            $totalFiles = $files.Count
            
            $files | ForEach-Object {
                $fileCount++
                if ($fileCount % 20 -eq 0 -or $fileCount -eq $totalFiles) {
                    Write-Progress -Activity "Syncing $item" -Status "File $fileCount of $totalFiles" -PercentComplete (($fileCount / $totalFiles) * 100)
                }
                
                $relativePath = $_.FullName.Substring($sourcePath.Length + 1).Replace('\', '/')
                $remoteFile = "${destPath}/${relativePath}"
                $remoteDir = Split-Path $remoteFile -Parent
                
                # Create remote directory
                $mkdirCmd = "mkdir -p `"$remoteDir`""
                if ($usePlink -and $sshPassword) {
                    echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $mkdirCmd 2>&1 | Out-Null
                }
                
                # Upload file
                if ($usePlink) {
                    $pscpPath = $plinkPath -replace "plink.exe", "pscp.exe"
                    if ($sshPassword) {
                        echo $sshPassword | & $pscpPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "$($_.FullName)" "${cpanelUser}@${cpanelHost}:${remoteFile}" 2>&1 | Out-Null
                    } else {
                        & $pscpPath -P $cpanelPort -i $cpanelKey "$($_.FullName)" "${cpanelUser}@${cpanelHost}:${remoteFile}" 2>&1 | Out-Null
                    }
                } else {
                    scp -i $cpanelKey -P $cpanelPort "$($_.FullName)" "${cpanelUser}@${cpanelHost}:${remoteFile}" 2>&1 | Out-Null
                }
            }
            Write-Progress -Activity "Syncing $item" -Completed
        } else {
            # File
            $remoteFile = "${remotePath}/${item}"
            if ($usePlink) {
                $pscpPath = $plinkPath -replace "plink.exe", "pscp.exe"
                if ($sshPassword) {
                    echo $sshPassword | & $pscpPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "$sourcePath" "${cpanelUser}@${cpanelHost}:${remoteFile}" 2>&1 | Out-Null
                } else {
                    & $pscpPath -P $cpanelPort -i $cpanelKey "$sourcePath" "${cpanelUser}@${cpanelHost}:${remoteFile}" 2>&1 | Out-Null
                }
            } else {
                scp -i $cpanelKey -P $cpanelPort "$sourcePath" "${cpanelUser}@${cpanelHost}:${remoteFile}" 2>&1 | Out-Null
            }
        }
        Write-Host "      ✅ Done" -ForegroundColor Green
    }
}

Write-Progress -Activity "Syncing Files" -Completed

# Step 3: Install dependencies
Write-Progress-Step -Step 3 -Total 5 -Message "Installing Dependencies..."
$npmCmd = "cd $remotePath && npm install --production 2>&1 | tail -15"
if ($usePlink) {
    if ($sshPassword) {
        $npmResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $npmCmd 2>&1
    } else {
        $npmResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $npmCmd 2>&1
    }
} else {
    $npmResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $npmCmd 2>&1
}
Write-Host $npmResult

# Step 4: Restart application
Write-Progress-Step -Step 4 -Total 5 -Message "Restarting Application..."
$restartCmd = "systemctl restart medarion-api.service 2>&1 || pm2 restart all 2>&1 || echo 'Restart attempted'"
if ($usePlink) {
    if ($sshPassword) {
        $restartResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $restartCmd 2>&1
    } else {
        $restartResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $restartCmd 2>&1
    }
} else {
    $restartResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $restartCmd 2>&1
}
Write-Host "   $restartResult" -ForegroundColor Gray

# Step 5: Verify deployment
Write-Progress-Step -Step 5 -Total 5 -Message "Verifying Deployment..."
$verifyCmd = "ls -la $remotePath/server.js $remotePath/package.json 2>&1 && echo '---' && systemctl status medarion-api.service --no-pager 2>&1 | head -5"
if ($usePlink) {
    if ($sshPassword) {
        $verifyResult = echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" $verifyCmd 2>&1
    } else {
        $verifyResult = & $plinkPath -P $cpanelPort -i $cpanelKey "${cpanelUser}@${cpanelHost}" $verifyCmd 2>&1
    }
} else {
    $verifyResult = ssh -i $cpanelKey -p $cpanelPort "${cpanelUser}@${cpanelHost}" $verifyCmd 2>&1
}
Write-Host "   $verifyResult" -ForegroundColor Gray

Write-Progress -Activity "Deploying Website to cPanel" -Completed
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Website Deployment Complete!" -ForegroundColor Green
Write-Host "`n💡 Next: Test your website, then we'll configure AI connection" -ForegroundColor Cyan

