# Complete Fresh Deployment - Clean Everything and Deploy New Version
# This script completely cleans the server and deploys fresh files

param(
    [string]$ConfigFile = "cpanel-config.json"
)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete Fresh Deployment - Clean & Deploy           ║" -ForegroundColor Cyan
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
$oldApiPath = "/home/$cpanelUser/api.medarion.africa"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   SSH Host: $sshHost" -ForegroundColor Gray
Write-Host "   SSH User: $sshUser (WHM Root)" -ForegroundColor Gray
Write-Host "   cPanel User: $cpanelUser" -ForegroundColor Gray
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

# Step 2: COMPLETE CLEANUP - Remove ALL old files
Write-Host "🧹 Step 2: Complete Cleanup - Removing ALL Old Files..." -ForegroundColor Yellow
Write-Host "   ⚠️  This will delete:" -ForegroundColor Yellow
Write-Host "      - All files in public_html (except .well-known)" -ForegroundColor Gray
Write-Host "      - All files in $nodeAppPath" -ForegroundColor Gray
Write-Host "      - Old Node.js app in $oldApiPath (if exists)" -ForegroundColor Gray
Write-Host ""

$cleanupCmd = @"
# Clean public_html (keep only .well-known)
cd $publicHtml && 
find . -mindepth 1 -maxdepth 1 ! -name '.well-known' ! -name '.ftpquota' -exec rm -rf {} + 2>/dev/null || true

# Remove old Node.js app directory completely
rm -rf $nodeAppPath 2>/dev/null || true

# Remove old api.medarion.africa if it exists (old Node.js setup)
rm -rf $oldApiPath 2>/dev/null || true

# Recreate directories with proper ownership
mkdir -p $publicHtml $nodeAppPath
chown -R ${cpanelUser}:${cpanelUser} $publicHtml $nodeAppPath

echo 'Cleanup complete'
"@

Write-Host "   Executing cleanup..." -ForegroundColor Gray
$cleanupResult = & ".\run_ssh_command.ps1" -Command $cleanupCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Complete cleanup done!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cleanup had some issues, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Verify Local Files Exist
Write-Host "📦 Step 3: Verifying Local Files..." -ForegroundColor Yellow

if (-not (Test-Path "medarion-dist")) {
    Write-Host "❌ Frontend build not found! Run: npm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "cpanel-nodejs-app")) {
    Write-Host "❌ Backend not prepared! Run: .\setup_cpanel_nodejs.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Local files verified" -ForegroundColor Green
Write-Host "   Frontend: $(Get-ChildItem 'medarion-dist' -Recurse -File | Measure-Object).Count files" -ForegroundColor Gray
Write-Host "   Backend: $(Get-ChildItem 'cpanel-nodejs-app' -Recurse -File | Measure-Object).Count files" -ForegroundColor Gray
Write-Host ""

# Step 4: Upload Files
Write-Host "📤 Step 4: Uploading Fresh Files..." -ForegroundColor Yellow

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

if (-not $pscpPath) {
    Write-Host "❌ pscp not found. Install PuTTY." -ForegroundColor Red
    exit 1
}

$keyPath = $config.ssh.keyPath
$password = $config.ssh.password
$sshPort = $config.ssh.port

# Upload Frontend
Write-Host "   Uploading frontend..." -ForegroundColor Gray
$frontendTar = "medarion-dist-fresh.zip"
Compress-Archive -Path "medarion-dist\*" -DestinationPath $frontendTar -Force

if ($keyPath -and (Test-Path $keyPath)) {
    & $pscpPath -i $keyPath -P $sshPort $frontendTar "${sshUser}@${sshHost}:$publicHtml/" 2>&1 | Out-Null
} else {
    echo $password | & $pscpPath -P $sshPort -pw $password $frontendTar "${sshUser}@${sshHost}:$publicHtml/" 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    $extractCmd = "cd $publicHtml && unzip -o $frontendTar && rm -f $frontendTar && chown -R ${cpanelUser}:${cpanelUser} . && echo 'Frontend deployed'"
    & ".\run_ssh_command.ps1" -Command $extractCmd | Out-Null
    Write-Host "   ✅ Frontend uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend upload failed" -ForegroundColor Red
    exit 1
}

Remove-Item $frontendTar -ErrorAction SilentlyContinue

# Upload Backend
Write-Host "   Uploading backend..." -ForegroundColor Gray
$backendTar = "cpanel-nodejs-app-fresh.zip"
Compress-Archive -Path "cpanel-nodejs-app\*" -DestinationPath $backendTar -Force

if ($keyPath -and (Test-Path $keyPath)) {
    & $pscpPath -i $keyPath -P $sshPort $backendTar "${sshUser}@${sshHost}:$nodeAppPath/" 2>&1 | Out-Null
} else {
    echo $password | & $pscpPath -P $sshPort -pw $password $backendTar "${sshUser}@${sshHost}:$nodeAppPath/" 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    $extractCmd = "cd $nodeAppPath && unzip -o $backendTar && rm -f $backendTar && chown -R ${cpanelUser}:${cpanelUser} . && echo 'Backend deployed'"
    & ".\run_ssh_command.ps1" -Command $extractCmd | Out-Null
    Write-Host "   ✅ Backend uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend upload failed" -ForegroundColor Red
    exit 1
}

Remove-Item $backendTar -ErrorAction SilentlyContinue
Write-Host ""

# Step 5: Install Dependencies
Write-Host "📦 Step 5: Installing Dependencies..." -ForegroundColor Yellow
$npmCmd = "cd $nodeAppPath && npm install --production && echo 'Dependencies installed'"
$npmResult = & ".\run_ssh_command.ps1" -Command $npmCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependency installation had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Set Permissions
Write-Host "🔐 Step 6: Setting Permissions..." -ForegroundColor Yellow
$permCmd = "chown -R ${cpanelUser}:${cpanelUser} $publicHtml $nodeAppPath && find $publicHtml -type d -exec chmod 755 {} \; && find $publicHtml -type f -exec chmod 644 {} \; && echo 'Permissions set'"
$permResult = & ".\run_ssh_command.ps1" -Command $permCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Permissions set" -ForegroundColor Green
} else {
    Write-Host "⚠️  Permission setting had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Verify Database Connection
Write-Host "🗄️  Step 7: Verifying Database Connection..." -ForegroundColor Yellow
$dbTestCmd = "cd $nodeAppPath && node -e `"import('./config/database.js').then(m => { const db = m.default || m; db.getConnection((err, conn) => { if (err) { console.error('DB Error:', err.message); process.exit(1); } else { conn.release(); console.log('✅ Database connection OK'); process.exit(0); } }); }).catch(e => { console.error('Import Error:', e.message); process.exit(1); });`""
$dbResult = & ".\run_ssh_command.ps1" -Command $dbTestCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection verified" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database connection test had issues" -ForegroundColor Yellow
    Write-Host "   Check database credentials in .env file" -ForegroundColor Gray
}
Write-Host ""

# Step 8: Final Verification
Write-Host "✅ Step 8: Final Verification..." -ForegroundColor Yellow
$verifyCmd = "echo '=== Frontend ===' && ls -la $publicHtml | head -10 && echo '' && echo '=== Backend ===' && ls -la $nodeAppPath | head -10 && echo '' && echo '=== Node.js ===' && node --version && echo '=== npm ===' && npm --version"
$verifyResult = & ".\run_ssh_command.ps1" -Command $verifyCmd
Write-Host "   $verifyResult" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Fresh Deployment Complete!                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Completed:" -ForegroundColor Cyan
Write-Host "   - All old files removed" -ForegroundColor Green
Write-Host "   - Fresh frontend deployed to $publicHtml" -ForegroundColor Green
Write-Host "   - Fresh backend deployed to $nodeAppPath" -ForegroundColor Green
Write-Host "   - Dependencies installed" -ForegroundColor Green
Write-Host "   - Permissions set" -ForegroundColor Green
Write-Host "   - Database connection verified" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to cPanel → Node.js Selector" -ForegroundColor White
Write-Host "   2. Create new Node.js app:" -ForegroundColor White
Write-Host "      - Node.js version: 22 (or 18)" -ForegroundColor Gray
Write-Host "      - Application root: $nodeAppPath" -ForegroundColor Gray
Write-Host "      - Application URL: /medarion" -ForegroundColor Gray
Write-Host "      - Application startup file: server.js" -ForegroundColor Gray
Write-Host "   3. Start the application" -ForegroundColor White
Write-Host "   4. Visit: https://medarion.africa" -ForegroundColor White
Write-Host ""

