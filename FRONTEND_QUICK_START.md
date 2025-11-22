# ⚡ Frontend Quick Start - See Changes Fast!

## 🚀 One Command to Deploy Frontend

```powershell
.\qfi.ps1
```

That's it! Builds and deploys your frontend in ~30 seconds.

## 👀 Watch Mode (Auto-Deploy)

**Start once, deploy automatically:**

```powershell
.\qfi.ps1 -Watch
```

Now:
1. Edit files in Cursor
2. Save (Ctrl+S)
3. Wait ~60 seconds
4. Changes are live on https://medarion.africa

**Press Ctrl+C to stop watch mode.**

## 📋 All Options

```powershell
.\qfi.ps1              # Build + Deploy (default)
.\qfi.ps1 -Watch       # Auto-deploy on changes
.\qfi.ps1 -Build       # Just build
.\qfi.ps1 -Deploy      # Just deploy (assumes built)
```

## 🎯 Typical Workflow

### Morning:
```powershell
# Start watch mode
.\qfi.ps1 -Watch
```

### During Work:
- Edit `src/` files in Cursor
- Save frequently
- Watch mode auto-deploys
- View on https://medarion.africa (Ctrl+F5 to refresh)

### When Done:
```powershell
# Stop watch (Ctrl+C)
# Commit changes
git-save "Frontend: Description"
```

## 💡 Tips

- **Hard Refresh**: Ctrl+F5 to see changes
- **Watch Mode**: Best for active development
- **Manual Deploy**: Best for testing before deploying
- **Build First**: Use `-Build` to test locally, then `-Deploy`

## 📚 Full Guide

See `FRONTEND_ITERATION_GUIDE.md` for complete details.

---

**Start now:**
```powershell
.\qfi.ps1 -Watch
```

Then just code and save! 🚀



