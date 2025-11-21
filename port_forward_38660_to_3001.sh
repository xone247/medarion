#!/bin/bash
# Port Forward: Public 38660 -> Internal 3001
# This allows API to run on 3001 internally while being accessible on 38660 publicly

echo "🔧 Setting up port forwarding: 38660 -> 3001"

# Kill any existing forwarder
pkill -f 'socat.*38660' || pkill -f 'port.*forward.*38660' || true
sleep 1

# Check if socat is installed
if ! command -v socat &> /dev/null; then
    echo "📦 Installing socat..."
    apt-get update -qq && apt-get install -y -qq socat > /dev/null 2>&1
fi

# Check if port 3001 is in use (API should be running)
if ! lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Warning: Port 3001 is not in use. Make sure API is running on port 3001 first!"
    echo "   Start API: cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &"
    exit 1
fi

# Kill anything on port 38660
echo "🛑 Clearing port 38660..."
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null || true
sleep 1

# Start port forwarder
echo "🚀 Starting port forward: 38660 -> 3001"
nohup socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001 > /dev/null 2>&1 &

sleep 2

# Verify forwarder is running
if ps aux | grep -v grep | grep -q 'socat.*38660'; then
    echo "✅ Port forwarder started successfully!"
    echo "   External: http://194.228.55.129:38660"
    echo "   Internal: http://localhost:3001"
    echo ""
    echo "📊 Status:"
    ps aux | grep -v grep | grep 'socat.*38660'
else
    echo "❌ Port forwarder failed to start"
    exit 1
fi

echo ""
echo "🧪 Testing connection..."
sleep 1
curl -s http://localhost:38660/health && echo "" || echo "⚠️  API not responding yet (may still be loading)"

