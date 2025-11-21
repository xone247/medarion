#!/bin/bash
# Vast.ai SSH Tunnel
# Connects localhost:8081 to Vast.ai API

SSH_KEY="/root/.ssh/vast_ai_key"
VAST_HOST="ssh7.vast.ai"
VAST_PORT="31731"
LOCAL_PORT="8081"
REMOTE_PORT="8081"

# Kill any existing tunnel on this port
if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi :${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:${LOCAL_PORT}) 2>/dev/null || true
        sleep 2
    fi
elif command -v ss >/dev/null 2>&1; then
    PID=$(ss -tulpn | grep ":${LOCAL_PORT} " | awk '{print $6}' | cut -d= -f2 | cut -d, -f1 | head -1)
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        sleep 2
    fi
fi

# Start tunnel in background
ssh -i "$SSH_KEY" \
    -p $VAST_PORT \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
    root@${VAST_HOST} &

TUNNEL_PID=$!
echo $TUNNEL_PID > /var/run/vast-ai-tunnel.pid

# Wait a moment to check if tunnel started successfully
sleep 3

if ps -p $TUNNEL_PID > /dev/null 2>&1; then
    echo "Tunnel started (PID: $TUNNEL_PID)"
    echo "Local: localhost:${LOCAL_PORT} -> Remote: ${VAST_HOST}:${REMOTE_PORT}"
else
    echo "Failed to start tunnel"
    exit 1
fi

