# 🚀 Direct cPanel Access - Quick Start

## 🔗 Your cPanel Direct Access URL

**cPanel Session URL:**
```
https://66.29.131.252:2083/cpsess0590300498/
```

**Note:** Session URLs expire after inactivity. For permanent access, use:
- **Standard URL**: https://medarion.africa:2083
- **IP URL**: http://66.29.131.252:2083
- **Username**: medasnnc
- **Password**: Neorage94

## ⚡ Quick Setup Steps

### Step 1: Access cPanel

**Click this link or copy to browser:**
```
https://66.29.131.252:2083/cpsess0590300498/
```

### Step 2: Install Node.js

1. **Click**: Software → Node.js Selector
2. **Click**: "Install Node.js Version"
3. **Select**: Node.js 18.x
4. **Click**: "Install"

### Step 3: Upload Files

**Go to**: Files → File Manager

#### Upload Node.js App:
1. Navigate to: `/home/medasnnc/nodevenv/medarion/18/bin/`
   - Create directories if needed
2. Click "Upload"
3. Upload all files from `cpanel-nodejs-app/` folder
   - Or zip the folder, upload zip, then extract

#### Upload Frontend:
1. Navigate to: `public_html/`
2. Upload all files from `medarion-dist/` folder

#### Upload API:
1. Navigate to: `public_html/`
2. Create folder: `api/`
3. Upload all files from `api/` folder

#### Upload Config:
1. Navigate to: `public_html/`
2. Create folder: `config/`
3. Upload `config/database.php`
4. Upload `.htaccess` to `public_html/`

### Step 4: Install Dependencies

**Go to**: Advanced → Terminal

Run:
```bash
cd ~/nodevenv/medarion/18/bin
npm install
```

### Step 5: Create Node.js Application

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

### Step 6: Set Environment Variables

1. **Click on your application** in Node.js Selector
2. **Go to**: "Environment Variables"
3. **Add these** (click "Add Variable" for each):

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

### Step 7: Start Application

1. In Node.js Selector, find your application
2. **Click**: "Start"
3. **Check**: Status should show "Running"

### Step 8: Test

- **Frontend**: https://medarion.africa
- **API**: https://medarion.africa/medarion-api/health

## 📋 Quick Links in cPanel

Once logged in, you'll need these sections:

- **Files** → File Manager (upload files)
- **Software** → Node.js Selector (install Node.js, create app)
- **Advanced** → Terminal (run npm install)
- **Databases** → MySQL Databases (verify database)

## 🎯 What Files to Upload

### From Your Local Machine:

1. **`cpanel-nodejs-app/`** folder
   - Upload to: `/home/medasnnc/nodevenv/medarion/18/bin/`

2. **`medarion-dist/`** folder
   - Upload to: `public_html/`

3. **`api/`** folder
   - Upload to: `public_html/api/`

4. **`config/database.php`**
   - Upload to: `public_html/config/`

5. **`.htaccess`**
   - Upload to: `public_html/`

## 💡 Pro Tips

1. **Zip large folders**: If uploading many files, zip them first
2. **Use Extract**: Upload zip file, then use "Extract" in File Manager
3. **Check permissions**: Files should be 644, folders 755
4. **View logs**: Check application logs in Node.js Selector if issues

## ✅ Checklist

- [ ] Node.js 18.x installed
- [ ] Node.js app files uploaded
- [ ] Frontend files uploaded
- [ ] API files uploaded
- [ ] Config files uploaded
- [ ] Dependencies installed
- [ ] Application created
- [ ] Environment variables set
- [ ] Application started
- [ ] Tested successfully

## 🚀 You're Ready!

**Click here to start**: https://66.29.131.252:2083/cpsess0590300498/

Then follow the steps above. All your files are prepared and ready to upload!

---

**Need help?** See `USE_CPANEL_NOW.md` for detailed instructions.

