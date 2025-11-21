#!/bin/bash
# Setup persistent SSH tunnel to Vast.ai with auto-restart
# This creates a systemd service or uses screen/tmux for persistence

VAST_IP="194.228.55.129"
DIRECT_PORT=37792
LOCAL_PORT=8081
REMOTE_PORT=8081
TUNNEL_DIR="$HOME/vast_tunnel"
TUNNEL_LOG="$TUNNEL_DIR/tunnel.log"
PID_FILE="$TUNNEL_DIR/tunnel.pid"
SCRIPT_PATH="$TUNNEL_DIR/start_tunnel.sh"

echo "🔧 Setting up persistent Vast.ai SSH tunnel..."

# Create tunnel directory
mkdir -p "$TUNNEL_DIR"

# Create tunnel start script
cat > "$SCRIPT_PATH" << 'EOF'
#!/bin/bash
VAST_IP="194.228.55.129"
DIRECT_PORT=37792
LOCAL_PORT=8081
REMOTE_PORT=8081
LOG_FILE="$HOME/vast_tunnel/tunnel.log"

while true; do
    echo "$(date): Starting SSH tunnel..." >> "$LOG_FILE"
    
    ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
        -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -o ConnectTimeout=10 \
        root@${VAST_IP} -p ${DIRECT_PORT} \
        >> "$LOG_FILE" 2>&1
    
    EXIT_CODE=$?
    echo "$(date): Tunnel exited with code $EXIT_CODE. Restarting in 10 seconds..." >> "$LOG_FILE"
    sleep 10
done
EOF

chmod +x "$SCRIPT_PATH"

# Stop any existing tunnel
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Stopping existing tunnel (PID: $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

# Try to use screen (most common)
if command -v screen > /dev/null 2>&1; then
    echo "✅ Using screen for persistent tunnel..."
    screen -dmS vast_tunnel bash "$SCRIPT_PATH"
    sleep 2
    SCREEN_PID=$(screen -list | grep vast_tunnel | awk -F'.' '{print $1}' | awk '{print $1}')
    if [ -n "$SCREEN_PID" ]; then
        echo "$SCREEN_PID" > "$PID_FILE"
        echo "✅ Tunnel running in screen session 'vast_tunnel'"
        echo "   View: screen -r vast_tunnel"
        echo "   Detach: Ctrl+A then D"
    fi
# Fallback to nohup
elif command -v nohup > /dev/null 2>&1; then
    echo "✅ Using nohup for persistent tunnel..."
    nohup bash "$SCRIPT_PATH" > "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!
    echo "$TUNNEL_PID" > "$PID_FILE"
    echo "✅ Tunnel started with PID: $TUNNEL_PID"
else
    echo "❌ Neither screen nor nohup available"
    exit 1
fi

# Wait and test
sleep 5
if curl -s http://localhost:${LOCAL_PORT}/ping > /dev/null 2>&1; then
    echo "✅ Tunnel connection verified!"
else
    echo "⚠️  Tunnel started but connection test failed"
    echo "   Check logs: tail -f $TUNNEL_LOG"
fi

echo ""
echo "📝 Management commands:"
echo "   Check status: ps aux | grep 'ssh.*${LOCAL_PORT}'"
echo "   View logs: tail -f $TUNNEL_LOG"
echo "   Stop tunnel: kill \$(cat $PID_FILE)"
if command -v screen > /dev/null 2>&1; then
    echo "   View screen: screen -r vast_tunnel"
fi

