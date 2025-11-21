# How to Fix 500 Errors - Complete Guide

## 🔴 Current Issue

All API endpoints are returning 500 errors because the **backend Node.js server is not running** on port 3001.

## ✅ What Has Been Fixed

1. **All TypeScript syntax errors fixed** - Removed 16 instances of `(req as any)` from `server/routes/admin.js`
2. **Server configuration verified** - `server/.env` is correctly configured
3. **Database connection tested** - MySQL is running and connection works

## 🚀 How to Start the Backend Server

### Option 1: Use the Startup Script (Easiest)

1. Open PowerShell in the project root (`C:\xampp\htdocs\medarion`)
2. Run:
   ```powershell
   .\start_backend_server.ps1
   ```
3. Check the output for any errors

### Option 2: Manual Start

1. Open PowerShell
2. Navigate to server directory:
   ```powershell
   cd C:\xampp\htdocs\medarion\server
   ```
3. Start the server:
   ```powershell
   node server.js
   ```

### Option 3: Check the Server Window

A server window should have been opened automatically. Look for:
- ✅ **Success**: "Server running on port 3001"
- ❌ **Error**: Any error messages (database connection, port in use, etc.)

## 🔍 What to Look For

When the server starts, you should see:
```
✅ Database connected successfully
🚀 Server running on port 3001
📊 Health check: http://localhost:3001/health
🔗 API base URL: http://localhost:3001/api
🌍 Environment: development
```

## ⚠️ Common Issues and Solutions

### Issue 1: Database Connection Failed
**Error**: `❌ Failed to connect to database`

**Solution**:
1. Make sure XAMPP MySQL is running
2. Check `server/.env` has correct database credentials:
   ```
   DB_HOST=localhost
   DB_NAME=medarion_platform
   DB_USER=root
   DB_PASSWORD=
   ```

### Issue 2: Port 3001 Already in Use
**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
1. Find and stop the process using port 3001:
   ```powershell
   netstat -ano | findstr :3001
   ```
2. Kill the process (replace PID with actual process ID):
   ```powershell
   taskkill /PID <PID> /F
   ```
3. Restart the server

### Issue 3: Missing Dependencies
**Error**: `Cannot find module 'xxx'`

**Solution**:
```powershell
cd server
npm install
```

### Issue 4: Syntax Errors
**Error**: `SyntaxError: Unexpected identifier`

**Solution**: All syntax errors have been fixed. If you see this, the file may have been reverted. Check `server/routes/admin.js` for any `(req as any)` and replace with `req`.

## ✅ Verification Steps

Once the server is running:

1. **Test health endpoint**:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
   ```
   Should return: `{"status":"ok"}`

2. **Test modules endpoint**:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/api/admin/modules?page=1&limit=5" -UseBasicParsing
   ```
   Should return JSON with modules data

3. **Refresh browser** - The 500 errors should disappear

## 🎯 Expected Result

Once the server is running:
- ✅ No more 500 errors in browser console
- ✅ Modules load from database
- ✅ All API endpoints work correctly
- ✅ Application functions normally

## 📝 Quick Checklist

- [ ] XAMPP MySQL is running
- [ ] Backend server is running on port 3001
- [ ] Health endpoint responds: `http://localhost:3001/health`
- [ ] Browser refreshed after server started
- [ ] No errors in server window

---

**Need Help?** Check the server window output for specific error messages and refer to the solutions above.

