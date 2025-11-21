#!/bin/bash
# Restart API on Vast.ai on public port 38660
# Run this on Vast.ai instance

echo "🛑 Stopping existing API..."
pkill -f 'run_api_on_vast.py' || true
sleep 2

echo "📋 Checking if run_api_on_vast.py exists..."
if [ ! -f "/workspace/run_api_on_vast.py" ]; then
    echo "❌ run_api_on_vast.py not found in /workspace"
    echo "   Please upload it first"
    exit 1
fi

echo "🔍 Verifying port configuration..."
grep -q "PORT = 38660" /workspace/run_api_on_vast.py && echo "✅ Port 38660 configured" || echo "⚠️  Port might not be 38660"

echo "🚀 Starting API on port 38660..."
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &

sleep 3

echo "📊 API Status:"
ps aux | grep run_api_on_vast.py | grep -v grep || echo "❌ API not running"

echo ""
echo "🧪 Testing connection..."
sleep 2
curl -s http://localhost:38660/health && echo "" || echo "⚠️  API not responding yet (may need more time to load model)"

echo ""
echo "✅ API should be running on: http://194.228.55.129:38660"
echo "📝 Check logs: tail -f /workspace/api.log"

