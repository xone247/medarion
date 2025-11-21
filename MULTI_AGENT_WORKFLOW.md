# Multi-Agent Development Workflow

This guide explains how to use multiple Cursor agents (including Cursor Online) simultaneously to work on different parts of your project faster.

## 🎯 Why Multi-Agent Development?

- **Parallel Work**: Different agents can work on different features simultaneously
- **Faster Development**: Multiple tasks completed at once
- **Remote Access**: Use Cursor Online from anywhere
- **Specialized Agents**: Use different agents for different tasks (frontend, backend, deployment)

## 🔧 Setup for Multi-Agent Work

### 1. Git Repository (Already Done ✅)

Your repository is already set up at:
- **GitHub**: https://github.com/xone247/medarion
- **Branch**: `master`

### 2. Agent Context Files

Each agent needs to understand the project. Key files to reference:

**Essential Context Files:**
- `PROJECT_KNOWLEDGE_BASE.md` - Complete project reference
- `DEVELOPMENT_WORKFLOW.md` - Development workflows
- `WORKING_ENVIRONMENT.md` - Server and deployment info
- `QUICK_WORKFLOW.md` - Quick commands
- `README.md` - Project overview

**For New Agents:**
When starting with a new agent (including Cursor Online), tell them:
```
"See PROJECT_KNOWLEDGE_BASE.md for complete project context.
See DEVELOPMENT_WORKFLOW.md for how to work on this project.
Use .\qd.ps1 -Deploy to deploy changes."
```

### 3. Branch Strategy for Multi-Agent Work

**Recommended Approach:**

```powershell
# Agent 1: Working on frontend
git-branch-new "feature/frontend-improvements"
# Make changes, commit
git-push "Frontend updates"

# Agent 2: Working on backend (in parallel)
git-branch-new "feature/backend-api"
# Make changes, commit
git-push "Backend API updates"

# Later: Merge both
git-branch-switch "master"
git merge feature/frontend-improvements
git merge feature/backend-api
git-push "Merge features"
.\qd.ps1 -Deploy
```

## 🚀 Workflow for Multiple Agents

### Scenario 1: Local + Cursor Online

**Local Agent (Your PC):**
```powershell
# Working on frontend
git-branch-new "feature/new-ui"
# Make changes
git-save "UI improvements"
git-push "UI updates"
```

**Cursor Online Agent:**
```powershell
# Clone or pull latest
git clone https://github.com/xone247/medarion.git
# Or if already cloned:
git-pull

# Working on backend
git-branch-new "feature/api-endpoints"
# Make changes
git-save "New API endpoints"
git-push "API updates"
```

**Merge Both:**
```powershell
# On local or online
git-branch-switch "master"
git merge feature/new-ui
git merge feature/api-endpoints
git-push "Merge parallel work"
.\qd.ps1 -Deploy
```

### Scenario 2: Multiple Local Agents

If you have multiple Cursor instances open:

**Agent 1 (Frontend):**
- Open: `src/` folder
- Reference: `PROJECT_KNOWLEDGE_BASE.md`
- Branch: `feature/frontend-task`

**Agent 2 (Backend):**
- Open: `server/` folder
- Reference: `PROJECT_KNOWLEDGE_BASE.md`
- Branch: `feature/backend-task`

**Agent 3 (Deployment/DevOps):**
- Open: Root folder
- Reference: `DEVELOPMENT_WORKFLOW.md`
- Branch: `feature/deployment-improvements`

## 📋 Agent Communication Protocol

### Starting a New Agent Session

**Tell the agent:**
```
"I'm working on the Medarion project. 
See PROJECT_KNOWLEDGE_BASE.md for complete context.
Current task: [describe what you want them to work on]
Use .\qd.ps1 -Deploy to deploy changes when done."
```

### Sharing Context Between Agents

**Use Git commits as communication:**
```powershell
# Agent 1 commits
git-save "Added user authentication UI"

# Agent 2 pulls and sees the changes
git-pull
# Now Agent 2 knows about the UI changes
```

### Avoiding Conflicts

**Best Practices:**
1. **Work on Different Files**: Each agent works on different parts
2. **Use Branches**: Always create feature branches
3. **Communicate via Commits**: Commit often with clear messages
4. **Pull Before Starting**: Always `git-pull` before starting work
5. **Merge Regularly**: Don't let branches diverge too much

## 🌐 Remote Deployment from Anywhere

### Using Cursor Online

1. **Clone Repository:**
   ```bash
   git clone https://github.com/xone247/medarion.git
   cd medarion
   ```

2. **Set Up Environment:**
   ```bash
   # Install dependencies
   npm run install:all
   
   # Load Git commands
   . ./git_quick_commands.ps1
   ```

3. **Make Changes:**
   - Edit files
   - Test locally (if possible)

4. **Deploy:**
   ```bash
   # Commit and push
   git-save "Remote changes"
   git-push "Remote updates"
   
   # Deploy to cPanel
   .\deploy_from_git.ps1
   ```

### Deployment Requirements

For deployment from anywhere, you need:
- ✅ Git repository (already set up)
- ✅ SSH access to cPanel (via `cpanel-config.json`)
- ⚠️ **Note**: `cpanel-config.json` contains sensitive credentials
  - **Option 1**: Store securely, don't commit to Git
  - **Option 2**: Use environment variables
  - **Option 3**: Use GitHub Secrets for CI/CD

## 🔐 Secure Multi-Agent Setup

### Option 1: Environment Variables (Recommended)

Create `cpanel-config.json.example` (already exists):
```json
{
  "ssh": {
    "host": "YOUR_HOST",
    "username": "YOUR_USER",
    "port": 22
  }
}
```

Each agent creates their own `cpanel-config.json` from the example.

### Option 2: GitHub Secrets (For CI/CD)

If using GitHub Actions:
1. Store credentials in GitHub Secrets
2. Use in deployment workflows
3. No need to share credentials

### Option 3: Secure Storage

- Use password manager for credentials
- Share via secure channel
- Never commit to Git

## 📝 Agent Task Assignment Examples

### Example 1: Frontend + Backend Parallel Work

**Agent 1 (Frontend):**
```
Task: Improve dashboard UI
Branch: feature/dashboard-ui
Files: src/pages/AdminDashboard.tsx, src/components/*
```

**Agent 2 (Backend):**
```
Task: Add new API endpoint
Branch: feature/new-endpoint
Files: server/routes/admin.js, server/routes/api.js
```

**Result:**
- Both work simultaneously
- No conflicts (different files)
- Merge when both complete

### Example 2: Feature + Bug Fix

**Agent 1 (Feature):**
```
Task: Add new feature
Branch: feature/new-feature
```

**Agent 2 (Bug Fix):**
```
Task: Fix critical bug
Branch: hotfix/critical-bug
```

**Result:**
- Bug fix can be merged and deployed immediately
- Feature continues development
- No blocking

## 🛠️ Tools for Multi-Agent Work

### Git Commands (Already Set Up)

```powershell
# Load commands
. .\git_quick_commands.ps1

# Quick operations
git-status          # Check status
git-save "msg"      # Quick commit
git-push "msg"      # Commit and push
git-pull            # Get latest
git-branch-new "name"  # New branch
```

### Deployment Scripts

```powershell
# Quick deploy
.\qd.ps1 -Message "Changes" -Deploy

# Full deployment
.\deploy_from_git.ps1
```

## 📚 Quick Reference for Agents

**For any new agent, share this:**

1. **Repository**: https://github.com/xone247/medarion
2. **Key Files**:
   - `PROJECT_KNOWLEDGE_BASE.md` - Everything about the project
   - `DEVELOPMENT_WORKFLOW.md` - How to work
   - `QUICK_WORKFLOW.md` - Quick commands
3. **Deploy**: `.\qd.ps1 -Deploy`
4. **Git**: Use `git_quick_commands.ps1` functions

## ✅ Checklist for Multi-Agent Session

- [ ] All agents have access to Git repository
- [ ] Each agent working on different branch/feature
- [ ] Agents pull latest before starting: `git-pull`
- [ ] Agents commit often: `git-save "description"`
- [ ] Agents push regularly: `git-push "description"`
- [ ] Merge conflicts resolved before deployment
- [ ] Test before deploying: `.\qd.ps1 -Deploy`
- [ ] Verify deployment: Check https://medarion.africa

## 🎯 Best Practices

1. **One Feature Per Branch**: Each agent gets their own branch
2. **Small, Frequent Commits**: Commit often with clear messages
3. **Pull Before Push**: Always pull latest before pushing
4. **Test Before Deploy**: Test locally before deploying
5. **Clear Communication**: Use commit messages to communicate
6. **Regular Merges**: Don't let branches get too far apart

---

**Happy Multi-Agent Development!** 🚀

