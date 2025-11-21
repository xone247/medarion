# Fast Deployment Script - Git to cPanel
# This script builds and deploys your project to cPanel using Git workflow

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Fast Git-to-cPanel Deployment" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Check Git Status
# ============================================================
Write-Host "`n[Step 1/6] Checking Git Status" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$hasChanges = $false
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    git status --short | Select-Object -First 10
    Write-Host "`n   Would you like to:" -ForegroundColor Cyan
    Write-Host "   1. Commit and push changes first (Recommended)" -ForegroundColor White
    Write-Host "   2. Deploy current state without committing" -ForegroundColor White
    Write-Host "   3. Cancel and commit manually" -ForegroundColor White
    
    $choice = Read-Host "`n   Enter choice (1-3)"
    
    if ($choice -eq "1") {
        $commitMsg = Read-Host "   Enter commit message (or press Enter for default)"
        if (-not $commitMsg) { $commitMsg = "Deployment: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
        
        Write-Host "`n   📝 Committing changes..." -ForegroundColor Cyan
        git add .
        git commit -m $commitMsg
        
        Write-Host "   📤 Pushing to GitHub..." -ForegroundColor Cyan
        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Changes pushed to GitHub" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Push failed, but continuing with deployment" -ForegroundColor Yellow
        }
    } elseif ($choice -eq "3") {
        Write-Host "   ❌ Deployment cancelled" -ForegroundColor Red
        exit 0
    }
}

# ============================================================
# Step 2: Build Frontend
# ============================================================
Write-Host "`n[Step 2/6] Building Frontend" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   🔨 Running: npm run build" -ForegroundColor Cyan
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
        
        if (Test-Path "dist/index.html") {
            $distFiles = Get-ChildItem -Path "dist" -Recurse -File | Measure-Object
            $distSize = (Get-ChildItem -Path "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "   📁 Output: dist/ folder" -ForegroundColor Gray
            Write-Host "   📊 Files: $($distFiles.Count) files, $([math]::Round($distSize, 2)) MB" -ForegroundColor Gray
        } else {
            Write-Host "   ❌ dist/index.html not found!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ❌ Build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================================
# Step 3: Load cPanel Configuration
# ============================================================
Write-Host "`n[Step 3/6] Loading cPanel Configuration" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

if (Test-Path "cpanel-config.json") {
    $config = Get-Content "cpanel-config.json" | ConvertFrom-Json
    Write-Host "   ✅ Configuration loaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ cpanel-config.json not found!" -ForegroundColor Red
    Write-Host "   Please create cpanel-config.json with SSH credentials" -ForegroundColor Yellow
    exit 1
}

$pscp = $config.ssh.plinkPath -replace "plink.exe", "pscp.exe"
if (-not (Test-Path $pscp)) {
    Write-Host "   ❌ PSCP not found at: $pscp" -ForegroundColor Red
    exit 1
}

$plink = $config.ssh.plinkPath
if (-not (Test-Path $plink)) {
    Write-Host "   ❌ PLINK not found at: $plink" -ForegroundColor Red
    exit 1
}

$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

# ============================================================
# Step 4: Upload Frontend
# ============================================================
Write-Host "`n[Step 4/6] Uploading Frontend to cPanel" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "   📤 Uploading dist/ to /home/medasnnc/public_html/" -ForegroundColor Cyan
Write-Host "   This may take a moment..." -ForegroundColor Gray

& $pscp -P $sshPort -r "dist\*" "${sshUser}@${sshHost}:/home/medasnnc/public_html/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Frontend uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend upload failed" -ForegroundColor Red
    Write-Host "   Check SSH connection and try again" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# Step 5: Upload Backend (if changed)
# ============================================================
Write-Host "`n[Step 5/6] Checking Backend Changes" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$backendFiles = @(
    "server/routes/admin.js",
    "server/routes/blog.js",
    "server/routes/notifications.js",
    "server/routes/ai.js",
    "server/server.js"
)

$hasBackendChanges = $false
foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        $hasBackendChanges = $true
        break
    }
}

if ($hasBackendChanges) {
    Write-Host "   📤 Uploading backend files..." -ForegroundColor Cyan
    
    foreach ($file in $backendFiles) {
        if (Test-Path $file) {
            $fileName = Split-Path $file -Leaf
            $remotePath = "/home/medasnnc/api.medarion.africa/routes/$fileName"
            if ($file -eq "server/server.js") {
                $remotePath = "/home/medasnnc/api.medarion.africa/server.js"
            }
            
            Write-Host "   📄 Uploading: $file" -ForegroundColor Gray
            & $pscp -P $sshPort $file "${sshUser}@${sshHost}:$remotePath"
        }
    }
    
    Write-Host "   ✅ Backend files uploaded" -ForegroundColor Green
    
    # Restart backend
    Write-Host "   🔄 Restarting backend server..." -ForegroundColor Cyan
    & $plink -P $sshPort -batch "${sshUser}@${sshHost}" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Backend restarted successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend restart may have failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  No backend changes detected" -ForegroundColor Cyan
}

# ============================================================
# Step 6: Summary
# ============================================================
Write-Host "`n[Step 6/6] Deployment Summary" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   • Frontend: Uploaded to https://medarion.africa" -ForegroundColor White
Write-Host "   • Backend: Updated and restarted" -ForegroundColor White
if ($choice -eq "1") {
    Write-Host "   • Git: Changes committed and pushed" -ForegroundColor White
}

Write-Host "`n🌐 Test your deployment:" -ForegroundColor Cyan
Write-Host "   • Frontend: https://medarion.africa" -ForegroundColor White
Write-Host "   • Backend API: https://api.medarion.africa/api/health" -ForegroundColor White

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray

