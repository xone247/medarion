#!/bin/bash
# Setup Node.js Application as Systemd Service
# This script creates a systemd service to run the Node.js app on cPanel

set -e

echo "🚀 Setting up Node.js Application as Systemd Service..."

# Configuration
APP_DIR="/home/medasnnc/nodevenv/medarion/18/bin"
APP_USER="medasnnc"
APP_NAME="medarion-api"
SERVICE_NAME="medarion-api"
PORT="3001"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ App directory not found: $APP_DIR"
    exit 1
fi

# Check if server.js exists
if [ ! -f "$APP_DIR/server.js" ]; then
    echo "❌ server.js not found in $APP_DIR"
    exit 1
fi

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  .env file not found. Creating default .env..."
    cat > "$APP_DIR/.env" << 'EOF'
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
    chown $APP_USER:$APP_USER "$APP_DIR/.env"
    echo "✅ .env file created"
fi

# Install PM2 globally (better process management)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Create PM2 ecosystem file
cat > "$APP_DIR/ecosystem.config.js" << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'medarion-api',
    script: './server.js',
    cwd: '/home/medasnnc/nodevenv/medarion/18/bin',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/medasnnc/nodevenv/medarion/18/bin/logs/error.log',
    out_file: '/home/medasnnc/nodevenv/medarion/18/bin/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
ECOSYSTEM

chown $APP_USER:$APP_USER "$APP_DIR/ecosystem.config.js"
mkdir -p "$APP_DIR/logs"
chown -R $APP_USER:$APP_USER "$APP_DIR/logs"

# Create systemd service for PM2
cat > /etc/systemd/system/${SERVICE_NAME}.service << 'SERVICE'
[Unit]
Description=Medarion API Node.js Application
After=network.target

[Service]
Type=forking
User=medasnnc
WorkingDirectory=/home/medasnnc/nodevenv/medarion/18/bin
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

# Alternative: Direct Node.js systemd service (if PM2 not preferred)
cat > /etc/systemd/system/${SERVICE_NAME}-direct.service << 'SERVICE_DIRECT'
[Unit]
Description=Medarion API Node.js Application (Direct)
After=network.target

[Service]
Type=simple
User=medasnnc
WorkingDirectory=/home/medasnnc/nodevenv/medarion/18/bin
EnvironmentFile=/home/medasnnc/nodevenv/medarion/18/bin/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE_DIRECT

echo "✅ Systemd service files created"

# Reload systemd
systemctl daemon-reload
echo "✅ Systemd reloaded"

# Enable service (start on boot)
systemctl enable ${SERVICE_NAME}.service
echo "✅ Service enabled (will start on boot)"

# Start service
systemctl start ${SERVICE_NAME}.service
echo "✅ Service started"

# Wait a moment
sleep 3

# Check status
if systemctl is-active --quiet ${SERVICE_NAME}.service; then
    echo ""
    echo "✅ SUCCESS! Application is running"
    echo ""
    echo "📊 Status:"
    systemctl status ${SERVICE_NAME}.service --no-pager -l | head -15
    echo ""
    echo "🧪 Testing application..."
    
    # Test health endpoint
    if curl -s -f http://localhost:${PORT}/health > /dev/null 2>&1; then
        echo "✅ Application is responding at http://localhost:${PORT}/health"
    else
        echo "⚠️  Application started but health check failed. Check logs:"
        echo "   journalctl -u ${SERVICE_NAME}.service -n 50"
    fi
else
    echo "❌ Service failed to start. Check logs:"
    echo "   journalctl -u ${SERVICE_NAME}.service -n 50"
    exit 1
fi

echo ""
echo "📋 Useful Commands:"
echo "   Start:   systemctl start ${SERVICE_NAME}.service"
echo "   Stop:    systemctl stop ${SERVICE_NAME}.service"
echo "   Restart: systemctl restart ${SERVICE_NAME}.service"
echo "   Status:  systemctl status ${SERVICE_NAME}.service"
echo "   Logs:    journalctl -u ${SERVICE_NAME}.service -f"
echo "   Test:    curl http://localhost:${PORT}/health"
echo ""
echo "💡 Alternative: Use PM2 directly"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "✅ Setup complete!"

