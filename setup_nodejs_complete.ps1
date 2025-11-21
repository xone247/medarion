# Complete Node.js Setup - Interactive with Password Authentication
# This script guides you through Node.js installation and app creation

param(
    [string]$ConfigFile = "cpanel-config.json",
    [string]$NodeVersion = "18"
)

Write-Host "🚀 Complete Node.js Setup for cPanel" -ForegroundColor Cyan
Write-Host ""

# Check if config exists
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    exit 1
}

# Load configuration
try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

# Get SSH credentials
if ($config.ssh -and $config.ssh.cpanel) {
    $sshHost = $config.ssh.cpanel.host
    $sshUser = $config.ssh.cpanel.username
    $sshPassword = $config.ssh.cpanel.password
} else {
    Write-Host "❌ SSH configuration not found" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   SSH User: $sshUser" -ForegroundColor Gray
Write-Host "   Node.js Version: $NodeVersion" -ForegroundColor Gray
Write-Host ""

# Step 1: Prepare application
Write-Host "📦 Step 1: Preparing application files..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "cpanel-nodejs-app")) {
    Write-Host "   Running setup script..." -ForegroundColor Gray
    & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly | Out-Null
    
    if (-not (Test-Path "cpanel-nodejs-app")) {
        Write-Host "❌ Failed to prepare application" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Application files prepared" -ForegroundColor Green
Write-Host ""

# Step 2: Check Node.js installation
Write-Host "🔍 Step 2: Checking Node.js installation..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Node.js Installation Options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Option A: Install via cPanel (Recommended)" -ForegroundColor White
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor Gray
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor Gray
Write-Host "   3. Click 'Install Node.js Version'" -ForegroundColor Gray
Write-Host "   4. Select Node.js $NodeVersion.x" -ForegroundColor Gray
Write-Host "   5. Click 'Install'" -ForegroundColor Gray
Write-Host ""

$nodeInstalled = Read-Host "Have you installed Node.js via cPanel? (y/n)"

if ($nodeInstalled -ne "y" -and $nodeInstalled -ne "Y") {
    Write-Host ""
    Write-Host "⚠️  Please install Node.js first via cPanel" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "✅ Node.js installation confirmed" -ForegroundColor Green
Write-Host ""

# Step 3: Create application directory
Write-Host "📁 Step 3: Creating application directory..." -ForegroundColor Yellow
Write-Host ""

$appPath = "/home/$sshUser/nodevenv/medarion/$NodeVersion/bin"

Write-Host "   Application Path: $appPath" -ForegroundColor Gray
Write-Host ""
Write-Host "   Connecting to server..." -ForegroundColor Gray
Write-Host "   Password: Neorage94" -ForegroundColor Yellow
Write-Host ""

# Create directory via SSH
ssh "${sshUser}@${sshHost}" "mkdir -p $appPath && echo 'Directory created: $appPath'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application directory created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Directory creation had issues" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Upload files
Write-Host "📤 Step 4: Uploading application files..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   This will upload all files from cpanel-nodejs-app/" -ForegroundColor Gray
Write-Host "   Password: Neorage94" -ForegroundColor Yellow
Write-Host ""

scp -r "cpanel-nodejs-app\*" "${sshUser}@${sshHost}:${appPath}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ File upload failed" -ForegroundColor Red
    Write-Host "   Please try again or upload manually via File Manager" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 5: Install dependencies
Write-Host "📦 Step 5: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Running npm install on server..." -ForegroundColor Gray
Write-Host "   Password: Neorage94" -ForegroundColor Yellow
Write-Host ""

ssh "${sshUser}@${sshHost}" "cd $appPath && npm install"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependency installation had issues" -ForegroundColor Yellow
    Write-Host "   You may need to run 'npm install' manually" -ForegroundColor Gray
}

Write-Host ""

# Step 6: Generate JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         Application Setup Complete!                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Application Details:" -ForegroundColor Cyan
Write-Host "   Application Path: $appPath" -ForegroundColor Gray
Write-Host "   Application URL: /medarion-api" -ForegroundColor Gray
Write-Host "   Startup File: server.js" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Final Step: Create Application in cPanel" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Fill in these settings:" -ForegroundColor White
Write-Host ""
Write-Host "      ┌─────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "      │ Node.js Version: $NodeVersion.x              │" -ForegroundColor White
Write-Host "      │ Application Root: $appPath │" -ForegroundColor White
Write-Host "      │ Application URL: /medarion-api          │" -ForegroundColor White
Write-Host "      │ Startup File: server.js                 │" -ForegroundColor White
Write-Host "      │ Port: 3001 (or auto-assigned)           │" -ForegroundColor White
Write-Host "      └─────────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""
Write-Host "   5. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "🔐 Step 7: Set Environment Variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "   In Node.js Selector, click on your application" -ForegroundColor White
Write-Host "   Go to 'Environment Variables' and add:" -ForegroundColor White
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

Write-Host "💡 Generated JWT_SECRET (save this!):" -ForegroundColor Cyan
Write-Host "   $jwtSecret" -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 Step 8: Start Application" -ForegroundColor Yellow
Write-Host ""
Write-Host "   In Node.js Selector, click 'Start' on your application" -ForegroundColor White
Write-Host ""

Write-Host "✅ Step 9: Test" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Frontend: https://medarion.africa" -ForegroundColor Cyan
Write-Host "   API Health: https://medarion.africa/medarion-api/health" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎉 Setup Complete! Follow the steps above to finish in cPanel." -ForegroundColor Green
Write-Host ""

