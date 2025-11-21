# ✅ Your cPanel Deployment is Ready!

Your credentials have been configured. You're ready to deploy!

## 🎯 Your Configuration

- **Domain**: medarion.africa
- **FTP Server**: ftp.medarion.africa
- **Database**: medasnnc_medarion
- **Config File**: `cpanel-config.json` ✅ Created

## 🚀 Quick Deployment Steps

### Step 1: Prepare Everything

Run the master setup script:

```powershell
.\setup_complete_cpanel.ps1
```

This will:
- ✅ Build your frontend
- ✅ Prepare Node.js application
- ✅ Create all configuration files

### Step 2: Set Up Node.js in cPanel

1. Log into cPanel
2. Go to: **Software** → **Node.js Selector**
3. Click **"Create Application"**
4. Configure:
   - **Node.js Version**: Select `18.x` or `20.x` (latest available)
   - **Application Mode**: `Production`
   - **Application Root**: cPanel will suggest a path like `/home/medasnnc/nodevenv/medarion/18/bin` - **COPY THIS PATH!**
   - **Application URL**: `/medarion-api` (or your preferred path)
   - **Application Startup File**: `server.js`
   - **Load App File**: `server.js`
   - **Application Port**: `3001` (or let cPanel assign)

5. **IMPORTANT**: Note the Application Root path - you'll need it in the next step!

### Step 3: Deploy Everything via SSH (Recommended!)

Since you have SSH access, use the faster SSH deployment:

**Option A: Using Password (Easiest - Will prompt for password)**

```powershell
# Deploy everything (will prompt for password: Neorage94)
.\deploy_via_ssh_simple.ps1 -DeployNodeJS -NodeAppPath "/home/medasnnc/nodevenv/medarion/18/bin"
```

(Replace the path with your actual Application Root path from Step 2)

**Option B: Using SSH Key (More Secure - One-time setup)**

```powershell
# First, set up SSH key authentication (one-time setup)
.\setup_ssh_key.ps1

# Then deploy everything
.\deploy_via_ssh.ps1 -DeployNodeJS -NodeAppPath "/home/medasnnc/nodevenv/medarion/18/bin"
```

**OR** use FTP deployment:

```powershell
# Deploy Node.js
.\deploy_nodejs_to_cpanel.ps1

# Deploy Frontend & PHP
.\deploy_to_cpanel.ps1
```

### Step 5: Configure Environment Variables

In cPanel Node.js Selector:

1. Click on your application
2. Go to **Environment Variables**
3. Add these variables:

```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET
```

**Important**: Generate a strong JWT_SECRET. You can use:
```powershell
# In PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use an online generator: https://randomkeygen.com/

### Step 6: Install Dependencies & Start

1. **SSH into your server** (or use cPanel Terminal)
2. Navigate to your Node.js app directory (the Application Root path):
   ```bash
   cd /home/medasnnc/nodevenv/medarion/18/bin
   ```
   (Replace with your actual path from Step 2)

3. Install dependencies:
   ```bash
   npm install
   ```

4. **In cPanel Node.js Selector**, click **"Start"** on your application

5. Check the logs to ensure it started successfully

### Step 7: Test Your Deployment

1. **Test Node.js API**:
   - Visit: `https://medarion.africa/medarion-api/health`
   - Should return a health check response

2. **Test Frontend**:
   - Visit: `https://medarion.africa`
   - Should load your React app

3. **Test Database Connection**:
   - Try logging in or using features that require database

## 📋 Quick Checklist

- [ ] Ran `setup_complete_cpanel.ps1`
- [ ] Created Node.js app in cPanel
- [ ] Deployed Node.js app (`deploy_nodejs_to_cpanel.ps1`)
- [ ] Deployed frontend (`deploy_to_cpanel.ps1`)
- [ ] Set environment variables in cPanel
- [ ] Ran `npm install` in Node.js app directory
- [ ] Started Node.js application
- [ ] Tested health endpoint
- [ ] Tested frontend
- [ ] Generated and set JWT_SECRET

## 🔒 Security Reminders

- ✅ Your `cpanel-config.json` is in `.gitignore` (won't be committed)
- ⚠️ **IMPORTANT**: Generate a strong `JWT_SECRET` - don't use the default!
- ✅ Database credentials are configured
- ✅ CORS is set to your domain

## 🛠️ Troubleshooting

### If Node.js app won't start:
- Check logs in Node.js Selector
- Verify environment variables are set correctly
- Ensure `npm install` completed successfully
- Check file permissions

### If database connection fails:
- Verify credentials in environment variables
- Test connection: `mysql -h localhost -u medasnnc_medarion -p medasnnc_medarion`
- Check database user permissions in cPanel

### If frontend can't connect to API:
- Verify CORS_ORIGIN is set to `https://medarion.africa`
- Check that Node.js app is running
- Verify Application URL path matches frontend API calls

## 📞 Next Steps

Once everything is deployed and working:

1. Test all features
2. Set up SSL/HTTPS (if not already done)
3. Configure backups
4. Set up monitoring
5. Review security settings

## 🎉 You're All Set!

Your configuration is complete. Just follow the steps above to deploy!

---

**Need help?** Check:
- `CPANEL_NODEJS_SETUP_GUIDE.md` - Detailed Node.js guide
- `README_COMPLETE_SETUP.md` - Complete setup reference
- `CPANEL_DEPLOYMENT_GUIDE.md` - General deployment guide

