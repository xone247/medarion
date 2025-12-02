# Sync Scripts Documentation

## Overview

Two sync scripts have been created to help you quickly sync your local development environment to cPanel and Git:

1. **`sync_to_cpanel_and_git.ps1`** - Comprehensive full sync (recommended for first-time setup)
2. **`quick_sync.ps1`** - Fast sync for regular development

## 🔄 Full Sync Script (`sync_to_cpanel_and_git.ps1`)

### What It Does

1. **Exports Local Database** - Creates a SQL dump of your local `medarion_platform` database
2. **Backs Up cPanel Configs** - Saves `.env`, `.htaccess`, and other config files
3. **Cleans cPanel Directories** - Removes old files while preserving configs
4. **Builds Frontend** - Runs `npm run build` to create production build
5. **Uploads Files** - Syncs frontend to `public_html` and backend to `api.medarion.africa`
6. **Restores Configs** - Puts back the saved config files
7. **Imports Database** - Imports local database to cPanel database
8. **Syncs to Git** - Commits and pushes all changes

### Usage

```powershell
# Full sync (everything)
.\sync_to_cpanel_and_git.ps1

# Skip database sync
.\sync_to_cpanel_and_git.ps1 -SkipDatabase

# Skip Git sync
.\sync_to_cpanel_and_git.ps1 -SkipGit

# Skip frontend
.\sync_to_cpanel_and_git.ps1 -SkipFrontend

# Skip backend
.\sync_to_cpanel_and_git.ps1 -SkipBackend
```

### What Gets Preserved on cPanel

- **Backend `.env`** - Database credentials, API keys, etc.
- **Frontend `.htaccess`** - Apache configuration
- **Backend `.htaccess`** - Backend routing
- **`.well-known`** - SSL/security files
- **`node_modules`** - Backend dependencies (not deleted)
- **`uploads`** - User uploaded files (not deleted)

## ⚡ Quick Sync Script (`quick_sync.ps1`)

### What It Does

- Builds and uploads frontend
- Uploads backend files
- Restarts backend server
- Optionally syncs database and Git

### Usage

```powershell
# Quick sync (everything)
.\quick_sync.ps1

# Frontend only
.\quick_sync.ps1 -FrontendOnly

# Backend only
.\quick_sync.ps1 -BackendOnly

# Skip database
.\quick_sync.ps1 -NoDb

# Skip Git
.\quick_sync.ps1 -NoGit
```

## 📋 Prerequisites

1. **SSH Access** - PuTTY tools must be installed and configured
2. **Pageant Running** - SSH key must be loaded in Pageant
3. **Local Database** - XAMPP MySQL must be running
4. **Node.js** - For building frontend
5. **Git** - For syncing to repository

## 🔐 Configuration

All scripts use `cpanel-config.json` for configuration:

```json
{
  "ssh": {
    "host": "server1.medarion.africa",
    "username": "root",
    "port": 22,
    "keyPath": "C:\\Users\\xone\\.ssh\\medarionput.ppk"
  },
  "database": {
    "host": "localhost",
    "name": "medasnnc_medarion",
    "username": "medasnnc_medarion",
    "password": "Neorage94"
  }
}
```

## 🚀 First-Time Setup

Run the full sync script to set everything up:

```powershell
.\sync_to_cpanel_and_git.ps1
```

This will:
- Clean cPanel directories
- Upload all local files
- Import local database
- Sync to Git

## 🔄 Regular Development Workflow

After making changes locally:

```powershell
# Quick sync (recommended for regular use)
.\quick_sync.ps1

# Or full sync if you made database changes
.\sync_to_cpanel_and_git.ps1
```

## ⚠️ Important Notes

1. **Database Sync** - The full sync script will **replace** the cPanel database with your local database. Make sure your local database is up-to-date.

2. **Config Files** - Config files (`.env`, `.htaccess`) are automatically preserved. The script backs them up before cleaning and restores them after.

3. **Backend Server** - The backend server is automatically restarted after upload. If it fails, check PM2 status manually.

4. **Git Sync** - All local changes are committed and pushed. Make sure you're on the correct branch.

## 🛠️ Troubleshooting

### SSH Connection Issues
- Make sure Pageant is running with your SSH key loaded
- Verify SSH credentials in `cpanel-config.json`

### Database Export Issues
- Make sure XAMPP MySQL is running
- Check that `mysqldump` is available (usually in `C:\xampp\mysql\bin\`)

### Upload Issues
- Check SSH connection: `plink -P 22 root@server1.medarion.africa "echo test"`
- Verify file paths in the script

### Backend Not Restarting
- Check PM2 status manually: `plink -P 22 root@server1.medarion.africa "/opt/cpanel/ea-nodejs22/bin/pm2 status"`
- Check backend logs: `plink -P 22 root@server1.medarion.africa "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend"`

## 📝 File Locations

### Local
- **Frontend Build**: `medarion-dist/`
- **Backend Source**: `server/`
- **Database**: `medarion_platform` (local MySQL)

### cPanel
- **Frontend**: `/home/medasnnc/public_html/`
- **Backend**: `/home/medasnnc/api.medarion.africa/`
- **Database**: `medasnnc_medarion` (cPanel MySQL)

## ✅ Verification

After syncing, verify:

1. **Frontend**: Visit https://medarion.africa
2. **Backend**: Check https://api.medarion.africa/api/health
3. **Database**: Check data in cPanel phpMyAdmin
4. **Git**: Check repository for latest commits

---

**Last Updated**: 2024-12-19
**Scripts**: `sync_to_cpanel_and_git.ps1`, `quick_sync.ps1`

