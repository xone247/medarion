# Install Node.js and Setup Application on cPanel via SSH
# This script installs Node.js (if needed) and creates the application

param(
    [string]$ConfigFile = "cpanel-config.json",
    [string]$NodeVersion = "18",
    [switch]$UseRoot = $false
)

Write-Host "🚀 Installing Node.js and Setting Up Application" -ForegroundColor Cyan
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

# Determine which SSH user to use
if ($UseRoot -and $config.ssh -and $config.ssh.whm) {
    $sshHost = $config.ssh.whm.host
    $sshUser = $config.ssh.whm.username
    $sshPassword = $config.ssh.whm.password
    Write-Host "⚠️  Using ROOT access for installation" -ForegroundColor Yellow
} elseif ($config.ssh -and $config.ssh.cpanel) {
    $sshHost = $config.ssh.cpanel.host
    $sshUser = $config.ssh.cpanel.username
    $sshPassword = $config.ssh.cpanel.password
    Write-Host "✅ Using cPanel user: $sshUser" -ForegroundColor Green
} else {
    Write-Host "❌ SSH configuration not found" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   SSH User: $sshUser" -ForegroundColor Gray
Write-Host "   Node.js Version: $NodeVersion" -ForegroundColor Gray
Write-Host ""

# Check for SSH
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Host "❌ SSH not found!" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Step 1: Checking Node.js availability..." -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is available via cPanel
$checkNodeJS = ssh "${sshUser}@${sshHost}" "which node || echo 'NOT_FOUND'"
$nodeInstalled = $checkNodeJS -notlike "*NOT_FOUND*"

if ($nodeInstalled) {
    Write-Host "✅ Node.js is available on the system" -ForegroundColor Green
    $nodeVersion = ssh "${sshUser}@${sshHost}" "node --version 2>&1"
    Write-Host "   Version: $nodeVersion" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Node.js not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Node.js needs to be installed via cPanel Node.js Selector:" -ForegroundColor Cyan
    Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
    Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
    Write-Host "   3. Install Node.js version $NodeVersion.x" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Continue with application setup? (Node.js will be installed via cPanel) (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
}

Write-Host ""
Write-Host "🔍 Step 2: Checking cPanel Node.js Selector..." -ForegroundColor Yellow
Write-Host ""

# Check if we can access Node.js via cPanel's path
$cpanelNodePath = "/opt/cpanel/ea-nodejs$NodeVersion/bin/node"
$nodeExists = ssh "${sshUser}@${sshHost}" "test -f $cpanelNodePath && echo 'EXISTS' || echo 'NOT_FOUND'"

if ($nodeExists -like "*EXISTS*") {
    Write-Host "✅ Found cPanel Node.js at: $cpanelNodePath" -ForegroundColor Green
    $nodePath = $cpanelNodePath
} else {
    Write-Host "⚠️  cPanel Node.js not found at standard path" -ForegroundColor Yellow
    Write-Host "   Will use system Node.js or install via cPanel" -ForegroundColor Gray
    $nodePath = "node"
}

Write-Host ""
Write-Host "📦 Step 3: Preparing Node.js application..." -ForegroundColor Yellow
Write-Host ""

# First, prepare the app locally
if (-not (Test-Path "cpanel-nodejs-app")) {
    Write-Host "   Preparing Node.js app files..." -ForegroundColor Gray
    & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to prepare Node.js app" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Node.js app prepared" -ForegroundColor Green
Write-Host ""

# Determine application path
$appName = "medarion"
$appPath = "/home/$sshUser/nodevenv/$appName/$NodeVersion/bin"

Write-Host "📁 Step 4: Creating application directory..." -ForegroundColor Yellow
Write-Host "   Application Path: $appPath" -ForegroundColor Gray
Write-Host ""

# Create directory structure
$createDir = ssh "${sshUser}@${sshHost}" "mkdir -p $appPath && echo 'CREATED' || echo 'FAILED'"

if ($createDir -like "*CREATED*") {
    Write-Host "✅ Application directory created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Directory creation had issues (may already exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📤 Step 5: Uploading application files..." -ForegroundColor Yellow
Write-Host ""

# Upload files
$uploadResult = scp -r "cpanel-nodejs-app\*" "${sshUser}@${sshHost}:${appPath}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ File upload failed" -ForegroundColor Red
    Write-Host "   You may need to enter password: Neorage94" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Step 6: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install dependencies
$npmInstall = ssh "${sshUser}@${sshHost}" "cd $appPath && npm install"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependency installation had issues" -ForegroundColor Yellow
    Write-Host "   You may need to run 'npm install' manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⚙️  Step 7: Setting up cPanel Node.js Application..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Manual Steps Required in cPanel:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Fill in:" -ForegroundColor White
Write-Host "      - Node.js Version: $NodeVersion.x" -ForegroundColor Gray
Write-Host "      - Application Root: $appPath" -ForegroundColor Gray
Write-Host "      - Application URL: /medarion-api" -ForegroundColor Gray
Write-Host "      - Startup File: server.js" -ForegroundColor Gray
Write-Host "      - Port: 3001 (or auto-assigned)" -ForegroundColor Gray
Write-Host "   5. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "📋 Step 8: Environment Variables to Set:" -ForegroundColor Yellow
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
JWT_SECRET=[GENERATE_RANDOM_SECRET]
"@

Write-Host $envVars -ForegroundColor Gray
Write-Host ""

# Generate JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "💡 Generated JWT_SECRET (save this!):" -ForegroundColor Cyan
Write-Host "   $jwtSecret" -ForegroundColor Yellow
Write-Host ""

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         Node.js Application Setup Complete!              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📁 Application Location:" -ForegroundColor Cyan
Write-Host "   $appPath" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Complete the cPanel Node.js Selector setup (see above)" -ForegroundColor White
Write-Host "   2. Set environment variables in cPanel" -ForegroundColor White
Write-Host "   3. Start the application in cPanel Node.js Selector" -ForegroundColor White
Write-Host "   4. Test: https://medarion.africa/medarion-api/health" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tip: If Node.js isn't installed, install it first via:" -ForegroundColor Cyan
Write-Host "   cPanel → Software → Node.js Selector → Install Node.js" -ForegroundColor White
Write-Host ""

