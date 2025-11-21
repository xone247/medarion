# Step 4: Upload Backend Files
# This script uploads the Node.js backend server to cPanel

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 4: Upload Backend                                ║" -ForegroundColor Cyan
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
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18"
$serverPath = "$nodeAppPath/server"
$medarionPath = "/home/medasnnc/medarion"

# Function to run SSH command
function Run-SSH-Auto {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*") {
        return $result
    }
    return $null
}

# Function to upload file
function Upload-File-Auto {
    param([string]$Local, [string]$Remote)
    if (-not (Test-Path $Local)) {
        return $false
    }
    echo $password | & $pscpPath -P $sshPort -pw $password "$Local" "$sshUser@${sshHost}:${Remote}" 2>&1 | Out-Null
    return ($LASTEXITCODE -eq 0)
}

# Check if server directory exists
if (-not (Test-Path "server")) {
    Write-Host "❌ server directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "server/server.js")) {
    Write-Host "❌ server/server.js not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "server/package.json")) {
    Write-Host "❌ server/package.json not found!" -ForegroundColor Red
    exit 1
}

# Check if backend already exists on server
Write-Host "🔍 Checking existing backend on server..." -ForegroundColor Yellow
$existingCheck = Run-SSH-Auto "test -f $serverPath/server.js && echo 'EXISTS' || echo 'NOT_EXISTS'"
if ($existingCheck -like "*EXISTS*") {
    Write-Host "   ⚠️  Backend already exists on server" -ForegroundColor Yellow
    $response = Read-Host "   Overwrite existing backend? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "   ⏭️  Skipping backend upload" -ForegroundColor Gray
        exit 0
    }
    Write-Host "   ✅ Will overwrite existing backend" -ForegroundColor Green
}
Write-Host ""

Write-Host "📤 Uploading backend files..." -ForegroundColor Yellow
Write-Host ""

# Create tar archive
Write-Host "   📦 Creating archive..." -ForegroundColor Gray
$tar = "server_backend.tar.gz"
Remove-Item $tar -ErrorAction SilentlyContinue

# Use tar command (Windows 10+ has tar built-in)
tar -czf $tar -C server . 2>&1 | Out-Null

if (-not (Test-Path $tar)) {
    Write-Host "   ❌ Failed to create archive" -ForegroundColor Red
    exit 1
}

$tarSize = (Get-Item $tar).Length / 1MB
Write-Host "   ✅ Archive created: $([math]::Round($tarSize, 2)) MB" -ForegroundColor Green

# Upload archive
Write-Host "   📤 Uploading archive..." -ForegroundColor Gray
$remoteTar = "$medarionPath/$tar"
if (Upload-File-Auto $tar $remoteTar) {
    Write-Host "   ✅ Archive uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload archive" -ForegroundColor Red
    Remove-Item $tar -ErrorAction SilentlyContinue
    exit 1
}

# Extract on server
Write-Host "   📂 Extracting on server..." -ForegroundColor Gray
$extractCmd = "cd $nodeAppPath; mkdir -p server; tar -xzf $remoteTar -C server; rm $remoteTar"
$result = Run-SSH-Auto $extractCmd

if ($result -ne $null) {
    Write-Host "   ✅ Files extracted" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Extraction may have had issues" -ForegroundColor Yellow
}

# Clean up local archive
Remove-Item $tar -ErrorAction SilentlyContinue

# Verify upload
Write-Host ""
Write-Host "🔍 Verifying upload..." -ForegroundColor Yellow
$verify = Run-SSH-Auto "test -f $serverPath/server.js && echo 'EXISTS' || echo 'MISSING'"
if ($verify -like "*EXISTS*") {
    Write-Host "   ✅ server.js verified on server" -ForegroundColor Green
} else {
    Write-Host "   ❌ server.js not found on server!" -ForegroundColor Red
    exit 1
}

$packageVerify = Run-SSH-Auto "test -f $serverPath/package.json && echo 'EXISTS' || echo 'MISSING'"
if ($packageVerify -like "*EXISTS*") {
    Write-Host "   ✅ package.json verified" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  package.json not found" -ForegroundColor Yellow
}

# Update state
Update-StepStatus "step4_upload_backend" "completed"

Write-Host ""
Write-Host "✅ Step 4 Complete: Backend uploaded successfully" -ForegroundColor Green
Write-Host ""

