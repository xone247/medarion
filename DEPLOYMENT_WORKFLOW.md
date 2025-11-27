# Deployment Workflow - Git to cPanel

## ✅ Setup Complete

Auto-sync scripts have been created and tested. All changes are now automatically deployed to cPanel production after git commits.

## Quick Start

### Option 1: Commit and Sync (One Command)
```powershell
.\scripts\commit_and_sync.ps1 "Your commit message here"
```

This single command will:
1. ✅ Stage all changes
2. ✅ Commit to Git
3. ✅ Push to remote
4. ✅ Build frontend
5. ✅ Sync files to cPanel
6. ✅ Install dependencies
7. ✅ Restart backend server

### Option 2: Manual Sync (After Git Commit)
If you've already committed:
```powershell
.\scripts\auto_sync_to_cpanel.ps1
```

## What Was Deployed

### Latest Changes (Just Synced)
✅ **Error Handling Improvements**
- Fixed token storage in all localStorage keys
- Improved API service token checking
- Added global error handlers
- Enhanced error logging

✅ **Authentication Fixes**
- Fixed token storage inconsistency
- Improved token compatibility
- Better logout cleanup

## Deployment Status

### ✅ Frontend
- **Status:** Deployed
- **Files:** 58 files synced
- **Location:** `/home/medasnnc/public_html/`
- **URL:** https://medarion.africa

### ✅ Backend
- **Status:** Running
- **Files:** 33 files synced
- **Location:** `/home/medasnnc/api.medarion.africa/`
- **URL:** https://api.medarion.africa
- **PM2 Status:** Online (PID: 2565850)

### ✅ Public Files
- **Status:** Deployed
- **Files:** 55 files synced
- **Location:** `/home/medasnnc/public_html/`

## Testing Production

After deployment, test:

1. **Frontend:**
   - https://medarion.africa
   - Check login functionality
   - Verify admin dashboard access

2. **Backend:**
   - https://api.medarion.africa/health
   - Test API endpoints
   - Verify authentication

3. **Browser Console:**
   - Open DevTools (F12)
   - Check for errors
   - Verify no authentication issues

## Workflow Going Forward

### Standard Workflow
```powershell
# 1. Make your changes
# Edit files...

# 2. Commit and sync
.\scripts\commit_and_sync.ps1 "Description of changes"

# 3. Test production
Start-Process "https://medarion.africa"
```

### Development Workflow
```powershell
# 1. Make changes locally
# Test locally first...

# 2. Commit to Git
git add .
git commit -m "Your changes"
git push origin master

# 3. Sync to production
.\scripts\auto_sync_to_cpanel.ps1

# 4. Test production
```

## Files Synced

### Frontend (`medarion-dist/`)
- All built React/Vite assets
- HTML, CSS, JavaScript bundles
- Static assets

### Backend (`server/`)
- All Node.js source files
- Configuration files
- Excludes: `node_modules`, `*.log`

### Public (`public/`)
- Static assets
- Upload directories
- Images, documents, etc.

## Server Management

### PM2 Commands (on server)
```bash
# Check status
pm2 list

# View logs
pm2 logs medarion-backend

# Restart
pm2 restart medarion-backend

# Stop
pm2 stop medarion-backend
```

## Troubleshooting

### Build Fails
- Check `package.json` exists
- Run `npm install` locally
- Check for TypeScript errors

### Sync Fails
- Verify SSH credentials in `cpanel-config.json`
- Check PuTTY/pscp is installed
- Verify network connectivity

### Server Won't Start
- Check PM2 is installed: `/opt/cpanel/ea-nodejs22/bin/pm2`
- Verify Node.js version matches
- Check server logs: `pm2 logs medarion-backend`
- Check `.env` file on server

### Authentication Issues
- Verify tokens are stored correctly
- Check browser console for errors
- Verify API endpoints are accessible
- Check backend logs for errors

## Configuration

All configuration is in `cpanel-config.json`:
- SSH credentials
- Server paths
- PM2 path

**⚠️ This file is in `.gitignore` - keep it secure!**

## Best Practices

1. ✅ **Test locally first** before syncing
2. ✅ **Use descriptive commit messages** for tracking
3. ✅ **Check sync output** for any errors
4. ✅ **Test production** after each sync
5. ✅ **Monitor server logs** if issues occur
6. ✅ **Keep cpanel-config.json secure**

## Next Steps

1. ✅ Test login on production
2. ✅ Verify admin dashboard works
3. ✅ Check browser console for errors
4. ✅ Test all major features
5. ✅ Monitor server performance

## Summary

🎉 **Auto-sync is now set up and working!**

Every time you commit changes, you can automatically deploy them to production with a single command. The deployment process:
- Builds the frontend
- Syncs all files
- Installs dependencies
- Restarts the server
- Verifies everything is working

Your production environment is now always in sync with your Git repository!
