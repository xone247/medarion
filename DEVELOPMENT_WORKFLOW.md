# Fast Development & Deployment Workflow

This guide shows you how to speed up your development and deployment process using Git and automated scripts.

## ⚡ Quick Commands

### Load Git Quick Commands
```powershell
. .\git_quick_commands.ps1
```

After loading, you can use:
- `git-status` - Quick status check
- `git-save "message"` - Add and commit
- `git-push "message"` - Add, commit, and push
- `git-pull` - Pull latest changes
- `git-branch` - Show current branch

## 🚀 Fast Development Workflow

### Option 1: Quick Dev Script (Recommended)
```powershell
# Commit and push (no deployment)
.\quick_dev.ps1 -Message "Fixed login bug"

# Commit, push, and deploy to cPanel
.\quick_dev.ps1 -Message "Fixed login bug" -Deploy

# Deploy without committing
.\quick_dev.ps1 -Deploy -NoCommit
```

**Shortcut:** Use `.\qd.ps1` instead of `.\quick_dev.ps1`

### Option 2: Full Deployment Script
```powershell
# Full deployment with Git integration
.\deploy_from_git.ps1
```

This script will:
1. Check for uncommitted changes
2. Optionally commit and push
3. Build frontend
4. Upload to cPanel
5. Restart backend

## 📋 Daily Workflow Examples

### Morning: Pull Latest Changes
```powershell
git-pull
```

### During Development: Quick Saves
```powershell
# Quick save to Git
git-save "WIP: Working on dashboard"

# Or use the quick dev script
.\qd.ps1 -Message "WIP: Dashboard updates"
```

### Before Deployment: Commit and Deploy
```powershell
# Commit, push, and deploy in one command
.\qd.ps1 -Message "Add new feature" -Deploy
```

### After Deployment: Verify
```powershell
# Check deployment
Start-Process "https://medarion.africa"
Start-Process "https://api.medarion.africa/api/health"
```

## 🔄 Complete Workflow

### 1. Start Development Session
```powershell
# Pull latest changes
git-pull

# Create feature branch (optional)
git-branch-new "feature/new-feature"
```

### 2. Make Changes
- Edit files in Cursor
- Test locally

### 3. Save Progress
```powershell
# Quick save
git-save "WIP: Description"

# Or commit and push
git-push "Description"
```

### 4. Deploy to Production
```powershell
# Full deployment
.\qd.ps1 -Message "Release: Feature complete" -Deploy
```

### 5. Verify Deployment
- Check https://medarion.africa
- Test API endpoints
- Check backend logs if needed

## 🛠️ Advanced Workflows

### Working on Multiple Features
```powershell
# Create feature branch
git-branch-new "feature/user-auth"

# Make changes and commit
git-save "Add user authentication"

# Switch back to main
git-branch-switch "master"

# Merge feature
git merge feature/user-auth
git-push "Merge user auth feature"
```

### Stashing Changes
```powershell
# Save current work without committing
git-stash-save "WIP: Before switching branches"

# Switch branches
git-branch-switch "master"

# Apply stashed changes later
git-stash-pop
```

### Quick Rollback
```powershell
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert specific commit
git revert <commit-hash>
```

## 📦 Deployment Options

### Frontend Only
```powershell
# Build and deploy frontend only
npm run build
.\deploy_from_git.ps1  # Will skip backend if no changes
```

### Backend Only
```powershell
# Deploy specific backend files
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscp = "C:\Program Files\PuTTY\pscp.exe"
& $pscp -P $config.ssh.port "server/routes/admin.js" "$($config.ssh.username)@$($config.ssh.host):/home/medasnnc/api.medarion.africa/routes/admin.js"
```

### Full Stack
```powershell
# Complete deployment
.\qd.ps1 -Message "Full deployment" -Deploy
```

## 🔍 Troubleshooting

### Deployment Fails
1. Check SSH connection: `Test-NetConnection server1.medarion.africa -Port 22`
2. Verify Pageant is running with SSH key loaded
3. Check cPanel config: `Get-Content cpanel-config.json`

### Git Push Fails
1. Pull latest first: `git-pull`
2. Resolve conflicts if any
3. Try again: `git-push "message"`

### Build Fails
1. Check Node.js version: `node --version`
2. Clear cache: `npm cache clean --force`
3. Reinstall dependencies: `npm install`

## 💡 Tips for Faster Development

1. **Use Quick Commands**: Load `git_quick_commands.ps1` in your PowerShell profile
2. **Frequent Commits**: Commit small changes often
3. **Use Branches**: Keep main branch stable
4. **Automate**: Use `quick_dev.ps1` for common workflows
5. **Test Locally**: Always test before deploying

## 📚 Related Documentation

- `PROJECT_KNOWLEDGE_BASE.md` - Complete project reference
- `GIT_SETUP_GUIDE.md` - Git commands and workflows
- `WORKING_ENVIRONMENT.md` - Deployment details
- `QUICK_REFERENCE.md` - Quick command reference

---

**Happy coding!** 🚀


