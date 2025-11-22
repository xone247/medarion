# ⚡ Quick Workflow Reference

**Fast commands for daily development and deployment**

## 🚀 One-Command Deployment

```powershell
# Commit, push, and deploy to cPanel
.\qd.ps1 -Message "Your commit message" -Deploy
```

## 📝 Quick Git Commands

After loading (`. .\git_quick_commands.ps1` or restart PowerShell):

```powershell
git-status          # Quick status
git-save "message"  # Add and commit
git-push "message"  # Add, commit, push
git-pull            # Pull latest
git-branch          # Show current branch
```

## 🔄 Common Workflows

### Daily Development
```powershell
# 1. Start session
git-pull

# 2. Make changes in Cursor

# 3. Quick save
git-save "WIP: Description"

# 4. Deploy when ready
.\qd.ps1 -Message "Feature complete" -Deploy
```

### Quick Fix
```powershell
# Fix, commit, push, deploy in one go
.\qd.ps1 -Message "Fixed bug" -Deploy
```

### Deploy Without Committing
```powershell
.\qd.ps1 -Deploy -NoCommit
```

## 📦 Deployment Options

### Full Deployment
```powershell
.\deploy_from_git.ps1
```

### Frontend Only
```powershell
npm run build
# Then use deploy_from_git.ps1 (it will skip backend)
```

## 🎯 Shortcuts

**Desktop Shortcuts Created:**
- `Medarion - Quick Deploy` - Opens deployment script
- `Medarion - Quick Dev` - Opens dev workflow

**Command Aliases** (load with `. .\aliases.ps1`):
- `gs` - git status
- `gsave` - git save
- `gpush` - git push
- `Deploy` - Quick deploy
- `Build` - Build frontend
- `Dev` - Start dev servers

## 📚 Full Documentation

- `DEVELOPMENT_WORKFLOW.md` - Complete guide
- `PROJECT_KNOWLEDGE_BASE.md` - Project reference
- `GIT_SETUP_GUIDE.md` - Git commands

---

**Pro Tip:** Use `.\qd.ps1` for 90% of your workflow!



