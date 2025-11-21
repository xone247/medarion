# Node.js Installation and Setup Guide for cPanel

This guide explains how to install Node.js and set up your application on cPanel.

## 🎯 Two Approaches

### Approach 1: Automated Setup (Recommended)

Run the automated setup script:

```powershell
.\auto_setup_nodejs_cpanel.ps1
```

This will:
- ✅ Prepare application files
- ✅ Create application directory on server
- ✅ Upload all files
- ✅ Install dependencies
- ✅ Provide instructions for final cPanel setup

### Approach 2: Step-by-Step Setup

Run the step-by-step script:

```powershell
.\install_and_setup_nodejs.ps1
```

This guides you through each step with more control.

## 📋 Manual Installation (If Scripts Don't Work)

### Step 1: Install Node.js via cPanel

1. **Log into cPanel**: https://medarion.africa:2083
2. **Go to**: Software → Node.js Selector
3. **Click**: "Install Node.js Version"
4. **Select**: Node.js 18.x or 20.x (latest LTS)
5. **Click**: "Install"

### Step 2: Create Application Directory

SSH into your server:

```powershell
ssh medasnnc@medarion.africa
# Password: Neorage94
```

Create directory:

```bash
mkdir -p ~/nodevenv/medarion/18/bin
cd ~/nodevenv/medarion/18/bin
```

### Step 3: Prepare Application Locally

On your local machine:

```powershell
.\setup_cpanel_nodejs.ps1
```

This creates the `cpanel-nodejs-app` directory.

### Step 4: Upload Files

```powershell
.\deploy_via_ssh_simple.ps1 -DeployNodeJS -NodeAppPath "/home/medasnnc/nodevenv/medarion/18/bin"
```

### Step 5: Install Dependencies

SSH into server:

```bash
cd ~/nodevenv/medarion/18/bin
npm install
```

### Step 6: Create Application in cPanel

1. **Go to**: Software → Node.js Selector
2. **Click**: "Create Application"
3. **Fill in**:
   - **Node.js Version**: 18.x (or what you installed)
   - **Application Root**: `/home/medasnnc/nodevenv/medarion/18/bin`
   - **Application URL**: `/medarion-api`
   - **Startup File**: `server.js`
   - **Port**: `3001` (or auto-assigned)
4. **Click**: "Create"

### Step 7: Set Environment Variables

In Node.js Selector, click on your application:

1. **Go to**: Environment Variables
2. **Add**:
   ```
   NODE_ENV=production
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=medasnnc_medarion
   DB_USER=medasnnc_medarion
   DB_PASSWORD=Neorage94
   CORS_ORIGIN=https://medarion.africa
   JWT_SECRET=[GENERATE_RANDOM]
   ```

Generate JWT_SECRET:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 8: Start Application

In Node.js Selector, click **"Start"** on your application.

## 🔍 Troubleshooting

### Node.js Not Found

**Problem**: `node: command not found`

**Solution**:
1. Install Node.js via cPanel Node.js Selector
2. Or use full path: `/opt/cpanel/ea-nodejs18/bin/node`

### Permission Denied

**Problem**: Can't create directories or write files

**Solution**:
```bash
# Check permissions
ls -la ~/nodevenv/

# Fix ownership (if needed, may require root)
chown -R medasnnc:medasnnc ~/nodevenv/
```

### npm install Fails

**Problem**: npm install errors

**Solution**:
1. Check Node.js version: `node --version`
2. Ensure npm is available: `npm --version`
3. Try clearing cache: `npm cache clean --force`
4. Check disk space: `df -h`

### Application Won't Start

**Problem**: App shows as "Stopped" in cPanel

**Solution**:
1. Check logs in Node.js Selector
2. Verify environment variables are set
3. Check that `server.js` exists
4. Verify port is not in use

## 📊 Application Structure

After setup, your application structure should be:

```
/home/medasnnc/nodevenv/medarion/18/bin/
├── server.js
├── package.json
├── .env
├── config/
│   └── database.js
├── routes/
├── middleware/
└── node_modules/ (after npm install)
```

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Automated Setup** | `.\auto_setup_nodejs_cpanel.ps1` |
| **Step-by-Step** | `.\install_and_setup_nodejs.ps1` |
| **Prepare App** | `.\setup_cpanel_nodejs.ps1` |
| **Deploy Files** | `.\deploy_via_ssh_simple.ps1 -DeployNodeJS -NodeAppPath "/path"` |
| **SSH Connect** | `ssh medasnnc@medarion.africa` |
| **Install Deps** | `cd /path/to/app && npm install` |

## ✅ Verification Checklist

After setup, verify:

- [ ] Node.js is installed (check in cPanel Node.js Selector)
- [ ] Application directory exists: `/home/medasnnc/nodevenv/medarion/18/bin`
- [ ] All files uploaded (check via SSH or File Manager)
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Application created in cPanel Node.js Selector
- [ ] Environment variables set
- [ ] Application started (shows "Running" in cPanel)
- [ ] Health endpoint works: `https://medarion.africa/medarion-api/health`

## 🚀 Next Steps

Once Node.js is set up:

1. Deploy your frontend: `.\deploy_via_ssh_simple.ps1`
2. Test the complete application
3. Set up monitoring and backups
4. Configure SSL/HTTPS (if not already done)

---

**Ready to install?** Run: `.\auto_setup_nodejs_cpanel.ps1`

