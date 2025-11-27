# Auto Sync to cPanel - Setup Guide

## Overview

After making changes and committing to Git, you can now automatically sync those changes to cPanel production. This ensures your online application is always up-to-date.

## Scripts Created

### 1. `scripts/auto_sync_to_cpanel.ps1`
- Standalone script to sync files to cPanel
- Can be run independently
- Builds frontend, syncs files, installs dependencies, restarts server

### 2. `scripts/commit_and_sync.ps1`
- Combined script that commits AND syncs
- One command does everything
- Usage: `.\scripts\commit_and_sync.ps1 "Your commit message"`

## Usage

### Option 1: Commit and Sync (Recommended)
```powershell
.\scripts\commit_and_sync.ps1 "Fixed authentication token storage"
```

This will:
1. ✅ Stage all changes
2. ✅ Commit with your message
3. ✅ Push to remote Git
4. ✅ Build frontend
5. ✅ Sync files to cPanel
6. ✅ Install backend dependencies
7. ✅ Restart backend server

### Option 2: Manual Sync (After Git Commit)
If you've already committed:
```powershell
.\scripts\auto_sync_to_cpanel.ps1
```

## What Gets Synced

### Frontend Files
- `medarion-dist/` → `/home/medasnnc/public_html/`
- All built frontend assets

### Backend Files
- `server/` → `/home/medasnnc/api.medarion.africa/`
- Excludes `node_modules` and `.log` files

### Public Files
- `public/` → `/home/medasnnc/public_html/`
- Static assets, uploads, etc.

## Process Flow

1. **Build Frontend**
   - Runs `npm run build`
   - Creates `medarion-dist/` directory

2. **Sync Files**
   - Uploads frontend files via SCP
   - Uploads backend files via SCP
   - Uploads public files via SCP

3. **Install Dependencies**
   - Runs `npm install --production` on server
   - Installs only production dependencies

4. **Restart Server**
   - Restarts PM2 process `medarion-backend`
   - Verifies server is running

## Configuration

The scripts use `cpanel-config.json` for:
- SSH credentials
- Server paths
- PM2 path

Make sure this file exists and is configured correctly.

## Testing

After sync completes, test:
- **Frontend:** https://medarion.africa
- **Backend:** https://api.medarion.africa/health

## Troubleshooting

### Build Fails
- Check `package.json` exists
- Run `npm install` locally first
- Check for build errors

### Sync Fails
- Verify SSH credentials in `cpanel-config.json`
- Check PuTTY/pscp is installed
- Verify network connectivity

### Server Won't Start
- Check PM2 is installed on server
- Verify Node.js version matches
- Check server logs: `pm2 logs medarion-backend`

## Best Practices

1. **Always test locally first** before syncing
2. **Use descriptive commit messages** for tracking
3. **Check sync output** for any errors
4. **Test production** after sync completes
5. **Keep cpanel-config.json secure** (already in .gitignore)

## Example Workflow

```powershell
# Make your changes to files...

# Commit and sync in one command
.\scripts\commit_and_sync.ps1 "Fixed browser console errors - improved token storage"

# Wait for sync to complete...

# Test production
Start-Process "https://medarion.africa"
```

## Notes

- The sync process takes a few minutes depending on file count
- Progress is shown for each step
- Server restart takes ~2 seconds
- All changes are logged for debugging

