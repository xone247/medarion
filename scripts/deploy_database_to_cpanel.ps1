# Deploy Database to cPanel
# This script exports local database and uploads to cPanel

Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host "DEPLOYING DATABASE TO CPANEL" -ForegroundColor Blue
Write-Host "=" -NoNewline
Write-Host ("=" * 79) -ForegroundColor Blue
Write-Host ""

# Step 1: Export local database
Write-Host "Step 1: Exporting local database..." -ForegroundColor Yellow
php scripts/export_local_database.php
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Export failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Upload to cPanel
Write-Host ""
Write-Host "Step 2: Uploading to cPanel..." -ForegroundColor Yellow
php scripts/upload_database_to_cpanel.php
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Database deployment complete!" -ForegroundColor Green

