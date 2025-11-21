# Fast Frontend Iteration Guide

**See your frontend changes on the live site in seconds!**

## ⚡ Quick Commands

### Fastest: One-Command Deploy
```powershell
.\quick_frontend_iteration.ps1
```
Builds and deploys frontend in one go.

### Watch Mode: Auto-Deploy on Changes
```powershell
.\quick_frontend_iteration.ps1 -Watch
```
Watches `src/` directory and automatically deploys when you save files.

### Build Only
```powershell
.\quick_frontend_iteration.ps1 -Build
```
Just builds, doesn't deploy. Good for testing locally first.

### Deploy Only
```powershell
.\quick_frontend_iteration.ps1 -Deploy
```
Deploys existing build. Use after building locally.

## 🚀 Recommended Workflow

### Option 1: Watch Mode (Best for Active Development)

**Terminal 1:**
```powershell
# Start watch mode
.\quick_frontend_iteration.ps1 -Watch
```

**Terminal 2:**
```powershell
# Start dev server (optional, for local testing)
npm run dev
```

**Now:**
1. Edit files in Cursor
2. Save (Ctrl+S)
3. Watch mode detects changes
4. Auto-builds and deploys
5. View on https://medarion.africa (hard refresh: Ctrl+F5)

### Option 2: Manual Deploy (More Control)

```powershell
# 1. Make changes in Cursor
# 2. Save files
# 3. Deploy
.\quick_frontend_iteration.ps1

# 4. View changes
Start-Process "https://medarion.africa"
```

### Option 3: Build Locally First

```powershell
# 1. Build and test locally
.\quick_frontend_iteration.ps1 -Build
npm run preview  # Test locally

# 2. If good, deploy
.\quick_frontend_iteration.ps1 -Deploy
```

## 📋 Typical Frontend Development Session

### Morning Setup:
```powershell
# 1. Pull latest
git-pull

# 2. Start watch mode (in separate terminal)
.\quick_frontend_iteration.ps1 -Watch
```

### During Development:
1. **Edit files** in Cursor (`src/` directory)
2. **Save** (Ctrl+S)
3. **Wait 30 seconds** (watch mode checks every 30s)
4. **See changes** on https://medarion.africa
5. **Hard refresh** (Ctrl+F5) if changes don't show

### When Done:
```powershell
# Stop watch mode (Ctrl+C)

# Commit changes
git-save "Frontend: Description of changes"

# Or full workflow
.\qd.ps1 -Message "Frontend updates" -Deploy
```

## 🎯 Fast Iteration Tips

### 1. Use Watch Mode
- Start once at beginning of session
- Let it run in background
- Focus on coding, deployment happens automatically

### 2. Hard Refresh Browser
- **Chrome/Edge**: Ctrl+F5 or Ctrl+Shift+R
- **Firefox**: Ctrl+F5 or Ctrl+Shift+R
- Clears cache and shows latest changes

### 3. Browser DevTools
- Keep DevTools open (F12)
- Check Network tab to see if new files loaded
- Check Console for errors

### 4. Quick Testing
```powershell
# Test locally first (faster feedback)
npm run dev
# Then deploy when ready
.\quick_frontend_iteration.ps1
```

## 🔄 Complete Frontend Workflow

### Daily Session:
```powershell
# 1. Start watch mode
.\quick_frontend_iteration.ps1 -Watch

# 2. Work in Cursor
# - Edit src/ files
# - Save frequently
# - Watch mode auto-deploys

# 3. View changes
# - Open https://medarion.africa
# - Hard refresh (Ctrl+F5)

# 4. When done
# - Stop watch (Ctrl+C)
# - Commit: git-save "Description"
```

### Quick Fixes:
```powershell
# Make fix, save, deploy
.\quick_frontend_iteration.ps1

# View immediately
Start-Process "https://medarion.africa"
```

## 📊 Performance

**Typical Deployment Time:**
- Build: ~15-20 seconds
- Upload: ~5-10 seconds
- **Total: ~20-30 seconds**

**With Watch Mode:**
- Detects changes: 30 seconds (check interval)
- Build + Deploy: ~20-30 seconds
- **Total: ~50-60 seconds from save to live**

## 🛠️ Troubleshooting

### Changes Not Showing?
1. **Hard refresh**: Ctrl+F5
2. **Clear browser cache**: Ctrl+Shift+Delete
3. **Check deployment**: Look for "✅ Frontend deployed!" message
4. **Check build**: Verify `medarion-dist/` folder exists

### Watch Mode Not Detecting Changes?
1. **Check interval**: Default is 30 seconds, wait a bit
2. **File location**: Only watches `src/` directory
3. **File types**: Watches `.tsx`, `.ts`, `.css`, `.js`, `.json`

### Build Fails?
1. **Check errors**: Look at build output
2. **Clear cache**: `npm cache clean --force`
3. **Reinstall**: `npm install`
4. **Check Node version**: `node --version` (should be 18+)

### Deployment Fails?
1. **Check SSH**: Verify Pageant is running with key loaded
2. **Check config**: Verify `cpanel-config.json` exists
3. **Check connection**: Test SSH manually
4. **Retry**: Run `.\quick_frontend_iteration.ps1` again

## 💡 Pro Tips

1. **Keep Watch Mode Running**: Start once, let it run all day
2. **Use Multiple Monitors**: Code on one, browser on another
3. **Browser Extensions**: Use "Auto Refresh" extensions if needed
4. **Git Integration**: Commit after each feature, not each deploy
5. **Test Locally First**: Use `npm run dev` for instant feedback

## 📚 Related Commands

```powershell
# Full deployment (frontend + backend)
.\qd.ps1 -Deploy

# Just frontend (fastest)
.\quick_frontend_iteration.ps1

# Watch mode
.\quick_frontend_iteration.ps1 -Watch

# Build only
.\quick_frontend_iteration.ps1 -Build
```

## 🎯 Workflow Comparison

### Old Way:
1. Make changes
2. `npm run build` (20s)
3. `git add .` (5s)
4. `git commit` (5s)
5. `git push` (10s)
6. Manual upload (30s)
7. **Total: ~70 seconds**

### New Way (Watch Mode):
1. Make changes
2. Save (auto-detected in 30s)
3. Auto-build + deploy (30s)
4. **Total: ~60 seconds, fully automated!**

### New Way (Manual):
1. Make changes
2. `.\quick_frontend_iteration.ps1` (30s)
3. **Total: ~30 seconds!**

---

**Start fast iteration now:**
```powershell
.\quick_frontend_iteration.ps1 -Watch
```

Then just code and save - deployment happens automatically! 🚀

