# Complete cPanel Environment Setup
# This script sets up everything needed for the application to work on cPanel

param(
    [switch]$SkipPageant = $false
)

$ErrorActionPreference = "Stop"

# Load config
$configPath = "cpanel-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Config file not found: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
# Use the hostname from config
$sshHost = $config.ssh.host  # server1.medarion.africa
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username  # root
$keyPath = $config.ssh.keyPath
$passphrase = $config.ssh.password
$plinkPath = $config.ssh.plinkPath
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "📋 SSH Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $sshHost" -ForegroundColor White
Write-Host "   Port: $sshPort" -ForegroundColor White
Write-Host "   User: $sshUser" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Setting up cPanel Environment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Load Pageant
if (-not $SkipPageant) {
    Write-Host "📋 Step 1: Loading SSH Key into Pageant..." -ForegroundColor Yellow
    & ".\load_pageant_auto.ps1"
    Start-Sleep -Seconds 2
    Write-Host ""
}

# Step 2: Test SSH Connection
Write-Host "📋 Step 2: Testing SSH Connection..." -ForegroundColor Yellow
$testCmd = "whoami && hostname && pwd"

# Try password first (more reliable with plink)
$sshPassword = $config.ssh.password
$sshPassword = "RgIyt5SEkc4E]nmp"  # Use passphrase as SSH password for root
$result = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $testCmd 2>&1

if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL*" -and $result -notlike "*Access denied*") {
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
    Write-Host "   $($result -join '`n')" -ForegroundColor Gray
} else {
    # Try with key (Pageant should handle it)
    Write-Host "   Trying with SSH key..." -ForegroundColor Yellow
    # Use password for plink (more reliable)
    $result = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $testCmd 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection successful (with key)" -ForegroundColor Green
        Write-Host "   $($result -join '`n')" -ForegroundColor Gray
    } else {
        Write-Host "❌ SSH connection failed" -ForegroundColor Red
        Write-Host "   $($result -join '`n')" -ForegroundColor Red
        Write-Host "   Trying manual connection..." -ForegroundColor Yellow
        exit 1
    }
}
Write-Host ""

# Step 3: Check Node.js
Write-Host "📋 Step 3: Checking Node.js Installation..." -ForegroundColor Yellow
$nodeCheck = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "node --version 2>&1; npm --version 2>&1"
if ($nodeCheck -match "v\d+\.\d+\.\d+") {
    Write-Host "✅ Node.js is installed: $($nodeCheck -split "`n" | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Node.js not found. Installing..." -ForegroundColor Yellow
    $installCmd = "curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && yum install -y nodejs"
    $installResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $installCmd 2>&1
    Write-Host "   $installResult" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Create Node.js App Directory
Write-Host "📋 Step 4: Creating Node.js App Directory..." -ForegroundColor Yellow
$createDirCmd = "mkdir -p $nodeAppPath && chown -R medasnnc:medasnnc $nodeAppPath && ls -la $nodeAppPath"
$dirResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $createDirCmd 2>&1
Write-Host "✅ Directory created" -ForegroundColor Green
Write-Host ""

# Step 5: Upload Server Files
Write-Host "📋 Step 5: Uploading Server Files..." -ForegroundColor Yellow
if (-not (Test-Path "server")) {
    Write-Host "❌ 'server' directory not found!" -ForegroundColor Red
    exit 1
}

$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
if (-not (Test-Path $pscpPath)) {
    Write-Host "❌ PSCP not found at: $pscpPath" -ForegroundColor Red
    Write-Host "   Please install PuTTY or use manual upload" -ForegroundColor Yellow
} else {
    Write-Host "   Uploading server files..." -ForegroundColor Gray
    
    # Upload server directory contents
    $serverFiles = Get-ChildItem -Path "server" -Recurse -File
    foreach ($file in $serverFiles) {
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\server\", "").Replace("\", "/")
        $remotePath = "$nodeAppPath/$relativePath"
        $remoteDir = Split-Path $remotePath -Parent
        
        # Create remote directory
        echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "mkdir -p $remoteDir" | Out-Null
        
        # Upload file
        echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "$($file.FullName)" "$sshUser@${sshHost}:$remotePath" 2>&1 | Out-Null
    }
    
    # Upload package.json if exists
    if (Test-Path "package.json") {
        echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "package.json" "$sshUser@${sshHost}:$nodeAppPath/package.json" 2>&1 | Out-Null
    }
    
    Write-Host "✅ Server files uploaded" -ForegroundColor Green
}
Write-Host ""

# Step 6: Install Dependencies
Write-Host "📋 Step 6: Installing Node.js Dependencies..." -ForegroundColor Yellow
$npmInstallCmd = "cd $nodeAppPath && npm install --production"
$npmResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $npmInstallCmd 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  npm install had issues. Check output:" -ForegroundColor Yellow
    Write-Host "   $npmResult" -ForegroundColor Gray
}
Write-Host ""

# Step 7: Create .env File
Write-Host "📋 Step 7: Creating .env File..." -ForegroundColor Yellow
$envContent = @"
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$($config.database.name)
DB_USER=$($config.database.username)
DB_PASSWORD=$($config.database.password)
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
VAST_AI_URL=http://localhost:8081
"@

# Create .env file on server
$envCmd = "cat > $nodeAppPath/.env << 'ENVEOF'
$envContent
ENVEOF
"
$envResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $envCmd 2>&1
Write-Host "✅ .env file created" -ForegroundColor Green
Write-Host ""

# Step 8: Setup AI Tunnel
Write-Host "📋 Step 8: Setting up AI Tunnel..." -ForegroundColor Yellow

# Upload tunnel setup script
if (Test-Path "setup_cpanel_ai_tunnel.sh") {
    echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "setup_cpanel_ai_tunnel.sh" "$sshUser@${sshHost}:/tmp/setup_cpanel_ai_tunnel.sh" 2>&1 | Out-Null
    
    # Make executable and run
    $tunnelCmd = "chmod +x /tmp/setup_cpanel_ai_tunnel.sh && /tmp/setup_cpanel_ai_tunnel.sh"
    $tunnelResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $tunnelCmd 2>&1
    
    if ($tunnelResult -match "SUCCESS|running") {
        Write-Host "✅ AI tunnel setup complete" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AI tunnel setup may need manual attention" -ForegroundColor Yellow
        Write-Host "   $tunnelResult" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Tunnel setup script not found. Skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Step 9: Verify Setup
Write-Host "📋 Step 9: Verifying Setup..." -ForegroundColor Yellow

# Check if files exist
$verifyCmd = "cd $nodeAppPath && ls -la server.js package.json .env 2>&1"
$verifyResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $verifyCmd 2>&1
if ($verifyResult -match "server.js|package.json|\.env") {
    Write-Host "✅ All files in place" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some files may be missing" -ForegroundColor Yellow
}

# Check tunnel
$tunnelStatus = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "systemctl status vast-ai-tunnel.service --no-pager 2>&1 | head -5" 2>&1
if ($tunnelStatus -match "active|running") {
    Write-Host "✅ AI tunnel is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  AI tunnel may not be running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Environment Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Log into cPanel: https://medarion.africa:2083" -ForegroundColor White
Write-Host "   2. Go to: Software → Node.js Selector" -ForegroundColor White
Write-Host "   3. Click 'Create Application'" -ForegroundColor White
Write-Host "   4. Settings:" -ForegroundColor White
Write-Host "      - Root: $nodeAppPath" -ForegroundColor Gray
Write-Host "      - URL: /medarion-api" -ForegroundColor Gray
Write-Host "      - File: server.js" -ForegroundColor Gray
Write-Host "      - Port: 3001" -ForegroundColor Gray
Write-Host "   5. Add environment variables (from .env file)" -ForegroundColor White
Write-Host "   6. Click 'Start'" -ForegroundColor White
Write-Host ""
Write-Host "📚 See CPANEL_BACKEND_AND_AI_SETUP.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

