# Complete Application Setup Guide

## 🎯 Overview

This guide restores the working configuration from when everything was functioning properly.

## 📋 What Was Working Before

### 1. **Server Architecture**
- **Frontend**: Vite dev server on port 5173
- **Backend**: Node.js Express server on port 3001
- **Database**: MySQL (XAMPP) on localhost:3306
- **AI Service**: Vast.ai via SSH tunnel on port 8081 (optional)

### 2. **API Routing**
- **All `/api/admin/*` endpoints** → Node.js (port 3001)
- **All `/api/ai/*` endpoints** → Node.js (port 3001)
- **All `/api/countries/*` endpoints** → Node.js (port 3001)
- **Other `/api/*` endpoints** → PHP (XAMPP)

### 3. **Module Management**
- Modules loaded from database via Node.js `/api/admin/modules`
- Only modules with data management in Admin Dashboard appear
- Module manager controlled by database

## 🚀 Quick Start

### Option 1: Automatic Start (Recommended)

```powershell
.\START_ALL_SERVERS.ps1
```

This script will:
- Check prerequisites
- Create `.env` file if missing
- Install dependencies if needed
- Start all servers in separate windows

### Option 2: Manual Start

**Terminal 1 - Backend Server:**
```powershell
cd server
npm start
```

**Terminal 2 - Frontend Server:**
```powershell
npm run dev
```

**Terminal 3 - SSH Tunnel (Optional, for AI):**
```powershell
.\start_vast_ssh_tunnel.ps1
```

### Option 3: Using Concurrently

```powershell
npm start
```

This runs both frontend and backend together.

## ⚙️ Configuration Files

### 1. Server Environment (`server/.env`)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medarion_platform
DB_USER=root
DB_PASSWORD=

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Secret
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS

# AI Configuration - Using Vast.ai
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
```

### 2. Database Config (`config/database.php`)

```php
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'medarion_platform',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
```

### 3. Proxy Configuration (`vite-plugin-api-proxy.ts`)

- `/api/admin/*` → Node.js (port 3001)
- `/api/ai/*` → Node.js (port 3001)
- `/api/countries/*` → Node.js (port 3001)
- Everything else → PHP (XAMPP)

## ✅ Verification Checklist

### 1. Prerequisites
- [ ] Node.js installed (v18+)
- [ ] npm installed
- [ ] XAMPP running (MySQL on port 3306)
- [ ] Database `medarion_platform` exists

### 2. Dependencies
- [ ] Frontend: `npm install` (in root)
- [ ] Backend: `cd server && npm install`

### 3. Configuration
- [ ] `server/.env` file exists with correct database credentials
- [ ] `config/database.php` exists with correct credentials

### 4. Servers Running
- [ ] Backend: http://localhost:3001/health returns OK
- [ ] Frontend: http://localhost:5173 loads
- [ ] Database: Can connect to MySQL

### 5. Endpoints Working
- [ ] `/api/admin/modules` returns module list from database
- [ ] `/api/admin/companies` returns companies
- [ ] `/api/admin/deals` returns deals
- [ ] Other admin endpoints work

## 🔧 Troubleshooting

### Backend Server Won't Start

1. **Check port 3001:**
   ```powershell
   netstat -ano | findstr ":3001"
   ```

2. **Check database connection:**
   - Verify MySQL is running in XAMPP
   - Check `server/.env` has correct credentials
   - Test connection: `cd server && node -e "import('./config/database.js').then(m => m.testConnection())"`

3. **Check dependencies:**
   ```powershell
   cd server
   npm install
   ```

### Frontend Server Won't Start

1. **Check port 5173:**
   ```powershell
   netstat -ano | findstr ":5173"
   ```

2. **Check dependencies:**
   ```powershell
   npm install
   ```

3. **Clear cache:**
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite
   ```

### Modules Not Loading

1. **Check database:**
   - Verify `modules` table exists
   - Check modules are seeded: `SELECT * FROM modules LIMIT 5;`

2. **Check endpoint:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/api/admin/modules" -UseBasicParsing
   ```

3. **Check proxy:**
   - Verify `vite-plugin-api-proxy.ts` routes `/api/admin/modules` to Node.js
   - Check browser console for proxy errors

### Database Connection Issues

1. **Verify XAMPP MySQL is running**
2. **Check credentials in `server/.env`**
3. **Test connection:**
   ```powershell
   cd server
   node -e "import('./config/database.js').then(async m => { const result = await m.testConnection(); console.log(result ? 'Connected' : 'Failed'); process.exit(result ? 0 : 1); })"
   ```

## 📊 Current Working Configuration

### Module System
- ✅ Modules loaded from database via Node.js
- ✅ Only modules with Admin Dashboard data management appear
- ✅ Module manager controlled by database
- ✅ Correct module IDs match Admin Dashboard

### API Endpoints
- ✅ All admin endpoints use Node.js
- ✅ All AI endpoints use Node.js
- ✅ All countries endpoints use Node.js
- ✅ PHP endpoints for other services

### Database
- ✅ MySQL on localhost:3306
- ✅ Database: `medarion_platform`
- ✅ Modules table with correct structure
- ✅ All data management tables exist

## 🎯 Next Steps

1. **Start all servers:**
   ```powershell
   .\START_ALL_SERVERS.ps1
   ```

2. **Verify everything works:**
   - Open: http://localhost:5173
   - Check Admin Dashboard
   - Check Module Manager
   - Test data management tabs

3. **If issues persist:**
   - Check server logs in PowerShell windows
   - Check browser console for errors
   - Verify database connection
   - Verify all dependencies installed

---

**Status:** ✅ **Configuration Restored to Working State**

