# Step 3: Upload Frontend Files
# This script uploads the built frontend to cPanel public_html

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 3: Upload Frontend                               ║" -ForegroundColor Cyan
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
$publicHtml = "/home/medasnnc/public_html"

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

# Check if build exists
if (-not (Test-Path "medarion-dist")) {
    Write-Host "❌ medarion-dist directory not found!" -ForegroundColor Red
    Write-Host "   Run deploy_step2_build.ps1 first" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "medarion-dist/index.html")) {
    Write-Host "❌ medarion-dist/index.html not found!" -ForegroundColor Red
    Write-Host "   Run deploy_step2_build.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if files already exist on server
Write-Host "🔍 Checking existing files on server..." -ForegroundColor Yellow
$existingCheck = Run-SSH-Auto "test -f $publicHtml/index.html && echo 'EXISTS' || echo 'NOT_EXISTS'"
if ($existingCheck -like "*EXISTS*") {
    Write-Host "   ⚠️  Files already exist on server" -ForegroundColor Yellow
    $response = Read-Host "   Overwrite existing files? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "   ⏭️  Skipping frontend upload" -ForegroundColor Gray
        exit 0
    }
    Write-Host "   ✅ Will overwrite existing files" -ForegroundColor Green
}
Write-Host ""

Write-Host "📤 Uploading frontend files..." -ForegroundColor Yellow
Write-Host ""

# Upload index.html
Write-Host "   📄 Uploading index.html..." -ForegroundColor Gray
if (Upload-File-Auto "medarion-dist/index.html" "$publicHtml/index.html") {
    Write-Host "   ✅ index.html uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload index.html" -ForegroundColor Red
    exit 1
}

# Upload assets
if (Test-Path "medarion-dist/assets") {
    Write-Host "   📦 Uploading assets..." -ForegroundColor Gray
    $assets = Get-ChildItem "medarion-dist/assets" -File -Recurse
    $total = $assets.Count
    $current = 0
    
    foreach ($file in $assets) {
        $current++
        $relativePath = $file.FullName.Replace((Resolve-Path "medarion-dist").Path + "\", "").Replace("\", "/")
        $remotePath = "$publicHtml/$relativePath"
        $remoteDir = $remotePath.Substring(0, $remotePath.LastIndexOf("/"))
        
        # Create directory if needed
        Run-SSH-Auto "mkdir -p `"$remoteDir`"" | Out-Null
        
        if (Upload-File-Auto $file.FullName $remotePath) {
            if ($current % 10 -eq 0 -or $current -eq $total) {
                Write-Host "      Progress: $current/$total files" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "      ⚠️  Failed to upload: $relativePath" -ForegroundColor Yellow
        }
    }
    Write-Host "   ✅ Assets uploaded ($total files)" -ForegroundColor Green
}

# Upload other root files
Write-Host "   📄 Uploading other files..." -ForegroundColor Gray
Get-ChildItem "medarion-dist" -File | Where-Object { $_.Name -ne "index.html" } | ForEach-Object {
    if (Upload-File-Auto $_.FullName "$publicHtml/$($_.Name)") {
        Write-Host "      ✅ $($_.Name)" -ForegroundColor DarkGreen
    }
}

# Verify upload
Write-Host ""
Write-Host "🔍 Verifying upload..." -ForegroundColor Yellow
$verify = Run-SSH-Auto "test -f $publicHtml/index.html && echo 'EXISTS' || echo 'MISSING'"
if ($verify -like "*EXISTS*") {
    Write-Host "   ✅ index.html verified on server" -ForegroundColor Green
} else {
    Write-Host "   ❌ index.html not found on server!" -ForegroundColor Red
    exit 1
}

$assetVerify = Run-SSH-Auto "ls -la $publicHtml/assets 2>/dev/null | wc -l"
if ($assetVerify -match '\d+' -and [int]$assetVerify -gt 0) {
    Write-Host "   ✅ Assets directory verified" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Assets directory may be empty" -ForegroundColor Yellow
}

# Update state
Update-StepStatus "step3_upload_frontend" "completed"

Write-Host ""
Write-Host "✅ Step 3 Complete: Frontend uploaded successfully" -ForegroundColor Green
Write-Host ""

