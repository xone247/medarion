# Deploy Backend Changes and Upload Logo Files
# This script deploys backend changes and ensures logo files are on the server

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Deploying Backend and Checking Logos" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Load config
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "   ❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plink = $config.ssh.plinkPath
$pscp = $plink -replace "plink.exe", "pscp.exe"
$sshHost = $config.ssh.host
$user = $config.ssh.username
$port = $config.ssh.port
$key = $config.ssh.keyPath
$pass = $config.ssh.password

$backendPath = "/home/medasnnc/api.medarion.africa"
$uploadsPath = "/home/medasnnc/api.medarion.africa/uploads"
$logoDir = "public/uploads/company"

Write-Host "`n[1/4] Checking Backend Files" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (-not (Test-Path "server/routes/admin.js")) {
    Write-Host "   ❌ server/routes/admin.js not found!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Backend files ready" -ForegroundColor Green

Write-Host "`n[2/4] Deploying Backend Changes" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   📤 Uploading server/routes/admin.js..." -ForegroundColor Cyan
$adminJsPath = "server/routes/admin.js"
$remoteAdminJsPath = "$backendPath/routes/admin.js"

# Upload admin.js
$uploadCmd = "echo $pass | & `"$pscp`" -P $port -pw $pass -i `"$key`" `"$adminJsPath`" `${user}@${sshHost}:${remoteAdminJsPath}"
Write-Host "   Command: $uploadCmd" -ForegroundColor Gray
Invoke-Expression $uploadCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend file uploaded" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Upload may have failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "`n[3/4] Checking Logo Files on Server" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Check if logo directory exists on server
Write-Host "   🔍 Checking server logo directory..." -ForegroundColor Cyan
$checkDirCmd = "echo $pass | & `"$plink`" -P $port -pw $pass -i `"$key`" -batch `${user}@${sshHost} `"test -d $uploadsPath/company && echo 'EXISTS' || echo 'NOT_EXISTS'`""
$dirResult = Invoke-Expression $checkDirCmd | Out-String

if ($dirResult -match "NOT_EXISTS") {
    Write-Host "   📁 Creating logo directory on server..." -ForegroundColor Cyan
    $createDirCmd = "echo $pass | & `"$plink`" -P $port -pw $pass -i `"$key`" -batch `${user}@${sshHost} `"mkdir -p $uploadsPath/company`""
    Invoke-Expression $createDirCmd
    Write-Host "   ✅ Logo directory created" -ForegroundColor Green
} else {
    Write-Host "   ✅ Logo directory exists" -ForegroundColor Green
}

# Count local logo files
if (Test-Path $logoDir) {
    $localLogos = Get-ChildItem -Path $logoDir -Filter "*.{png,jpg,jpeg,svg}" -Recurse | Where-Object { -not $_.PSIsContainer }
    Write-Host "   📊 Local logo files: $($localLogos.Count)" -ForegroundColor Cyan
    
    # Check server logo count
    $serverLogoCountCmd = "echo $pass | & `"$plink`" -P $port -pw $pass -i `"$key`" -batch `${user}@${sshHost} `"find $uploadsPath/company -type f -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.svg' 2>/dev/null | wc -l`""
    $serverCount = Invoke-Expression $serverLogoCountCmd | Out-String
    $serverCount = $serverCount.Trim()
    Write-Host "   📊 Server logo files: $serverCount" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  Local logo directory not found: $logoDir" -ForegroundColor Yellow
    $localLogos = @()
}

Write-Host "`n[4/4] Uploading Logo Files" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if ($localLogos.Count -gt 0) {
    Write-Host "   📤 Uploading $($localLogos.Count) logo files..." -ForegroundColor Cyan
    
    # Upload all logo files
    $uploadLogosCmd = "echo $pass | & `"$pscp`" -P $port -pw $pass -i `"$key`" -r `"$logoDir/*`" `${user}@${sshHost}:${uploadsPath}/company/"
    Write-Host "   Command: $uploadLogosCmd" -ForegroundColor Gray
    Invoke-Expression $uploadLogosCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Logo files uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Logo upload may have failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  No local logo files to upload" -ForegroundColor Yellow
}

Write-Host "`n[5/5] Restarting Backend Server" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"
Write-Host "   🔄 Restarting backend server..." -ForegroundColor Cyan
$restartCmd = "echo $pass | & `"$plink`" -P $port -pw $pass -i `"$key`" -batch `${user}@${sshHost} `"cd $backendPath; $pm2Path restart medarion-backend 2>&1 || $pm2Path start server.js --name medarion-backend 2>&1`""
$restartResult = Invoke-Expression $restartCmd | Out-String
Write-Host $restartResult -ForegroundColor Gray

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check backend logs to see companies API query" -ForegroundColor White
Write-Host "  2. Test logo URLs in browser" -ForegroundColor White
Write-Host "  3. Verify all 288 companies are returned" -ForegroundColor White

