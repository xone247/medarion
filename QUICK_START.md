# 🚀 Quick Start - Deployment & Sync

## ✅ Initial Deployment Complete!

Your application has been deployed:
- ✅ **Frontend**: `/home/medasnnc/public_html/`
- ✅ **Backend**: `/home/medasnnc/medarion/`
- ✅ **Dependencies**: Installed
- ✅ **Permissions**: Set

## 📝 Final Setup Steps

### 1. Create Node.js App in cPanel

1. Go to **cPanel → Node.js Selector**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: `22` (or `18`)
   - **Application root**: `/home/medasnnc/medarion`
   - **Application URL**: `/medarion` (or your preferred path)
   - **Application startup file**: `server.js`
   - **Application mode**: `Production`
4. Click **Create**
5. Click **Start** to start the application

### 2. Verify Deployment

- **Frontend**: Visit `https://medarion.africa`
- **Backend API**: Check `https://medarion.africa/api/health` (or your API endpoint)

## 🔄 Daily Sync Workflow

After making changes locally, sync to production:

```powershell
# Sync everything (frontend + backend)
.\sync_to_production.ps1

# Sync frontend only (faster)
.\sync_to_production.ps1 -FrontendOnly

# Sync backend only
.\sync_to_production.ps1 -BackendOnly
```

### After Backend Changes

If you synced backend changes, restart the Node.js app:
1. Go to **cPanel → Node.js Selector**
2. Find your app
3. Click **Restart**

## 📋 Quick Commands

| Task | Command |
|------|---------|
| **Full deployment** | `.\deploy_full_setup.ps1` |
| **Quick sync** | `.\sync_to_production.ps1` |
| **Sync frontend** | `.\sync_to_production.ps1 -FrontendOnly` |
| **Sync backend** | `.\sync_to_production.ps1 -BackendOnly` |
| **Run SSH command** | `.\run_ssh_command.ps1 -Command "your command"` |
| **Check files** | `.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/public_html/"` |

## 🎯 Typical Workflow

1. **Make changes locally**
2. **Test locally**
3. **Sync to production:**
   ```powershell
   .\sync_to_production.ps1 -FrontendOnly  # or -BackendOnly
   ```
4. **Restart Node.js app** (if backend changed)
5. **Verify on live site**

## 🔧 Troubleshooting

### Frontend Not Loading
- Check files: `.\run_ssh_command.ps1 -Command "ls -la /home/medasnnc/public_html/"`
- Verify `.htaccess` exists

### Backend Not Starting
- Check Node.js app in cPanel Node.js Selector
- Verify `server.js` exists: `.\run_ssh_command.ps1 -Command "test -f /home/medasnnc/medarion/server.js && echo 'OK'"`

### Permission Errors
```powershell
.\run_ssh_command.ps1 -Command "chown -R medasnnc:medasnnc /home/medasnnc/public_html /home/medasnnc/medarion"
```

---

**Ready to sync?** Run: `.\sync_to_production.ps1`

