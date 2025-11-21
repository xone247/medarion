#!/bin/bash
set -e

NODE_VERSION="18"
USER_NAME="root"

echo "?? Installing Node.js $NODE_VERSION..."

# Check if running as root
if [ $(id -u) -eq 0 ]; then
    IS_ROOT=true
    INSTALL_USER=$USER_NAME
else
    IS_ROOT=false
    INSTALL_USER=$USER
fi

echo "Installing for user: $INSTALL_USER"

# Method 1: Install via cPanel ea-nodejs (if available)
if [ -d "/opt/cpanel/ea-nodejs$NODE_VERSION" ]; then
    echo "? cPanel Node.js $NODE_VERSION already installed"
    NODE_PATH="/opt/cpanel/ea-nodejs$NODE_VERSION/bin"
    export PATH="$NODE_PATH:$PATH"
    node --version
    exit 0
fi

# Method 2: Install using NodeSource repository (requires root)
if [ $IS_ROOT = true ]; then
    echo "Installing Node.js via NodeSource..."
    
    # Install prerequisites
    yum install -y curl
    
    # Install Node.js from NodeSource
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    yum install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    
    echo "? Node.js installed successfully"
    
    # Create symlink for user
    if [ $INSTALL_USER != "root" ]; then
        echo "Setting up for user: $INSTALL_USER"
        # Node.js is now available system-wide
    fi
else
    # Method 3: Install using NVM (for non-root users)
    echo "Installing Node.js via NVM (Node Version Manager)..."
    
    # Install NVM
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    else
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Install Node.js
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
    
    # Verify
    node --version
    npm --version
    
    echo "? Node.js installed via NVM"
    
    # Add to profile
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
    echo "nvm use default" >> ~/.bashrc
fi

echo "? Node.js installation complete!"
