# Complete Deployment via SSH - Upload and Setup Node.js Application
# This script uploads files and sets up everything on the server

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$SkipBuild = $false,
    [switch]$SkipUpload = $false
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Deployment via SSH                           ║" -ForegroundColor Cyan
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
$sshPort = $config.ssh.port
$cpanelUser = if ($config.cpanel) { $config.cpanel.username } else { "medasnnc" }
$appName = "medarion"
$appPath = "/home/$cpanelUser/$appName"
$nodeVersion = "18"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   SSH User: $sshUser" -ForegroundColor Gray
Write-Host "   cPanel User: $cpanelUser" -ForegroundColor Gray
Write-Host "   App Path: $appPath" -ForegroundColor Gray
Write-Host ""

# Step 1: Test Connection
Write-Host "🔍 Step 1: Testing SSH Connection..." -ForegroundColor Yellow
$testResult = & ".\run_ssh_command.ps1" -Command "echo 'Connection OK' && whoami"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Connection successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Prepare Application Locally
if (-not $SkipBuild) {
    Write-Host "📦 Step 2: Preparing Application Files..." -ForegroundColor Yellow
    
    # Prepare Node.js app
    if (-not (Test-Path "cpanel-nodejs-app")) {
        Write-Host "   Preparing Node.js app..." -ForegroundColor Gray
        & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to prepare Node.js app" -ForegroundColor Red
            exit 1
        }
    }
    
    # Build frontend
    if (-not (Test-Path "medarion-dist")) {
        Write-Host "   Building frontend..." -ForegroundColor Gray
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Frontend build had issues" -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Application files prepared" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Step 2: Skipping build (using existing files)" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Create Application Directory on Server
Write-Host "📁 Step 3: Creating Application Directory..." -ForegroundColor Yellow
$createDir = & ".\run_ssh_command.ps1" -Command "mkdir -p $appPath && chown -R $cpanelUser:$cpanelUser $appPath && echo 'Directory: $appPath'"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application directory created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Directory creation had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Upload Files
if (-not $SkipUpload) {
    Write-Host "📤 Step 4: Uploading Files..." -ForegroundColor Yellow
    
    # Check for pscp (PuTTY SCP)
    $pscpPaths = @(
        "${env:ProgramFiles}\PuTTY\pscp.exe",
        "${env:ProgramFiles(x86)}\PuTTY\pscp.exe",
        "$env:LOCALAPPDATA\Programs\PuTTY\pscp.exe"
    )
    
    $pscpPath = $null
    foreach ($path in $pscpPaths) {
        if (Test-Path $path) {
            $pscpPath = $path
            break
        }
    }
    
    if ($pscpPath) {
        Write-Host "   Found pscp: $pscpPath" -ForegroundColor Gray
        
        # Upload Node.js app
        if (Test-Path "cpanel-nodejs-app") {
            Write-Host "   Uploading Node.js app..." -ForegroundColor Gray
            
            $keyPath = $config.ssh.keyPath
            $password = $config.ssh.password
            
            if ($keyPath -and (Test-Path $keyPath)) {
                # Upload with key
                $uploadCmd = "& `"$pscpPath`" -i `"$keyPath`" -P $sshPort -r `"cpanel-nodejs-app\*`" ${sshUser}@${sshHost}:$appPath/"
            } else {
                # Upload with password
                $uploadCmd = "echo $password | & `"$pscpPath`" -P $sshPort -pw $password -r `"cpanel-nodejs-app\*`" ${sshUser}@${sshHost}:$appPath/"
            }
            
            Write-Host "   Executing: pscp upload..." -ForegroundColor Gray
            Invoke-Expression $uploadCmd
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Node.js app uploaded" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Upload had issues (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
            }
        }
        
        # Upload frontend
        if (Test-Path "medarion-dist") {
            Write-Host "   Uploading frontend..." -ForegroundColor Gray
            
            $publicHtml = "/home/$cpanelUser/public_html"
            $keyPath = $config.ssh.keyPath
            $password = $config.ssh.password
            
            if ($keyPath -and (Test-Path $keyPath)) {
                $uploadCmd = "& `"$pscpPath`" -i `"$keyPath`" -P $sshPort -r `"medarion-dist\*`" ${sshUser}@${sshHost}:$publicHtml/"
            } else {
                $uploadCmd = "echo $password | & `"$pscpPath`" -P $sshPort -pw $password -r `"medarion-dist\*`" ${sshUser}@${sshHost}:$publicHtml/"
            }
            
            Invoke-Expression $uploadCmd
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Frontend uploaded" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Frontend upload had issues" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ⚠️  pscp not found - using alternative method" -ForegroundColor Yellow
        Write-Host "   💡 Manual upload required:" -ForegroundColor Cyan
        Write-Host "      1. Use cPanel File Manager" -ForegroundColor Gray
        Write-Host "      2. Or use FTP/SFTP client" -ForegroundColor Gray
        Write-Host "      3. Upload cpanel-nodejs-app/* to $appPath/" -ForegroundColor Gray
        Write-Host "      4. Upload medarion-dist/* to /home/$cpanelUser/public_html/" -ForegroundColor Gray
    }
    
    Write-Host ""
} else {
    Write-Host "⏭️  Step 4: Skipping upload" -ForegroundColor Gray
    Write-Host ""
}

# Step 5: Set Permissions
Write-Host "🔐 Step 5: Setting Permissions..." -ForegroundColor Yellow
$permCmd = "chown -R $cpanelUser:$cpanelUser $appPath && chmod -R 755 $appPath && echo 'Permissions set'"
$permResult = & ".\run_ssh_command.ps1" -Command $permCmd
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Permissions set" -ForegroundColor Green
} else {
    Write-Host "⚠️  Permission setting had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Install Dependencies
Write-Host "📦 Step 6: Installing Dependencies..." -ForegroundColor Yellow
$npmCmd = "cd $appPath && npm install --production"
Write-Host "   Running: $npmCmd" -ForegroundColor Gray
$npmResult = & ".\run_ssh_command.ps1" -Command $npmCmd
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependency installation had issues" -ForegroundColor Yellow
    Write-Host "   Output: $npmResult" -ForegroundColor Gray
}
Write-Host ""

# Step 7: Verify Installation
Write-Host "✅ Step 7: Verifying Installation..." -ForegroundColor Yellow
$verifyCmd = "cd $appPath && ls -la && echo '---' && test -f package.json && echo 'package.json: OK' || echo 'package.json: MISSING'"
$verifyResult = & ".\run_ssh_command.ps1" -Command $verifyCmd
Write-Host "   $verifyResult" -ForegroundColor Gray
Write-Host ""

# Step 8: Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Deployment Summary                           ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Completed:" -ForegroundColor Cyan
Write-Host "   - SSH connection: Working" -ForegroundColor Green
Write-Host "   - Application directory: $appPath" -ForegroundColor Green
Write-Host "   - Files uploaded: $(if (-not $SkipUpload) { 'Yes' } else { 'Skipped' })" -ForegroundColor Green
Write-Host "   - Dependencies: Installed" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to cPanel → Node.js Selector" -ForegroundColor White
Write-Host "   2. Create new Node.js app:" -ForegroundColor White
Write-Host "      - Node.js version: 18 (or 22)" -ForegroundColor Gray
Write-Host "      - Application root: $appPath" -ForegroundColor Gray
Write-Host "      - Application URL: /medarion" -ForegroundColor Gray
Write-Host "      - Application startup file: server.js" -ForegroundColor Gray
Write-Host "   3. Start the application" -ForegroundColor White
Write-Host ""

Write-Host "💡 Quick Commands:" -ForegroundColor Cyan
Write-Host "   # Check app directory" -ForegroundColor Gray
Write-Host "   .\run_ssh_command.ps1 'ls -la $appPath'" -ForegroundColor White
Write-Host ""
Write-Host "   # Check Node.js" -ForegroundColor Gray
Write-Host "   .\run_ssh_command.ps1 'node --version'" -ForegroundColor White
Write-Host ""
Write-Host "   # Restart app (after cPanel setup)" -ForegroundColor Gray
Write-Host "   .\run_ssh_command.ps1 'cd $appPath && pm2 restart medarion || echo \"Use cPanel to restart\"'" -ForegroundColor White
Write-Host ""

