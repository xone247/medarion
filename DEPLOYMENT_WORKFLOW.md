# 🚀 Deployment Workflow: Local Development → cPanel Production

## Overview

This workflow separates your **local development environment** from your **cPanel production environment**, allowing you to:
- ✅ Develop and test locally without affecting production
- ✅ Sync changes to cPanel when ready
- ✅ Keep both versions separate and organized

## 📁 Directory Structure

```
medarion/
├── .git/                          # Git repository
├── server/                        # Backend code
├── public/                        # Frontend code
├── config.json                    # Local config
├── cpanel-config.json             # cPanel deployment config
├── .env.local                     # Local environment variables
│
├── deploy/                        # Deployment scripts
│   ├── sync-to-cpanel.ps1        # Sync local → cPanel
│   ├── backup-cpanel.ps1          # Backup before deployment
│   └── deploy-checklist.md        # Pre-deployment checklist
│
└── docs/
    └── DEPLOYMENT_WORKFLOW.md     # This file
```

## 🔄 Workflow Process

### Phase 1: Local Development (Offline)

1. **Work on your local version**
   - Make changes
   - Test locally
   - Commit to git

2. **When ready to deploy:**
   - Run pre-deployment checklist
   - Test all features locally
   - Create backup of cPanel version

### Phase 2: Deployment to cPanel (Online)

1. **Sync changes:**
   ```powershell
   .\deploy\sync-to-cpanel.ps1
   ```

2. **Verify deployment:**
   - Check application is running
   - Test critical features
   - Monitor logs

## 📋 Deployment Scripts

### 1. `sync-to-cpanel.ps1`
Syncs your local changes to cPanel:
- Excludes node_modules, .git, etc.
- Preserves cPanel-specific configs
- Updates only changed files

### 2. `backup-cpanel.ps1`
Creates backup before deployment:
- Backs up current cPanel files
- Creates timestamped backup
- Stores in backup directory

### 3. `deploy-checklist.md`
Pre-deployment checklist:
- Test all features
- Update version numbers
- Check dependencies

## 🎯 Best Practices

1. **Always backup before deploying**
2. **Test locally first**
3. **Deploy during low-traffic hours**
4. **Keep git commits clean**
5. **Document major changes**

## 📝 Environment Separation

### Local (.env.local)
```env
NODE_ENV=development
DATABASE_URL=localhost
VAST_AI_URL=http://localhost:3001
DEBUG=true
```

### cPanel (.env on server)
```env
NODE_ENV=production
DATABASE_URL=localhost
VAST_AI_URL=http://localhost:3001
DEBUG=false
```

## 🔐 Configuration Files

- **config.json**: Local development config
- **cpanel-config.json**: cPanel deployment config (SSH, paths, etc.)

## ✅ Deployment Checklist

Before deploying:
- [ ] All tests pass locally
- [ ] No console errors
- [ ] Database migrations ready (if any)
- [ ] Environment variables updated
- [ ] Dependencies installed
- [ ] Backup created
- [ ] Deployment script tested

