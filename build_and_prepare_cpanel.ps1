# Build Production and Prepare for cPanel Deployment

$ErrorActionPreference = "Continue"

Write-Host "`n📦 Building Production and Preparing for cPanel" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Step 1: Build frontend
Write-Host "`n[1/4] Building production frontend..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
        Write-Host "   📁 Output: dist/ folder" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment package info
Write-Host "`n[2/4] Creating deployment checklist..." -ForegroundColor Yellow
$deploymentInfo = @"
# cPanel Deployment Files

## Frontend (Upload to public_html/)
- All files from: dist/
- Keep folder structure

## Backend (Upload to public_html/server/)
- server/ folder (excluding node_modules/)
- server/.env (update with cPanel values)
- server/package.json
- All server source files

## Environment Variables for cPanel (.env)
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast

# Add your cPanel database config:
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name
PORT=3001
NODE_ENV=production
"@

Set-Content -Path "CPANEL_FILES_TO_UPLOAD.txt" -Value $deploymentInfo
Write-Host "   ✅ Created: CPANEL_FILES_TO_UPLOAD.txt" -ForegroundColor Green

# Step 3: Verify dist folder
Write-Host "`n[3/4] Verifying build output..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $distFiles = Get-ChildItem -Path "dist" -Recurse -File | Measure-Object
    Write-Host "   ✅ dist/ folder contains $($distFiles.Count) files" -ForegroundColor Green
} else {
    Write-Host "   ❌ dist/ folder not found" -ForegroundColor Red
    exit 1
}

# Step 4: Summary
Write-Host "`n[4/4] Deployment Summary" -ForegroundColor Yellow
Write-Host "`n📋 Files Ready:" -ForegroundColor Cyan
Write-Host "   ✅ Frontend: dist/ folder" -ForegroundColor Green
Write-Host "   ✅ Backend: server/ folder" -ForegroundColor Green
Write-Host "   ✅ Config: CPANEL_FILES_TO_UPLOAD.txt" -ForegroundColor Green

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Upload dist/ contents to public_html/" -ForegroundColor White
Write-Host "   2. Upload server/ to public_html/server/" -ForegroundColor White
Write-Host "   3. Update server/.env with cPanel values" -ForegroundColor White
Write-Host "   4. Install dependencies: cd server && npm install --production" -ForegroundColor White
Write-Host "   5. Set up Node.js app in cPanel" -ForegroundColor White
Write-Host "   6. Test: https://yourdomain.com/api/ai/health" -ForegroundColor White

Write-Host "`n📄 See CPANEL_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Production build complete!" -ForegroundColor Green

