#!/bin/bash
# Setup persistent SSH tunnel to Vast.ai on production server
# This script sets up an SSH tunnel that runs in the background

VAST_IP="194.228.55.129"
VAST_PROXY="ssh7.vast.ai"
DIRECT_PORT=37792
PROXY_PORT=31731
LOCAL_PORT=8081
REMOTE_PORT=8081
SSH_KEY_PATH="$HOME/.ssh/vast_ai_key"
TUNNEL_LOG="$HOME/vast_tunnel.log"
PID_FILE="$HOME/vast_tunnel.pid"

echo "🔧 Setting up Vast.ai SSH tunnel..."

# Check if tunnel is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Tunnel already running with PID: $OLD_PID"
        echo "   Stopping existing tunnel..."
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

# Try direct connection first, fallback to proxy
echo "📡 Attempting direct connection to $VAST_IP:$DIRECT_PORT..."

# Use nohup to run tunnel in background
nohup ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    root@${VAST_IP} -p ${DIRECT_PORT} \
    > "$TUNNEL_LOG" 2>&1 &

TUNNEL_PID=$!
echo $TUNNEL_PID > "$PID_FILE"

sleep 3

# Check if tunnel is working
if ps -p "$TUNNEL_PID" > /dev/null 2>&1; then
    echo "✅ SSH tunnel started with PID: $TUNNEL_PID"
    echo "   Log file: $TUNNEL_LOG"
    echo "   PID file: $PID_FILE"
    
    # Test connection
    sleep 2
    if curl -s http://localhost:${LOCAL_PORT}/ping > /dev/null 2>&1; then
        echo "✅ Tunnel connection verified!"
    else
        echo "⚠️  Tunnel started but connection test failed"
        echo "   Check logs: tail -f $TUNNEL_LOG"
    fi
else
    echo "❌ Failed to start tunnel"
    echo "   Check logs: cat $TUNNEL_LOG"
    rm -f "$PID_FILE"
    exit 1
fi

echo ""
echo "📝 To check tunnel status:"
echo "   ps aux | grep 'ssh.*${LOCAL_PORT}'"
echo ""
echo "📝 To stop tunnel:"
echo "   kill \$(cat $PID_FILE)"
echo ""
echo "📝 To view logs:"
echo "   tail -f $TUNNEL_LOG"

