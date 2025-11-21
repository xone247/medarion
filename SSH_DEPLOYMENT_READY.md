# SSH Deployment Ready! 🚀

Your SSH access is now configured and working!

## ✅ What's Configured

- **SSH Host**: `server1.medarion.africa`
- **SSH User**: `root`
- **SSH Key**: `C:\Users\xone\.ssh\medarionput.ppk`
- **Node.js**: v22.21.0 (already installed!)
- **cPanel User**: `medasnnc`

## 🚀 Quick Start

### 1. Test SSH Connection
```powershell
.\run_ssh_command.ps1 -Command "echo 'Hello from SSH!' && node --version"
```

### 2. Complete Deployment
```powershell
.\deploy_complete_via_ssh.ps1
```

This will:
- ✅ Prepare application files locally
- ✅ Create application directory on server
- ✅ Upload files (if pscp is available)
- ✅ Install dependencies
- ✅ Set permissions

### 3. Manual Steps (if needed)

If file upload via SSH doesn't work, use cPanel File Manager:

1. **Prepare files locally:**
   ```powershell
   .\setup_cpanel_nodejs.ps1
   npm run build
   ```

2. **Upload via cPanel File Manager:**
   - Go to cPanel → File Manager
   - Upload `cpanel-nodejs-app/*` to `/home/medasnnc/medarion/`
   - Upload `medarion-dist/*` to `/home/medasnnc/public_html/`

3. **Install dependencies via SSH:**
   ```powershell
   .\run_ssh_command.ps1 -Command "cd /home/medasnnc/medarion && npm install --production"
   ```

4. **Create Node.js app in cPanel:**
   - Go to cPanel → Node.js Selector
   - Create new app:
     - Node.js version: 22 (or 18)
     - Application root: `/home/medasnnc/medarion`
     - Application URL: `/medarion`
     - Application startup file: `server.js`

## 📝 Useful Commands

### Check Node.js
```powershell
.\run_ssh_command.ps1 -Command "node --version && npm --version"
```

### Check Directory
```powershell
.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/medarion"
```

### Install Dependencies
```powershell
.\run_ssh_command.ps1 -Command "cd /home/medasnnc/medarion && npm install --production"
```

### Check Application Status
```powershell
.\run_ssh_command.ps1 -Command "cd /home/medasnnc/medarion && pm2 list || echo 'Use cPanel to manage Node.js app'"
```

### View Logs
```powershell
.\run_ssh_command.ps1 -Command "tail -n 50 /home/medasnnc/medarion/logs/*.log"
```

## 🔧 Available Scripts

- **`run_ssh_command.ps1`** - Run any SSH command
- **`deploy_complete_via_ssh.ps1`** - Complete deployment automation
- **`complete_setup_via_ssh.ps1`** - Setup guide with manual steps
- **`deploy_via_putty.ps1`** - Alternative deployment method

## 💡 Tips

1. **File Upload**: If pscp isn't available, use cPanel File Manager or FTP
2. **Permissions**: Root can set permissions, but cPanel user owns the files
3. **Node.js**: Already installed at system level (v22.21.0)
4. **cPanel Node.js Selector**: Use this to create and manage the Node.js app

## 🎯 Next Steps

1. Run `.\deploy_complete_via_ssh.ps1` to deploy
2. Or follow manual steps above
3. Create Node.js app in cPanel
4. Start the application!

---

**Ready to deploy?** Run: `.\deploy_complete_via_ssh.ps1`

