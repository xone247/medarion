# Quick Development Workflow
# Combines Git operations and deployment in one command

param(
    [string]$Message = "Update",
    [switch]$Deploy,
    [switch]$NoCommit
)

$ErrorActionPreference = "Continue"

Write-Host "`n⚡ Quick Development Workflow" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Step 1: Check status
Write-Host "`n[1/3] Checking Status" -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "   ℹ️  No changes to commit" -ForegroundColor Cyan
    if (-not $Deploy) {
        Write-Host "   💡 Use -Deploy flag to deploy without committing" -ForegroundColor Gray
        exit 0
    }
} else {
    Write-Host "   📋 Changes detected:" -ForegroundColor Cyan
    git status --short | Select-Object -First 10
}

# Step 2: Commit (if not skipped)
if (-not $NoCommit -and $status) {
    Write-Host "`n[2/3] Committing Changes" -ForegroundColor Yellow
    git add .
    git commit -m $Message
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Committed: $Message" -ForegroundColor Green
        
        # Push to GitHub
        Write-Host "   📤 Pushing to GitHub..." -ForegroundColor Cyan
        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Pushed to GitHub" -ForegroundColor Green
        }
    }
}

# Step 3: Deploy (if requested)
if ($Deploy) {
    Write-Host "`n[3/3] Deploying to cPanel" -ForegroundColor Yellow
    & ".\deploy_from_git.ps1"
} else {
    Write-Host "`n[3/3] Skipping Deployment" -ForegroundColor Yellow
    Write-Host "   💡 Use -Deploy flag to deploy to cPanel" -ForegroundColor Gray
}

Write-Host "`n✅ Workflow Complete!" -ForegroundColor Green


















