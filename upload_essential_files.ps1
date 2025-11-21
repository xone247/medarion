# Upload Only Essential Files for Node.js Server
# This script uploads only the critical files needed to run the server

param(
    [switch]$SkipTest = $false
)

$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = $config.ssh.plinkPath
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

Write-Host "📤 Uploading Essential Files Only..." -ForegroundColor Cyan
Write-Host ""

# Step 0: Clean previous uploads
Write-Host "🧹 Step 0: Cleaning Previous Uploads..." -ForegroundColor Yellow
$cleanCmd = "cd $nodeAppPath && rm -rf config middleware routes services server.js package.json 2>/dev/null; mkdir -p config middleware routes services; echo 'Cleaned'"
$cleanResult = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $cleanCmd 2>&1
Write-Host "✅ Previous files cleaned" -ForegroundColor Green
Write-Host ""

# Essential files to upload
$essentialFiles = @(
    # Main server file
    "server/server.js",
    
    # Configuration
    "server/config/database.js",
    
    # Middleware
    "server/middleware/auth.js",
    
    # Routes (all .js files in routes)
    "server/routes/auth.js",
    "server/routes/companies.js",
    "server/routes/deals.js",
    "server/routes/grants.js",
    "server/routes/clinical-trials.js",
    "server/routes/blog.js",
    "server/routes/db.js",
    "server/routes/ai.js",
    "server/routes/ai-data-generation.js",
    "server/routes/ai-data-updates.js",
    "server/routes/investors.js",
    "server/routes/notifications.js",
    "server/routes/admin.js",
    "server/routes/countries.js",
    
    # Services
    "server/services/vastAiService.js",
    
    # Package.json
    "package.json"
)

# Find all route files dynamically
$routeFiles = Get-ChildItem -Path "server/routes" -Filter "*.js" -File | ForEach-Object { $_.FullName }
$serviceFiles = Get-ChildItem -Path "server/services" -Filter "*.js" -File | ForEach-Object { $_.FullName }
$configFiles = Get-ChildItem -Path "server/config" -Filter "*.js" -File | ForEach-Object { $_.FullName }
$middlewareFiles = Get-ChildItem -Path "server/middleware" -Filter "*.js" -File | ForEach-Object { $_.FullName }

# Combine all essential files
$allEssentialFiles = @()
$allEssentialFiles += "server/server.js"
$allEssentialFiles += $routeFiles
$allEssentialFiles += $serviceFiles
$allEssentialFiles += $configFiles
$allEssentialFiles += $middlewareFiles
$allEssentialFiles += "package.json"

# Filter to only existing files
$filesToUpload = $allEssentialFiles | Where-Object { Test-Path $_ }

Write-Host "📋 Files to Upload ($($filesToUpload.Count) files):" -ForegroundColor Yellow
$filesToUpload | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
Write-Host ""

# Upload files
$uploaded = 0
$failed = 0

foreach ($file in $filesToUpload) {
    # Remove the "server/" prefix and project root, keep only the relative path within server
    $relativePath = $file.Replace((Get-Location).Path + "\server\", "").Replace((Get-Location).Path + "\", "").Replace("\", "/")
    
    # For package.json, put it at root
    if ($file -like "*package.json") {
        $remotePath = "$nodeAppPath/package.json"
        $remoteDir = $nodeAppPath
    } else {
        # For server files, put them directly in app root (not in server/ subdirectory)
        $remotePath = "$nodeAppPath/$relativePath"
        $remoteDir = Split-Path $remotePath -Parent
    }
    
    # Create remote directory
    echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" "mkdir -p $remoteDir" | Out-Null
    
    # Upload file
    $result = echo $sshPassword | & $pscpPath -P $sshPort -pw $sshPassword "$file" "$sshUser@${sshHost}:$remotePath" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $uploaded++
        Write-Host "✅ $relativePath" -ForegroundColor Green
    } else {
        $failed++
        Write-Host "❌ $relativePath - $result" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Upload Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Uploaded: $uploaded" -ForegroundColor Green
Write-Host "   ❌ Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($uploaded -gt 0) {
    Write-Host "✅ Essential files uploaded!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Install dependencies: npm install --production" -ForegroundColor White
    Write-Host "   2. Create .env file" -ForegroundColor White
    Write-Host "   3. Setup AI tunnel" -ForegroundColor White
    Write-Host "   4. Create Node.js app in cPanel" -ForegroundColor White
}

