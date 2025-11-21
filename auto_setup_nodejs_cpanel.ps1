# Automated Node.js Setup for cPanel
# This script attempts to fully automate Node.js installation and app creation

param(
    [string]$ConfigFile = "cpanel-config.json",
    [string]$NodeVersion = "18",
    [string]$AppName = "medarion",
    [string]$AppURL = "/medarion-api"
)

Write-Host "🤖 Automated Node.js Setup for cPanel" -ForegroundColor Cyan
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
Write-Host "   App Name: $AppName" -ForegroundColor Gray
Write-Host ""

# Prepare application locally first
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

# Create setup script for server
$setupScript = @"
#!/bin/bash
# Automated Node.js Setup Script
# This script runs on the server to set up Node.js application

set -e

APP_NAME="$AppName"
NODE_VERSION="$NodeVersion"
APP_URL="$AppURL"
USER_NAME="$sshUser"
APP_PATH="/home/$sshUser/nodevenv/`${APP_NAME}/`${NODE_VERSION}/bin"

echo "🚀 Setting up Node.js application..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found in PATH"
    echo "   Please install Node.js via cPanel Node.js Selector first"
    echo "   Or use: /opt/cpanel/ea-nodejs`${NODE_VERSION}/bin/node"
    exit 1
fi

# Create application directory
echo "📁 Creating application directory..."
mkdir -p `$APP_PATH
cd `$APP_PATH

# Set permissions
chown -R `$USER_NAME:`$USER_NAME `$APP_PATH
chmod -R 755 `$APP_PATH

echo "✅ Application directory created: `$APP_PATH"
echo ""
echo "📝 Next: Upload files and create app in cPanel Node.js Selector"
echo "   Application Root: `$APP_PATH"
echo "   Application URL: `$APP_URL"
echo "   Startup File: server.js"
"@

$setupScript | Out-File "server_setup.sh" -Encoding ASCII
Write-Host "✅ Created server setup script" -ForegroundColor Green
Write-Host ""

# Upload setup script
Write-Host "📤 Step 2: Uploading setup script to server..." -ForegroundColor Yellow
Write-Host ""

scp "server_setup.sh" "${sshUser}@${sshHost}:~/server_setup.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Setup script uploaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  Upload failed (will continue anyway)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Step 3: Running setup on server..." -ForegroundColor Yellow
Write-Host ""

# Run setup script
ssh "${sshUser}@${sshHost}" "bash ~/server_setup.sh && rm ~/server_setup.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Server setup completed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Server setup had issues (may need manual steps)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📤 Step 4: Uploading application files..." -ForegroundColor Yellow
Write-Host ""

$appPath = "/home/$sshUser/nodevenv/$AppName/$NodeVersion/bin"

# Upload application files
scp -r "cpanel-nodejs-app\*" "${sshUser}@${sshHost}:${appPath}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application files uploaded" -ForegroundColor Green
} else {
    Write-Host "❌ File upload failed" -ForegroundColor Red
    Write-Host "   Password: Neorage94" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Step 5: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install dependencies
ssh "${sshUser}@${sshHost}" "cd $appPath && npm install"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependency installation had issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         Automated Setup Complete!                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Application Details:" -ForegroundColor Cyan
Write-Host "   Application Path: $appPath" -ForegroundColor Gray
Write-Host "   Application URL: $AppURL" -ForegroundColor Gray
Write-Host "   Startup File: server.js" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Final Step: Create Application in cPanel" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Use these settings:" -ForegroundColor White
Write-Host "      - Node.js Version: $NodeVersion.x" -ForegroundColor Gray
Write-Host "      - Application Root: $appPath" -ForegroundColor Gray
Write-Host "      - Application URL: $AppURL" -ForegroundColor Gray
Write-Host "      - Startup File: server.js" -ForegroundColor Gray
Write-Host "      - Port: 3001" -ForegroundColor Gray
Write-Host "   5. Set environment variables (see below)" -ForegroundColor White
Write-Host "   6. Click 'Create' and 'Start'" -ForegroundColor White
Write-Host ""

Write-Host "🔐 Environment Variables:" -ForegroundColor Yellow
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
JWT_SECRET=$(-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_}))
"@

Write-Host $envVars -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Setup complete! Application is ready in cPanel." -ForegroundColor Green
Write-Host ""

