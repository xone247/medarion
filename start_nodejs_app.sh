#!/bin/bash
# Start Node.js application script for production

cd /home/medasnnc/medarion

# Load environment variables
export NODE_ENV=production
export PORT=3001

# Check if already running
if pgrep -f "node.*server.js" > /dev/null; then
    echo "⚠️  Node.js app is already running"
    pkill -f "node.*server.js"
    sleep 2
fi

# Start the application in background
nohup node server.js > /home/medasnnc/medarion/app.log 2>&1 &

# Get the process ID
APP_PID=$!
echo "✅ Node.js app started with PID: $APP_PID"
echo "📝 Logs: /home/medasnnc/medarion/app.log"
echo "🌐 App should be accessible on port 3001"

# Wait a moment and check if it's running
sleep 3
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application is running successfully"
    echo "PID: $APP_PID"
else
    echo "❌ Application failed to start. Check logs:"
    tail -20 /home/medasnnc/medarion/app.log
    exit 1
fi

