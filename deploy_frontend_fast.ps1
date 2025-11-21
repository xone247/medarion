# Fast Frontend Deployment - For Quick Iteration
# This script only builds and deploys frontend (fastest option)

$ErrorActionPreference = "Continue"

Write-Host "`n⚡ Fast Frontend Deployment" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Build Frontend
# ============================================================
Write-Host "`n[1/3] Building Frontend" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   🔨 Building..." -ForegroundColor Cyan
npm run build 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Check build output
$buildDir = if (Test-Path "medarion-dist/index.html") { "medarion-dist" } else { "dist" }
if (-not (Test-Path "$buildDir/index.html")) {
    Write-Host "   ❌ Build output not found!" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Build complete" -ForegroundColor Green

# ============================================================
# Step 2: Load Config
# ============================================================
Write-Host "`n[2/3] Loading Configuration" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "   ❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscp = $config.ssh.plinkPath -replace "plink.exe", "pscp.exe"

if (-not (Test-Path $pscp)) {
    Write-Host "   ❌ PSCP not found!" -ForegroundColor Red
    exit 1
}

$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

Write-Host "   ✅ Configuration loaded" -ForegroundColor Green

# ============================================================
# Step 3: Deploy Frontend
# ============================================================
Write-Host "`n[3/3] Deploying Frontend" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   📤 Uploading to cPanel..." -ForegroundColor Cyan
& $pscp -P $sshPort -r "${buildDir}\*" "${sshUser}@${sshHost}:/home/medasnnc/public_html/" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Frontend deployed!" -ForegroundColor Green
    Write-Host "`n🌐 View changes: https://medarion.africa" -ForegroundColor Cyan
    Write-Host "   (Hard refresh: Ctrl+F5 to see changes)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Fast deployment complete!" -ForegroundColor Green

