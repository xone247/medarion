# Deploy All Steps - Master Script
# This script runs all deployment steps in sequence

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Deployment - All Steps                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$steps = @(
    @{ Name = "Step 1: Cleanup"; Script = "deploy_step1_cleanup.ps1" },
    @{ Name = "Step 2: Build Frontend"; Script = "deploy_step2_build.ps1" },
    @{ Name = "Step 3: Upload Frontend"; Script = "deploy_step3_upload_frontend.ps1" },
    @{ Name = "Step 4: Upload Backend"; Script = "deploy_step4_upload_backend.ps1" },
    @{ Name = "Step 5: Upload .htaccess"; Script = "deploy_step5_upload_htaccess.ps1" },
    @{ Name = "Step 6: Upload Database"; Script = "deploy_step6_upload_database.ps1" },
    @{ Name = "Step 7: Deploy on Server"; Script = "deploy_step7_deploy_server.ps1" }
)

$failedSteps = @()

foreach ($step in $steps) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    if (-not (Test-Path $step.Script)) {
        Write-Host "❌ Script not found: $($step.Script)" -ForegroundColor Red
        $failedSteps += $step.Name
        continue
    }
    
    Write-Host "▶️  Running: $($step.Name)" -ForegroundColor Cyan
    Write-Host ""
    
    $result = & powershell -ExecutionPolicy Bypass -File $step.Script
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ $($step.Name) failed!" -ForegroundColor Red
        $failedSteps += $step.Name
        
        $response = Read-Host "Continue with next step? (y/n)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host ""
            Write-Host "Deployment stopped by user" -ForegroundColor Yellow
            break
        }
    } else {
        Write-Host ""
        Write-Host "✅ $($step.Name) completed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if ($failedSteps.Count -eq 0) {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ALL STEPS COMPLETED SUCCESSFULLY!                    ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your application: https://medarion.africa" -ForegroundColor Cyan
} else {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║     DEPLOYMENT COMPLETED WITH ERRORS                       ║" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Failed steps:" -ForegroundColor Yellow
    foreach ($step in $failedSteps) {
        Write-Host "   - $step" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "💡 You can re-run individual steps:" -ForegroundColor Cyan
    foreach ($step in $failedSteps) {
        $script = ($steps | Where-Object { $_.Name -eq $step }).Script
        Write-Host "   .\$script" -ForegroundColor White
    }
}

Write-Host ""

