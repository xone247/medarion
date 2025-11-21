#!/bin/bash
# Complete Deployment Steps
# Run this script on the server via SSH

echo "=== Completing Deployment ==="

# Step 1: Import Database
echo "1. Importing database..."
cd /home/medasnnc/medarion
if [ -f medarion_local_export_20251112_034406.sql ]; then
    mysql -u medasnnc_medarion -p'Neorage94' medasnnc_medarion < medarion_local_export_20251112_034406.sql 2>&1 | head -20
    echo "Database import completed"
else
    echo "SQL file not found"
fi

# Step 2: Install Dependencies
echo ""
echo "2. Installing Node.js dependencies..."
cd /home/medasnnc/nodevenv/medarion/18/server
npm install --production 2>&1 | tail -20

# Step 3: Install PM2
echo ""
echo "3. Installing PM2..."
npm install -g pm2 2>&1 | tail -5

# Step 4: Start Application
echo ""
echo "4. Starting application with PM2..."
cd /home/medasnnc/nodevenv/medarion/18
pm2 stop medarion 2>/dev/null || true
pm2 delete medarion 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 5: Verify
echo ""
echo "5. Verifying deployment..."
echo "=== Node.js ==="
node --version
echo ""
echo "=== PM2 Status ==="
pm2 list
echo ""
echo "=== Application Status ==="
pm2 status medarion
echo ""
echo "=== Database Tables ==="
mysql -u medasnnc_medarion -p'Neorage94' medasnnc_medarion -e "SHOW TABLES;" | head -10

echo ""
echo "=== Deployment Complete ==="
