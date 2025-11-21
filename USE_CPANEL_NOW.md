# 🚀 Use cPanel Now - Complete Setup Guide

You have cPanel access! Here's the fastest way to complete your setup.

## 🔗 Your cPanel Access

**cPanel URL**: https://medarion.africa:2083
- **Username**: medasnnc
- **Password**: Neorage94

**WHM URL**: https://medarion.africa:2087
- **Username**: root
- **Password**: Neorage94

## ⚡ Fastest Setup Method (Using cPanel)

### Method 1: Complete via cPanel Interface (Easiest)

#### Step 1: Install Node.js

1. **Log into cPanel**: https://medarion.africa:2083
2. **Go to**: Software → Node.js Selector
3. **Click**: "Install Node.js Version"
4. **Select**: Node.js 18.x
5. **Click**: "Install"

#### Step 2: Upload Files via File Manager

1. **Go to**: Files → File Manager

2. **Create Node.js App Directory**:
   - Navigate to `/home/medasnnc/`
   - Create: `nodevenv/medarion/18/bin/`
   - Or navigate there directly

3. **Upload Node.js App**:
   - Go to `nodevenv/medarion/18/bin/`
   - Click "Upload"
   - Select all files from your local `cpanel-nodejs-app/` folder
   - Or zip the folder first, upload, then extract

4. **Upload Frontend**:
   - Navigate to `public_html/`
   - Upload all files from `medarion-dist/` folder

5. **Upload API**:
   - Create folder: `public_html/api/`
   - Upload all files from `api/` folder

6. **Upload Config**:
   - Create folder: `public_html/config/`
   - Upload `config/database.php`
   - Upload `.htaccess` to `public_html/`

#### Step 3: Install Dependencies

**Option A: Via Terminal in cPanel**
1. **Go to**: Advanced → Terminal
2. **Run**:
   ```bash
   cd ~/nodevenv/medarion/18/bin
   npm install
   ```

**Option B: Via SSH** (if Terminal not available)
```powershell
ssh medasnnc@medarion.africa
cd ~/nodevenv/medarion/18/bin
npm install
```

#### Step 4: Create Node.js Application

1. **Go to**: Software → Node.js Selector
2. **Click**: "Create Application"
3. **Settings**:
   ```
   Node.js Version: 18.x
   Application Root: /home/medasnnc/nodevenv/medarion/18/bin
   Application URL: /medarion-api
   Startup File: server.js
   Port: 3001
   ```
4. **Click**: "Create"

#### Step 5: Set Environment Variables

1. **Click on your application** in Node.js Selector
2. **Go to**: "Environment Variables"
3. **Add these** (one by one, click "Add Variable" each time):

   ```
   NODE_ENV = production
   PORT = 3001
   DB_HOST = localhost
   DB_PORT = 3306
   DB_NAME = medasnnc_medarion
   DB_USER = medasnnc_medarion
   DB_PASSWORD = Neorage94
   CORS_ORIGIN = https://medarion.africa
   JWT_SECRET = QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
   ```

4. **Save** after adding each variable

#### Step 6: Start Application

1. In Node.js Selector, find your application
2. **Click**: "Start"
3. **Check**: Status should show "Running"
4. **View Logs**: Click "Logs" to verify no errors

#### Step 7: Test

- **Frontend**: https://medarion.africa
- **API**: https://medarion.africa/medarion-api/health

## 📦 What Files to Upload

### Node.js App (`cpanel-nodejs-app/` folder)
**Upload to**: `/home/medasnnc/nodevenv/medarion/18/bin/`

Contains:
- `server.js`
- `package.json`
- `.env`
- `config/` folder
- `routes/` folder
- All other server files

### Frontend (`medarion-dist/` folder)
**Upload to**: `public_html/`

Contains:
- `index.html`
- `assets/` folder
- All built React files

### API (`api/` folder)
**Upload to**: `public_html/api/`

Contains:
- All PHP API files

### Config Files
- `config/database.php` → `public_html/config/`
- `.htaccess` → `public_html/`

## 🎯 Quick Checklist

- [ ] Node.js installed (18.x)
- [ ] Node.js app files uploaded
- [ ] Frontend files uploaded
- [ ] API files uploaded
- [ ] Config files uploaded
- [ ] Dependencies installed (`npm install`)
- [ ] Application created in Node.js Selector
- [ ] Environment variables set
- [ ] Application started
- [ ] Tested frontend and API

## 💡 Pro Tips

1. **Zip files first**: If uploading many files, zip them first, upload zip, then extract in File Manager
2. **Use Terminal**: cPanel Terminal is faster than SSH for quick commands
3. **Check logs**: Always check application logs if something doesn't work
4. **File permissions**: Usually auto-set, but if issues, set to 755 for folders, 644 for files

## 🐛 Common Issues

### Files not uploading?
- Check file size limits
- Try FTP instead: `ftp.medarion.africa` (username: medarion@medarion.africa)

### Application won't start?
- Check logs in Node.js Selector
- Verify all environment variables are set
- Ensure `server.js` exists

### Dependencies fail?
- Check Node.js version matches
- Try: `npm cache clean --force` then `npm install`

## 🎉 You're Ready!

All your files are prepared locally. Just upload them via cPanel and follow the steps above!

---

**Quick Start**: Log into cPanel → File Manager → Upload files → Node.js Selector → Create App → Start!

