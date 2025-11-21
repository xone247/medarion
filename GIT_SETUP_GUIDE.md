# Git & GitHub Setup Guide

This guide will help you set up Git and connect your Medarion project to GitHub.

## 🎯 Quick Setup

Run the automated setup script:

```powershell
.\setup_git_github.ps1
```

The script will guide you through:
1. ✅ Checking Git installation
2. ✅ Initializing Git repository
3. ✅ Configuring Git user (name and email)
4. ✅ Setting up GitHub authentication
5. ✅ Creating/connecting to GitHub repository

## 📋 Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Initialize Git Repository

```bash
git init
```

### 2. Configure Git User

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Add All Files (Sensitive files are already excluded)

```bash
git add .
```

### 4. Make Initial Commit

```bash
git commit -m "Initial commit"
```

### 5. Create GitHub Repository

1. Go to: https://github.com/new
2. Enter repository name (e.g., `medarion`)
3. Choose public or private
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

### 6. Connect Local Repository to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/medarion.git
git branch -M main
git push -u origin main
```

## 🔐 GitHub Authentication Methods

### Option 1: GitHub CLI (Recommended - Easiest)

1. **Install GitHub CLI:**
   ```powershell
   winget install GitHub.cli
   ```

2. **Authenticate:**
   ```bash
   gh auth login
   ```
   This will open your browser for authentication.

3. **Create repository:**
   ```bash
   gh repo create medarion --public --source=. --remote=origin
   ```

### Option 2: Personal Access Token (PAT)

1. **Create a token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a name (e.g., "Medarion Project")
   - Select scope: `repo` (full control)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Use the token:**
   - When Git prompts for password, use the token instead
   - Username: Your GitHub username
   - Password: The token you copied

### Option 3: SSH Key (Most Secure)

1. **Check if you have an SSH key:**
   ```powershell
   Test-Path ~/.ssh/id_rsa.pub
   ```

2. **If no key exists, generate one:**
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

3. **Copy your public key:**
   ```powershell
   Get-Content ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

5. **Use SSH URL for remote:**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/medarion.git
   ```

## ✅ Verification

After setup, verify everything works:

```bash
# Check Git status
git status

# Check remote repository
git remote -v

# Test push (if repository exists)
git push origin main
```

## 🔒 Security Notes

### Files Automatically Excluded from Git

The following sensitive files are in `.gitignore` and will **never** be committed:

- ✅ `.env` files (environment variables)
- ✅ `cpanel-config.json` (server credentials)
- ✅ SSH keys (`*.ppk`, `*.pem`, `*.key`)
- ✅ Database exports (`*.sql` files)
- ✅ Log files (`*.log`)
- ✅ Build outputs (`dist/`, `node_modules/`)

### Best Practices

1. **Never commit sensitive data:**
   - Passwords
   - API keys
   - SSH keys
   - Database credentials

2. **Use environment variables:**
   - Store sensitive config in `.env` files
   - `.env` files are already in `.gitignore`

3. **Review before committing:**
   ```bash
   git status
   git diff
   ```

4. **Use meaningful commit messages:**
   ```bash
   git commit -m "Add user authentication feature"
   ```

## 📝 Common Git Commands

### Daily Workflow

```bash
# Check what changed
git status

# See changes in files
git diff

# Stage all changes
git add .

# Stage specific files
git add src/components/NewComponent.tsx

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

### Branching (Advanced)

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Merge branch
git checkout main
git merge feature/new-feature

# Delete branch
git branch -d feature/new-feature
```

## 🆘 Troubleshooting

### Problem: "Authentication failed"

**Solution:**
- If using PAT: Make sure you're using the token as password, not your GitHub password
- If using SSH: Verify your SSH key is added to GitHub
- Try: `gh auth login` (if GitHub CLI is installed)

### Problem: "Repository not found"

**Solution:**
- Verify repository URL: `git remote -v`
- Check repository exists on GitHub
- Verify you have access to the repository

### Problem: "Permission denied"

**Solution:**
- Check your SSH key is added to GitHub (if using SSH)
- Verify your PAT has correct permissions (if using PAT)
- Try: `gh auth refresh` (if GitHub CLI is installed)

### Problem: "Files still showing as untracked"

**Solution:**
- Check if files are in `.gitignore`
- If they should be tracked, remove them from `.gitignore`
- If they shouldn't be tracked, they're correctly ignored

## 📚 Additional Resources

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com
- **GitHub CLI:** https://cli.github.com/manual/
- **Project Knowledge Base:** `PROJECT_KNOWLEDGE_BASE.md`

---

**Need help?** Check `PROJECT_KNOWLEDGE_BASE.md` for complete project information.

