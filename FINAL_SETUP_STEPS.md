# Final Setup Steps - Using cPanel

You have cPanel access! Here's how to complete the setup using the cPanel interface.

## 🎯 Quick Setup via cPanel

### Step 1: Install Node.js (if not done)

1. **Log into cPanel**: https://medarion.africa:2083
   - Username: medasnnc
   - Password: Neorage94

2. **Go to**: Software → Node.js Selector

3. **Click**: "Install Node.js Version"

4. **Select**: Node.js 18.x (or latest LTS)

5. **Click**: "Install"

### Step 2: Upload Files via File Manager

1. **Go to**: Files → File Manager

2. **Navigate to**: `/home/medasnnc/nodevenv/medarion/18/bin`
   - Create directories if they don't exist

3. **Upload Node.js App**:
   - Click "Upload" in File Manager
   - Upload all files from `cpanel-nodejs-app/` folder
   - Or use "Extract" if you zip the folder first

4. **Navigate to**: `public_html/`

5. **Upload Frontend**:
   - Upload all files from `medarion-dist/` folder

6. **Create API directory**:
   - Create folder: `public_html/api/`
   - Upload all files from `api/` folder

7. **Upload Config**:
   - Create folder: `public_html/config/`
   - Upload `config/database.php`
   - Upload `.htaccess` to `public_html/`

### Step 3: Install Dependencies

**Option A: Via SSH** (Recommended)
```bash
ssh medasnnc@medarion.africa
cd ~/nodevenv/medarion/18/bin
npm install
```

**Option B: Via cPanel Terminal**
1. Go to: Advanced → Terminal
2. Run:
   ```bash
   cd ~/nodevenv/medarion/18/bin
   npm install
   ```

### Step 4: Create Node.js Application

1. **Go to**: Software → Node.js Selector

2. **Click**: "Create Application"

3. **Fill in**:
   - **Node.js Version**: 18.x
   - **Application Root**: `/home/medasnnc/nodevenv/medarion/18/bin`
   - **Application URL**: `/medarion-api`
   - **Startup File**: `server.js`
   - **Load App File**: `server.js`
   - **Application Port**: `3001` (or auto-assigned)

4. **Click**: "Create"

### Step 5: Set Environment Variables

1. In Node.js Selector, **click on your application**

2. **Go to**: "Environment Variables" section

3. **Add each variable** (click "Add Variable" for each):

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

4. **Click**: "Save" after adding each variable

### Step 6: Start Application

1. In Node.js Selector, find your application

2. **Click**: "Start" button

3. **Check status**: Should show "Running"

4. **View logs**: Click "Logs" to see if there are any errors

### Step 7: Test Your Application

- **Frontend**: https://medarion.africa
- **API Health**: https://medarion.africa/medarion-api/health
- **API Base**: https://medarion.africa/medarion-api

## 📋 Alternative: Upload via FTP

If File Manager is slow, use FTP:

1. **Use FileZilla** or similar FTP client
2. **Connect to**:
   - Host: ftp.medarion.africa
   - Username: medarion@medarion.africa
   - Password: Neorage94
   - Port: 21

3. **Upload files** to same locations as above

## ✅ Verification Checklist

After setup:

- [ ] Node.js installed (check in Node.js Selector)
- [ ] Files uploaded to correct locations
- [ ] Dependencies installed (`npm install` completed)
- [ ] Application created in Node.js Selector
- [ ] Environment variables set
- [ ] Application started (shows "Running")
- [ ] Frontend loads: https://medarion.africa
- [ ] API responds: https://medarion.africa/medarion-api/health

## 🐛 Troubleshooting

### Application won't start:
- Check logs in Node.js Selector
- Verify environment variables are correct
- Ensure `server.js` exists in application root
- Check that port is not in use

### Files not uploading:
- Check file permissions
- Verify disk space: `df -h` (via Terminal)
- Try FTP instead of File Manager

### Dependencies not installing:
- Check Node.js version: `node --version`
- Verify npm is available: `npm --version`
- Check internet connection on server

## 🎉 You're Almost Done!

Once all steps are complete, your application will be live!

---

**Need help?** All your files are prepared locally. Just upload them via cPanel File Manager or FTP!

