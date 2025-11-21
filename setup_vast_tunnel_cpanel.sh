#!/bin/bash
# Setup Vast.ai SSH Tunnel on cPanel
# This creates a local port forward from cPanel to Vast.ai

set -e

echo "🔧 Setting up Vast.ai SSH Tunnel on cPanel..."

# Configuration
# Using Vast.ai proxy SSH connection
VAST_SSH_HOST="ssh2.vast.ai"
VAST_SSH_PORT="14075"
VAST_SSH_USER="root"
LOCAL_PORT="8081"
# Use external port 38660 (mapped to container port 3001)
# Vast.ai only allows specific external ports - 38660 is available
VAST_EXTERNAL_IP="194.228.55.129"
VAST_EXTERNAL_PORT="38660"
SSH_KEY_PATH="/root/.ssh/vast_ai_key"

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at $SSH_KEY_PATH"
    echo "   Please upload your Vast.ai SSH key first"
    exit 1
fi

# Set correct permissions
chmod 600 "$SSH_KEY_PATH"

# Check if tunnel is already running
if pgrep -f "ssh.*$VAST_SSH_HOST.*$LOCAL_PORT.*$VAST_EXTERNAL_IP.*$VAST_EXTERNAL_PORT" > /dev/null; then
    echo "⚠️  Tunnel already running"
    echo "   Stopping existing tunnel..."
    pkill -f "ssh.*$VAST_SSH_HOST.*$LOCAL_PORT.*$VAST_EXTERNAL_IP.*$VAST_EXTERNAL_PORT" || true
    sleep 2
fi

# Start SSH tunnel
# Forward localhost:8081 to Vast.ai external IP:38660
echo "🚀 Starting SSH tunnel..."
echo "   Forwarding: localhost:$LOCAL_PORT → $VAST_EXTERNAL_IP:$VAST_EXTERNAL_PORT"

ssh -i "$SSH_KEY_PATH" \
    -p "$VAST_SSH_PORT" \
    "$VAST_SSH_USER@$VAST_SSH_HOST" \
    -L "$LOCAL_PORT:$VAST_EXTERNAL_IP:$VAST_EXTERNAL_PORT" \
    -N -f \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes

if [ $? -eq 0 ]; then
    echo "✅ SSH tunnel started successfully"
    echo "   Test with: curl http://localhost:$LOCAL_PORT/health"
else
    echo "❌ Failed to start SSH tunnel"
    exit 1
fi

# Test connection
echo ""
echo "🧪 Testing connection..."
sleep 2

if curl -s -f "http://localhost:$LOCAL_PORT/health" > /dev/null; then
    echo "✅ Connection test successful!"
else
    echo "⚠️  Connection test failed (tunnel may still be establishing)"
    echo "   Wait a few seconds and try: curl http://localhost:$LOCAL_PORT/health"
fi

echo ""
echo "📝 Tunnel Status:"
ps aux | grep "ssh.*$VAST_SSH_HOST.*$LOCAL_PORT.*$VAST_EXTERNAL_IP.*$VAST_EXTERNAL_PORT" | grep -v grep || echo "   No tunnel process found"

echo ""
echo "💡 To stop the tunnel:"
echo "   pkill -f 'ssh.*$VAST_SSH_HOST.*$LOCAL_PORT.*$VAST_EXTERNAL_IP.*$VAST_EXTERNAL_PORT'"

