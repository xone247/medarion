# Quick Install All Dependencies
# Installs dependencies for both root (frontend) and server (backend)

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     INSTALLING ALL DEPENDENCIES                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Install root dependencies (frontend)
Write-Host "1. Installing root dependencies (frontend)..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   [ERROR] Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Root dependencies installed" -ForegroundColor Green
Write-Host ""

# Install server dependencies (backend)
Write-Host "2. Installing server dependencies (backend)..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\server"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   [ERROR] Failed to install server dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Server dependencies installed" -ForegroundColor Green
Write-Host ""

# Return to root
Set-Location $PSScriptRoot

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

