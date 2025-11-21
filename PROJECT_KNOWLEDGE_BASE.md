# Medarion Project - Complete Knowledge Base

**Last Updated:** 2024-12-19  
**Purpose:** Comprehensive reference for all project information, configurations, and workflows

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [SSH & Server Access](#ssh--server-access)
4. [Deployment](#deployment)
5. [Database Configuration](#database-configuration)
6. [API Configuration](#api-configuration)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Project Overview

### Technology Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js 22 + Express + MySQL2
- **Database:** MySQL (cPanel production, XAMPP local)
- **Authentication:** JWT tokens
- **File Uploads:** PHP (multipart/form-data handling)
- **Process Manager:** PM2 (production)

### Project Structure
```
medarion/
├── src/                    # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Theme, Dashboard)
│   ├── pages/             # Page components
│   ├── lib/               # API client and utilities
│   └── types/             # TypeScript type definitions
├── server/                 # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── config/            # Database configuration
│   └── server.js          # Main server file
├── api/                    # PHP upload handlers
│   ├── upload/            # Blog image uploads
│   └── admin/             # Admin file uploads
└── dist/                   # Production build output
```

---

## 🏛️ Architecture

### Hybrid Backend Architecture

#### Node.js (Express) - Primary Backend
- **Location:** `/home/medasnnc/api.medarion.africa/` (production)
- **Port:** `3001` (localhost)
- **Process Manager:** PM2 (`medarion-backend`)
- **Purpose:** Business logic, CRUD operations, authentication, API endpoints

**Key Routes:**
- `/api/blog/*` - Blog post endpoints
- `/api/admin/*` - Admin operations
- `/api/auth/*` - Authentication endpoints
- `/api/health` - Health check endpoint
- `/api/ai/*` - AI chat endpoints

#### PHP - File Upload Handler
- **Location:** `/home/medasnnc/api.medarion.africa/api/upload/` and `/api/admin/`
- **Purpose:** Handles multipart/form-data file uploads
- **Endpoints:**
  - `/api/upload/image.php` - Blog post image uploads
  - `/api/admin/upload.php` - Admin uploads (ads, announcements, companies, investors)

**Why PHP for Uploads?**
1. Robust multipart/form-data handling
2. Existing architecture compatibility
3. Separation of concerns
4. Efficient file I/O

### Apache Configuration

**Main API Subdomain (.htaccess):**
```apache
# Check if REQUEST_URI ends with .php BEFORE proxying
RewriteCond %{REQUEST_URI} \.php$ [NC]
RewriteRule ^ - [L]

# Proxy /api/* requests to Node.js (except PHP files)
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]
```

**Key Rule:** PHP files execute directly. All other `/api/*` requests are proxied to Node.js.

---

## 🔐 SSH & Server Access

### SSH Connection Details

**Primary Configuration:**
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

**Important Notes:**
- Pageant does NOT use passphrases - it's a key agent
- Your `.ppk` file may have a passphrase
- You'll enter it ONCE when loading the key in Pageant
- After loading, Pageant handles all authentication automatically

### PuTTY Tools Paths
- **PSCP:** `C:\Program Files\PuTTY\pscp.exe` (file upload)
- **PLINK:** `C:\Program Files\PuTTY\plink.exe` (SSH commands)
- **Pageant:** `C:\Program Files\PuTTY\pageant.exe` (key agent)

### Server Paths

**Frontend Deployment:**
- **Local Build:** `dist/` (after `npm run build`)
- **Server Path:** `/home/medasnnc/public_html/`

**Backend Deployment:**
- **Server Path:** `/home/medasnnc/api.medarion.africa/`
- **Routes Path:** `/home/medasnnc/api.medarion.africa/routes/`
- **Server File:** `/home/medasnnc/api.medarion.africa/server.js`
- **PM2 Path:** `/opt/cpanel/ea-nodejs22/bin/pm2`
- **PM2 Process:** `medarion-backend`

### Testing SSH Connection
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
& "C:\Program Files\PuTTY\plink.exe" -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "echo 'SSH OK'"
```

---

## 🚀 Deployment

### Standard Deployment Workflow

#### 1. Build Frontend
```powershell
npm run build
```

#### 2. Upload Frontend
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$pscp = "C:\Program Files\PuTTY\pscp.exe"
& $pscp -P $config.ssh.port -r "dist\*" "$($config.ssh.username)@$($config.ssh.host):/home/medasnnc/public_html/"
```

#### 3. Upload Backend (if changed)
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

#### 4. Restart Backend
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plink = "C:\Program Files\PuTTY\plink.exe"
& $plink -P $config.ssh.port -batch "$($config.ssh.username)@$($config.ssh.host)" "cd /home/medasnnc/api.medarion.africa && /opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend"
```

### PM2 Commands (via SSH)

**Check Status:**
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 status
```

**Restart Server:**
```bash
cd /home/medasnnc/api.medarion.africa
/opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend
```

**View Logs:**
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend --lines 50
```

**Save Configuration (for auto-start):**
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 save
/opt/cpanel/ea-nodejs22/bin/pm2 startup
```

---

## 💾 Database Configuration

### Production Database
- **Database Name:** `medasnnc_medarion`
- **Database User:** `medasnnc_medarion`
- **Database Password:** `Neorage94`
- **Host:** `localhost` (on cPanel server)
- **Port:** `3306`

### Local Development Database
- **Database Name:** `medarion_platform`
- **Database User:** `root`
- **Database Password:** (empty)
- **Host:** `localhost`
- **Port:** `3306`

### Auto-Created Tables
The following tables are automatically created by the backend if they don't exist:
- `notifications` - User notifications
- `announcements` - Announcements for paid users
- `blog_categories` - Blog post categories
- `blog_posts` - Blog posts
- `users` - User accounts and profiles
- `companies` - Startup and investor companies
- `deals` - Investment deals and transactions
- `grants` - Research grants and funding opportunities
- `clinical_trials` - Clinical trial information

---

## 🔌 API Configuration

### AI Service Configuration

**Current AI Service:**
- **URL:** `https://establish-ought-operation-areas.trycloudflare.com`
- **API Key:** `medarion-secure-key-2025`
- **Model:** Medarion-Mistral-7B (fine-tuned)
- **Mode:** `vast`

**Backend Configuration (`server/.env`):**
```env
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast
```

### API Endpoints

**Authentication:**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

**AI Chat:**
- `POST /api/ai/query` - Send chat query
- `GET /api/ai/health` - Check AI service health

**Blog:**
- `GET /api/blog` - List blog posts
- `GET /api/blog/:id` - Get blog post
- `GET /api/blog/slug/:slug` - Get blog post by slug
- `POST /api/blog` - Create blog post (authenticated)
- `PUT /api/blog/:id` - Update blog post (authenticated)
- `DELETE /api/blog/:id` - Delete blog post (authenticated)

**Admin:**
- `GET /api/admin/*` - Admin operations (ads, announcements, users, etc.)

**File Uploads:**
- `POST /api/upload/image.php` - Blog post image uploads
- `POST /api/admin/upload.php` - Admin file uploads

### Server URLs

**Production:**
- **Frontend:** `https://medarion.africa`
- **Backend API:** `https://api.medarion.africa/api`
- **cPanel:** `https://medarion.africa:2083`

**Local Development:**
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001/api`

---

## 💻 Development Workflow

### Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup Database:**
   ```bash
   npm run setup:db
   ```

3. **Start Development Servers:**
   ```bash
   npm start
   ```
   This starts both frontend (port 5173) and backend (port 3001).

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server
- `npm start` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run lint` - Run ESLint
- `npm run setup` - Full setup (install + database)
- `npm run setup:db` - Setup database only

### Environment Variables

**Backend (`server/.env`):**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medarion_platform
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# AI Service
VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
VAST_AI_API_KEY=medarion-secure-key-2025
AI_MODE=vast
```

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Medarion Healthcare Platform
VITE_APP_VERSION=1.0.0
```

---

## 🛠️ Troubleshooting

### SSH Connection Issues

**Problem: "Connection refused" or "Connection timed out"**
- Verify SSH port in `cpanel-config.json` (usually 22)
- Check if Pageant is running and has the key loaded
- Verify SSH host/username are correct

**Problem: "Authentication failed"**
- Ensure Pageant is running with the correct key loaded
- Check that the key file matches the server's authorized_keys
- Try loading the key again in Pageant

### Backend Server Issues

**Problem: Server not starting**
- Check PM2 status: `/opt/cpanel/ea-nodejs22/bin/pm2 status`
- View logs: `/opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend`
- Check if port 3001 is available
- Verify database connection

**Problem: Server stops after deployment**
- Ensure PM2 is configured for auto-restart: `/opt/cpanel/ea-nodejs22/bin/pm2 save`
- Check PM2 startup: `/opt/cpanel/ea-nodejs22/bin/pm2 startup`

### Deployment Issues

**Problem: Files not uploading**
- Verify SSH connection works
- Check file permissions on server
- Ensure correct paths (public_html for frontend, api.medarion.africa for backend)

**Problem: Changes not reflecting**
- Clear browser cache
- Restart backend server after backend changes
- Check if frontend build was successful

### CORS Errors
1. Check PHP scripts set headers **before any output**
2. Verify `.htaccess` allows PHP execution
3. Check Node.js CORS middleware configuration

### File Upload Failures
1. Verify upload directories exist with correct permissions (755)
2. Check PHP `upload_max_filesize` and `post_max_size` settings
3. Verify CORS headers are set correctly
4. Check file type validation in PHP scripts

---

## 📝 Important Notes

### After PC Restart Checklist:
1. ✅ Start Pageant
2. ✅ Load SSH key (`C:\Users\xone\.ssh\medarionput.ppk`)
3. ✅ Enter passphrase if prompted (once)
4. ✅ Verify SSH connection works
5. ✅ Check backend server status
6. ✅ Ready to deploy!

### Security Notes
- Keep `cpanel-config.json` secure (contains server details)
- Do not commit sensitive files to Git
- `.env` files are excluded from Git
- SSH keys should never be shared

### Git Repository
- Sensitive files are in `.gitignore`
- Use `setup_git_github.ps1` to set up Git and GitHub
- See `README.md` for project overview

---

## 📚 Related Documentation

- **Complete Environment Reference:** `WORKING_ENVIRONMENT.md`
- **Quick Commands:** `QUICK_REFERENCE.md`
- **Architecture Details:** `ARCHITECTURE_DOCUMENTATION.md`
- **Backend Info:** `BACKEND_SERVER_INFO.md`
- **Config File:** `cpanel-config.json` (not in Git)

---

**This document consolidates information from all project documentation files.**
**Update this file when making significant changes to the project.**

