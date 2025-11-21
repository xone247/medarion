#!/bin/bash
# Setup SSH tunnel to Vast.ai using proxy method
# This may work if direct connection is blocked

VAST_PROXY="ssh7.vast.ai"
PROXY_PORT=31731
LOCAL_PORT=8081
REMOTE_PORT=8081
TUNNEL_DIR="$HOME/vast_tunnel"
TUNNEL_LOG="$TUNNEL_DIR/tunnel.log"
PID_FILE="$TUNNEL_DIR/tunnel.pid"

echo "🔧 Setting up Vast.ai SSH tunnel via proxy..."

# Create tunnel directory
mkdir -p "$TUNNEL_DIR"

# Stop existing tunnels
pkill -f "ssh.*8081" 2>/dev/null
screen -X -S vast_tunnel quit 2>/dev/null
sleep 2

# Create tunnel start script with auto-restart
cat > "$TUNNEL_DIR/start_tunnel.sh" << EOF
#!/bin/bash
VAST_PROXY="${VAST_PROXY}"
PROXY_PORT=${PROXY_PORT}
LOCAL_PORT=${LOCAL_PORT}
REMOTE_PORT=${REMOTE_PORT}
LOG_FILE="${TUNNEL_LOG}"

while true; do
    echo "\$(date): Starting SSH tunnel via proxy..." >> "\$LOG_FILE"
    
    ssh -N -L \${LOCAL_PORT}:localhost:\${REMOTE_PORT} \
        -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -o ConnectTimeout=10 \
        -o PasswordAuthentication=yes \
        root@\${VAST_PROXY} -p \${PROXY_PORT} \
        >> "\$LOG_FILE" 2>&1
    
    EXIT_CODE=\$?
    echo "\$(date): Tunnel exited with code \$EXIT_CODE. Restarting in 10 seconds..." >> "\$LOG_FILE"
    sleep 10
done
EOF

chmod +x "$TUNNEL_DIR/start_tunnel.sh"

# Start tunnel in screen session
echo "🚀 Starting tunnel via proxy in screen session..."
screen -dmS vast_tunnel bash "$TUNNEL_DIR/start_tunnel.sh"

sleep 3

# Get screen PID
SCREEN_PID=$(screen -list | grep vast_tunnel | awk -F'.' '{print $1}' | awk '{print $1}')
if [ -n "$SCREEN_PID" ]; then
    echo "$SCREEN_PID" > "$PID_FILE"
    echo "✅ Tunnel running in screen session 'vast_tunnel' (PID: $SCREEN_PID)"
else
    echo "⚠️  Could not find screen session"
fi

# Wait and test
echo "⏳ Waiting for tunnel to establish..."
sleep 5

# Check if SSH process is running
if ps aux | grep -q "ssh.*8081"; then
    SSH_PID=$(ps aux | grep "ssh.*8081" | grep -v grep | awk '{print $2}' | head -1)
    echo "✅ SSH tunnel process running (PID: $SSH_PID)"
    
    # Test connection
    if curl -s --connect-timeout 5 http://localhost:${LOCAL_PORT}/ping > /dev/null 2>&1; then
        echo "✅ Tunnel connection verified!"
        curl -s http://localhost:${LOCAL_PORT}/ping
    else
        echo "⚠️  Tunnel process running but connection test failed"
        echo "   This may require interactive password entry"
        echo "   View tunnel: screen -r vast_tunnel"
    fi
else
    echo "⚠️  SSH tunnel process not found"
    echo "   Check logs: tail -f $TUNNEL_LOG"
    echo "   View screen: screen -r vast_tunnel"
fi

echo ""
echo "📝 Management:"
echo "   View tunnel: screen -r vast_tunnel"
echo "   Check logs: tail -f $TUNNEL_LOG"
echo "   Stop: screen -X -S vast_tunnel quit"

