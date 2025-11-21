#!/bin/bash
# Complete Deployment Script - Run on Server
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
PUBLIC_HTML='$publicHtml'
SQL_FILE="medarion_local_export_20251112_034406.sql"

# Step 1: Import Database
echo "1. Importing Database..."
cd /home/medasnnc/medarion
if [ -f "$SQL_FILE" ]; then
    echo "   Importing $SQL_FILE..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1 | grep -v "Warning" | tail -20
    TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N 2>/dev/null)
    echo "   Database imported - $TABLE_COUNT tables"
else
    echo "   SQL file not found: $SQL_FILE"
    ls -la *.sql 2>/dev/null | head -5
fi
echo ""

# Step 2: Install Node.js (if not installed)
echo "2. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "   Installing Node.js 18.x..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
echo "   Node.js: `$NODE_VERSION"
echo ""

# Step 3: Install Dependencies
echo "3. Installing Node.js Dependencies..."
cd "$NODE_APP_PATH/server"
if [ -f "package.json" ]; then
    echo "   Installing production dependencies..."
    npm install --production 2>&1 | tail -30
    echo "   Dependencies installed"
else
    echo "   ⚠️  package.json not found"
fi
echo ""

# Step 4: Install PM2
echo "4. Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "   Installing PM2 globally..."
    npm install -g pm2 2>&1 | tail -10
    echo "   PM2 installed"
else
    PM2_VERSION=$(pm2 --version)
    echo "   PM2 already installed: $PM2_VERSION"
fi
echo ""

# Step 5: Create .env if not exists
echo "5. Ensuring .env file exists..."
cd "`$NODE_APP_PATH"
if [ ! -f ".env" ]; then
    echo "   Creating .env file..."
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=$dbUser
DB_PASSWORD=$dbPass
DB_NAME=$dbName
JWT_SECRET=$(openssl rand -hex 32)
VAST_AI_URL=http://localhost:8081
ENVEOF
    chmod 600 .env
    echo "   .env file created"
else
    echo "   ✅ .env file already exists"
fi
echo ""

# Step 6: Start Application with PM2
echo "6. Starting Application with PM2..."
cd "`$NODE_APP_PATH"
if [ -f "ecosystem.config.js" ]; then
    pm2 stop medarion 2>/dev/null || true
    pm2 delete medarion 2>/dev/null || true
    pm2 start ecosystem.config.js
    sleep 2
    pm2 save
    pm2 startup systemd -u medasnnc --hp /home/medasnnc 2>/dev/null || pm2 startup
    echo "   Application started"
else
    echo "   ⚠️  ecosystem.config.js not found"
fi
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

# Step 8: Configure Apache .htaccess
echo "8. Configuring Apache .htaccess..."
cat > "$PUBLIC_HTML/.htaccess" << 'HTACCESSEOF'
# Enable rewrite engine
RewriteEngine On

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Proxy AI requests
RewriteCond %{REQUEST_URI} ^/api/ai/(.*)$
RewriteRule ^api/ai/(.*)$ http://localhost:3001/api/ai/$1 [P,L]

# Serve frontend files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
HTACCESSEOF

chmod 644 "$PUBLIC_HTML/.htaccess"
echo "   .htaccess configured"
echo ""

# Step 9: Set Permissions
echo "9. Setting File Permissions..."
chown -R medasnnc:medasnnc "$PUBLIC_HTML" 2>/dev/null || true
chown -R medasnnc:medasnnc "$NODE_APP_PATH" 2>/dev/null || true
chmod -R 755 "$PUBLIC_HTML" 2>/dev/null || true
chmod -R 755 "$NODE_APP_PATH" 2>/dev/null || true
echo "   Permissions set"
echo ""

# Step 10: Verify Everything
echo "10. Verifying Deployment..."
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
sleep 2
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "   Application is responding"
    curl -s http://localhost:3001/api/health | head -3
else
    echo "   ⚠️  Application not responding yet"
    echo "   Checking logs..."
    pm2 logs medarion --lines 5 --nostream 2>&1 | tail -5
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