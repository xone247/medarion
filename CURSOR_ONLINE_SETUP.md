# 💻 Cursor Online Setup Guide

**Work on your project from anywhere using Cursor Online!**

## 🎯 Quick Setup

### Step 1: Open Cursor Online
1. Go to **cursor.sh** or your Cursor account
2. Sign in with your account
3. Open a new workspace

### Step 2: Clone Your Repository
```bash
# In Cursor Online terminal
git clone https://github.com/xone247/medarion.git
cd medarion
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Set Up Configuration
```bash
# Create cPanel config (you'll need your server credentials)
# This file is NOT in Git (for security)
```

Create `cpanel-config.json`:
```json
{
  "ssh": {
    "host": "your-server.com",
    "username": "your-username",
    "port": 22,
    "plinkPath": "C:\\path\\to\\plink.exe"
  }
}
```

### Step 5: Start Working!
```bash
# Pull latest
git pull

# Make changes
# Deploy when ready
.\qfi.ps1
```

## 🔄 Daily Workflow in Cursor Online

### Morning:
```bash
cd medarion
git pull
```

### During Work:
1. **Edit files** in Cursor
2. **Save** (Ctrl+S)
3. **Deploy** when ready: `.\qfi.ps1`
4. **Commit** when done: `git add -A && git commit -m "message" && git push`

### End of Day:
```bash
git add -A
git commit -m "Work done today"
git push
```

## 📋 What Works in Cursor Online

### ✅ Works:
- All Git operations
- Code editing
- File management
- Terminal commands
- npm install/build
- Deployment scripts (if SSH is set up)

### ⚠️ May Need Setup:
- SSH keys for deployment (set up SSH agent)
- cPanel config (create manually)
- Local dev server (if needed)

## 🚀 Deployment from Cursor Online

### Option 1: Use Deployment Scripts
```bash
# Frontend only
.\qfi.ps1

# Full stack
.\qd.ps1 -Deploy
```

### Option 2: Manual Git Push
```bash
git add -A
git commit -m "Changes"
git push
```

Then deploy from a computer with SSH access, or set up SSH in Cursor Online.

## 🔐 Security Best Practices

1. **Never commit sensitive files:**
   - `cpanel-config.json` is in `.gitignore`
   - `.env` files are in `.gitignore`
   - SSH keys are in `.gitignore`

2. **Use environment variables:**
   - Store secrets in environment variables
   - Use `.env.example` as template

3. **Keep credentials local:**
   - Each computer has its own `cpanel-config.json`
   - Don't share credentials in chat

## 💡 Tips for Cursor Online

1. **Keep terminal open:** Use it for Git and deployment
2. **Use branches:** Create feature branches for new work
3. **Commit often:** Small, frequent commits are better
4. **Pull before starting:** Always `git pull` first
5. **Push when done:** Don't leave work uncommitted

## 🎯 Example Session

```bash
# 1. Open Cursor Online
# 2. Clone repo
git clone https://github.com/xone247/medarion.git
cd medarion

# 3. Install dependencies
npm install

# 4. Set up config (one-time)
# Create cpanel-config.json with your credentials

# 5. Pull latest
git pull

# 6. Create branch for new feature
git checkout -b feature/new-feature

# 7. Make changes in Cursor
# Edit files, save, etc.

# 8. Deploy to test
.\qfi.ps1

# 9. Commit when done
git add -A
git commit -m "Add new feature"
git push origin feature/new-feature

# 10. Merge when ready (from main computer or GitHub)
```

## 📚 All Your Scripts Work

Every script you created works in Cursor Online:
- `.\qfi.ps1` - Fast frontend deployment
- `.\qd.ps1` - Full deployment
- `.\git_quick_commands.ps1` - Git shortcuts
- All other scripts

## ✅ Verification Checklist

- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] cPanel config created
- [ ] Can pull latest (`git pull`)
- [ ] Can make changes
- [ ] Can commit (`git commit`)
- [ ] Can push (`git push`)
- [ ] Can deploy (if SSH set up)

---

**You're all set!** Work from anywhere with Cursor Online! 🚀

