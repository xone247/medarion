#!/bin/bash
# Setup Reverse SSH Tunnel from Vast.ai to cPanel
# Run this on the Vast.ai instance

CPANEL_HOST="server1.medarion.africa"
CPANEL_PORT="22"
CPANEL_USER="root"
LOCAL_PORT="3001"  # Vast.ai API port
REMOTE_PORT="8081" # Port on cPanel

echo "Setting up reverse SSH tunnel..."
echo "Vast.ai:localhost:$LOCAL_PORT -> cPanel:localhost:$REMOTE_PORT"

# Test connection first
echo "Testing connection to cPanel..."
if ssh -p $CPANEL_PORT -o ConnectTimeout=10 -o StrictHostKeyChecking=no $CPANEL_USER@$CPANEL_HOST 'echo "Connection successful"' 2>/dev/null; then
    echo "✅ Connection test passed"
    
    # Start tunnel
    echo "Starting reverse tunnel..."
    ssh -R ${REMOTE_PORT}:localhost:${LOCAL_PORT} \
        -p $CPANEL_PORT \
        -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -N -f \
        $CPANEL_USER@$CPANEL_HOST
    
    if [ $? -eq 0 ]; then
        echo "✅ Reverse tunnel started successfully"
        echo "cPanel can now access Vast.ai API at http://localhost:$REMOTE_PORT"
    else
        echo "❌ Failed to start tunnel"
        exit 1
    fi
else
    echo "❌ Cannot connect to cPanel. Check:"
    echo "   1. SSH access from Vast.ai to cPanel is allowed"
    echo "   2. Firewall rules on cPanel"
    echo "   3. SSH key or password authentication"
    exit 1
fi
