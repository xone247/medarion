# Step 6: Upload Database SQL File
# This script uploads the database SQL file to the server

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 6: Upload Database                               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" -Raw | ConvertFrom-Json
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password
$medarionPath = "/home/medasnnc/medarion"

# Function to upload file
function Upload-File-Auto {
    param([string]$Local, [string]$Remote)
    if (-not (Test-Path $Local)) {
        return $false
    }
    echo $password | & $pscpPath -P $sshPort -pw $password "$Local" "$sshUser@${sshHost}:${Remote}" 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# Function to run SSH command
function Run-SSH-Auto {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*") {
        return $result
    }
    return $null
}

# Find SQL file
$sqlFile = $null
$sqlFiles = @(
    "medarion_local_export_20251112_034406.sql",
    "medarion_local_export_20251111_150329.sql"
)

foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        $sqlFile = $file
        break
    }
}

if (-not $sqlFile) {
    Write-Host "❌ SQL file not found!" -ForegroundColor Red
    Write-Host "   Looking for:" -ForegroundColor Yellow
    foreach ($file in $sqlFiles) {
        Write-Host "     - $file" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "   💡 You may need to export your database first" -ForegroundColor Cyan
    exit 1
}

$fileSize = (Get-Item $sqlFile).Length / 1MB
Write-Host "📄 Found SQL file: $sqlFile" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
Write-Host ""

# Check if SQL file already exists on server
Write-Host "🔍 Checking if SQL file already exists on server..." -ForegroundColor Yellow
$existingCheck = Run-SSH-Auto "test -f $medarionPath/$sqlFile && echo 'EXISTS' || echo 'NOT_EXISTS'"
if ($existingCheck -like "*EXISTS*") {
    Write-Host "   ℹ️  SQL file already exists on server" -ForegroundColor Gray
    $response = Read-Host "   Re-upload SQL file? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "   ⏭️  Using existing SQL file on server" -ForegroundColor Gray
    } else {
        Write-Host "📤 Uploading SQL file..." -ForegroundColor Yellow
        $remoteSql = "$medarionPath/$sqlFile"
        if (Upload-File-Auto $sqlFile $remoteSql) {
            Write-Host "   ✅ SQL file uploaded" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to upload SQL file" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "📤 Uploading SQL file..." -ForegroundColor Yellow
    $remoteSql = "$medarionPath/$sqlFile"
    if (Upload-File-Auto $sqlFile $remoteSql) {
        Write-Host "   ✅ SQL file uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to upload SQL file" -ForegroundColor Red
        exit 1
    }
}

# Verify upload
Write-Host ""
Write-Host "🔍 Verifying upload..." -ForegroundColor Yellow
$verify = Run-SSH-Auto "test -f $remoteSql && echo 'EXISTS' || echo 'MISSING'"
if ($verify -like "*EXISTS*") {
    $remoteSize = Run-SSH-Auto "stat -c%s $remoteSql 2>/dev/null || stat -f%z $remoteSql 2>/dev/null || echo '0'"
    if ($remoteSize -match '\d+') {
        $remoteSizeMB = [math]::Round([int64]$remoteSize / 1MB, 2)
        Write-Host "   ✅ SQL file verified on server ($remoteSizeMB MB)" -ForegroundColor Green
    } else {
        Write-Host "   ✅ SQL file verified on server" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ SQL file not found on server!" -ForegroundColor Red
    exit 1
}

# Update state
Update-StepStatus "step6_upload_database" "completed"

Write-Host ""
Write-Host "✅ Step 6 Complete: Database SQL file uploaded successfully" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next: Run deploy_step7_deploy_server.ps1 to import and deploy" -ForegroundColor Cyan
Write-Host ""

