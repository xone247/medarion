# Complete Deployment & Sync Guide

## 🚀 Initial Full Deployment

Run the complete deployment script to set up everything:

```powershell
.\deploy_full_setup.ps1
```

This will:
1. ✅ Test SSH connection
2. ✅ Build frontend (`npm run build`)
3. ✅ Prepare Node.js backend
4. ✅ **Clean public_html** (removes old files, keeps `.well-known` and `.htaccess`)
5. ✅ Create directories
6. ✅ Upload frontend to `/home/medasnnc/public_html/`
7. ✅ Upload backend to `/home/medasnnc/medarion/`
8. ✅ Install dependencies
9. ✅ Set permissions

## 🔄 Quick Sync for Updates

After initial deployment, use the sync script for easy updates:

```powershell
# Sync everything (frontend + backend)
.\sync_to_production.ps1

# Sync frontend only
.\sync_to_production.ps1 -FrontendOnly

# Sync backend only
.\sync_to_production.ps1 -BackendOnly

# Sync without rebuilding (use existing builds)
.\sync_to_production.ps1 -SkipBuild
```

## 📋 Setup Steps

### 1. Initial Deployment
```powershell
.\deploy_full_setup.ps1
```

### 2. Create Node.js App in cPanel
1. Go to **cPanel → Node.js Selector**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 22 (or 18)
   - **Application root**: `/home/medasnnc/medarion`
   - **Application URL**: `/medarion` (or your preferred path)
   - **Application startup file**: `server.js`
   - **Application mode**: Production
4. Click **Create**
5. Click **Start** to start the application

### 3. Verify Deployment
- Visit your domain: `https://medarion.africa`
- Check API: `https://medarion.africa/api/health` (or your API endpoint)

## 🔧 Workflow

### Daily Development Workflow

1. **Make changes locally**
2. **Test locally**
3. **Sync to production:**
   ```powershell
   # If you changed frontend
   .\sync_to_production.ps1 -FrontendOnly
   
   # If you changed backend
   .\sync_to_production.ps1 -BackendOnly
   
   # If you changed both
   .\sync_to_production.ps1
   ```

### After Backend Changes

If you synced backend changes, restart the Node.js app:
1. Go to **cPanel → Node.js Selector**
2. Find your app
3. Click **Restart**

Or via SSH:
```powershell
.\run_ssh_command.ps1 -Command "cd /home/medasnnc/medarion && pm2 restart medarion || echo 'Use cPanel to restart'"
```

## 📁 Directory Structure

```
/home/medasnnc/
├── public_html/          # Frontend (React build)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
└── medarion/             # Backend (Node.js)
    ├── server.js
    ├── package.json
    ├── .env
    └── node_modules/
```

## 🛠️ Useful Commands

### Check Deployment Status
```powershell
# Check frontend files
.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/public_html/ | head -20"

# Check backend files
.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/medarion/"

# Check Node.js version
.\run_ssh_command.ps1 -Command "node --version"
```

### View Logs
```powershell
# Application logs (if using PM2)
.\run_ssh_command.ps1 -Command "cd /home/medasnnc/medarion && pm2 logs medarion --lines 50"

# Or check cPanel logs
.\run_ssh_command.ps1 -Command "tail -n 50 /home/medasnnc/medarion/logs/*.log"
```

### Restart Application
```powershell
# Via cPanel (recommended)
# Or via SSH if PM2 is configured
.\run_ssh_command.ps1 -Command "cd /home/medasnnc/medarion && pm2 restart medarion"
```

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| **Full deployment** | `.\deploy_full_setup.ps1` |
| **Quick sync (all)** | `.\sync_to_production.ps1` |
| **Sync frontend** | `.\sync_to_production.ps1 -FrontendOnly` |
| **Sync backend** | `.\sync_to_production.ps1 -BackendOnly` |
| **Run SSH command** | `.\run_ssh_command.ps1 -Command "your command"` |
| **Check files** | `.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/public_html/"` |

## 🔐 Security Notes

- SSH access is via root (WHM level)
- Files are owned by `medasnnc` (cPanel user)
- Permissions are set automatically
- `.env` files are not uploaded (configure in cPanel)

## 🐛 Troubleshooting

### Files Not Uploading
- Check if `pscp.exe` is installed (part of PuTTY)
- Verify SSH connection: `.\run_ssh_command.ps1 -Command "echo 'test'"`

### Frontend Not Loading
- Check `.htaccess` exists in `public_html`
- Verify files were uploaded: `.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/public_html/"`

### Backend Not Starting
- Check Node.js app in cPanel Node.js Selector
- Verify `server.js` exists: `.\run_ssh_command.ps1 -Command "test -f /home/medasnnc/medarion/server.js && echo 'OK'"`
- Check logs in cPanel

### Permission Errors
```powershell
.\run_ssh_command.ps1 -Command "chown -R medasnnc:medasnnc /home/medasnnc/public_html /home/medasnnc/medarion"
```

---

**Ready to deploy?** Run: `.\deploy_full_setup.ps1`

