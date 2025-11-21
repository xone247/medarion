# Setup Script - Create Necessary Folders
# This script creates all folders needed for deployment

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Setup: Create Necessary Folders                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Local folders
$localFolders = @(
    "medarion-dist",
    "logs",
    "temp",
    "backups"
)

Write-Host "📁 Creating local folders..." -ForegroundColor Yellow
foreach ($folder in $localFolders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "   ✅ Created: $folder" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  Already exists: $folder" -ForegroundColor Gray
    }
}

# Create deployment state directory
$stateDir = ".deployment"
if (-not (Test-Path $stateDir)) {
    New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
    Write-Host "   ✅ Created: $stateDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Setup Complete: All necessary folders created" -ForegroundColor Green
Write-Host ""

