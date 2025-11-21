#!/bin/bash
# Node.js Installation Script for AlmaLinux 8
# Run this via VNC Console or SSH as root

set -e

echo "🚀 Installing Node.js 18 on AlmaLinux 8..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root"
    echo "   Use: sudo bash $0"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
yum update -y

# Install prerequisites
echo "📦 Installing prerequisites..."
yum install -y curl

# Add NodeSource repository
echo "📦 Adding NodeSource repository..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -

# Install Node.js
echo "📦 Installing Node.js 18..."
yum install -y nodejs

# Verify installation
echo ""
echo "✅ Installation complete!"
echo ""
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Check for cPanel user
if id "medasnnc" &>/dev/null; then
    echo "🔍 Verifying for cPanel user (medasnnc)..."
    su - medasnnc -c "node --version && npm --version"
    echo ""
    echo "✅ Node.js is available for cPanel user"
else
    echo "⚠️  cPanel user 'medasnnc' not found"
fi

echo ""
echo "🎉 Node.js installation complete!"
echo ""
echo "Next steps:"
echo "1. Upload your application files"
echo "2. Create Node.js application in cPanel"
echo "3. Set environment variables"
echo "4. Start the application"
echo ""

