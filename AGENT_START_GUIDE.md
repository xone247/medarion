# Quick Start Guide for New Agents

**Use this when starting a new Cursor agent session (including Cursor Online)**

## 🚀 Quick Setup

### 1. Get the Code

```bash
# If cloning fresh
git clone https://github.com/xone247/medarion.git
cd medarion

# If already cloned
git pull origin master
```

### 2. Load Development Tools

```powershell
# Load Git quick commands
. .\git_quick_commands.ps1

# Or load aliases
. .\aliases.ps1
```

### 3. Understand the Project

**Read these files in order:**
1. `PROJECT_KNOWLEDGE_BASE.md` - Complete project context
2. `DEVELOPMENT_WORKFLOW.md` - How to work on this project
3. `QUICK_WORKFLOW.md` - Quick commands reference

## 📋 Essential Information

### Project Structure
- **Frontend**: `src/` (React + TypeScript + Vite)
- **Backend**: `server/` (Node.js + Express)
- **Build Output**: `medarion-dist/` or `dist/`
- **Config**: `cpanel-config.json` (SSH/deployment config)

### Key Commands

```powershell
# Quick save
git-save "Description"

# Quick deploy
.\qd.ps1 -Message "Changes" -Deploy

# Build frontend
npm run build

# Start development
npm start
```

### Deployment

**To deploy to cPanel:**
```powershell
.\qd.ps1 -Message "Your changes" -Deploy
```

This will:
1. Commit changes
2. Push to GitHub
3. Build frontend
4. Deploy to cPanel
5. Restart backend

## 🎯 Working on Tasks

### Before Starting

1. **Pull latest:**
   ```powershell
   git-pull
   ```

2. **Create branch (if working on feature):**
   ```powershell
   git-branch-new "feature/your-feature"
   ```

3. **Understand context:**
   - Read relevant documentation
   - Check `PROJECT_KNOWLEDGE_BASE.md`

### While Working

1. **Make changes**
2. **Test locally** (if possible)
3. **Commit often:**
   ```powershell
   git-save "WIP: Description"
   ```

### When Done

1. **Final commit:**
   ```powershell
   git-save "Feature complete: Description"
   ```

2. **Push to GitHub:**
   ```powershell
   git-push "Feature complete"
   ```

3. **Deploy (if ready):**
   ```powershell
   .\qd.ps1 -Message "Deploy feature" -Deploy
   ```

## 🔐 Important Notes

### Sensitive Files (Never Commit)
- `cpanel-config.json` - SSH credentials
- `.env` files - Environment variables
- `*.ppk`, `*.pem` - SSH keys

These are in `.gitignore` - don't commit them!

### Server Access
- **SSH Host**: `server1.medarion.africa`
- **Frontend**: https://medarion.africa
- **Backend API**: https://api.medarion.africa

### Database
- **Production**: `medasnnc_medarion` (on cPanel)
- **Local**: `medarion_platform` (XAMPP)

## 📚 Documentation Files

- `PROJECT_KNOWLEDGE_BASE.md` - **START HERE** - Complete reference
- `DEVELOPMENT_WORKFLOW.md` - Development workflows
- `MULTI_AGENT_WORKFLOW.md` - Working with multiple agents
- `QUICK_WORKFLOW.md` - Quick commands
- `WORKING_ENVIRONMENT.md` - Server and deployment details
- `README.md` - Project overview

## ⚡ Quick Reference

**Most Common Commands:**
```powershell
git-pull                    # Get latest
git-save "msg"             # Quick commit
git-push "msg"             # Commit and push
.\qd.ps1 -Deploy           # Deploy to cPanel
npm run build              # Build frontend
npm start                  # Start dev servers
```

**Need Help?**
- Check `PROJECT_KNOWLEDGE_BASE.md` for project details
- Check `DEVELOPMENT_WORKFLOW.md` for workflows
- Check `QUICK_WORKFLOW.md` for commands

---

**You're ready to start!** 🚀



