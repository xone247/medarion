# 🚀 Quick Deploy Guide - medarion.africa

Your credentials are configured! Here's the fastest way to deploy.

## ⚡ Super Quick Deploy (3 Commands)

### 1. Prepare Everything

```powershell
.\setup_complete_cpanel.ps1
```

### 2. Create Node.js App in cPanel

1. Log into cPanel
2. Go to: **Software** → **Node.js Selector**
3. Click **"Create Application"**
4. Settings:
   - Node.js Version: `18.x` or `20.x`
   - Application URL: `/medarion-api`
   - Startup File: `server.js`
   - Port: `3001`
5. **Copy the Application Root path** (shown after creation)

### 3. Deploy Everything

```powershell
.\deploy_via_ssh_simple.ps1 -DeployNodeJS -NodeAppPath "/home/medasnnc/nodevenv/medarion/18/bin"
```

Replace `/home/medasnnc/nodevenv/medarion/18/bin` with your actual path from Step 2.

**Note:** You'll be prompted for your SSH password. Enter: `Neorage94`

**That's it!** The script will:
- ✅ Upload frontend
- ✅ Upload PHP API
- ✅ Upload Node.js app
- ✅ Run `npm install`
- ✅ Set up all config files

## 📋 Then Configure Environment Variables

In cPanel Node.js Selector:

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
JWT_SECRET=[GENERATE_RANDOM_SECRET]
```

Generate JWT_SECRET:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## 🎯 Start Application

In cPanel Node.js Selector, click **"Start"** on your application.

## ✅ Test

- Frontend: https://medarion.africa
- API Health: https://medarion.africa/medarion-api/health

## 🔒 Security Note

Your SSH password is stored in `cpanel-config.json` (already in `.gitignore`).

For better security, consider setting up SSH keys:
```powershell
.\setup_ssh_key.ps1
```

Then use:
```powershell
.\deploy_via_ssh.ps1 -DeployNodeJS -NodeAppPath "/your/path"
```

---

**That's it! You're deployed!** 🎉

