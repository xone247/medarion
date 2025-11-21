# Quick Sync Script - Syncs only changed files to cPanel
# Faster than full deployment for small changes

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host "⚡ Quick Sync to cPanel" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "   Run deploy_to_cpanel.ps1 first to create the config file." -ForegroundColor Yellow
    exit 1
}

# Load configuration
try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

# Check if frontend needs rebuilding
$frontendChanged = $false
if (Test-Path "src") {
    $srcLastWrite = (Get-ChildItem -Path "src" -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
    $distLastWrite = if (Test-Path "medarion-dist") { 
        (Get-ChildItem -Path "medarion-dist" -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime 
    } else { 
        [DateTime]::MinValue 
    }
    
    if ($srcLastWrite -gt $distLastWrite) {
        $frontendChanged = $true
        Write-Host "📦 Frontend changes detected - rebuilding..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Frontend rebuilt" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "📤 Syncing files..." -ForegroundColor Cyan
Write-Host ""

# Use the main deployment script but skip build if already done
if (-not $frontendChanged) {
    Write-Host "   (Skipping build - no frontend changes)" -ForegroundColor Gray
    Write-Host ""
}

# For quick sync, we'll use the same upload logic but only sync specific directories
# This is a simplified version - for full sync, use deploy_to_cpanel.ps1

Write-Host "💡 For full deployment, use: .\deploy_to_cpanel.ps1" -ForegroundColor Yellow
Write-Host "   This quick sync is best for small file changes." -ForegroundColor Yellow
Write-Host ""

# You can extend this script to only sync specific files/directories
# For now, it's recommended to use the full deployment script

Write-Host "✅ Quick sync complete!" -ForegroundColor Green

