# 🚀 Deploy Now - Everything is Ready!

Your credentials are configured. Here's how to deploy right now.

## ✅ What's Configured

- ✅ **FTP**: ftp.medarion.africa (Password: Neorage94)
- ✅ **SSH**: medarion.africa (User: medasnnc, Password: Neorage94)
- ✅ **Database**: medasnnc_medarion (Password: Neorage94)
- ✅ **Domain**: medarion.africa
- ✅ **All deployment scripts ready**

## 🚀 Quick Deploy (3 Commands)

### Step 1: Prepare Everything

```powershell
.\setup_complete_cpanel.ps1
```

This will:
- Build your frontend
- Prepare Node.js app
- Create all config files

### Step 2: Create Node.js App in cPanel

1. Log into cPanel: https://medarion.africa:2083
2. Go to: **Software** → **Node.js Selector**
3. Click **"Create Application"**
4. Settings:
   - **Node.js Version**: `18.x` or `20.x` (latest available)
   - **Application URL**: `/medarion-api`
   - **Startup File**: `server.js`
   - **Port**: `3001` (or let cPanel assign)
5. **IMPORTANT**: Copy the **Application Root** path (shown after creation)
   - Example: `/home/medasnnc/nodevenv/medarion/18/bin`

### Step 3: Deploy Everything

```powershell
.\deploy_via_ssh_simple.ps1 -DeployNodeJS -NodeAppPath "/home/medasnnc/nodevenv/medarion/18/bin"
```

**Replace the path** with your actual Application Root path from Step 2.

**When prompted for password**, enter: `Neorage94`

This will:
- ✅ Upload frontend to `public_html/`
- ✅ Upload PHP API to `public_html/api/`
- ✅ Upload Node.js app
- ✅ Run `npm install` automatically
- ✅ Set up all config files

## 📋 Configure Environment Variables

After deployment, in cPanel Node.js Selector:

1. Click on your application
2. Go to **Environment Variables**
3. Add these:

```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=[GENERATE_THIS]
```

**Generate JWT_SECRET:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## 🎯 Start Application

In cPanel Node.js Selector, click **"Start"** on your application.

## ✅ Test Your Deployment

- **Frontend**: https://medarion.africa
- **API Health**: https://medarion.africa/medarion-api/health

## 🔧 Troubleshooting

### If password prompt doesn't work:
- Make sure you're entering: `Neorage94`
- Check that SSH is enabled on your server
- Try connecting manually: `ssh medasnnc@medarion.africa`

### If deployment fails:
- Check that Node.js app path is correct
- Verify files were built: `npm run build`
- Check cPanel error logs

### If Node.js app won't start:
- Verify environment variables are set
- Check logs in Node.js Selector
- Ensure `npm install` completed

## 📝 Your Credentials (For Reference)

- **SSH Host**: medarion.africa
- **SSH User**: medasnnc
- **SSH Password**: Neorage94
- **Database**: medasnnc_medarion
- **DB User**: medasnnc_medarion
- **DB Password**: Neorage94

## 🎉 That's It!

You're ready to deploy. Just run the 3 steps above!

---

**Need help?** Check:
- `QUICK_DEPLOY.md` - Quick reference
- `DEPLOYMENT_READY.md` - Detailed guide
- `ROOT_SSH_SETUP.md` - Root SSH info

