# Production Deployment Files List

## 📦 Complete File Structure for Production

### Frontend (Upload to: `/home/medasnnc/public_html/`)

#### Required Files:
```
public_html/
├── index.html
├── assets/
│   ├── index-*.js          (all JS bundles)
│   ├── index-*.css         (all CSS files)
│   └── *.png, *.jpg, etc.  (all static assets)
└── .htaccess               (Apache configuration)
```

**Source:** Build output from `npm run build` → `dist/` directory

**Build Command:**
```bash
npm run build
```

**Upload:** Copy entire contents of `dist/` to `public_html/`

---

### Backend (Upload to: `/home/medasnnc/medarion/`)

#### Required Directory Structure:
```
medarion/
├── server.js               (main entry point)
├── package.json            (dependencies)
├── .env                    (production environment variables)
├── routes/
│   ├── admin.js
│   ├── ai.js
│   ├── auth.js
│   ├── blog.js
│   ├── companies.js
│   ├── countries.js
│   ├── deals.js
│   ├── grants.js
│   ├── investors.js
│   ├── clinical-trials.js
│   ├── notifications.js
│   └── ... (all route files)
├── middleware/
│   ├── auth.js
│   └── ... (all middleware files)
├── config/
│   └── database.js
├── services/
│   ├── vastAiService.js
│   └── ... (all service files)
└── utils/
    └── ... (all utility files)
```

**Source:** Entire `server/` directory from local project

**Upload:** Copy entire `server/` directory structure

**After Upload:**
```bash
cd /home/medasnnc/medarion
npm install --production
```

---

## 🔑 Configuration Files

### 1. Backend `.env` (Production)
**Location:** `/home/medasnnc/medarion/.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://medarion.africa

# AI Configuration
AI_MODE=vast
VAST_AI_URL=http://localhost:8081

# JWT Secret (use a strong random string)
JWT_SECRET=your-production-jwt-secret-here
```

### 2. Frontend `.htaccess`
**Location:** `/home/medasnnc/public_html/.htaccess`

```apache
# HTTPS Redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API Proxy to Node.js Backend
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Serve static files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

---

## 📊 Database

### Export from Local:
```bash
mysqldump -u root medarion_platform > medarion_platform_backup.sql
```

### Import to Production:
```bash
# On server, replace database name
sed -i 's/medarion_platform/medasnnc_medarion/g' medarion_platform_backup.sql
mysql -u medasnnc_medarion -p medasnnc_medarion < medarion_platform_backup.sql
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at `https://medarion.africa`
- [ ] Backend API responds at `https://medarion.africa/api/health`
- [ ] Database connection works
- [ ] All API endpoints respond correctly:
  - [ ] `/api/admin/modules`
  - [ ] `/api/countries/investment`
  - [ ] `/api/blog/get_posts`
  - [ ] `/api/auth/*` endpoints
  - [ ] `/api/companies/*` endpoints
  - [ ] `/api/deals/*` endpoints
  - [ ] `/api/grants/*` endpoints
  - [ ] `/api/investors/*` endpoints
  - [ ] `/api/clinical-trials/*` endpoints
  - [ ] `/api/ai/*` endpoints
- [ ] Node.js app is running (check via cPanel or SSH)
- [ ] Logs show no errors
- [ ] Admin login works
- [ ] All modules load correctly

---

## 🚀 Quick Deployment Commands

### 1. Build Frontend Locally:
```bash
npm run build
```

### 2. Create Archives:
```bash
# Frontend
cd dist
tar -czf ../medarion-frontend.tar.gz .
cd ..

# Backend
cd server
tar -czf ../medarion-backend.tar.gz .
cd ..
```

### 3. Upload via SSH:
```bash
# Frontend
pscp -i "C:\Users\xone\.ssh\medarionput.ppk" -P 22 medarion-frontend.tar.gz root@server1.medarion.africa:/home/medasnnc/public_html/

# Backend
pscp -i "C:\Users\xone\.ssh\medarionput.ppk" -P 22 medarion-backend.tar.gz root@server1.medarion.africa:/home/medasnnc/medarion/
```

### 4. Extract on Server:
```bash
# Frontend
cd /home/medasnnc/public_html
tar -xzf medarion-frontend.tar.gz
chown -R medasnnc:medasnnc .

# Backend
cd /home/medasnnc/medarion
tar -xzf medarion-backend.tar.gz
chown -R medasnnc:medasnnc .
npm install --production
```

### 5. Start Node.js App:
```bash
cd /home/medasnnc/medarion
node server.js
# Or use PM2: pm2 start server.js
```

---

## 📝 Notes

- **Do NOT upload:** `node_modules/` (install on server)
- **Do NOT upload:** `.git/` directory
- **Do NOT upload:** Development files (`.env.local`, `*.log`)
- **DO upload:** All source files, configuration, and built assets
- **Ensure:** File permissions are correct (`chown medasnnc:medasnnc`)
- **Verify:** All environment variables are set correctly

