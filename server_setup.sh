#!/bin/bash
# Automated Node.js Setup Script
# This script runs on the server to set up Node.js application

set -e

APP_NAME="medarion"
NODE_VERSION="18"
APP_URL="/medarion-api"
USER_NAME="medasnnc"
APP_PATH="/home/medasnnc/nodevenv/${APP_NAME}/${NODE_VERSION}/bin"

echo "?? Setting up Node.js application..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "??  Node.js not found in PATH"
    echo "   Please install Node.js via cPanel Node.js Selector first"
    echo "   Or use: /opt/cpanel/ea-nodejs${NODE_VERSION}/bin/node"
    exit 1
fi

# Create application directory
echo "?? Creating application directory..."
mkdir -p $APP_PATH
cd $APP_PATH

# Set permissions
chown -R $USER_NAME:$USER_NAME $APP_PATH
chmod -R 755 $APP_PATH

echo "? Application directory created: $APP_PATH"
echo ""
echo "?? Next: Upload files and create app in cPanel Node.js Selector"
echo "   Application Root: $APP_PATH"
echo "   Application URL: $APP_URL"
echo "   Startup File: server.js"
