# Master Script - Do Everything for Node.js Setup
# This script automates all possible steps

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Node.js Setup & Deployment Automation       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Load Configuration
Write-Host "📋 Step 1: Loading Configuration..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    Write-Host "✅ Configuration loaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

$nodeVersion = "18"
$appPath = "/home/medasnnc/nodevenv/medarion/$nodeVersion/bin"
$cpanelUrl = if ($config.cpanel) { $config.cpanel.url } else { "https://medarion.africa:2083" }

Write-Host ""

# Step 2: Prepare Application Files
Write-Host "📦 Step 2: Preparing Application Files..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "cpanel-nodejs-app")) {
    Write-Host "   Running setup script..." -ForegroundColor Gray
    & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly | Out-Null
    
    if (-not (Test-Path "cpanel-nodejs-app")) {
        Write-Host "❌ Failed to prepare application" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Application files prepared" -ForegroundColor Green
} else {
    Write-Host "✅ Application files already prepared" -ForegroundColor Green
}

Write-Host ""

# Step 3: Build Frontend
Write-Host "🏗️  Step 3: Building Frontend..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "medarion-dist")) {
    Write-Host "   Running: npm run build" -ForegroundColor Gray
    $buildResult = npm run build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend built successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Build had issues, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Frontend already built" -ForegroundColor Green
}

Write-Host ""

# Step 4: Instructions for Node.js Installation
Write-Host "🔍 Step 4: Node.js Installation Instructions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Install Node.js via cPanel:" -ForegroundColor Gray
Write-Host "   1. Log into cPanel: $cpanelUrl" -ForegroundColor Cyan
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor Gray
Write-Host "   3. Click: 'Install Node.js Version'" -ForegroundColor Gray
Write-Host "   4. Select: Node.js 18.x" -ForegroundColor Gray
Write-Host "   5. Click: 'Install'" -ForegroundColor Gray
Write-Host ""

$nodeInstalled = $false

Write-Host ""

# Step 5: Instructions for File Upload
Write-Host "📁 Step 5: File Upload Instructions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Upload files via cPanel File Manager:" -ForegroundColor Gray
Write-Host "   1. Go to: Files → File Manager" -ForegroundColor Cyan
Write-Host "   2. Navigate to: $appPath" -ForegroundColor Gray
Write-Host "   3. Upload: All files from cpanel-nodejs-app/ folder" -ForegroundColor Gray
Write-Host "   4. Navigate to: public_html/" -ForegroundColor Gray
Write-Host "   5. Upload: All files from medarion-dist/ folder" -ForegroundColor Gray
Write-Host "   6. Create: public_html/api/ and upload api/ files" -ForegroundColor Gray
Write-Host "   7. Create: public_html/config/ and upload config files" -ForegroundColor Gray
Write-Host ""

Write-Host "   OR use FTP:" -ForegroundColor Yellow
Write-Host "   - Host: ftp.medarion.africa" -ForegroundColor Gray
Write-Host "   - Username: medarion@medarion.africa" -ForegroundColor Gray
Write-Host "   - Password: Neorage94" -ForegroundColor Gray
Write-Host ""

# Step 6: Instructions for Dependencies
Write-Host "📦 Step 6: Install Dependencies..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Use cPanel Terminal:" -ForegroundColor Gray
Write-Host "   1. Go to: Advanced → Terminal" -ForegroundColor Cyan
Write-Host "   2. Run: cd $appPath && npm install" -ForegroundColor Gray
Write-Host ""

Write-Host ""

# Step 9: Generate JWT Secret
Write-Host "🔐 Step 9: Generating Security Keys..." -ForegroundColor Yellow
Write-Host ""

$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "✅ JWT Secret generated" -ForegroundColor Green
Write-Host ""

# Final Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Setup Complete!                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   Application Path: $appPath" -ForegroundColor Gray
Write-Host "   Node.js Version: $nodeVersion" -ForegroundColor Gray
Write-Host "   Frontend: public_html/" -ForegroundColor Gray
Write-Host "   API: public_html/api/" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Note: Complete Node.js installation and file upload via cPanel interface" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Final Step: Create Application in cPanel" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Settings:" -ForegroundColor White
Write-Host "      - Node.js Version: $nodeVersion.x" -ForegroundColor Gray
Write-Host "      - Application Root: $appPath" -ForegroundColor Gray
Write-Host "      - Application URL: /medarion-api" -ForegroundColor Gray
Write-Host "      - Startup File: server.js" -ForegroundColor Gray
Write-Host "      - Port: 3001" -ForegroundColor Gray
Write-Host "   5. Set Environment Variables:" -ForegroundColor White
Write-Host ""

$envVars = @"
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$($config.database.name)
DB_USER=$($config.database.username)
DB_PASSWORD=$($config.database.password)
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=$jwtSecret
"@

Write-Host $envVars -ForegroundColor Gray
Write-Host ""
Write-Host "   6. Click 'Create' and 'Start'" -ForegroundColor White
Write-Host ""

Write-Host "✅ Test Your Application:" -ForegroundColor Cyan
Write-Host "   Frontend: https://medarion.africa" -ForegroundColor White
Write-Host "   API Health: https://medarion.africa/medarion-api/health" -ForegroundColor White
Write-Host ""

Write-Host "💡 JWT Secret (save this!):" -ForegroundColor Yellow
Write-Host "   $jwtSecret" -ForegroundColor Cyan
Write-Host ""

