# Deploy Backend Server and Setup AI Tunnel on cPanel
# This script helps automate the deployment process

param(
    [string]$SSHHost = "server1.medarion.africa",
    [int]$SSHPort = 22,
    [string]$SSHUser = "root",
    [string]$NodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"
)

Write-Host "🚀 Deploying to cPanel..." -ForegroundColor Cyan
Write-Host ""

# Load config
$configPath = "cpanel-config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    if ($config.ssh) {
        $SSHHost = $config.ssh.host
        $SSHPort = $config.ssh.port
        $SSHUser = $config.ssh.username
    }
}

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   SSH Host: $SSHHost" -ForegroundColor White
Write-Host "   SSH Port: $SSHPort" -ForegroundColor White
Write-Host "   SSH User: $SSHUser" -ForegroundColor White
Write-Host "   Node App Path: $NodeAppPath" -ForegroundColor White
Write-Host ""

# Check if server directory exists
if (-not (Test-Path "server")) {
    Write-Host "❌ 'server' directory not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "📤 Step 1: Uploading server files..." -ForegroundColor Cyan

# Use SCP to upload files
$scpCommand = "scp -P $SSHPort -r server/* ${SSHUser}@${SSHHost}:${NodeAppPath}/"

Write-Host "   Command: $scpCommand" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Manual Step Required:" -ForegroundColor Yellow
Write-Host "   Run this command manually (SSH key authentication required):" -ForegroundColor White
Write-Host "   $scpCommand" -ForegroundColor Cyan
Write-Host ""

# Upload package.json if exists
if (Test-Path "package.json") {
    Write-Host "   Also upload package.json:" -ForegroundColor White
    Write-Host "   scp -P $SSHPort package.json ${SSHUser}@${SSHHost}:${NodeAppPath}/" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Step 2: SSH Commands to Run on cPanel Server" -ForegroundColor Yellow
Write-Host ""

$sshCommands = @"
# Navigate to app directory
cd $NodeAppPath

# Install dependencies
npm install

# Create .env file (edit with your values)
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
VAST_AI_URL=http://localhost:8081
EOF

# Test server (optional)
# node server.js
"@

Write-Host $sshCommands -ForegroundColor White
Write-Host ""

Write-Host "📋 Step 3: Setup AI Tunnel" -ForegroundColor Yellow
Write-Host ""

Write-Host "   Option A: Upload and run setup script:" -ForegroundColor Cyan
Write-Host "   scp -P $SSHPort setup_cpanel_ai_tunnel.sh ${SSHUser}@${SSHHost}:/tmp/" -ForegroundColor White
Write-Host "   ssh -p $SSHPort ${SSHUser}@${SSHHost} 'chmod +x /tmp/setup_cpanel_ai_tunnel.sh && /tmp/setup_cpanel_ai_tunnel.sh'" -ForegroundColor White
Write-Host ""

Write-Host "   Option B: Manual setup (see CPANEL_BACKEND_AND_AI_SETUP.md)" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Step 4: Create Node.js App in cPanel" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Settings:" -ForegroundColor White
Write-Host "      - Root: $NodeAppPath" -ForegroundColor Gray
Write-Host "      - URL: /medarion-api" -ForegroundColor Gray
Write-Host "      - File: server.js" -ForegroundColor Gray
Write-Host "      - Port: 3001" -ForegroundColor Gray
Write-Host "   5. Add environment variables (from .env file)" -ForegroundColor White
Write-Host "   6. Click 'Start'" -ForegroundColor White
Write-Host ""

Write-Host "✅ Complete Guide: CPANEL_BACKEND_AND_AI_SETUP.md" -ForegroundColor Green
Write-Host ""
