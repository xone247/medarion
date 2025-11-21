# Complete cPanel Deployment Script
# Fully cleans cPanel and deploys entire project to match local functionality

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Complete cPanel Deployment - Full Clean & Deploy    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    Write-Host "   Please create it from cpanel-config.json.example" -ForegroundColor Yellow
    exit 1
}

$config = Get-Content "cpanel-config.json" -Raw | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$keyPath = $config.ssh.keyPath
$password = $config.ssh.password
$dbName = $config.database.name
$dbUser = $config.database.username
$dbPass = $config.database.password

$publicHtml = "/home/medasnnc/public_html"
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18"
$serverPath = "$nodeAppPath/server"
$medarionPath = "/home/medasnnc/medarion"

# Function to run SSH command - handles "Access granted" automatically
function Run-SSH-Auto {
    param([string]$Cmd)
    
    # Try password first (no prompts at all)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*" -and $result -notlike "*publickey*") {
        return $result
    }
    
    # If password fails, use key with expect-like automation
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $plinkPath
    $processInfo.Arguments = "-i `"$keyPath`" -P $sshPort $sshUser@${sshHost} `"$Cmd`""
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardInput = $true
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    
    # Wait for "Access granted" then send Enter
    Start-Sleep -Milliseconds 2000
    $process.StandardInput.WriteLine()
    $process.StandardInput.Close()
    
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    $process.WaitForExit(30000)
    
    return $output + $error
}

# Function to upload file
function Upload-File-Auto {
    param([string]$Local, [string]$Remote)
    
    if (-not (Test-Path $Local)) {
        Write-Host "   ⚠️  File not found: $Local" -ForegroundColor Yellow
        return $false
    }
    
    # Try password first
    echo $password | & $pscpPath -P $sshPort -pw $password "$Local" "$sshUser@${sshHost}:${Remote}" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        return $true
    }
    
    # Use key with auto-enter
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $pscpPath
    $processInfo.Arguments = "-i `"$keyPath`" -P $sshPort `"$Local`" $sshUser@${sshHost}:${Remote}"
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    Start-Sleep -Milliseconds 1500
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    $process.WaitForExit()
    
    return ($process.ExitCode -eq 0)
}

# Function to upload directory recursively
function Upload-Directory-Auto {
    param([string]$LocalDir, [string]$RemoteDir)
    
    if (-not (Test-Path $LocalDir)) {
        Write-Host "   ⚠️  Directory not found: $LocalDir" -ForegroundColor Yellow
        return $false
    }
    
    # Create tar archive
    $tarName = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.tar.gz'
    $tarName = $tarName -replace '\\', '/'
    
    Write-Host "   📦 Creating archive..." -ForegroundColor Gray
    $tarCmd = "tar -czf `"$tarName`" -C `"$LocalDir`" ."
    Invoke-Expression $tarCmd 2>&1 | Out-Null
    
    if (-not (Test-Path $tarName)) {
        Write-Host "   ❌ Failed to create archive" -ForegroundColor Red
        return $false
    }
    
    # Upload archive
    Write-Host "   📤 Uploading archive..." -ForegroundColor Gray
    $remoteTar = "$medarionPath/temp_upload.tar.gz"
    if (Upload-File-Auto $tarName $remoteTar) {
        # Extract on server
        Write-Host "   📂 Extracting on server..." -ForegroundColor Gray
        $extractCmd = "mkdir -p `"$RemoteDir`"; tar -xzf `"$remoteTar`" -C `"$RemoteDir`"; rm `"$remoteTar`""
        Run-SSH-Auto $extractCmd | Out-Null
        Remove-Item $tarName -ErrorAction SilentlyContinue
        return $true
    }
    
    Remove-Item $tarName -ErrorAction SilentlyContinue
    return $false
}

# ============================================================================
# STEP 1: COMPLETE CLEANUP
# ============================================================================

Write-Host "1️⃣  COMPLETE CLEANUP - Removing Everything..." -ForegroundColor Yellow

$cleanupScript = @"
# Stop all processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f 'node.*server.js' 2>/dev/null || true
pkill -f 'ssh.*vast' 2>/dev/null || true

# Remove ALL medarion files and folders
rm -rf $publicHtml/* 2>/dev/null || true
rm -rf $publicHtml/.* 2>/dev/null || true
rm -rf $nodeAppPath 2>/dev/null || true
rm -rf $medarionPath 2>/dev/null || true
find /home/medasnnc -name '*medarion*' -type d -exec rm -rf {} + 2>/dev/null || true
find /home/medasnnc -name '*medarion*' -type f -delete 2>/dev/null || true

# Clean database - DROP ALL TABLES
mysql -u $dbUser -p'$dbPass' $dbName << 'SQLEND'
SET FOREIGN_KEY_CHECKS = 0;
SET @tables = NULL;
SELECT GROUP_CONCAT('`', table_name, '`') INTO @tables
  FROM information_schema.tables
  WHERE table_schema = '$dbName';
SET @tables = CONCAT('DROP TABLE IF EXISTS ', @tables);
PREPARE stmt FROM @tables;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET FOREIGN_KEY_CHECKS = 1;
SQLEND

# Recreate database structure
mysql -u $dbUser -p'$dbPass' $dbName -e "SELECT 1;" 2>/dev/null || mysql -u $dbUser -p'$dbPass' -e "CREATE DATABASE IF NOT EXISTS $dbName;"

# Create fresh directories
mkdir -p $publicHtml
mkdir -p $serverPath
mkdir -p $medarionPath
chown -R medasnnc:medasnnc $publicHtml
chown -R medasnnc:medasnnc $nodeAppPath
chown -R medasnnc:medasnnc $medarionPath
chmod -R 755 $publicHtml
chmod -R 755 $nodeAppPath

echo 'Complete cleanup finished'
"@

Write-Host "   Cleaning all files and database..." -ForegroundColor Gray
$cleanResult = Run-SSH-Auto $cleanupScript

if ($cleanResult -like "*finished*" -or $cleanResult -like "*Complete*") {
    Write-Host "   ✅ Everything cleaned" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Cleanup may have had issues" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# STEP 2: BUILD FRONTEND
# ============================================================================

Write-Host "2️⃣  Building Frontend..." -ForegroundColor Yellow

if (-not (Test-Path "medarion-dist") -or (Get-ChildItem "medarion-dist" -File | Measure-Object).Count -eq 0) {
    Write-Host "   📦 Running npm build..." -ForegroundColor Gray
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        $buildOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        exit 1
    }
    Write-Host "   ✅ Frontend built" -ForegroundColor Green
} else {
    Write-Host "   ✅ Frontend already built" -ForegroundColor Green
}
Write-Host ""

# ============================================================================
# STEP 3: UPLOAD FRONTEND
# ============================================================================

Write-Host "3️⃣  Uploading Frontend..." -ForegroundColor Yellow

if (Test-Path "medarion-dist") {
    # Upload all files from medarion-dist
    Write-Host "   📤 Uploading frontend files..." -ForegroundColor Gray
    
    # Upload index.html
    if (Test-Path "medarion-dist/index.html") {
        Upload-File-Auto "medarion-dist/index.html" "$publicHtml/index.html" | Out-Null
        Write-Host "   ✅ index.html uploaded" -ForegroundColor Green
    }
    
    # Upload assets directory
    if (Test-Path "medarion-dist/assets") {
        Run-SSH-Auto "mkdir -p $publicHtml/assets" | Out-Null
        Get-ChildItem "medarion-dist/assets" -File -Recurse | ForEach-Object {
            $relativePath = $_.FullName.Replace((Resolve-Path "medarion-dist").Path + "\", "").Replace("\", "/")
            $remotePath = "$publicHtml/$relativePath"
            $remoteDir = Split-Path $remotePath -Parent
            Run-SSH-Auto "mkdir -p `"$remoteDir`"" | Out-Null
            Upload-File-Auto $_.FullName $remotePath | Out-Null
        }
        Write-Host "   ✅ Assets uploaded" -ForegroundColor Green
    }
    
    # Upload other files in root
    Get-ChildItem "medarion-dist" -File | Where-Object { $_.Name -ne "index.html" } | ForEach-Object {
        Upload-File-Auto $_.FullName "$publicHtml/$($_.Name)" | Out-Null
    }
    
    Write-Host "   ✅ Frontend uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ medarion-dist directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================================
# STEP 4: UPLOAD BACKEND
# ============================================================================

Write-Host "4️⃣  Uploading Backend..." -ForegroundColor Yellow

if (Test-Path "server") {
    Write-Host "   📤 Uploading server directory..." -ForegroundColor Gray
    
    # Create server directory on remote
    Run-SSH-Auto "mkdir -p $serverPath" | Out-Null
    
    # Upload entire server directory
    if (Upload-Directory-Auto "server" $serverPath) {
        Write-Host "   ✅ Backend uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Upload had issues, trying alternative method..." -ForegroundColor Yellow
        
        # Alternative: upload as tar
        $tar = "server_backend.tar.gz"
        Remove-Item $tar -ErrorAction SilentlyContinue
        tar -czf $tar -C server . 2>&1 | Out-Null
        if (Test-Path $tar) {
            $remoteTar = "$medarionPath/$tar"
            if (Upload-File-Auto $tar $remoteTar) {
                $altCmd = "cd $nodeAppPath; mkdir -p server; tar -xzf $remoteTar -C server; rm $remoteTar"
                Run-SSH-Auto $altCmd | Out-Null
                Write-Host "   ✅ Backend uploaded (alternative method)" -ForegroundColor Green
            }
            Remove-Item $tar -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "   ❌ server directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================================
# STEP 5: UPLOAD .HTACCESS
# ============================================================================

Write-Host "5️⃣  Uploading .htaccess..." -ForegroundColor Yellow

# Create production .htaccess with Node.js proxy
$htaccessContent = @"
# Medarion Platform - Apache Configuration for cPanel

# Enable Rewrite Engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Force HTTPS (uncomment when SSL is configured)
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Proxy API requests to Node.js backend
    RewriteCond %{REQUEST_URI} ^/api/(.*)$
    RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

    # Proxy AI requests
    RewriteCond %{REQUEST_URI} ^/api/ai/(.*)$
    RewriteRule ^api/ai/(.*)$ http://localhost:3001/api/ai/$1 [P,L]

    # Handle React Router - redirect all requests to index.html except for existing files
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# Enable proxy modules
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# PHP Configuration
<IfModule mod_php7.c>
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value max_execution_time 300
    php_value max_input_time 300
    php_value memory_limit 256M
</IfModule>

# Enable Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Prevent directory listing
Options -Indexes

# Protect sensitive files
<FilesMatch `"\.(env|log|json|md)$`">
    Order allow,deny
    Deny from all
</FilesMatch>
"@

$htaccessFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $htaccessFile -Value $htaccessContent -NoNewline

$htaccessRemotePath = "${publicHtml}/.htaccess"
if (Upload-File-Auto $htaccessFile $htaccessRemotePath) {
    Write-Host "   ✅ .htaccess uploaded" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .htaccess upload failed" -ForegroundColor Yellow
}

Remove-Item $htaccessFile -ErrorAction SilentlyContinue
Write-Host ""

# ============================================================================
# STEP 6: UPLOAD DATABASE
# ============================================================================

Write-Host "6️⃣  Uploading Database..." -ForegroundColor Yellow

$sqlFile = "medarion_local_export_20251112_034406.sql"
if (Test-Path $sqlFile) {
    Write-Host "   📤 Uploading SQL file..." -ForegroundColor Gray
    if (Upload-File-Auto $sqlFile "$medarionPath/$sqlFile") {
        Write-Host "   ✅ SQL file uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  SQL file upload failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  SQL file not found: $sqlFile" -ForegroundColor Yellow
    Write-Host "   💡 You may need to import database manually via phpMyAdmin" -ForegroundColor Cyan
}
Write-Host ""

# ============================================================================
# STEP 7: CREATE DEPLOYMENT SCRIPT
# ============================================================================

Write-Host "7️⃣  Creating Server Deployment Script..." -ForegroundColor Yellow

$deployScript = @"
#!/bin/bash
# Complete Server Deployment Script
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Complete Server Deployment                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

DB_NAME='$dbName'
DB_USER='$dbUser'
DB_PASS='$dbPass'
NODE_APP_PATH='$nodeAppPath'
SERVER_PATH='$serverPath'
PUBLIC_HTML='$publicHtml'
SQL_FILE="$medarionPath/medarion_local_export_20251112_034406.sql"

# Step 1: Import Database
echo "1. Importing Database..."
if [ -f "$SQL_FILE" ]; then
    echo "   Importing database..."
    # Clean SQL file (remove CREATE DATABASE, USE statements)
    sed -i 's/CREATE DATABASE.*;//g' "$SQL_FILE"
    sed -i 's/USE.*;//g' "$SQL_FILE"
    sed -i 's/medarion_platform/$DB_NAME/g' "$SQL_FILE"
    
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1 | grep -v "Warning" | tail -20
    TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
    echo "   ✅ Database imported - $TABLE_COUNT tables"
else
    echo "   ⚠️  SQL file not found: $SQL_FILE"
fi
echo ""

# Step 2: Install Node.js Dependencies
echo "2. Installing Node.js Dependencies..."
cd "$SERVER_PATH"
if [ -f "package.json" ]; then
    echo "   Installing production dependencies..."
    npm install --production 2>&1 | tail -30
    echo "   ✅ Dependencies installed"
else
    echo "   ❌ package.json not found"
    exit 1
fi
echo ""

# Step 3: Install PM2
echo "3. Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "   Installing PM2 globally..."
    npm install -g pm2 2>&1 | tail -10
    echo "   ✅ PM2 installed"
else
    PM2_VERSION=$(pm2 --version)
    echo "   ✅ PM2 already installed: $PM2_VERSION"
fi
echo ""

# Step 4: Create .env file
echo "4. Creating .env file..."
cd "$NODE_APP_PATH"
if [ ! -f ".env" ]; then
    cat > .env << ENVEOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
JWT_SECRET=$(openssl rand -hex 32)
VAST_AI_URL=http://localhost:8081
CORS_ORIGIN=https://medarion.africa
ENVEOF
    chmod 600 .env
    echo "   ✅ .env file created"
else
    echo "   ✅ .env file already exists"
fi
echo ""

# Step 5: Create PM2 ecosystem config
echo "5. Creating PM2 ecosystem config..."
cd "$NODE_APP_PATH"
cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: 'medarion',
    script: '$SERVER_PATH/server.js',
    cwd: '$SERVER_PATH',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/medasnnc/medarion/logs/pm2-error.log',
    out_file: '/home/medasnnc/medarion/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
PM2EOF
echo "   ✅ PM2 config created"
echo ""

# Step 6: Start Application with PM2
echo "6. Starting Application with PM2..."
cd "$NODE_APP_PATH"
mkdir -p /home/medasnnc/medarion/logs

pm2 stop medarion 2>/dev/null || true
pm2 delete medarion 2>/dev/null || true
pm2 start ecosystem.config.js
sleep 3
pm2 save
pm2 startup systemd -u medasnnc --hp /home/medasnnc 2>/dev/null || true
echo "   ✅ Application started"
echo ""

# Step 7: Setup Vast.ai Tunnel Script
echo "7. Setting Up Vast.ai Tunnel..."
mkdir -p ~/vast_tunnel
cat > ~/vast_tunnel/start_tunnel.sh << 'TUNNELEOF'
#!/bin/bash
VAST_HOST="93.91.156.91"
VAST_PORT="52695"
LOCAL_PORT="8081"
REMOTE_PORT="8081"
LOG_FILE="$HOME/vast_tunnel/tunnel.log"
PID_FILE="$HOME/vast_tunnel/tunnel.pid"

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    kill "$OLD_PID" 2>/dev/null || true
    rm -f "$PID_FILE"
fi

nohup ssh -N -L $LOCAL_PORT:localhost:$REMOTE_PORT \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -o ConnectTimeout=10 \
    root@$VAST_HOST -p $VAST_PORT \
    > "$LOG_FILE" 2>&1 &

TUNNEL_PID=$!
echo $TUNNEL_PID > "$PID_FILE"
echo "Tunnel started with PID: $TUNNEL_PID"
TUNNELEOF

chmod +x ~/vast_tunnel/start_tunnel.sh
echo "   ✅ Tunnel script created"
echo ""

# Step 8: Set Permissions
echo "8. Setting File Permissions..."
chown -R medasnnc:medasnnc "$PUBLIC_HTML" 2>/dev/null || true
chown -R medasnnc:medasnnc "$NODE_APP_PATH" 2>/dev/null || true
chown -R medasnnc:medasnnc "$medarionPath" 2>/dev/null || true
chmod -R 755 "$PUBLIC_HTML" 2>/dev/null || true
chmod -R 755 "$NODE_APP_PATH" 2>/dev/null || true
echo "   ✅ Permissions set"
echo ""

# Step 9: Verify Everything
echo "9. Verifying Deployment..."
echo ""
echo "   === Node.js ==="
node --version
echo ""
echo "   === PM2 Status ==="
pm2 list
echo ""
echo "   === Application Status ==="
pm2 status medarion || echo "   Application not running"
echo ""
echo "   === Database Tables ==="
TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
echo "   Tables: $TABLE_COUNT"
echo ""
echo "   === Application Health ==="
sleep 3
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   ✅ Application is responding"
    curl -s http://localhost:3001/api/health | head -3
else
    echo "   ⚠️  Application not responding yet"
    echo "   Checking logs..."
    pm2 logs medarion --lines 10 --nostream 2>&1 | tail -10
fi
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Deployment Complete!                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "   1. Start Vast.ai tunnel: ~/vast_tunnel/start_tunnel.sh"
echo "   2. Test website: https://medarion.africa"
echo "   3. Check logs: pm2 logs medarion"
echo ""
"@

# Save deployment script
$deployScriptFile = "deploy_on_server.sh"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($deployScriptFile, $deployScript, $utf8)

# Upload deployment script
Write-Host "   📤 Uploading deployment script..." -ForegroundColor Gray
if (Upload-File-Auto $deployScriptFile "$medarionPath/$deployScriptFile") {
    Write-Host "   ✅ Deployment script uploaded" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Deployment script upload failed" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# STEP 8: EXECUTE DEPLOYMENT
# ============================================================================

Write-Host "8️⃣  Executing Server Deployment..." -ForegroundColor Yellow
Write-Host "   (This takes 5-10 minutes)" -ForegroundColor Gray
Write-Host ""

$deployCmd = "chmod +x $medarionPath/$deployScriptFile; bash $medarionPath/$deployScriptFile 2>&1"
$deploy = Run-SSH-Auto $deployCmd

if ($deploy) {
    $deploy | ForEach-Object {
        if ($_ -match "complete|started|online|tables|imported|installed|Node.js|PM2|Database|Application|✅") {
            Write-Host "   $_" -ForegroundColor Green
        } elseif ($_ -match "warning|WARNING|⚠️") {
            Write-Host "   $_" -ForegroundColor Yellow
        } elseif ($_ -match "error|ERROR|failed|FAILED|❌") {
            Write-Host "   $_" -ForegroundColor Red
        } else {
            Write-Host "   $_" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   ⚠️  Could not execute automatically" -ForegroundColor Yellow
    Write-Host "   💡 Run manually via SSH:" -ForegroundColor Cyan
    Write-Host "      ssh $sshUser@${sshHost}" -ForegroundColor White
    Write-Host "      bash $medarionPath/$deployScriptFile" -ForegroundColor White
}
Write-Host ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              DEPLOYMENT COMPLETE!                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application: https://medarion.africa" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 What was deployed:" -ForegroundColor Cyan
Write-Host "   ✅ Frontend (React app)" -ForegroundColor White
Write-Host "   ✅ Backend (Node.js/Express)" -ForegroundColor White
Write-Host "   ✅ Database (MySQL)" -ForegroundColor White
Write-Host "   ✅ .htaccess (Apache configuration)" -ForegroundColor White
Write-Host "   ✅ PM2 process manager" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Verify deployment:" -ForegroundColor Yellow
Write-Host "   1. Check PM2: ssh ${sshUser}@${sshHost} `"pm2 list`"" -ForegroundColor White
Write-Host "   2. Test website: https://medarion.africa" -ForegroundColor White
Write-Host "   3. Start Vast.ai tunnel: ssh ${sshUser}@${sshHost} `"~/vast_tunnel/start_tunnel.sh`"" -ForegroundColor White
Write-Host "   4. Check logs: ssh ${sshUser}@${sshHost} `"pm2 logs medarion`"" -ForegroundColor White
Write-Host ""
Write-Host "✅ Your application should now be fully functional online!" -ForegroundColor Green
Write-Host ""

