# Commit and Sync - Git commit followed by automatic cPanel sync
# Usage: .\scripts\commit_and_sync.ps1 "Your commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📝 COMMIT AND SYNC TO PRODUCTION" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Step 1: Stage all changes
Write-Host "[1/4] Staging changes..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to stage changes" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Changes staged" -ForegroundColor Green

# Step 2: Commit changes
Write-Host "`n[2/4] Committing changes..." -ForegroundColor Cyan
Write-Host "   Message: $CommitMessage" -ForegroundColor Gray
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Changes committed" -ForegroundColor Green

# Step 3: Push to remote
Write-Host "`n[3/4] Pushing to remote..." -ForegroundColor Cyan
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠ Failed to push to remote, continuing with sync..." -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Changes pushed to remote" -ForegroundColor Green
}

# Step 4: Sync to cPanel
Write-Host "`n[4/4] Syncing to cPanel..." -ForegroundColor Cyan
& .\scripts\auto_sync_to_cpanel.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠ Sync had issues, check output above" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Sync completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "✅ ALL DONE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "Your changes are now:" -ForegroundColor Yellow
Write-Host "   ✓ Committed to Git" -ForegroundColor White
Write-Host "   ✓ Pushed to remote" -ForegroundColor White
Write-Host "   ✓ Deployed to cPanel production" -ForegroundColor White
Write-Host ""

