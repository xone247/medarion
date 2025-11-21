# Pre-Production Deployment Checklist

**Date:** November 11, 2025  
**Project:** Medarion Healthcare Platform

---

## ✅ **COMPLETED CHECKS**

### Infrastructure
- [x] Backend server running (port 3001)
- [x] Vast.ai connected and accessible
- [x] Database connected and queryable
- [x] Frontend server running (port 5173)
- [x] SSH tunnel to Vast.ai active

### Code Quality
- [x] Removed all demo answer fallbacks
- [x] Added centralized API configuration
- [x] Improved error handling
- [x] Added demo answer detection
- [x] Configured for production (relative paths)

### API Endpoints
- [x] `/api/ai/health` - Working
- [x] `/api/admin/modules` - Working
- [x] `/api/blog/get_posts` - Working
- [x] `/api/companies` - Working
- [x] Direct AI queries - Working (real responses)

---

## ⚠️ **REMAINING CHECKS**

### Authentication
- [ ] Verify PHP authentication endpoints (`/api/auth/signin.php`)
- [ ] Test login flow end-to-end
- [ ] Verify JWT token generation and validation
- [ ] Test session management

### Admin CRUD Operations
- [ ] Test creating companies
- [ ] Test updating companies
- [ ] Test deleting companies
- [ ] Test other modules (deals, grants, investors, etc.)
- [ ] Verify permissions and access control

### Frontend Testing
- [ ] Test complete user registration flow
- [ ] Test login/logout flow
- [ ] Test all admin modules load correctly
- [ ] Test AI tools with various queries
- [ ] Check browser console for errors
- [ ] Test responsive design on different screen sizes

### Production Configuration
- [ ] Build frontend for production (`npm run build`)
- [ ] Verify `.env` file has production values
- [ ] Check database credentials for production
- [ ] Verify Vast.ai SSH tunnel setup for production
- [ ] Test production build locally before deployment

---

## 📋 **DEPLOYMENT STEPS**

### 1. Pre-Deployment
- [ ] Run `npm run build` to create production build
- [ ] Verify build output in `dist/` directory
- [ ] Check all environment variables
- [ ] Backup current production database (if exists)

### 2. Deployment
- [ ] Upload frontend build to cPanel `public_html`
- [ ] Upload backend to cPanel Node.js directory
- [ ] Install Node.js dependencies on server
- [ ] Configure `.env` file on server
- [ ] Set up Apache proxy configuration
- [ ] Start Node.js application on server
- [ ] Set up SSH tunnel to Vast.ai on server

### 3. Post-Deployment
- [ ] Test production URL
- [ ] Verify all API endpoints work
- [ ] Test authentication
- [ ] Test AI tools
- [ ] Check server logs for errors
- [ ] Monitor performance

---

## 🔍 **TESTING COMMANDS**

### Local Testing
```powershell
# Backend Health
Invoke-WebRequest -Uri "http://localhost:3001/api/ai/health" -UseBasicParsing

# Vast.ai Health
Invoke-WebRequest -Uri "http://localhost:8081/health" -UseBasicParsing

# Test AI Query
$body = @{ query = "test"; topK = 5 } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/ai/query" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 60
```

### Production Testing
```bash
# SSH into server and test
curl http://localhost:3001/api/ai/health
curl http://localhost:8081/health
```

---

## 📝 **NOTES**

### Known Issues (Dev-Only)
- Vite proxy returns 500 errors (won't affect production)
- Some AI queries may timeout (expected for complex queries)

### Production Considerations
- Apache proxy will handle `/api/*` requests differently than Vite
- Relative API paths will work correctly in production
- SSH tunnel to Vast.ai must be persistent on server

---

## ✅ **SIGN-OFF**

**Status:** Ready for production deployment after completing remaining checks.

**Priority Actions:**
1. Test authentication flow
2. Test admin CRUD operations
3. Build production frontend
4. Deploy to cPanel

---

**Last Updated:** November 11, 2025

