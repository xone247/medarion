# Complete Deployment Checklist for cPanel

This document lists everything that needs to be done to have the application fully working on cPanel.

## ✅ Pre-Deployment Requirements

### 1. Server Prerequisites
- [ ] SSH access to cPanel server
- [ ] Root or sudo access
- [ ] Node.js installed (version 18+)
- [ ] MySQL/MariaDB database created
- [ ] Database user with proper permissions
- [ ] Apache with required modules enabled:
  - [ ] `mod_rewrite` (for URL routing)
  - [ ] `mod_proxy` (for API proxying)
  - [ ] `mod_proxy_http` (for HTTP proxying)
  - [ ] `mod_headers` (for security headers)
  - [ ] `mod_deflate` (for compression)
  - [ ] `mod_expires` (for caching)

### 2. Local Prerequisites
- [ ] `cpanel-config.json` configured with:
  - [ ] SSH credentials
  - [ ] Database credentials
  - [ ] Server paths
- [ ] Database SQL export file ready
- [ ] All source code ready
- [ ] Dependencies installed locally (for building)

## 📋 Deployment Steps

### Step 1: Cleanup ✅
**Script: `deploy_step1_cleanup.ps1`**
- [ ] Stop all PM2 processes
- [ ] Delete all PM2 processes
- [ ] Kill any running Node.js processes
- [ ] Remove all files from `/home/medasnnc/public_html/`
- [ ] Remove all medarion folders
- [ ] Drop existing database
- [ ] Create fresh database
- [ ] Create necessary directories:
  - [ ] `/home/medasnnc/public_html`
  - [ ] `/home/medasnnc/nodevenv/medarion/18/server`
  - [ ] `/home/medasnnc/medarion`
- [ ] Set proper file permissions (755 for directories, 644 for files)
- [ ] Set proper ownership (medasnnc:medasnnc)

### Step 2: Build Frontend ✅
**Script: `deploy_step2_build.ps1`**
- [ ] Install npm dependencies (if needed)
- [ ] Run `npm run build`
- [ ] Verify `medarion-dist/index.html` exists
- [ ] Verify assets directory has files
- [ ] Check build size

### Step 3: Upload Frontend ✅
**Script: `deploy_step3_upload_frontend.ps1`**
- [ ] Upload `index.html` to `/home/medasnnc/public_html/`
- [ ] Upload all assets to `/home/medasnnc/public_html/assets/`
- [ ] Upload any other root files
- [ ] Verify files on server
- [ ] Set proper permissions

### Step 4: Upload Backend ✅
**Script: `deploy_step4_upload_backend.ps1`**
- [ ] Create tar archive of server directory
- [ ] Upload archive to server
- [ ] Extract on server to `/home/medasnnc/nodevenv/medarion/18/server/`
- [ ] Verify `server.js` exists
- [ ] Verify `package.json` exists
- [ ] Set proper permissions

### Step 5: Upload .htaccess ✅
**Script: `deploy_step5_upload_htaccess.ps1`**
- [ ] Create/upload `.htaccess` file
- [ ] Configure API proxying to `http://localhost:3001`
- [ ] Configure React Router fallback
- [ ] Add security headers
- [ ] Add compression settings
- [ ] Add caching rules
- [ ] Verify `.htaccess` on server
- [ ] Verify proxy configuration

### Step 6: Upload Database ✅
**Script: `deploy_step6_upload_database.ps1`**
- [ ] Find SQL export file
- [ ] Upload SQL file to server
- [ ] Verify file on server
- [ ] Check file size

### Step 7: Deploy on Server ✅
**Script: `deploy_step7_deploy_server.ps1`**

#### 7.1 Database Import
- [ ] Clean SQL file (remove CREATE DATABASE, USE statements)
- [ ] Replace database name in SQL file
- [ ] Import SQL file to database
- [ ] Verify tables created
- [ ] Count tables to confirm import

#### 7.2 Node.js Setup
- [ ] Navigate to server directory
- [ ] Install production dependencies (`npm install --production`)
- [ ] Verify `node_modules` created
- [ ] Check for installation errors

#### 7.3 PM2 Setup
- [ ] Install PM2 globally (if not installed)
- [ ] Create PM2 ecosystem config file
- [ ] Configure PM2 for:
  - [ ] Application name: `medarion`
  - [ ] Script path: `/home/medasnnc/nodevenv/medarion/18/server/server.js`
  - [ ] Working directory
  - [ ] Environment variables
  - [ ] Log files location
  - [ ] Auto-restart on crash
  - [ ] Memory limit
- [ ] Stop any existing PM2 process
- [ ] Start application with PM2
- [ ] Save PM2 process list
- [ ] Configure PM2 to start on boot

#### 7.4 Environment Configuration
- [ ] Create `.env` file in `/home/medasnnc/nodevenv/medarion/18/`
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=3001`
- [ ] Set database connection:
  - [ ] `DB_HOST=localhost`
  - [ ] `DB_PORT=3306`
  - [ ] `DB_USER` (from config)
  - [ ] `DB_PASSWORD` (from config)
  - [ ] `DB_NAME` (from config)
- [ ] Set `JWT_SECRET` (generate random)
- [ ] Set `VAST_AI_URL=http://localhost:8081`
- [ ] Set `CORS_ORIGIN=https://medarion.africa`
- [ ] Set proper file permissions (600 for .env)

#### 7.5 Vast.ai Tunnel Setup
- [ ] Create tunnel directory `~/vast_tunnel`
- [ ] Create `start_tunnel.sh` script
- [ ] Configure tunnel:
  - [ ] Vast.ai host: `93.91.156.91`
  - [ ] Vast.ai port: `52695`
  - [ ] Local port: `8081`
  - [ ] Remote port: `8081`
- [ ] Make script executable
- [ ] Test tunnel connection (optional)

#### 7.6 File Permissions
- [ ] Set ownership: `chown -R medasnnc:medasnnc` for:
  - [ ] `/home/medasnnc/public_html`
  - [ ] `/home/medasnnc/nodevenv/medarion/18`
  - [ ] `/home/medasnnc/medarion`
- [ ] Set directory permissions: `chmod -R 755`
- [ ] Set file permissions: `chmod -R 644` (except executables)

## 🔧 Additional Configuration (May Need Manual Setup)

### Apache Module Verification
- [ ] Verify `mod_rewrite` is enabled
- [ ] Verify `mod_proxy` is enabled
- [ ] Verify `mod_proxy_http` is enabled
- [ ] Verify `mod_headers` is enabled
- [ ] If modules not enabled, contact hosting provider or enable via cPanel

### SSL/HTTPS Configuration
- [ ] SSL certificate installed
- [ ] HTTPS redirect configured (uncomment in .htaccess)
- [ ] Mixed content issues resolved

### Firewall/Security
- [ ] Port 3001 accessible from localhost only
- [ ] Port 8081 accessible for Vast.ai tunnel
- [ ] No external access to Node.js port

## ✅ Post-Deployment Verification

### 1. Application Status
- [ ] PM2 shows application running: `pm2 list`
- [ ] Application responds: `curl http://localhost:3001/api/health`
- [ ] No errors in PM2 logs: `pm2 logs medarion`
- [ ] Application accessible via browser: `https://medarion.africa`

### 2. Frontend Verification
- [ ] Homepage loads: `https://medarion.africa`
- [ ] React Router works (navigate to different routes)
- [ ] Assets load correctly (CSS, JS, images)
- [ ] No 404 errors for assets

### 3. Backend/API Verification
- [ ] API health check works: `https://medarion.africa/api/health`
- [ ] API endpoints respond correctly
- [ ] CORS headers present
- [ ] Authentication endpoints work
- [ ] Database queries work

### 4. Database Verification
- [ ] Database connection successful
- [ ] All tables imported
- [ ] Data present in tables
- [ ] Queries return expected results

### 5. Integration Verification
- [ ] Vast.ai tunnel running (if needed)
- [ ] AI endpoints work (if using Vast.ai)
- [ ] File uploads work (if applicable)
- [ ] Email sending works (if applicable)

## 🚨 Common Issues & Missing Items

### Potential Missing Items in Scripts:

1. **Apache Module Verification** ❌
   - Scripts don't verify if Apache modules are enabled
   - **Fix**: Add verification step or manual check

2. **PM2 Startup on Boot** ⚠️
   - Script runs `pm2 startup` but may need manual confirmation
   - **Fix**: May need to run manually or add to script

3. **Vast.ai Tunnel Auto-Start** ❌
   - Tunnel script created but not started automatically
   - **Fix**: Add step to start tunnel or create systemd service

4. **SSL Certificate** ❌
   - Not handled in scripts
   - **Fix**: Manual setup or add step

5. **CORS Configuration** ⚠️
   - CORS_ORIGIN set in .env but need to verify server.js reads it
   - **Fix**: Verify CORS configuration

6. **Error Logging** ⚠️
   - PM2 logs configured but no log rotation
   - **Fix**: Add log rotation or manual setup

7. **Database Backup** ❌
   - No backup before dropping database
   - **Fix**: Add backup step before cleanup

8. **Node.js Version Check** ⚠️
   - No verification of Node.js version
   - **Fix**: Add version check

9. **Port Availability** ❌
   - No check if port 3001 is available
   - **Fix**: Add port check

10. **File Upload Directory** ❌
    - No creation of uploads directory if needed
    - **Fix**: Add uploads directory creation

## 📝 Manual Steps Required

These may need to be done manually or added to scripts:

1. **Enable Apache Modules** (if not already enabled)
   ```bash
   # May need to contact hosting provider or use cPanel
   ```

2. **Start Vast.ai Tunnel** (after deployment)
   ```bash
   ssh user@server '~/vast_tunnel/start_tunnel.sh'
   ```

3. **Verify PM2 Startup** (after first deployment)
   ```bash
   pm2 startup systemd -u medasnnc --hp /home/medasnnc
   # Follow the output instructions
   ```

4. **SSL Certificate** (if not already configured)
   - Use cPanel SSL/TLS interface
   - Or Let's Encrypt via cPanel

5. **Firewall Rules** (if needed)
   - Ensure port 3001 is only accessible from localhost
   - Ensure port 8081 is accessible for tunnel

## ✅ Script Coverage Summary

| Requirement | Covered | Script | Notes |
|------------|---------|--------|-------|
| Cleanup | ✅ | step1 | Complete |
| Build Frontend | ✅ | step2 | Complete |
| Upload Frontend | ✅ | step3 | Complete |
| Upload Backend | ✅ | step4 | Complete |
| Upload .htaccess | ✅ | step5 | Complete |
| Upload Database | ✅ | step6 | Complete |
| Import Database | ✅ | step7 | Complete |
| Install Dependencies | ✅ | step7 | Complete |
| PM2 Setup | ✅ | step7 | Complete |
| .env Creation | ✅ | step7 | Complete |
| Vast.ai Tunnel Script | ✅ | step7 | Created but not started |
| File Permissions | ✅ | step7 | Complete |
| Apache Modules | ❌ | None | Manual check needed |
| SSL Setup | ❌ | None | Manual setup |
| Port Verification | ❌ | None | Manual check |
| Log Rotation | ❌ | None | Manual setup |
| Database Backup | ❌ | step1 | Should add before drop |

## 🎯 Recommendations

1. **Add Apache Module Check**: Create script to verify required modules
2. **Add Port Check**: Verify port 3001 is available before starting
3. **Add Database Backup**: Backup before dropping in step 1
4. **Add Vast.ai Tunnel Start**: Optionally start tunnel after deployment
5. **Add Verification Script**: Post-deployment verification script
6. **Add Log Rotation**: Configure PM2 log rotation
7. **Add Health Check**: Automated health check after deployment

