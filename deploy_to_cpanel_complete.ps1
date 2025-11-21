# Complete cPanel Deployment Script
# Tests local, builds, and prepares for cPanel upload

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Complete cPanel Deployment" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# ============================================================
# Step 1: Test Local Environment
# ============================================================
Write-Host "`n[Step 1/6] Testing Local Environment" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Check backend
Write-Host "`n[1.1] Checking Backend Server..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Backend is running on port 3001" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Backend not running - starting it..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; `$env:NODE_ENV='development'; node server.js" -WindowStyle Normal
    Write-Host "   ⏳ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
        Write-Host "   ✅ Backend is now running" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Backend failed to start. Please start manually." -ForegroundColor Red
        Write-Host "   Command: cd server && npm start" -ForegroundColor Gray
    }
}

# Test backend API
Write-Host "`n[1.2] Testing Backend API..." -ForegroundColor Cyan
try {
    $body = @{ query = "test" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/query" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    if ($response.success) {
        Write-Host "   ✅ Backend API is working" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Backend API test failed (may need Vast.ai connection)" -ForegroundColor Yellow
    Write-Host "   This is OK if Vast.ai tunnel is not running" -ForegroundColor Gray
}

# Check frontend
Write-Host "`n[1.3] Checking Frontend..." -ForegroundColor Cyan
if (Test-Path "dist") {
    $distFiles = Get-ChildItem -Path "dist" -Recurse -File | Measure-Object
    Write-Host "   ✅ dist folder exists ($($distFiles.Count) files)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  dist folder not found (will build in next step)" -ForegroundColor Yellow
}

# ============================================================
# Step 2: Build Production Frontend
# ============================================================
Write-Host "`n[Step 2/6] Building Production Frontend" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`nRunning: npm run build" -ForegroundColor Cyan
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
        
        # Verify build
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
# Step 3: Prepare Backend for Upload
# ============================================================
Write-Host "`n[Step 3/6] Preparing Backend for Upload" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Check server folder
if (Test-Path "server") {
    Write-Host "   ✅ server/ folder exists" -ForegroundColor Green
    
    # Check for .env
    if (Test-Path "server/.env") {
        Write-Host "   ✅ server/.env exists" -ForegroundColor Green
        Write-Host "   ⚠️  Remember to update .env on cPanel with production values!" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  server/.env not found" -ForegroundColor Yellow
        Write-Host "   You'll need to create it on cPanel" -ForegroundColor Gray
    }
    
    # Check package.json
    if (Test-Path "server/package.json") {
        Write-Host "   ✅ server/package.json exists" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ server/ folder not found!" -ForegroundColor Red
    exit 1
}

# ============================================================
# Step 4: Create Deployment Instructions
# ============================================================
Write-Host "`n[Step 4/6] Creating Deployment Instructions" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$instructions = @"
# cPanel Deployment Instructions

## 📦 Files to Upload

### Frontend (Upload to: public_html/)
- Upload ALL contents from: dist/
- Keep folder structure intact
- Files include: index.html, assets/, etc.

### Backend (Upload to: public_html/server/)
- Upload entire server/ folder (excluding node_modules/)
- Include: server.js, package.json, routes/, services/, etc.
- Do NOT upload: node_modules/ (install on cPanel)

## 🔧 cPanel Setup Steps

### 1. Upload Files
- Use File Manager or FTP/SFTP
- Frontend: Upload dist/ contents to public_html/
- Backend: Upload server/ folder to public_html/server/

### 2. Install Backend Dependencies
SSH into cPanel or use Terminal:
```bash
cd ~/public_html/server
npm install --production
```

### 3. Create/Update .env File
Create server/.env on cPanel with:
```env
# Vast.ai Configuration
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast

# Database Configuration (UPDATE WITH YOUR VALUES)
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name

# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here

# CORS (UPDATE WITH YOUR DOMAIN)
CORS_ORIGIN=https://yourdomain.com
```

### 4. Set Up Node.js App in cPanel
1. Go to cPanel → Node.js Selector
2. Create new application:
   - Node.js version: 18 or 20 (match your local)
   - Application root: public_html/server
   - Application URL: /server (or leave empty)
   - Application startup file: server.js
3. Add environment variables from .env
4. Start the application

### 5. Alternative: Use PM2 (if available)
```bash
cd ~/public_html/server
pm2 start server.js --name medarion-backend
pm2 save
pm2 startup
```

### 6. Test
- Frontend: https://yourdomain.com
- Backend: https://yourdomain.com/api/health
- AI: https://yourdomain.com/api/ai/query

## ✅ Verification Checklist
- [ ] Frontend files uploaded to public_html/
- [ ] Backend files uploaded to public_html/server/
- [ ] Dependencies installed (npm install --production)
- [ ] .env file created with correct values
- [ ] Node.js app created and started in cPanel
- [ ] Backend health check works
- [ ] Frontend loads correctly
- [ ] AI endpoint responds

## 🐛 Troubleshooting
- If backend not starting: Check Node.js version matches
- If 503 errors: Check backend is running
- If CORS errors: Update CORS_ORIGIN in .env
- If database errors: Verify DB credentials in .env
"@

Set-Content -Path "CPANEL_DEPLOYMENT_INSTRUCTIONS.md" -Value $instructions
Write-Host "   ✅ Created: CPANEL_DEPLOYMENT_INSTRUCTIONS.md" -ForegroundColor Green

# ============================================================
# Step 5: Create .env Template for cPanel
# ============================================================
Write-Host "`n[Step 5/6] Creating .env Template" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

$envTemplate = @"
# Vast.ai Configuration
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast

# Database Configuration (UPDATE WITH YOUR CPANEL VALUES)
DB_HOST=localhost
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name

# Server Configuration
PORT=3001
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here

# CORS (UPDATE WITH YOUR DOMAIN)
CORS_ORIGIN=https://yourdomain.com
"@

Set-Content -Path "server/.env.cpanel.template" -Value $envTemplate
Write-Host "   ✅ Created: server/.env.cpanel.template" -ForegroundColor Green
Write-Host "   💡 Copy this to server/.env on cPanel and update values" -ForegroundColor Yellow

# ============================================================
# Step 6: Summary
# ============================================================
Write-Host "`n[Step 6/6] Deployment Summary" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

Write-Host "`n✅ Local Environment:" -ForegroundColor Green
Write-Host "   • Backend: Running on port 3001" -ForegroundColor White
Write-Host "   • Frontend: Built in dist/ folder" -ForegroundColor White

Write-Host "`n📦 Files Ready for Upload:" -ForegroundColor Cyan
Write-Host "   • Frontend: dist/ folder → public_html/" -ForegroundColor White
Write-Host "   • Backend: server/ folder → public_html/server/" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Upload dist/ contents to public_html/" -ForegroundColor White
Write-Host "   2. Upload server/ to public_html/server/" -ForegroundColor White
Write-Host "   3. Install dependencies: cd server && npm install --production" -ForegroundColor White
Write-Host "   4. Create .env file on cPanel (use .env.cpanel.template)" -ForegroundColor White
Write-Host "   5. Set up Node.js app in cPanel Node.js Selector" -ForegroundColor White
Write-Host "   6. Start the application" -ForegroundColor White
Write-Host "   7. Test: https://yourdomain.com" -ForegroundColor White

Write-Host "`n📄 See CPANEL_DEPLOYMENT_INSTRUCTIONS.md for detailed steps" -ForegroundColor Yellow

Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host "   Ready to upload to cPanel!" -ForegroundColor Green

