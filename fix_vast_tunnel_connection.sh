#!/bin/bash
# Fix SSH tunnel connection to Vast.ai
# This script tries different connection methods

VAST_IP="194.228.55.129"
DIRECT_PORT=37792
LOCAL_PORT=8081
REMOTE_PORT=8081

echo "🔧 Fixing Vast.ai SSH tunnel connection..."

# Stop existing tunnels
pkill -f "ssh.*8081" 2>/dev/null
sleep 2

# Try connection without key first (password auth)
echo "📡 Testing connection to Vast.ai..."
TEST_OUTPUT=$(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o PasswordAuthentication=yes root@${VAST_IP} -p ${DIRECT_PORT} 'echo "connected"' 2>&1)

if echo "$TEST_OUTPUT" | grep -q "connected"; then
    echo "✅ Connection test successful!"
    echo "📝 Starting tunnel with password authentication..."
    
    # Start tunnel in screen session
    screen -dmS vast_tunnel bash -c "
    while true; do
        ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
            -o StrictHostKeyChecking=no \
            -o ServerAliveInterval=60 \
            -o ServerAliveCountMax=3 \
            -o ExitOnForwardFailure=yes \
            -o ConnectTimeout=10 \
            root@${VAST_IP} -p ${DIRECT_PORT} \
            >> /root/vast_tunnel/tunnel.log 2>&1
        sleep 10
    done
    "
    
    sleep 3
    
    # Check if tunnel process is running
    if ps aux | grep -q "ssh.*8081.*${VAST_IP}"; then
        echo "✅ Tunnel started successfully!"
        echo "   PID: $(ps aux | grep 'ssh.*8081' | grep -v grep | awk '{print $2}' | head -1)"
    else
        echo "⚠️  Tunnel process not found"
    fi
else
    echo "⚠️  Connection test failed"
    echo "   Output: $TEST_OUTPUT"
    echo ""
    echo "📝 Trying alternative: Direct connection with nohup..."
    
    # Alternative: Try with nohup
    nohup ssh -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
        -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        root@${VAST_IP} -p ${DIRECT_PORT} \
        > /root/vast_tunnel/nohup.log 2>&1 &
    
    TUNNEL_PID=$!
    echo "$TUNNEL_PID" > /root/vast_tunnel/tunnel.pid
    
    sleep 3
    
    if ps -p "$TUNNEL_PID" > /dev/null 2>&1; then
        echo "✅ Tunnel started with PID: $TUNNEL_PID"
    else
        echo "❌ Failed to start tunnel"
        echo "   Check logs: cat /root/vast_tunnel/nohup.log"
    fi
fi

echo ""
echo "📝 Testing tunnel connection..."
sleep 2
if curl -s --connect-timeout 5 http://localhost:${LOCAL_PORT}/ping > /dev/null 2>&1; then
    echo "✅ Tunnel connection verified!"
    curl -s http://localhost:${LOCAL_PORT}/ping
else
    echo "⚠️  Tunnel connection test failed"
    echo "   This may be normal if Vast.ai requires interactive authentication"
    echo "   Check: ps aux | grep 'ssh.*8081'"
fi

