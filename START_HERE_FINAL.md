# 🎯 START HERE - Final Setup Guide

## ✅ Everything is Prepared!

All your files are ready locally. Now complete the setup in cPanel.

## 🔗 Access cPanel Now

**Direct Link:**
```
https://66.29.131.252:2083/cpsess0590300498/
```

**Or use standard login:**
- URL: https://medarion.africa:2083
- Username: medasnnc
- Password: Neorage94

## ⚡ 5-Minute Setup

### 1️⃣ Install Node.js (1 min)
- cPanel → Software → Node.js Selector
- Click "Install Node.js Version"
- Select 18.x → Install

### 2️⃣ Upload Files (2 min)
- cPanel → Files → File Manager
- Upload `cpanel-nodejs-app/` to `/home/medasnnc/nodevenv/medarion/18/bin/`
- Upload `medarion-dist/` to `public_html/`
- Upload `api/` to `public_html/api/`
- Upload `config/database.php` to `public_html/config/`
- Upload `.htaccess` to `public_html/`

### 3️⃣ Install Dependencies (1 min)
- cPanel → Advanced → Terminal
- Run: `cd ~/nodevenv/medarion/18/bin && npm install`

### 4️⃣ Create Application (1 min)
- cPanel → Software → Node.js Selector
- Click "Create Application"
- Settings:
  - Root: `/home/medasnnc/nodevenv/medarion/18/bin`
  - URL: `/medarion-api`
  - File: `server.js`
- Add Environment Variables (see below)
- Click "Start"

## 🔐 Environment Variables

Add these in Node.js Selector → Your App → Environment Variables:

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

## ✅ Test

- Frontend: https://medarion.africa
- API: https://medarion.africa/medarion-api/health

## 📚 Detailed Guides

- `CPANEL_DIRECT_ACCESS.md` - Complete cPanel setup
- `USE_CPANEL_NOW.md` - Detailed instructions
- `COMPLETE_MANUAL_SETUP.md` - Alternative methods

---

**Ready?** Click the cPanel link above and start uploading files! 🚀

