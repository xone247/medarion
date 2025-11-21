# cPanel Node.js Selector Setup Guide

## 🎯 Goal
Set up the Node.js backend application in cPanel's Node.js Selector so that:
- `/server/*` routes properly to the Node.js backend
- API calls work correctly
- The application runs automatically

## 📋 Step-by-Step Instructions

### Step 1: Access cPanel Node.js Selector

1. **Log into cPanel:**
   - URL: `https://medarion.africa:2083`
   - Username: `medasnnc`
   - Password: `Neorage94`

2. **Navigate to Node.js Selector:**
   - Go to: **Software** → **Node.js Selector**

### Step 2: Create Node.js Application

1. **Click "Create Application"**

2. **Fill in the Application Details:**
   ```
   Node.js Version: 18.x (or 20.x)
   Application Root: /home/medasnnc/public_html/server
   Application URL: /server
   Application Startup File: server.js
   Application Port: 3001
   ```

3. **Add Environment Variables:**
   Click "Add Variable" for each of these:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=medasnnc_medarion
   DB_USER=medasnnc_medarion
   DB_PASSWORD=Neorage94
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
   CORS_ORIGIN=https://medarion.africa
   VAST_AI_URL=https://establish-ought-operation-areas.trycloudflare.com
   VAST_AI_API_KEY=medarion-secure-key-2025
   AI_MODE=vast
   ```

4. **Click "Create"**

### Step 3: Install Dependencies

1. **After creating the application, click "Run npm install"**
   - This will install all dependencies from `package.json`

2. **Wait for installation to complete**

### Step 4: Start the Application

1. **Click "Start" or "Restart" on your application**

2. **Verify it's running:**
   - Status should show "Running"
   - Check logs if needed

### Step 5: Test the Application

1. **Test Health Endpoint:**
   ```
   https://medarion.africa/server/health
   ```

2. **Test API Endpoint:**
   ```
   https://medarion.africa/server/api/blog?status=published&limit=1
   ```

3. **Test AI Endpoint:**
   ```
   https://medarion.africa/server/api/ai/query
   ```

## ✅ Expected Results

- ✅ `/server/health` returns JSON: `{"status":"ok",...}`
- ✅ `/server/api/blog` returns JSON blog posts
- ✅ `/server/api/ai/query` works for AI chat
- ✅ Frontend can successfully call backend APIs

## 🐛 Troubleshooting

### If Application Won't Start:
1. Check logs in Node.js Selector
2. Verify all environment variables are set
3. Check that port 3001 is not in use
4. Verify `server.js` exists in the application root

### If Routes Don't Work:
1. Verify Application URL is set to `/server`
2. Check that the application is running
3. Test direct backend: `curl http://localhost:3001/health`
4. Check Apache error logs

### If Database Connection Fails:
1. Verify database credentials in environment variables
2. Test database connection: `mysql -u medasnnc_medarion -p medasnnc_medarion`
3. Check that database was synced properly

## 📝 Notes

- Node.js Selector automatically handles routing from `/server/*` to the Node.js backend
- The application will auto-restart on server reboot if configured
- Logs are available in the Node.js Selector interface
- Environment variables can be updated without restarting (may need restart to take effect)

