# Cursor Memory - Medarion Project Environment

**This file serves as Cursor's memory for the Medarion project environment.**
**Reference this file when resuming work after PC restart or in new sessions.**

---

## 🔐 SSH Connection (CRITICAL - Use This First)

### Primary SSH Configuration
- **Host:** `server1.medarion.africa`
- **Username:** `root`
- **Port:** `22`
- **Key File:** `C:\Users\xone\.ssh\medarionput.ppk`
- **Password (fallback):** `RgIyt5SEkc4E]nmp`
- **Config File:** `cpanel-config.json` (in project root)

### Pageant Setup (After PC Restart)
1. **Start Pageant** (from Start Menu or PuTTY folder)
2. **Load SSH Key:**
   - Right-click Pageant icon in system tray
   - Click "Add Key"
   - Select: `C:\Users\xone\.ssh\medarionput.ppk`
   - Enter passphrase if prompted (ONCE per session)
3. **Verify:** Key should appear in Pageant window

### Passphrase Information
- **Pageant does NOT use passphrases** - it's a key agent
- Your `.ppk` file may have a passphrase
- You'll enter it ONCE when loading the key in Pageant
- After loading, Pageant handles all authentication automatically
- No need to enter passphrase for each SSH command

### PuTTY Tools Paths
- **PSCP:** `C:\Program Files\PuTTY\pscp.exe` (file upload)
- **PLINK:** `C:\Program Files\PuTTY\plink.exe` (SSH commands)
- **Pageant:** `C:\Program Files\PuTTY\pageant.exe` (key agent)

---

## 🖥️ Server Paths (CRITICAL)

### Frontend Deployment
- **Local Build:** `medarion-dist/` (after `npm run build`)
- **Server Path:** `/home/medasnnc/public_html/`
- **Upload Command:**
  ```powershell
  $config = Get-Content "cpanel-config.json" | ConvertFrom-Json
  & "C:\Program Files\PuTTY\pscp.exe" -P $config.ssh.port -r "medarion-dist\*" "$($config.ssh.username)@$($config.ssh.host):/home/medasnnc/public_html/"
  ```

### Backend Deployment
- **Server Path:** `/home/medasnnc/api.medarion.africa/`
- **Routes Path:** `/home/medasnnc/api.medarion.africa/routes/`
- **Server File:** `/home/medasnnc/api.medarion.africa/server.js`
- **PM2 Path:** `/opt/cpanel/ea-nodejs22/bin/pm2`
- **PM2 Process:** `medarion-backend`

### Backend Restart Command
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
& "C:\Program Files\PuTTY\plink.exe" -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
```

---

## 📦 Project Structure

### Local Development
- **Workspace:** `C:\xampp\htdocs\medarion`
- **Frontend Source:** `src/`
- **Backend Source:** `server/`
- **Build Output:** `medarion-dist/`
- **Config File:** `cpanel-config.json`

### Key Files
- `WORKING_ENVIRONMENT.md` - Complete environment documentation
- `QUICK_REFERENCE.md` - Quick command reference
- `BACKEND_SERVER_INFO.md` - Backend server details
- `cpanel-config.json` - SSH and server configuration

---

## 🚀 Standard Deployment Workflow

### 1. Build Frontend
```powershell
npm run build
```

### 2. Upload Frontend
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscp = "C:\Program Files\PuTTY\pscp.exe"
& $pscp -P $config.ssh.port -r "medarion-dist\*" "$($config.ssh.username)@$($config.ssh.host):/home/medasnnc/public_html/"
```

### 3. Upload Backend (if changed)
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscp = "C:\Program Files\PuTTY\pscp.exe"
$host = $config.ssh.host
$user = $config.ssh.username
$port = $config.ssh.port

# Upload specific route files
& $pscp -P $port "server/routes/admin.js" "${user}@${host}:/home/medasnnc/api.medarion.africa/routes/admin.js"
& $pscp -P $port "server/routes/blog.js" "${user}@${host}:/home/medasnnc/api.medarion.africa/routes/blog.js"
& $pscp -P $port "server/routes/notifications.js" "${user}@${host}:/home/medasnnc/api.medarion.africa/routes/notifications.js"
```

### 4. Restart Backend
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plink = "C:\Program Files\PuTTY\plink.exe"
& $plink -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
```

---

## 🔍 Quick Verification Commands

### Test SSH Connection
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
& "C:\Program Files\PuTTY\plink.exe" -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "echo 'SSH OK'"
```

### Check Backend Status
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
& "C:\Program Files\PuTTY\plink.exe" -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "/opt/cpanel/ea-nodejs22/bin/pm2 status"
```

### View Backend Logs
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
& "C:\Program Files\PuTTY\plink.exe" -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend --lines 50"
```

---

## 💾 Database Information

- **Database Name:** `medasnnc_medarion`
- **Database User:** `medasnnc_medarion`
- **Database Password:** `Neorage94`
- **Host:** `localhost`
- **Port:** `3306`

### Auto-Created Tables
- `notifications` - Created automatically by backend
- `announcements` - Created automatically by backend
- `blog_categories` - Created automatically by backend
- `blog_posts` - Created automatically by backend

---

## 📝 Important Notes

### After PC Restart Checklist:
1. ✅ Start Pageant
2. ✅ Load SSH key (`C:\Users\xone\.ssh\medarionput.ppk`)
3. ✅ Enter passphrase if prompted (once)
4. ✅ Verify SSH connection works
5. ✅ Check backend server status
6. ✅ Ready to deploy!

### Pageant Passphrase:
- **DO NOT** add passphrase to Pageant itself
- Pageant is just a key agent
- Your `.ppk` file may have a passphrase
- Enter it ONCE when loading the key
- After that, Pageant handles everything automatically

### Server Access:
- **Frontend:** https://medarion.africa
- **Backend API:** https://api.medarion.africa/api
- **cPanel:** https://medarion.africa:2083

---

## 🔗 Related Documentation

- **Complete Reference:** `WORKING_ENVIRONMENT.md`
- **Quick Commands:** `QUICK_REFERENCE.md`
- **Backend Info:** `BACKEND_SERVER_INFO.md`
- **Config File:** `cpanel-config.json`

---

**Last Updated:** 2024-12-19  
**Status:** Active and Verified


