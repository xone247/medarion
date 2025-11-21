# Complete cPanel Node.js Setup Guide for Medarion

This guide will walk you through setting up the Node.js backend on cPanel, step by step.

## 🎯 Overview

Your Medarion application has two parts:
1. **Frontend** (React) - Served via Apache/PHP
2. **Backend** (Node.js/Express) - Runs as a Node.js application

This guide focuses on setting up the Node.js backend.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ cPanel access with Node.js Selector enabled
- ✅ Database created in cPanel
- ✅ FTP/SFTP access
- ✅ SSH access (recommended, but not required)

## 🚀 Quick Setup (Automated)

### Step 1: Generate Node.js App Files

Run the setup script:

```powershell
.\setup_cpanel_nodejs.ps1
```

This will create a `cpanel-nodejs-app` directory with all necessary files.

### Step 2: Follow the Manual Setup Steps Below

The script creates detailed instructions in `cpanel-nodejs-app/CPANEL_SETUP_INSTRUCTIONS.md`.

## 📝 Manual Setup (Step by Step)

### Step 1: Access Node.js Selector

1. Log into your cPanel
2. Navigate to: **Software** → **Node.js Selector**
3. Click **"Create Application"**

### Step 2: Configure Node.js Application

Fill in the application settings:

| Setting | Value | Notes |
|---------|-------|-------|
| **Node.js Version** | `18.x` or `20.x` | Select the latest available version |
| **Application Mode** | `Production` | |
| **Application Root** | `/home/username/nodevenv/medarion/18/bin` | cPanel will suggest a path - use it |
| **Application URL** | `/medarion-api` | This is the URL path (e.g., `yourdomain.com/medarion-api`) |
| **Application Startup File** | `server.js` | |
| **Load App File** | `server.js` | |
| **Application Port** | `3001` | Or let cPanel assign automatically |

**Important Notes:**
- The **Application Root** path will be shown by cPanel - copy it exactly
- The **Application URL** determines how you'll access your API (e.g., `https://yourdomain.com/medarion-api`)
- If you want a subdomain (e.g., `api.yourdomain.com`), you'll configure that separately

### Step 3: Upload Application Files

After creating the application, you need to upload the files:

#### Option A: Via FTP/SFTP (Recommended)

1. Use FileZilla or similar FTP client
2. Connect to your cPanel server
3. Navigate to the **Application Root** path (from Step 2)
4. Upload all files from the `cpanel-nodejs-app` directory:
   - `server.js`
   - `package.json`
   - `.env` (update with your credentials first!)
   - `config/` directory
   - `routes/` directory
   - `middleware/` directory
   - `services/` directory (if exists)
   - All other files from the server directory

#### Option B: Via cPanel File Manager

1. Go to **Files** → **File Manager**
2. Navigate to the Application Root path
3. Upload files using the upload button
4. Extract if you uploaded a zip file

### Step 4: Install Dependencies

You need to install Node.js packages. You can do this in two ways:

#### Option A: Via SSH (Recommended)

1. SSH into your server
2. Navigate to the application directory:
   ```bash
   cd /home/username/nodevenv/medarion/18/bin
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

#### Option B: Via cPanel Node.js Selector

1. In Node.js Selector, find your application
2. Click on it to open details
3. Look for **"Run NPM Install"** button (if available)
4. Click it to install dependencies

### Step 5: Configure Environment Variables

Environment variables are crucial for your app to work. Set them in cPanel:

1. In **Node.js Selector**, click on your application
2. Find the **"Environment Variables"** section
3. Add the following variables:

```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_username
DB_PASSWORD=your_database_password
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**Important:**
- Replace `your_database_name`, `your_database_username`, etc. with actual values
- Generate a strong random string for `JWT_SECRET` (you can use: `openssl rand -base64 32`)
- Set `CORS_ORIGIN` to your actual domain (e.g., `https://medarion.com`)

### Step 6: Update Database Configuration

If your server uses a different database path, update `server/config/database.js`:

1. Edit the database configuration file
2. Ensure it reads from environment variables (it should already do this)
3. Verify the connection settings match your cPanel database

### Step 7: Start the Application

1. In **Node.js Selector**, find your application
2. Click the **"Start"** button
3. Check the **"Logs"** section for any errors
4. The application should show as "Running"

### Step 8: Test the Application

Test that your Node.js app is working:

1. Open your browser
2. Visit: `https://yourdomain.com/medarion-api/health`
3. You should see a health check response

Or test via curl:
```bash
curl https://yourdomain.com/medarion-api/health
```

## 🌐 Setting Up a Subdomain (Optional)

If you want to use `api.yourdomain.com` instead of `yourdomain.com/medarion-api`:

### Step 1: Create Subdomain

1. Go to **Domains** → **Subdomains**
2. Create subdomain: `api`
3. Document root: Point to your Node.js app directory (or leave default)

### Step 2: Update Application URL

1. In **Node.js Selector**, edit your application
2. Change **Application URL** to `/` (root of subdomain)
3. Or configure reverse proxy (see below)

### Step 3: Configure Reverse Proxy (if needed)

If cPanel doesn't automatically route the subdomain to Node.js, you may need to configure Apache:

1. Go to **Files** → **File Manager**
2. Navigate to subdomain's document root
3. Create/edit `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

## 🔧 Troubleshooting

### Application Won't Start

**Check logs:**
1. In Node.js Selector, click on your app
2. View the **"Logs"** section
3. Look for error messages

**Common issues:**
- **Port already in use**: Change PORT in environment variables
- **Module not found**: Run `npm install` again
- **Database connection failed**: Check database credentials
- **Permission denied**: Check file permissions (should be 755 for dirs, 644 for files)

### Database Connection Failed

1. Verify database credentials in environment variables
2. Ensure database user has proper permissions
3. Check if database host is correct (usually `localhost`)
4. Test connection manually:
   ```bash
   mysql -h localhost -u db_user -p db_name
   ```

### CORS Errors

1. Verify `CORS_ORIGIN` environment variable matches your frontend domain
2. Check that the frontend is making requests to the correct API URL
3. Review CORS configuration in `server.js`

### 404 Errors on API Routes

1. Verify Application URL is set correctly
2. Check that routes are properly configured
3. Ensure the application is running
4. Test with the health endpoint first

### Module Not Found Errors

1. SSH into server
2. Navigate to app directory
3. Run: `npm install`
4. Verify `node_modules` directory exists
5. Check `package.json` is correct

## 📊 Monitoring Your Application

### View Logs

1. In **Node.js Selector**, click on your application
2. Click **"Logs"** to view application logs
3. Check for errors, warnings, or important messages

### Restart Application

1. Click **"Stop"** in Node.js Selector
2. Wait a few seconds
3. Click **"Start"** to restart

### Update Application

1. Upload new files via FTP
2. If `package.json` changed, run `npm install` again
3. Restart the application

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` file** - it contains sensitive credentials
2. ✅ **Use strong JWT_SECRET** - generate with: `openssl rand -base64 32`
3. ✅ **Enable HTTPS** - ensure SSL certificate is active
4. ✅ **Keep dependencies updated** - run `npm audit` regularly
5. ✅ **Limit database permissions** - only grant necessary permissions
6. ✅ **Use environment variables** - never hardcode credentials
7. ✅ **Enable firewall** - restrict access if possible

## 📞 Need Help?

If you encounter issues:

1. Check the logs in Node.js Selector
2. Review the deployment checklist: `cpanel-nodejs-app/DEPLOYMENT_CHECKLIST.md`
3. Verify all environment variables are set correctly
4. Test database connection separately
5. Check file permissions

## ✅ Verification Checklist

After setup, verify:

- [ ] Application shows as "Running" in Node.js Selector
- [ ] Health endpoint responds: `/health`
- [ ] Database connection works
- [ ] API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] Frontend can connect to API
- [ ] Logs show no critical errors
- [ ] SSL/HTTPS is working

## 🎉 Next Steps

Once Node.js is set up:

1. Deploy your frontend (React app) to `public_html`
2. Update frontend API base URL to point to your Node.js app
3. Test the complete application flow
4. Set up monitoring and backups

---

**Need the automated setup script?** Run: `.\setup_cpanel_nodejs.ps1`

