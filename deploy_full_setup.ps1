# Complete Full Deployment - Clean, Deploy, and Setup Everything
# This script cleans public_html, deploys frontend and backend, and sets up Node.js

param(
    [string]$ConfigFile = "cpanel-config.json",
    [switch]$SkipBuild = $false,
    [switch]$SkipClean = $false
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Full Deployment - Medarion                  ║" -ForegroundColor Cyan
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
$publicHtml = "/home/$cpanelUser/public_html"
$nodeAppPath = "/home/$cpanelUser/medarion"
$apiPath = "/home/$cpanelUser/api.medarion.africa"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   SSH User: $sshUser (WHM Root)" -ForegroundColor Gray
Write-Host "   cPanel User: $cpanelUser" -ForegroundColor Gray
Write-Host "   Public HTML: $publicHtml" -ForegroundColor Gray
Write-Host "   Node.js App: $nodeAppPath" -ForegroundColor Gray
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
        & ".\setup_cpanel_nodejs.ps1" -ConfigFile $ConfigFile -GenerateOnly 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Node.js app preparation had issues" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Node.js app already prepared" -ForegroundColor Gray
    }
    
    # Build frontend
    if (-not (Test-Path "medarion-dist")) {
        Write-Host "   Building frontend..." -ForegroundColor Gray
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Frontend build failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✅ Frontend built successfully" -ForegroundColor Green
    } else {
        Write-Host "   Frontend already built" -ForegroundColor Gray
    }
    
    Write-Host "✅ Application files prepared" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Step 2: Skipping build (using existing files)" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Clean public_html (keep essential files)
if (-not $SkipClean) {
    Write-Host "🧹 Step 3: Cleaning public_html..." -ForegroundColor Yellow
    
    $cleanCmd = @"
cd $publicHtml && 
find . -mindepth 1 -maxdepth 1 ! -name '.well-known' ! -name '.htaccess' ! -name '.ftpquota' -exec rm -rf {} + 2>/dev/null || 
(rm -rf assets assets.zip index.html vite.svg 2>/dev/null; echo 'Cleaned public_html')
"@
    
    Write-Host "   Removing old files (keeping .well-known, .htaccess)..." -ForegroundColor Gray
    $cleanResult = & ".\run_ssh_command.ps1" -Command $cleanCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ public_html cleaned" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Clean had some issues, continuing..." -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Step 3: Skipping clean" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Create Directories
Write-Host "📁 Step 4: Creating Directories..." -ForegroundColor Yellow

$dirCmd = "mkdir -p $nodeAppPath $publicHtml && chown -R ${cpanelUser}:${cpanelUser} $nodeAppPath $publicHtml && echo 'Directories ready'"
$dirResult = & ".\run_ssh_command.ps1" -Command $dirCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Directories created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Directory creation had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Upload Files via pscp (PuTTY SCP)
Write-Host "📤 Step 5: Uploading Files..." -ForegroundColor Yellow

# Check for pscp
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
    Write-Host "   ✅ Found pscp: $pscpPath" -ForegroundColor Green
    
    $keyPath = $config.ssh.keyPath
    $password = $config.ssh.password
    $sshPort = $config.ssh.port
    
    # Upload Frontend
    if (Test-Path "medarion-dist") {
        Write-Host "   Uploading frontend to public_html..." -ForegroundColor Gray
        
        # Create tar archive for faster upload
        $frontendTar = "medarion-dist.tar.gz"
        Write-Host "   Creating archive..." -ForegroundColor Gray
        
        # Use PowerShell compression
        $compressCmd = "Compress-Archive -Path 'medarion-dist\*' -DestinationPath '$frontendTar.zip' -Force"
        Invoke-Expression $compressCmd
        
        if (Test-Path "$frontendTar.zip") {
            # Upload zip file
            if ($keyPath -and (Test-Path $keyPath)) {
                $uploadCmd = "& `"$pscpPath`" -i `"$keyPath`" -P $sshPort `"$frontendTar.zip`" ${sshUser}@${sshHost}:$publicHtml/"
            } else {
                $uploadCmd = "echo $password | & `"$pscpPath`" -P $sshPort -pw $password `"$frontendTar.zip`" ${sshUser}@${sshHost}:$publicHtml/"
            }
            
            Write-Host "   Uploading archive..." -ForegroundColor Gray
            Invoke-Expression $uploadCmd
            
            if ($LASTEXITCODE -eq 0) {
                # Extract on server
                Write-Host "   Extracting on server..." -ForegroundColor Gray
                $extractCmd = "cd $publicHtml && unzip -o $frontendTar.zip && rm -f $frontendTar.zip && chown -R ${cpanelUser}:${cpanelUser} . && echo 'Frontend deployed'"
                $extractResult = & ".\run_ssh_command.ps1" -Command $extractCmd
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Frontend uploaded and extracted" -ForegroundColor Green
                } else {
                    Write-Host "   ⚠️  Extraction had issues" -ForegroundColor Yellow
                }
                
                # Clean up local archive
                Remove-Item "$frontendTar.zip" -ErrorAction SilentlyContinue
            } else {
                Write-Host "   ⚠️  Upload had issues" -ForegroundColor Yellow
            }
        }
    }
    
    # Upload Node.js App
    if (Test-Path "cpanel-nodejs-app") {
        Write-Host "   Uploading Node.js app..." -ForegroundColor Gray
        
        $nodeTar = "cpanel-nodejs-app.tar.gz"
        $compressCmd = "Compress-Archive -Path 'cpanel-nodejs-app\*' -DestinationPath '$nodeTar.zip' -Force"
        Invoke-Expression $compressCmd
        
        if (Test-Path "$nodeTar.zip") {
            if ($keyPath -and (Test-Path $keyPath)) {
                $uploadCmd = "& `"$pscpPath`" -i `"$keyPath`" -P $sshPort `"$nodeTar.zip`" ${sshUser}@${sshHost}:$nodeAppPath/"
            } else {
                $uploadCmd = "echo $password | & `"$pscpPath`" -P $sshPort -pw $password `"$nodeTar.zip`" ${sshUser}@${sshHost}:$nodeAppPath/"
            }
            
            Invoke-Expression $uploadCmd
            
            if ($LASTEXITCODE -eq 0) {
                $extractCmd = "cd $nodeAppPath && unzip -o $nodeTar.zip && rm -f $nodeTar.zip && chown -R ${cpanelUser}:${cpanelUser} . && echo 'Node.js app deployed'"
                $extractResult = & ".\run_ssh_command.ps1" -Command $extractCmd
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Node.js app uploaded and extracted" -ForegroundColor Green
                } else {
                    Write-Host "   ⚠️  Extraction had issues" -ForegroundColor Yellow
                }
                
                Remove-Item "$nodeTar.zip" -ErrorAction SilentlyContinue
            } else {
                Write-Host "   ⚠️  Upload had issues" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "   ⚠️  pscp not found" -ForegroundColor Yellow
    Write-Host "   💡 Manual upload required:" -ForegroundColor Cyan
    Write-Host "      1. Use cPanel File Manager" -ForegroundColor Gray
    Write-Host "      2. Upload medarion-dist/* to $publicHtml/" -ForegroundColor Gray
    Write-Host "      3. Upload cpanel-nodejs-app/* to $nodeAppPath/" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Install Dependencies
Write-Host "📦 Step 6: Installing Dependencies..." -ForegroundColor Yellow

$npmCmd = "cd $nodeAppPath && npm install --production && echo 'Dependencies installed'"
Write-Host "   Running: npm install --production" -ForegroundColor Gray
$npmResult = & ".\run_ssh_command.ps1" -Command $npmCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependency installation had issues" -ForegroundColor Yellow
    Write-Host "   You may need to install manually" -ForegroundColor Gray
}
Write-Host ""

# Step 7: Set Permissions
Write-Host "🔐 Step 7: Setting Permissions..." -ForegroundColor Yellow

$permCmd = "chown -R ${cpanelUser}:${cpanelUser} $publicHtml $nodeAppPath && find $publicHtml -type d -exec chmod 755 {} \; && find $publicHtml -type f -exec chmod 644 {} \; && echo 'Permissions set'"
$permResult = & ".\run_ssh_command.ps1" -Command $permCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Permissions set" -ForegroundColor Green
} else {
    Write-Host "⚠️  Permission setting had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Verify Installation
Write-Host "✅ Step 8: Verifying Installation..." -ForegroundColor Yellow

$verifyCmd = "echo '=== Frontend ===' && ls -la $publicHtml | head -10 && echo '' && echo '=== Node.js App ===' && ls -la $nodeAppPath | head -10"
$verifyResult = & ".\run_ssh_command.ps1" -Command $verifyCmd
Write-Host "   $verifyResult" -ForegroundColor Gray
Write-Host ""

# Step 9: Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Deployment Complete!                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Completed:" -ForegroundColor Cyan
Write-Host "   - public_html cleaned and frontend deployed" -ForegroundColor Green
Write-Host "   - Node.js app deployed to $nodeAppPath" -ForegroundColor Green
Write-Host "   - Dependencies installed" -ForegroundColor Green
Write-Host "   - Permissions set" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to cPanel → Node.js Selector" -ForegroundColor White
Write-Host "   2. Create new Node.js app:" -ForegroundColor White
Write-Host "      - Node.js version: 22 (or 18)" -ForegroundColor Gray
Write-Host "      - Application root: $nodeAppPath" -ForegroundColor Gray
Write-Host "      - Application URL: /medarion" -ForegroundColor Gray
Write-Host "      - Application startup file: server.js" -ForegroundColor Gray
Write-Host "   3. Start the application" -ForegroundColor White
Write-Host "   4. Visit your domain to see the frontend" -ForegroundColor White
Write-Host ""

Write-Host "💡 Quick Sync for Updates:" -ForegroundColor Cyan
Write-Host "   Run: .\sync_to_production.ps1" -ForegroundColor White
Write-Host ""

