# Vite Server Stability - Why It Stops and How to Fix

## 🔍 Common Reasons Vite Stops After Changes

### 1. **Syntax Errors** (Most Common)
- **Problem:** TypeScript/JSX syntax errors cause Vite to crash
- **Solution:** Always check for linter errors before saving
- **Check:** Run `npm run lint` or check Cursor's error panel

### 2. **Import Errors**
- **Problem:** Missing modules or incorrect import paths
- **Solution:** Ensure all imports are correct and modules are installed
- **Check:** Look for red underlines in imports

### 3. **File Watching Issues (Windows)**
- **Problem:** Windows file watcher can fail with too many files
- **Solution:** Use polling mode or reduce watched files
- **Fix Applied:** Updated `vite.config.ts` to ignore build directories

### 4. **Memory Issues**
- **Problem:** Out of memory errors
- **Solution:** Increase Node.js memory limit
- **Current:** `NODE_OPTIONS="--max-old-space-size=512"`

### 5. **HMR (Hot Module Replacement) Failures**
- **Problem:** HMR can't update certain files
- **Solution:** Improved HMR config in `vite.config.ts`
- **Fix Applied:** Better error overlay and HMR settings

### 6. **Background Process Issues**
- **Problem:** When running in background, errors aren't visible
- **Solution:** Check terminal output or run in foreground to see errors

## ✅ Fixes Applied

1. **Updated `vite.config.ts`:**
   - Better file watching (ignores build dirs)
   - Improved HMR configuration
   - Error overlay enabled
   - More resilient file system settings

2. **Better Error Handling:**
   - Vite now shows errors in browser overlay
   - Console errors are more visible

## 🚀 Recommended Workflow

### Option 1: Run in Foreground (See Errors)
```powershell
# Terminal 1 - Backend
cd C:\xampp\htdocs\medarion
npm run server:dev

# Terminal 2 - Frontend (see errors here)
cd C:\xampp\htdocs\medarion
npm run dev
```

### Option 2: Check for Errors Before Saving
1. Check Cursor's error panel (bottom right)
2. Fix any red underlines
3. Save file
4. Server should stay running

### Option 3: Clear Cache and Restart
```powershell
# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Restart server
npm run dev
```

## 🔧 If Server Keeps Stopping

1. **Check Terminal Output:**
   - Look for error messages
   - Common: "Cannot find module", "Unexpected token", etc.

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab

3. **Check for Syntax Errors:**
   ```powershell
   npm run lint
   ```

4. **Clear Cache:**
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite
   npm run dev
   ```

5. **Increase Memory:**
   ```powershell
   $env:NODE_OPTIONS="--max-old-space-size=1024"
   npm run dev
   ```

## 📝 Best Practices

1. **Fix errors before saving** - Check linter first
2. **Save files one at a time** - Don't save multiple files with errors
3. **Watch terminal output** - Errors appear there first
4. **Use TypeScript** - Catches errors before runtime
5. **Clear cache regularly** - If issues persist

## 🐛 Debug Mode

To see more detailed errors:
```powershell
$env:DEBUG="vite:*"
npm run dev
```

This will show detailed Vite logging.

