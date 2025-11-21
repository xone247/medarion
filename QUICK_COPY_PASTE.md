# Quick Copy & Paste - cPanel Setup

Everything is prepared! Use cPanel to complete setup.

## 🔐 Step 1: Install Node.js via cPanel

1. **Log into cPanel**: https://66.29.131.252:2083/cpsess0590300498/
2. **Go to**: Software → Node.js Selector
3. **Click**: "Install Node.js Version"
4. **Select**: Node.js 18.x
5. **Click**: "Install"

## 📁 Step 2: Upload Files via cPanel

1. **Go to**: Files → File Manager
2. **Navigate to**: `/home/medasnnc/nodevenv/medarion/18/bin/`
3. **Upload**: All files from `cpanel-nodejs-app/` folder
4. **Navigate to**: `public_html/`
5. **Upload**: All files from `medarion-dist/` folder
6. **Create folder**: `public_html/api/` and upload files from `api/` folder
7. **Create folder**: `public_html/config/` and upload `config/database.php` and `.htaccess`

## 📦 Step 3: Install Dependencies

**Use cPanel Terminal:**
1. **Go to**: Advanced → Terminal
2. **Run**: `cd ~/nodevenv/medarion/18/bin && npm install`

## 🎯 Step 4: cPanel Setup

1. Go to: https://medarion.africa:2083
2. Software → Node.js Selector → Create Application
3. Settings:
   - Root: `/home/medasnnc/nodevenv/medarion/18/bin`
   - URL: `/medarion-api`
   - File: `server.js`
4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=medasnnc_medarion
   DB_USER=medasnnc_medarion
   DB_PASSWORD=Neorage94
   CORS_ORIGIN=https://medarion.africa
   JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
   ```
5. Click "Start"

## ✅ Done!

Test: https://medarion.africa/medarion-api/health
