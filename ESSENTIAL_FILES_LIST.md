# 📋 Essential Files to Upload to cPanel

## Upload Location
**Target Directory:** `/home/medasnnc/nodevenv/medarion/18/bin/`

## 📁 Directory Structure on Server

```
/home/medasnnc/nodevenv/medarion/18/bin/
├── server.js                    (main entry point)
├── package.json                 (dependencies)
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── admin.js
│   ├── ai.js
│   ├── ai-data-generation.js
│   ├── ai-data-updates.js
│   ├── auth.js
│   ├── blog.js
│   ├── clinical-trials.js
│   ├── companies.js
│   ├── countries.js
│   ├── db.js
│   ├── deals.js
│   ├── grants.js
│   ├── investors.js
│   └── notifications.js
└── services/
    └── vastAiService.js
```

## 📤 Files to Upload (21 files total)

### Root Level (2 files)
1. `server/server.js` → `/home/medasnnc/nodevenv/medarion/18/bin/server.js`
2. `package.json` → `/home/medasnnc/nodevenv/medarion/18/bin/package.json`

### Config (1 file)
3. `server/config/database.js` → `/home/medasnnc/nodevenv/medarion/18/bin/config/database.js`

### Middleware (1 file)
4. `server/middleware/auth.js` → `/home/medasnnc/nodevenv/medarion/18/bin/middleware/auth.js`

### Routes (14 files)
5. `server/routes/admin.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/admin.js`
6. `server/routes/ai.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/ai.js`
7. `server/routes/ai-data-generation.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/ai-data-generation.js`
8. `server/routes/ai-data-updates.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/ai-data-updates.js`
9. `server/routes/auth.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/auth.js`
10. `server/routes/blog.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/blog.js`
11. `server/routes/clinical-trials.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/clinical-trials.js`
12. `server/routes/companies.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/companies.js`
13. `server/routes/countries.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/countries.js`
14. `server/routes/db.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/db.js`
15. `server/routes/deals.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/deals.js`
16. `server/routes/grants.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/grants.js`
17. `server/routes/investors.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/investors.js`
18. `server/routes/notifications.js` → `/home/medasnnc/nodevenv/medarion/18/bin/routes/notifications.js`

### Services (1 file)
19. `server/services/vastAiService.js` → `/home/medasnnc/nodevenv/medarion/18/bin/services/vastAiService.js`

## 🚀 Quick Upload Commands

### Option 1: Upload via SCP (from your local machine)
```powershell
# Set variables
$sshHost = "root@server1.medarion.africa"
$remotePath = "/home/medasnnc/nodevenv/medarion/18/bin"

# Upload root files
scp -P 22 server/server.js $sshHost:$remotePath/
scp -P 22 package.json $sshHost:$remotePath/

# Upload config
scp -P 22 server/config/database.js $sshHost:$remotePath/config/

# Upload middleware
scp -P 22 server/middleware/auth.js $sshHost:$remotePath/middleware/

# Upload routes (all at once)
scp -P 22 server/routes/*.js $sshHost:$remotePath/routes/

# Upload services
scp -P 22 server/services/vastAiService.js $sshHost:$remotePath/services/
```

### Option 2: Upload via cPanel File Manager
1. Log into cPanel: https://medarion.africa:2083
2. Go to **Files → File Manager**
3. Navigate to: `/home/medasnnc/nodevenv/medarion/18/bin/`
4. Create directories: `config`, `middleware`, `routes`, `services`
5. Upload files to their respective directories

## 🧹 Before Upload: Clean Previous Files

**IMPORTANT:** Delete any previously uploaded files to avoid conflicts:

```bash
# SSH into server
ssh root@server1.medarion.africa

# Clean previous uploads
cd /home/medasnnc/nodevenv/medarion/18/bin
rm -rf config middleware routes services server.js package.json .env node_modules
mkdir -p config middleware routes services
```

Or use the automated script:
```powershell
.\clean_and_upload.ps1
```

## ✅ After Upload

1. **Install dependencies:**
   ```bash
   cd /home/medasnnc/nodevenv/medarion/18/bin
   npm install --production
   ```

2. **Create .env file:**
   ```bash
   cat > /home/medasnnc/nodevenv/medarion/18/bin/.env << 'EOF'
   NODE_ENV=production
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=medasnnc_medarion
   DB_USER=medasnnc_medarion
   DB_PASSWORD=Neorage94
   CORS_ORIGIN=https://medarion.africa
   JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
   VAST_AI_URL=http://localhost:8081
   EOF
   ```

3. **Create Node.js app in cPanel** (see CPANEL_BACKEND_AND_AI_SETUP.md)

---

**Total: 21 essential files** (excluding node_modules, which will be installed via npm)

