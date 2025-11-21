#!/bin/bash
# Setup persistent SSH tunnel from cPanel to Vast.ai
# This script should be run on cPanel server

set -e

echo "====================================================================="
echo "🔗 Setting up SSH Tunnel from cPanel to Vast.ai"
echo "====================================================================="

# Configuration
VAST_SSH_KEY="$HOME/.ssh/id_ed25519_vast"
VAST_SSH_PORT=31216
VAST_SSH_HOST="ssh1.vast.ai"
VAST_REMOTE_PORT=3001
LOCAL_PORT=3001
SERVICE_NAME="vast-ai-tunnel"
SERVICE_USER=$(whoami)

# Check if SSH key exists
if [ ! -f "$VAST_SSH_KEY" ]; then
    echo "❌ SSH key not found at: $VAST_SSH_KEY"
    echo "💡 Please upload your SSH key first"
    exit 1
fi

# Set correct permissions
chmod 600 "$VAST_SSH_KEY"

# Create systemd service for persistent tunnel
echo ""
echo "📝 Creating systemd service..."

sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=SSH Tunnel to Vast.ai for AI API
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
ExecStart=/usr/bin/ssh -i ${VAST_SSH_KEY} -p ${VAST_SSH_PORT} -N -L ${LOCAL_PORT}:localhost:${VAST_REMOTE_PORT} root@${VAST_SSH_HOST} -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable service
echo "✅ Enabling service..."
sudo systemctl enable ${SERVICE_NAME}

# Start service
echo "🚀 Starting tunnel..."
sudo systemctl start ${SERVICE_NAME}

# Wait a moment
sleep 3

# Check status
echo ""
echo "📊 Service Status:"
sudo systemctl status ${SERVICE_NAME} --no-pager -l | head -15

# Test connection
echo ""
echo "🧪 Testing connection..."
sleep 2
if curl -s http://localhost:${LOCAL_PORT}/health > /dev/null 2>&1; then
    echo "✅ Tunnel is working! Health check passed."
    curl -s http://localhost:${LOCAL_PORT}/health | jq . 2>/dev/null || curl -s http://localhost:${LOCAL_PORT}/health
else
    echo "⚠️  Tunnel started but health check failed. Check logs:"
    echo "   sudo journalctl -u ${SERVICE_NAME} -n 20"
fi

echo ""
echo "====================================================================="
echo "✅ Setup Complete!"
echo "====================================================================="
echo ""
echo "📋 Service Management:"
echo "   Start:   sudo systemctl start ${SERVICE_NAME}"
echo "   Stop:    sudo systemctl stop ${SERVICE_NAME}"
echo "   Status:  sudo systemctl status ${SERVICE_NAME}"
echo "   Logs:    sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "🌐 API URL for your application:"
echo "   http://localhost:${LOCAL_PORT}"
echo ""
echo "💡 Update your .env file with:"
echo "   VAST_AI_URL=http://localhost:${LOCAL_PORT}"
echo ""

