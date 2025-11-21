# Complete cPanel Setup Guide - Quick Start

This is your one-stop guide to getting Medarion fully deployed on cPanel with Node.js support.

## 🎯 What This Setup Does

This setup will prepare and deploy:
1. ✅ **React Frontend** → Served via Apache
2. ✅ **PHP API** → Runs on Apache
3. ✅ **Node.js Backend** → Runs as Node.js application
4. ✅ **Database Configuration** → MySQL setup
5. ✅ **All Configuration Files** → `.htaccess`, environment variables, etc.

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Credentials

1. Copy the config template:
   ```powershell
   Copy-Item cpanel-config.json.example cpanel-config.json
   ```

2. Edit `cpanel-config.json` with your cPanel credentials:
   - FTP/SFTP credentials
   - Database credentials
   - Domain information

### Step 2: Run Complete Setup

Run the master setup script:

```powershell
.\setup_complete_cpanel.ps1
```

This will:
- ✅ Build your frontend
- ✅ Prepare Node.js application
- ✅ Create all necessary configuration files
- ✅ Generate deployment instructions

### Step 3: Deploy to cPanel

#### A. Set Up Node.js in cPanel

1. Log into cPanel
2. Go to: **Software** → **Node.js Selector**
3. Click **"Create Application"**
4. Configure:
   - Node.js Version: `18.x` or `20.x`
   - Application Root: (cPanel will suggest a path - copy it!)
   - Application URL: `/medarion-api`
   - Startup File: `server.js`
   - Port: `3001` (or auto-assigned)

5. **Note the Application Root path** - you'll need it next!

#### B. Deploy Node.js App

```powershell
.\deploy_nodejs_to_cpanel.ps1
```

When prompted, enter the Application Root path from Step A.

#### C. Deploy Frontend & PHP

```powershell
.\deploy_to_cpanel.ps1
```

#### D. Configure Environment Variables

1. In cPanel Node.js Selector, click on your application
2. Go to **Environment Variables**
3. Add these variables (from your `cpanel-config.json`):
   ```
   NODE_ENV=production
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=your_database_name
   DB_USER=your_database_username
   DB_PASSWORD=your_database_password
   CORS_ORIGIN=https://yourdomain.com
   JWT_SECRET=generate-a-random-secret-here
   ```

#### E. Install Dependencies & Start

1. SSH into your server (or use cPanel terminal)
2. Navigate to your Node.js app directory:
   ```bash
   cd /home/username/nodevenv/medarion/18/bin
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. In cPanel Node.js Selector, click **"Start"** on your application

## 📋 Complete Checklist

Use this checklist to ensure everything is set up:

### Pre-Deployment
- [ ] Created `cpanel-config.json` with credentials
- [ ] Verified database exists in cPanel
- [ ] Created database user with proper permissions
- [ ] Ran `setup_complete_cpanel.ps1`

### cPanel Node.js Setup
- [ ] Created Node.js application in Node.js Selector
- [ ] Selected Node.js version 18.x or higher
- [ ] Set Application Root path
- [ ] Set Application URL to `/medarion-api`
- [ ] Set Startup File to `server.js`
- [ ] Noted the Application Root path

### File Deployment
- [ ] Deployed Node.js app using `deploy_nodejs_to_cpanel.ps1`
- [ ] Deployed frontend using `deploy_to_cpanel.ps1`
- [ ] Uploaded `config/database.php` with production credentials
- [ ] Verified `.htaccess` is in place

### Configuration
- [ ] Set all environment variables in Node.js Selector
- [ ] Updated `CORS_ORIGIN` to your production domain
- [ ] Generated strong `JWT_SECRET`
- [ ] Verified database credentials are correct

### Dependencies & Startup
- [ ] Ran `npm install` in Node.js app directory
- [ ] Started Node.js application in cPanel
- [ ] Checked application logs for errors
- [ ] Verified application shows as "Running"

### Testing
- [ ] Tested health endpoint: `https://yourdomain.com/medarion-api/health`
- [ ] Tested API endpoints
- [ ] Verified frontend loads correctly
- [ ] Tested frontend → API communication
- [ ] Verified CORS is working
- [ ] Tested authentication flow

## 🛠️ Individual Scripts Reference

If you need to run steps individually:

| Script | Purpose |
|--------|---------|
| `setup_complete_cpanel.ps1` | Master script - prepares everything |
| `setup_cpanel_nodejs.ps1` | Prepares Node.js app files |
| `deploy_nodejs_to_cpanel.ps1` | Uploads Node.js app to cPanel |
| `deploy_to_cpanel.ps1` | Uploads frontend & PHP to cPanel |
| `quick_sync_cpanel.ps1` | Quick sync for small changes |

## 📖 Detailed Guides

- **Node.js Setup**: `CPANEL_NODEJS_SETUP_GUIDE.md` - Complete Node.js setup guide
- **General Deployment**: `CPANEL_DEPLOYMENT_GUIDE.md` - Full deployment guide
- **Quick Reference**: `README_CPANEL.md` - Quick commands reference
- **Credentials Needed**: `CPANEL_CREDENTIALS_NEEDED.md` - What credentials you need

## 🔧 Troubleshooting

### Node.js App Won't Start

1. Check logs in Node.js Selector
2. Verify environment variables are set
3. Ensure `npm install` was run
4. Check file permissions

### Database Connection Failed

1. Verify database credentials in environment variables
2. Test connection: `mysql -h localhost -u user -p database`
3. Check database user permissions

### CORS Errors

1. Verify `CORS_ORIGIN` matches your frontend domain
2. Check frontend API base URL configuration
3. Review CORS settings in `server.js`

### 404 Errors

1. Verify Application URL in Node.js Selector
2. Check `.htaccess` configuration
3. Ensure application is running

## 🔒 Security Reminders

- ⚠️ Never commit `cpanel-config.json` (already in `.gitignore`)
- ⚠️ Never commit `config/database.php` with real credentials
- ✅ Use strong, random `JWT_SECRET`
- ✅ Enable HTTPS/SSL
- ✅ Keep dependencies updated

## 📞 Need Help?

1. Check the detailed guides listed above
2. Review application logs in cPanel
3. Verify all checklist items are complete
4. Test each component individually (database, Node.js, frontend)

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Node.js app shows "Running" in cPanel
- ✅ Health endpoint responds: `/health`
- ✅ Frontend loads without errors
- ✅ API calls from frontend work
- ✅ Authentication works
- ✅ No errors in browser console
- ✅ No errors in Node.js logs

---

**Ready to start?** Run: `.\setup_complete_cpanel.ps1`

