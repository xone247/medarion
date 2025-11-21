#!/bin/bash
# Quick Start Script for cPanel Node.js App
# Run this in your Node.js application directory on cPanel

echo "🚀 Starting Medarion Node.js Application Setup..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "   Please create .env file with your production configuration"
    exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
node -e "
import('./config/database.js').then(async (db) => {
    const connected = await db.testConnection();
    if (connected) {
        console.log('✅ Database connection successful');
        process.exit(0);
    } else {
        console.log('❌ Database connection failed');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
"

if [ True -eq 0 ]; then
    echo "✅ Setup complete! Start your application in cPanel Node.js Selector"
else
    echo "❌ Setup failed. Check the errors above."
    exit 1
fi
