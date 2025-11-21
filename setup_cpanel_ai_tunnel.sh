#!/bin/bash
# Setup Vast.ai SSH Tunnel on cPanel Server
# This script creates a systemd service for persistent AI tunnel

set -e

echo "🚀 Setting up Vast.ai SSH Tunnel on cPanel..."

# Configuration
# Using Vast.ai proxy SSH connection (ssh2.vast.ai:14075)
SSH_KEY="/root/.ssh/vast_ai_key"
VAST_IP="ssh2.vast.ai"
VAST_PORT="14075"
LOCAL_PORT="8081"
REMOTE_PORT="3001"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Create .ssh directory if it doesn't exist
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "⚠️  SSH key not found at: $SSH_KEY"
    echo "📝 Please copy your SSH key to the server first:"
    echo "   scp -P 22 C:\\Users\\xone\\.ssh\\vast_ai_key root@server1.medarion.africa:/root/.ssh/"
    echo ""
    read -p "Press Enter after copying the key, or Ctrl+C to cancel..."
    
    if [ ! -f "$SSH_KEY" ]; then
        echo "❌ SSH key still not found. Exiting."
        exit 1
    fi
fi

# Set correct permissions on SSH key
chmod 600 "$SSH_KEY"
echo "✅ SSH key permissions set"

# Create tunnel script
cat > /usr/local/bin/vast-ai-tunnel.sh << 'TUNNEL_SCRIPT'
#!/bin/bash
# Vast.ai SSH Tunnel
# Connects localhost:8081 to Vast.ai API (port 3001)

SSH_KEY="/root/.ssh/vast_ai_key"
VAST_IP="ssh2.vast.ai"
VAST_PORT="14075"
LOCAL_PORT="8081"
REMOTE_PORT="3001"

# Kill any existing tunnel on this port
if lsof -Pi :${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port ${LOCAL_PORT} is in use. Killing existing process..."
    kill -9 $(lsof -t -i:${LOCAL_PORT}) 2>/dev/null || true
    sleep 2
fi

# Start tunnel in background
ssh -i "$SSH_KEY" \
    -p $VAST_PORT \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
    root@${VAST_IP} &

TUNNEL_PID=$!
echo $TUNNEL_PID > /var/run/vast-ai-tunnel.pid

# Wait a moment to check if tunnel started successfully
sleep 2

if ps -p $TUNNEL_PID > /dev/null; then
    echo "Vast.ai tunnel started (PID: $TUNNEL_PID)"
    echo "Local: localhost:${LOCAL_PORT} -> Remote: ${VAST_IP}:${REMOTE_PORT}"
else
    echo "Failed to start tunnel. Check SSH key and connection."
    exit 1
fi
TUNNEL_SCRIPT

chmod +x /usr/local/bin/vast-ai-tunnel.sh
echo "✅ Tunnel script created"

# Create systemd service
cat > /etc/systemd/system/vast-ai-tunnel.service << 'SERVICE_FILE'
[Unit]
Description=Vast.ai SSH Tunnel for AI API
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/vast-ai-tunnel.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE_FILE

echo "✅ Systemd service file created"

# Reload systemd
systemctl daemon-reload
echo "✅ Systemd reloaded"

# Enable service (start on boot)
systemctl enable vast-ai-tunnel.service
echo "✅ Service enabled (will start on boot)"

# Start service
systemctl start vast-ai-tunnel.service
echo "✅ Service started"

# Wait a moment for tunnel to establish
sleep 3

# Check status
if systemctl is-active --quiet vast-ai-tunnel.service; then
    echo ""
    echo "✅ SUCCESS! Tunnel is running"
    echo ""
    echo "📊 Status:"
    systemctl status vast-ai-tunnel.service --no-pager -l
    echo ""
    echo "🧪 Testing connection..."
    
    # Test tunnel
    if curl -s -f http://localhost:8081/health > /dev/null 2>&1; then
        echo "✅ Tunnel is working! AI API is accessible at http://localhost:8081"
    else
        echo "⚠️  Tunnel started but health check failed. Check logs:"
        echo "   journalctl -u vast-ai-tunnel.service -n 50"
    fi
else
    echo "❌ Service failed to start. Check logs:"
    echo "   journalctl -u vast-ai-tunnel.service -n 50"
    exit 1
fi

echo ""
echo "📋 Useful Commands:"
echo "   Start:   systemctl start vast-ai-tunnel.service"
echo "   Stop:    systemctl stop vast-ai-tunnel.service"
echo "   Status:  systemctl status vast-ai-tunnel.service"
echo "   Logs:    journalctl -u vast-ai-tunnel.service -f"
echo "   Test:    curl http://localhost:8081/health"
echo ""
echo "✅ Setup complete!"

