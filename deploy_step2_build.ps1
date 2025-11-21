# Step 2: Build Frontend
# This script builds the React frontend for production

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 2: Build Frontend                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists and package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    Write-Host "   Please ensure you're in the project root directory" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Write-Host "   node_modules not found, installing..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
} else {
    $moduleCount = (Get-ChildItem "node_modules" -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
    if ($moduleCount -gt 0) {
        Write-Host "   ℹ️  node_modules exists ($moduleCount packages)" -ForegroundColor Gray
        Write-Host "   ⏭️  Skipping dependency installation" -ForegroundColor Gray
    } else {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    }
    Write-Host ""
}

# Check if medarion-dist exists and has content
$needsBuild = $true
if (Test-Path "medarion-dist") {
    $fileCount = (Get-ChildItem "medarion-dist" -Recurse -File | Measure-Object).Count
    if ($fileCount -gt 0) {
        Write-Host "📋 Checking existing build..." -ForegroundColor Yellow
        $response = Read-Host "   medarion-dist exists with $fileCount files. Rebuild? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            $needsBuild = $true
        } else {
            $needsBuild = $false
        }
    }
}

if ($needsBuild) {
    Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
    Write-Host "   This may take a few minutes..." -ForegroundColor Gray
    Write-Host ""
    
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "   ✅ Build completed" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  Skipping build (using existing)" -ForegroundColor Yellow
}

# Verify build output
Write-Host ""
Write-Host "🔍 Verifying build output..." -ForegroundColor Yellow

if (Test-Path "medarion-dist/index.html") {
    Write-Host "   ✅ index.html exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ index.html missing!" -ForegroundColor Red
    exit 1
}

$assetCount = (Get-ChildItem "medarion-dist/assets" -File -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
if ($assetCount -gt 0) {
    Write-Host "   ✅ Assets directory has $assetCount files" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Assets directory is empty" -ForegroundColor Yellow
}

$totalSize = (Get-ChildItem "medarion-dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   📊 Total build size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Gray

# Update state
Update-StepStatus "step2_build" "completed"

Write-Host ""
Write-Host "✅ Step 2 Complete: Frontend built successfully" -ForegroundColor Green
Write-Host ""

