# Medarion Working Environment Documentation

**Last Updated:** 2024-12-19  
**Purpose:** Complete reference for the development and deployment environment

---

## 📋 Table of Contents
1. [SSH Connection Details](#ssh-connection-details)
2. [Server Information](#server-information)
3. [Deployment Process](#deployment-process)
4. [Backend Server Management](#backend-server-management)
5. [Database Information](#database-information)
6. [Development Setup](#development-setup)
7. [Important Paths](#important-paths)
8. [Troubleshooting](#troubleshooting)

---

## 🔐 SSH Connection Details

### Connection Configuration
- **SSH Host:** `server1.medarion.africa`
- **SSH Port:** `22`
- **SSH Username:** `root`
- **SSH Key Path:** `C:\Users\xone\.ssh\medarionput.ppk`
- **SSH Password (fallback):** `RgIyt5SEkc4E]nmp`
- **Authentication Method:** SSH Key (via PuTTY/Pageant) - Primary, Password as fallback

### SSH Key Setup

#### Using PuTTY/Pageant (Recommended)
1. **Pageant Setup:**
   - Pageant is a PuTTY authentication agent that holds your private keys in memory
   - **DO NOT add passphrase to Pageant** - Pageant itself doesn't use passphrases
   - The private key file (`.ppk`) may have a passphrase, but Pageant will prompt for it once when you load the key
   - After loading the key in Pageant, you won't need to enter the passphrase again until you restart Pageant

2. **Loading SSH Key in Pageant:**
   ```
   - Open Pageant (usually in system tray)
   - Right-click Pageant icon → "Add Key"
   - Select your .ppk file
   - Enter passphrase if prompted (only once per session)
   - Key will remain loaded until Pageant is closed
   ```

3. **PuTTY Tools Location:**
   - **PuTTY:** `C:\Program Files\PuTTY\putty.exe`
   - **PSCP (SCP):** `C:\Program Files\PuTTY\pscp.exe`
   - **PLINK (SSH):** `C:\Program Files\PuTTY\plink.exe`
   - **Pageant:** `C:\Program Files\PuTTY\pageant.exe`

4. **Configuration File:**
   - Location: `cpanel-config.json` (in project root)
   - Contains: SSH host, username, port, and other connection details

### SSH Key Passphrase
- **If your SSH key has a passphrase:**
  - You'll be prompted once when loading the key in Pageant
  - After loading, Pageant handles authentication automatically
  - No need to enter passphrase for each command
- **If your SSH key doesn't have a passphrase:**
  - Simply load the key in Pageant
  - No prompts will appear

### Testing SSH Connection
```powershell
# Test SSH connection
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$sshHost = $config.ssh.host  # server1.medarion.africa
$sshUser = $config.ssh.username  # root
$sshPort = $config.ssh.port  # 22
$keyPath = $config.ssh.keyPath  # C:\Users\xone\.ssh\medarionput.ppk

# Test with key (if Pageant is running)
& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" "echo 'SSH connection successful'"

# Or test with explicit key path
& $plinkPath -P $sshPort -i $keyPath -batch "${sshUser}@${sshHost}" "echo 'SSH connection successful'"
```

---

## 🖥️ Server Information

### Frontend Server (cPanel)
- **Domain:** `medarion.africa`
- **Server Path:** `/home/medasnnc/public_html/`
- **Upload Method:** SCP via PSCP
- **Deployment:** Upload `medarion-dist/*` to public_html

### Backend Server (Node.js)
- **Subdomain:** `api.medarion.africa`
- **Server Path:** `/home/medasnnc/api.medarion.africa/`
- **Node.js Version:** 22 (via cPanel)
- **PM2 Path:** `/opt/cpanel/ea-nodejs22/bin/pm2`
- **PM2 Process Name:** `medarion-backend`
- **Port:** `3001` (default, or from environment)
- **Server File:** `server.js` (in subdomain root)

### Database Server
- **Database Name:** `medasnnc_medarion`
- **Database User:** `medasnnc_medarion`
- **Host:** `localhost` (on cPanel server)
- **Connection:** Via Node.js backend using MySQL2

---

## 🚀 Deployment Process

### Frontend Deployment
```powershell
# 1. Build frontend
npm run build

# 2. Upload to server
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

& $pscpPath -P $sshPort -r "medarion-dist\*" "${sshUser}@${sshHost}:/home/medasnnc/public_html/"
```

### Backend Deployment
```powershell
# Upload specific backend files
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

# Upload routes
& $pscpPath -P $sshPort "server/routes/admin.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/routes/admin.js"
& $pscpPath -P $sshPort "server/routes/blog.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/routes/blog.js"
& $pscpPath -P $sshPort "server/routes/notifications.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/routes/notifications.js"

# Upload server.js if changed
& $pscpPath -P $sshPort "server/server.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/server.js"
```

### Restart Backend Server
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
```

---

## 🔧 Backend Server Management

### PM2 Commands
All PM2 commands must use the full path: `/opt/cpanel/ea-nodejs22/bin/pm2`

#### Start Server
```bash
cd /home/medasnnc/api.medarion.africa
/opt/cpanel/ea-nodejs22/bin/pm2 start server.js --name medarion-backend --log server.log
```

#### Stop Server
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 stop medarion-backend
```

#### Restart Server
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend
```

#### Check Status
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 status
```

#### View Logs
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend
```

#### Save Configuration (for auto-start)
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 save
/opt/cpanel/ea-nodejs22/bin/pm2 startup
```

### Server File Structure
```
/home/medasnnc/api.medarion.africa/
├── server.js                 # Main server file
├── routes/
│   ├── admin.js             # Admin routes (ads, announcements, users, blog, etc.)
│   ├── blog.js              # Blog routes (public blog, announcements public API)
│   ├── notifications.js     # Notification routes
│   ├── auth.js              # Authentication routes
│   └── ...                  # Other route files
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
└── node_modules/            # Dependencies
```

---

## 💾 Database Information

### Database Tables (Auto-Created)
The following tables are automatically created by the backend if they don't exist:

1. **notifications** - User notifications
2. **announcements** - Announcements for paid users
3. **blog_categories** - Blog post categories
4. **blog_posts** - Blog posts

### Manual Table Creation
If needed, tables can be created manually via SQL:
- See `create_announcements_table.sql` for announcements table structure
- Other tables are created automatically by backend routes

---

## 💻 Development Setup

### Local Development
- **Workspace:** `C:\xampp\htdocs\medarion`
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Build Command:** `npm run build`
- **Build Output:** `medarion-dist/`

### Environment Variables
- Frontend API base URL is configured in `src/config/api.ts`
- Backend uses `.env` file (if present) or environment variables
- Database credentials are in `server/config/database.js`

### Key Dependencies
- **Frontend:** React, React Router, Vite, TypeScript
- **Backend:** Express, MySQL2, JWT, bcrypt
- **Deployment Tools:** PuTTY (PSCP, PLINK, Pageant)

---

## 📁 Important Paths

### Local Paths
- **Project Root:** `C:\xampp\htdocs\medarion`
- **Frontend Source:** `src/`
- **Frontend Build:** `medarion-dist/`
- **Backend Source:** `server/`
- **Config File:** `cpanel-config.json`

### Server Paths
- **Frontend:** `/home/medasnnc/public_html/`
- **Backend:** `/home/medasnnc/api.medarion.africa/`
- **PM2:** `/opt/cpanel/ea-nodejs22/bin/pm2`

### API Endpoints
- **Frontend API Base:** `/api` (proxied via .htaccess)
- **Backend Base:** `https://api.medarion.africa/api`
- **Admin Routes:** `/api/admin/*`
- **Public Routes:** `/api/*` (companies, deals, etc.)
- **Blog Routes:** `/api/blog/*`
- **Notifications:** `/api/notifications/*`

---

## 🔄 Quick Reference Commands

### Complete Deployment (Frontend + Backend)
```powershell
# 1. Build frontend
npm run build

# 2. Upload frontend
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

# Upload frontend
& $pscpPath -P $sshPort -r "medarion-dist\*" "${sshUser}@${sshHost}:/home/medasnnc/public_html/"

# Upload backend files (if changed)
& $pscpPath -P $sshPort "server/routes/admin.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/routes/admin.js"
& $pscpPath -P $sshPort "server/routes/blog.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/routes/blog.js"
& $pscpPath -P $sshPort "server/routes/notifications.js" "${sshUser}@${sshHost}:/home/medasnnc/api.medarion.africa/routes/notifications.js"

# Restart backend
& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
```

### Check Backend Status
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" "/opt/cpanel/ea-nodejs22/bin/pm2 status"
```

### View Backend Logs
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port

& $plinkPath -P $sshPort -batch "${sshUser}@${sshHost}" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend --lines 50"
```

---

## 🛠️ Troubleshooting

### SSH Connection Issues

#### Problem: "Connection refused" or "Connection timed out"
- **Solution:** 
  - Verify SSH port in `cpanel-config.json` (usually 2083 for cPanel)
  - Check if Pageant is running and has the key loaded
  - Verify SSH host/username are correct

#### Problem: "Authentication failed"
- **Solution:**
  - Ensure Pageant is running with the correct key loaded
  - Check that the key file matches the server's authorized_keys
  - Try loading the key again in Pageant

#### Problem: "Host key verification failed"
- **Solution:**
  - Accept the host key when prompted
  - Or use `-batch` flag with PLINK to skip host key prompts

### Backend Server Issues

#### Problem: Server not starting
- **Solution:**
  - Check PM2 status: `/opt/cpanel/ea-nodejs22/bin/pm2 status`
  - View logs: `/opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend`
  - Check if port 3001 is available
  - Verify database connection

#### Problem: Server stops after deployment
- **Solution:**
  - Ensure PM2 is configured for auto-restart: `/opt/cpanel/ea-nodejs22/bin/pm2 save`
  - Check PM2 startup: `/opt/cpanel/ea-nodejs22/bin/pm2 startup`

### Deployment Issues

#### Problem: Files not uploading
- **Solution:**
  - Verify SSH connection works
  - Check file permissions on server
  - Ensure correct paths (public_html for frontend, api.medarion.africa for backend)

#### Problem: Changes not reflecting
- **Solution:**
  - Clear browser cache
  - Restart backend server after backend changes
  - Check if frontend build was successful

---

## 📝 Pageant Setup Instructions

### Initial Setup (One-Time)
1. **Install PuTTY Suite:**
   - Download from: https://www.putty.org/
   - Install all components (PuTTY, PSCP, PLINK, Pageant)

2. **Load SSH Key:**
   - Open Pageant (from Start Menu or PuTTY folder)
   - Right-click Pageant icon in system tray
   - Click "Add Key"
   - Select your `.ppk` file
   - Enter passphrase if prompted (only once)
   - Key will show in Pageant window

3. **Auto-Start Pageant (Optional):**
   - Create shortcut to Pageant in Windows Startup folder
   - Or add Pageant to Windows Task Scheduler to run on login

### Daily Usage
1. **On PC Startup:**
   - Pageant should auto-start (if configured)
   - If not, manually start Pageant
   - Load your SSH key (if not auto-loaded)

2. **Verify Key is Loaded:**
   - Right-click Pageant icon → "View Keys"
   - Your key should be listed

3. **Using SSH:**
   - All PuTTY tools (PSCP, PLINK) will automatically use keys from Pageant
   - No need to specify key file in commands
   - No need to enter passphrase for each command

### Passphrase Handling
- **If your key has a passphrase:**
  - You'll be prompted once when loading the key in Pageant
  - After that, Pageant handles authentication automatically
  - Passphrase is stored in Pageant's memory (not on disk)
  - You'll need to reload the key if you restart Pageant

- **If your key doesn't have a passphrase:**
  - Simply load the key in Pageant
  - No prompts will appear

### Security Notes
- Pageant stores keys in memory only (not on disk)
- Keys are cleared when Pageant is closed
- For security, close Pageant when not in use
- Never share your `.ppk` file or passphrase

---

## 🔑 Key Configuration Files

### cpanel-config.json
```json
{
  "ssh": {
    "host": "server1.medarion.africa",
    "username": "root",
    "port": 22,
    "usePlink": true,
    "plinkPath": "C:\\Program Files\\PuTTY\\plink.exe",
    "useKey": true,
    "keyPath": "C:\\Users\\xone\\.ssh\\medarionput.ppk",
    "password": "RgIyt5SEkc4E]nmp",
    "description": "PuTTY SSH access to root via server1.medarion.africa"
  }
}
```

**Current Configuration (as of 2024-12-19):**
- Host: `server1.medarion.africa`
- Username: `root`
- Port: `22`
- Key Path: `C:\Users\xone\.ssh\medarionput.ppk`
- Password: Available as fallback (stored in config)

### Important Notes
- Keep `cpanel-config.json` secure (contains server details)
- Do not commit to public repositories
- Update this file if server details change

---

## 📚 Additional Resources

### Documentation Files
- `BACKEND_SERVER_INFO.md` - Backend server management details
- `WORKING_ENVIRONMENT.md` - This file (complete environment reference)

### Useful Commands Reference
- See "Quick Reference Commands" section above
- All commands use PowerShell syntax
- Commands assume Pageant is running with key loaded

---

## ✅ Verification Checklist

After restarting your PC, verify:

- [ ] Pageant is running
- [ ] SSH key is loaded in Pageant
- [ ] Can connect via PLINK: `plink -P 2083 medasnnc@medasnnc.medarion.africa "echo 'test'"`
- [ ] Backend server is running: Check PM2 status
- [ ] Frontend is accessible: Visit https://medarion.africa
- [ ] Backend API is accessible: Check https://api.medarion.africa/api

---

**Note:** This document should be updated whenever the environment changes. Keep it in the project root for easy reference.

