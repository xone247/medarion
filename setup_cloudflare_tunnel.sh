#!/bin/bash
# Setup Cloudflare tunnel for Vast.ai API
# This exposes the internal port 8080 publicly

echo "🚀 Setting up Cloudflare Tunnel for Vast.ai API"
echo "================================================"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing cloudflared..."
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    echo "✅ cloudflared installed"
else
    echo "✅ cloudflared already installed"
fi

# Check if API is running
if ! curl -s http://localhost:8080/health > /dev/null; then
    echo "⚠️  API is not running on port 8080"
    echo "   Start the API first: cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &"
    exit 1
fi

echo ""
echo "🌐 Starting Cloudflare tunnel..."
echo "   Internal: http://localhost:8080"
echo "   Public URL will be shown below:"
echo ""

# Start tunnel in background
nohup cloudflared tunnel --url http://localhost:8080 > /tmp/cloudflared.log 2>&1 &

sleep 3

# Extract the public URL from logs
TUNNEL_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/cloudflared.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Tunnel is running!"
    echo "🌐 Public URL: $TUNNEL_URL"
    echo ""
    echo "📝 Update your backend .env:"
    echo "   VAST_AI_URL=$TUNNEL_URL"
    echo ""
    echo "🧪 Test it:"
    echo "   curl $TUNNEL_URL/health"
else
    echo "⚠️  Could not extract URL from logs"
    echo "   Check: tail -20 /tmp/cloudflared.log"
fi

echo ""
echo "💡 To stop tunnel: pkill cloudflared"

