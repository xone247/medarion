# Step 7: Deploy on Server
# This script runs the server-side deployment (database import, npm install, PM2 setup)

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Step 7: Deploy on Server                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load configuration
if (-not (Test-Path "cpanel-config.json")) {
    Write-Host "❌ cpanel-config.json not found!" -ForegroundColor Red
    exit 1
}

$config = Get-Content "cpanel-config.json" -Raw | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$password = $config.ssh.password
$dbName = $config.database.name
$dbUser = $config.database.username
$dbPass = $config.database.password
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18"
$serverPath = "$nodeAppPath/server"
$medarionPath = "/home/medasnnc/medarion"

# Function to run SSH command
function Run-SSH-Auto {
    param([string]$Cmd)
    $result = echo $password | & $plinkPath -P $sshPort -pw $password "$sshUser@${sshHost}" $Cmd 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -notlike "*FATAL ERROR*") {
        return $result
    }
    return $result
}

# Generate server deployment script
Write-Host "📝 Creating server deployment script..." -ForegroundColor Yellow

$deployScript = @'
#!/bin/bash
set -e

DB_NAME='PLACEHOLDER_DB_NAME'
DB_USER='PLACEHOLDER_DB_USER'
DB_PASS='PLACEHOLDER_DB_PASS'
NODE_APP_PATH='PLACEHOLDER_NODE_PATH'
SERVER_PATH='PLACEHOLDER_SERVER_PATH'
SQL_FILE="PLACEHOLDER_SQL_FILE"

echo "1. Checking Database Status..."
# Check if database exists
if mysql -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null; then
    EXISTING_TABLES=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
    if [ "$EXISTING_TABLES" -gt 0 ]; then
        echo "   Database exists with $EXISTING_TABLES tables"
        echo "   ⚠️  Database already has tables"
        read -p "   Import anyway? This may cause errors if tables exist (y/n): " IMPORT_ANYWAY
        if [ "$IMPORT_ANYWAY" != "y" ] && [ "$IMPORT_ANYWAY" != "Y" ]; then
            echo "   ⏭️  Skipping database import"
        else
            echo "   Importing database (may show errors for existing tables)..."
            if [ -f "$SQL_FILE" ]; then
                sed -i 's/CREATE DATABASE.*;//g' "$SQL_FILE" 2>/dev/null || true
                sed -i 's/USE.*;//g' "$SQL_FILE" 2>/dev/null || true
                sed -i "s/medarion_platform/$DB_NAME/g" "$SQL_FILE" 2>/dev/null || true
                mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1 | grep -v "Warning\|Error\|Duplicate" | tail -20 || true
                TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
                echo "   Database import completed - $TABLE_COUNT tables"
            else
                echo "   SQL file not found: $SQL_FILE"
            fi
        fi
    else
        echo "   Database exists but is empty, importing..."
        if [ -f "$SQL_FILE" ]; then
            sed -i 's/CREATE DATABASE.*;//g' "$SQL_FILE" 2>/dev/null || true
            sed -i 's/USE.*;//g' "$SQL_FILE" 2>/dev/null || true
            sed -i "s/medarion_platform/$DB_NAME/g" "$SQL_FILE" 2>/dev/null || true
            mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1 | grep -v "Warning" | tail -20
            TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
            echo "   Database imported - $TABLE_COUNT tables"
        else
            echo "   SQL file not found: $SQL_FILE"
        fi
    fi
else
    echo "   Database does not exist, creating and importing..."
    mysql -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || true
    if [ -f "$SQL_FILE" ]; then
        sed -i 's/CREATE DATABASE.*;//g' "$SQL_FILE" 2>/dev/null || true
        sed -i 's/USE.*;//g' "$SQL_FILE" 2>/dev/null || true
        sed -i "s/medarion_platform/$DB_NAME/g" "$SQL_FILE" 2>/dev/null || true
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1 | grep -v "Warning" | tail -20
        TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
        echo "   Database imported - $TABLE_COUNT tables"
    else
        echo "   SQL file not found: $SQL_FILE"
    fi
fi

echo ""
echo "2. Checking Node.js Dependencies..."
cd "$SERVER_PATH"
if [ ! -f "package.json" ]; then
    echo "   ❌ package.json not found"
    exit 1
fi

if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "   node_modules exists with $MODULE_COUNT packages"
    read -p "   Reinstall dependencies? (y/n): " REINSTALL
    if [ "$REINSTALL" = "y" ] || [ "$REINSTALL" = "Y" ]; then
        echo "   Reinstalling dependencies..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        npm install --production 2>&1 | tail -30
        echo "   Dependencies reinstalled"
    else
        echo "   ⏭️  Using existing node_modules"
    fi
else
    echo "   Installing dependencies..."
    npm install --production 2>&1 | tail -30
    echo "   Dependencies installed"
fi

echo ""
echo "3. Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 2>&1 | tail -10
    echo "   PM2 installed"
else
    PM2_VERSION=$(pm2 --version)
    echo "   PM2 already installed: $PM2_VERSION"
fi

echo ""
echo "4. Checking .env file..."
cd "$NODE_APP_PATH"
if [ -f ".env" ]; then
    echo "   .env file already exists"
    read -p "   Overwrite .env file? (y/n): " OVERWRITE_ENV
    if [ "$OVERWRITE_ENV" = "y" ] || [ "$OVERWRITE_ENV" = "Y" ]; then
        echo "   Creating new .env file..."
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
        echo "   .env file updated"
    else
        echo "   ⏭️  Keeping existing .env file"
        echo "   ℹ️  Make sure existing .env has correct values"
    fi
else
    echo "   Creating .env file..."
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
    echo "   .env file created"
fi

echo ""
echo "5. Checking PM2 ecosystem config..."
if [ -f "ecosystem.config.js" ]; then
    echo "   ecosystem.config.js already exists"
    read -p "   Overwrite PM2 config? (y/n): " OVERWRITE_PM2
    if [ "$OVERWRITE_PM2" != "y" ] && [ "$OVERWRITE_PM2" != "Y" ]; then
        echo "   ⏭️  Using existing PM2 config"
    else
        echo "   Creating new PM2 config..."
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
echo "   PM2 config created"

echo ""
echo "6. Checking Port 3001 Availability..."
PORT_IN_USE=$(netstat -tuln 2>/dev/null | grep ':3001' || ss -tuln 2>/dev/null | grep ':3001' || echo '')
if [ -n "$PORT_IN_USE" ]; then
    echo "   Port 3001 is already in use:"
    echo "   $PORT_IN_USE"
    echo "   Stopping existing process..."
    pm2 stop medarion 2>/dev/null || true
    pm2 delete medarion 2>/dev/null || true
    pkill -f 'node.*server.js' 2>/dev/null || true
    sleep 2
    PORT_CHECK=$(netstat -tuln 2>/dev/null | grep ':3001' || ss -tuln 2>/dev/null | grep ':3001' || echo '')
    if [ -n "$PORT_CHECK" ]; then
        echo "   ⚠️  Port 3001 still in use - may need manual intervention"
    else
        echo "   ✅ Port 3001 is now available"
    fi
else
    echo "   ✅ Port 3001 is available"
fi

echo ""
echo "7. Checking PM2 Process Status..."
mkdir -p /home/medasnnc/medarion/logs

# Check if PM2 process already exists
if pm2 list | grep -q "medarion"; then
    echo "   PM2 process 'medarion' already exists"
    PM2_STATUS=$(pm2 jlist | grep -o '"name":"medarion"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Current status: $PM2_STATUS"
    read -p "   Restart existing process? (y/n): " RESTART_PM2
    if [ "$RESTART_PM2" = "y" ] || [ "$RESTART_PM2" = "Y" ]; then
        echo "   Stopping existing process..."
        pm2 stop medarion 2>/dev/null || true
        pm2 delete medarion 2>/dev/null || true
        sleep 2
        echo "   Starting application with PM2..."
        pm2 start ecosystem.config.js
        sleep 3
        pm2 save
        echo "   Application restarted"
    else
        echo "   ⏭️  Keeping existing PM2 process"
    fi
else
    echo "   Starting application with PM2..."
    pm2 start ecosystem.config.js
    sleep 3
    pm2 save
    echo "   Application started"
fi

# Setup PM2 startup (only if not already configured)
if ! pm2 startup | grep -q "already"; then
    pm2 startup systemd -u medasnnc --hp /home/medasnnc 2>/dev/null || true
fi

echo ""
echo "8. Setting up Vast.ai Tunnel..."
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
        echo "   Tunnel script updated"
    fi
else
    echo "   Creating Vast.ai Tunnel Script..."
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
    echo "   Tunnel script created"
fi

echo ""
echo "9. Setting Permissions..."
chown -R medasnnc:medasnnc /home/medasnnc/public_html 2>/dev/null || true
chown -R medasnnc:medasnnc "$NODE_APP_PATH" 2>/dev/null || true
chown -R medasnnc:medasnnc /home/medasnnc/medarion 2>/dev/null || true
chmod -R 755 /home/medasnnc/public_html 2>/dev/null || true
echo "   Permissions set"

echo ""
echo "10. Verifying Deployment..."
echo "   Node.js: $(node --version 2>/dev/null || echo 'not installed')"
echo "   PM2 Status:"
pm2 list
echo ""
echo "   Database Tables:"
TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
echo "   Tables: $TABLE_COUNT"
echo ""
echo "   Application Health:"
sleep 3
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   Application is responding"
    curl -s http://localhost:3001/api/health | head -3
else
    echo "   Application not responding yet"
    pm2 logs medarion --lines 10 --nostream 2>&1 | tail -10
fi

echo ""
echo "Deployment Complete!"
'@

# Find SQL file
$sqlFile = $null
$sqlFiles = @(
    "medarion_local_export_20251112_034406.sql",
    "medarion_local_export_20251111_150329.sql"
)
foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        $sqlFile = $file
        break
    }
}

if (-not $sqlFile) {
    Write-Host "⚠️  SQL file not found locally, will use server file if exists" -ForegroundColor Yellow
    $sqlFile = "medarion_local_export_20251112_034406.sql"
}

# Replace placeholders
$deployScript = $deployScript -replace 'PLACEHOLDER_DB_NAME', $dbName
$deployScript = $deployScript -replace 'PLACEHOLDER_DB_USER', $dbUser
$deployScript = $deployScript -replace 'PLACEHOLDER_DB_PASS', $dbPass
$deployScript = $deployScript -replace 'PLACEHOLDER_NODE_PATH', $nodeAppPath
$deployScript = $deployScript -replace 'PLACEHOLDER_SERVER_PATH', $serverPath
$deployScript = $deployScript -replace 'PLACEHOLDER_SQL_FILE', "$medarionPath/$sqlFile"

# Save and upload script
$deployScriptFile = "deploy_on_server.sh"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($deployScriptFile, $deployScript, $utf8)

Write-Host "   ✅ Script created" -ForegroundColor Green
Write-Host ""

# Upload script
Write-Host "📤 Uploading deployment script..." -ForegroundColor Yellow
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
echo $password | & $pscpPath -P $sshPort -pw $password "$deployScriptFile" "$sshUser@${sshHost}:${medarionPath}/$deployScriptFile" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Script uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload script" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Executing deployment on server..." -ForegroundColor Yellow
Write-Host "   (This takes 5-10 minutes)" -ForegroundColor Gray
Write-Host ""

$deployCmd = "chmod +x ${medarionPath}/$deployScriptFile; bash ${medarionPath}/$deployScriptFile 2>&1"
$deploy = Run-SSH-Auto $deployCmd

if ($deploy) {
    $deploy | ForEach-Object {
        if ($_ -match "complete|started|online|tables|imported|installed|Node.js|PM2|Database|Application|responding|✅") {
            Write-Host "   $_" -ForegroundColor Green
        } elseif ($_ -match "warning|WARNING|⚠️") {
            Write-Host "   $_" -ForegroundColor Yellow
        } elseif ($_ -match "error|ERROR|failed|FAILED|❌") {
            Write-Host "   $_" -ForegroundColor Red
        } else {
            Write-Host "   $_" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              DEPLOYMENT COMPLETE!                         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application: https://medarion.africa" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start Vast.ai tunnel: ssh ${sshUser}@${sshHost} '~/vast_tunnel/start_tunnel.sh'" -ForegroundColor White
Write-Host "   2. Test website: https://medarion.africa" -ForegroundColor White
Write-Host "   3. Check logs: ssh ${sshUser}@${sshHost} 'pm2 logs medarion'" -ForegroundColor White
Write-Host ""

# Update state
Update-StepStatus "step7_deploy_server" "completed"

