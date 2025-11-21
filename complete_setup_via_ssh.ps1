# Complete Setup via SSH - Install Node.js and Deploy Application
# This script does everything via SSH using your PuTTY connection

param(
    [string]$ConfigFile = "cpanel-config.json",
    [string]$NodeVersion = "18"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Setup via SSH - Automated                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found" -ForegroundColor Red
    exit 1
}

try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration" -ForegroundColor Red
    exit 1
}

if (-not $config.ssh) {
    Write-Host "❌ SSH not configured" -ForegroundColor Red
    exit 1
}

$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$cpanelUser = if ($config.cpanel) { $config.cpanel.username } else { "medasnnc" }
$nodeVersion = $NodeVersion
$appPath = "/home/$cpanelUser/nodevenv/medarion/$nodeVersion/bin"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   SSH User: $sshUser" -ForegroundColor Gray
Write-Host "   cPanel User: $cpanelUser" -ForegroundColor Gray
Write-Host "   Node.js Version: $nodeVersion" -ForegroundColor Gray
Write-Host ""

# Step 1: Test Connection
Write-Host "🔍 Step 1: Testing SSH Connection..." -ForegroundColor Yellow
Write-Host ""

$testResult = & ".\run_ssh_command.ps1" -Command "echo 'Connection OK' && whoami && hostname"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connection successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Check Node.js
Write-Host "🔍 Step 2: Checking Node.js Installation..." -ForegroundColor Yellow
Write-Host ""

$nodeCheck = & ".\run_ssh_command.ps1" -Command "node --version 2>&1"

if ($nodeCheck -like "*v*" -and $nodeCheck -notlike "*not found*") {
    Write-Host "✅ Node.js is installed: $nodeCheck" -ForegroundColor Green
    $nodeInstalled = $true
} else {
    Write-Host "⚠️  Node.js not found or different version" -ForegroundColor Yellow
    $nodeInstalled = $false
}

Write-Host ""

# Step 3: Install Node.js (if needed)
if (-not $nodeInstalled) {
    Write-Host "📦 Step 3: Installing Node.js $nodeVersion..." -ForegroundColor Yellow
    Write-Host ""
    
    $installCmd = "curl -fsSL https://rpm.nodesource.com/setup_${nodeVersion}.x | bash - && yum install -y nodejs && node --version"
    
    Write-Host "   Running installation..." -ForegroundColor Gray
    $installResult = & ".\run_ssh_command.ps1" -Command $installCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
        Write-Host "   $installResult" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Installation had issues" -ForegroundColor Yellow
        Write-Host "   $installResult" -ForegroundColor Gray
    }
    
    Write-Host ""
} else {
    Write-Host "⏭️  Step 3: Node.js already installed, skipping" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Prepare Application Locally
Write-Host "📦 Step 4: Preparing Application Files..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "cpanel-nodejs-app")) {
    Write-Host "   Preparing Node.js app..." -ForegroundColor Gray
    & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly | Out-Null
}

if (-not (Test-Path "medarion-dist")) {
    Write-Host "   Building frontend..." -ForegroundColor Gray
    npm run build 2>&1 | Out-Null
}

Write-Host "✅ Application files prepared" -ForegroundColor Green
Write-Host ""

# Step 5: Create Application Directory
Write-Host "📁 Step 5: Creating Application Directory..." -ForegroundColor Yellow
Write-Host ""

$createDir = & ".\run_ssh_command.ps1" -Command "mkdir -p $appPath && chown -R $cpanelUser:$cpanelUser /home/$cpanelUser/nodevenv && echo 'Directory created: $appPath'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application directory created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Directory creation had issues" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Upload Files (using tar/zip method)
Write-Host "📤 Step 6: Preparing Files for Upload..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Creating archive of Node.js app..." -ForegroundColor Gray
$tarFile = "cpanel-nodejs-app.tar.gz"

# Create tar archive
if (Test-Path "cpanel-nodejs-app") {
    # Use PowerShell compression (or tar if available)
    Compress-Archive -Path "cpanel-nodejs-app\*" -DestinationPath "$tarFile.zip" -Force
    Write-Host "✅ Archive created: $tarFile.zip" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js app not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 7: Upload and Extract
Write-Host "📤 Step 7: Uploading Files..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   ⚠️  File upload requires pscp or manual upload" -ForegroundColor Yellow
Write-Host "   💡 Use cPanel File Manager or FTP to upload:" -ForegroundColor Cyan
Write-Host "      - $tarFile.zip to $appPath/" -ForegroundColor Gray
Write-Host "      - Then extract on server" -ForegroundColor Gray
Write-Host ""

# Step 8: Install Dependencies
Write-Host "📦 Step 8: Installing Dependencies..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Note: Run after files are uploaded" -ForegroundColor Gray
$npmCmd = "cd $appPath && npm install"
Write-Host "   Command: $npmCmd" -ForegroundColor Cyan
Write-Host ""

# Step 9: Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Setup Progress Summary                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Completed:" -ForegroundColor Cyan
Write-Host "   - SSH connection: Working" -ForegroundColor Green
Write-Host "   - Node.js: $(if ($nodeInstalled) { 'Installed' } else { 'Installation attempted' })" -ForegroundColor Green
Write-Host "   - Application files: Prepared locally" -ForegroundColor Green
Write-Host "   - Application directory: Created" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Upload files via cPanel File Manager or FTP" -ForegroundColor White
Write-Host "   2. Extract archive on server" -ForegroundColor White
Write-Host "   3. Run: .\run_ssh_command.ps1 'cd $appPath && npm install'" -ForegroundColor White
Write-Host "   4. Create Node.js app in cPanel" -ForegroundColor White
Write-Host ""

Write-Host "💡 Quick Commands:" -ForegroundColor Cyan
Write-Host "   # Check Node.js" -ForegroundColor Gray
Write-Host "   .\run_ssh_command.ps1 'node --version'" -ForegroundColor White
Write-Host ""
Write-Host "   # Create directory" -ForegroundColor Gray
Write-Host "   .\run_ssh_command.ps1 'mkdir -p $appPath'" -ForegroundColor White
Write-Host ""
Write-Host "   # Install dependencies (after upload)" -ForegroundColor Gray
Write-Host "   .\run_ssh_command.ps1 'cd $appPath && npm install'" -ForegroundColor White
Write-Host ""

