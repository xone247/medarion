# cPanel Credentials Needed for Deployment

## 🔐 What Credentials You Need to Provide

To deploy your Medarion application to cPanel, you'll need to provide the following information. **Store these securely and never share them publicly.**

### 1. FTP/SFTP Access Credentials

**Where to find in cPanel:**
- Go to cPanel → Files → FTP Accounts
- Or use your main cPanel login credentials

**What you need:**
- **FTP Host/Server**: Usually `ftp.yourdomain.com` or just `yourdomain.com`
- **FTP Username**: Your cPanel username (or FTP account username)
- **FTP Password**: Your FTP account password
- **Port**: 
  - `21` for FTP (standard)
  - `22` for SFTP (more secure, recommended)
- **Remote Directory**: Usually `/public_html` (or `/public_html/medarion` if using subdirectory)

**Example:**
```
Host: ftp.medarion.com
Username: medarion_user
Password: YourSecurePassword123!
Port: 21 (or 22 for SFTP)
Remote Path: /public_html
```

### 2. Database Credentials

**Where to find in cPanel:**
- Go to cPanel → Databases → MySQL Databases
- Create a database if you haven't already
- Create a database user and assign it to the database

**What you need:**
- **Database Host**: Usually `localhost` (sometimes `127.0.0.1`)
- **Database Name**: Your database name (e.g., `medarion_user_medarion`)
- **Database Username**: Your database username (e.g., `medarion_user_db`)
- **Database Password**: Your database user password
- **Port**: Usually `3306` (default MySQL port)

**Example:**
```
Host: localhost
Database Name: medarion_user_medarion
Username: medarion_user_db
Password: YourDatabasePassword123!
Port: 3306
```

### 3. Domain Information

**What you need:**
- **Domain Name**: Your domain (e.g., `medarion.com`)
- **Subdomain** (optional): If using a subdomain (e.g., `app.medarion.com`)
- **SSL Status**: Whether SSL/HTTPS is enabled

### 4. Optional: Node.js Information (if using Node.js features)

**Where to find in cPanel:**
- Go to cPanel → Software → Node.js Selector
- Check available Node.js versions

**What you need:**
- **Node.js Version**: Available version (e.g., `18.x`, `20.x`)
- **Application Root**: Where Node.js apps run (usually auto-configured)

## 📝 How to Provide These Credentials

### Option 1: Configuration File (Recommended)

1. Copy the example config file:
   ```powershell
   Copy-Item cpanel-config.json.example cpanel-config.json
   ```

2. Edit `cpanel-config.json` and fill in your credentials:
   ```json
   {
     "ftp": {
       "host": "ftp.yourdomain.com",
       "username": "your_actual_username",
       "password": "your_actual_password",
       "port": 21,
       "useSftp": false,
       "remotePath": "/public_html"
     },
     "database": {
       "host": "localhost",
       "name": "your_database_name",
       "username": "your_db_username",
       "password": "your_db_password",
       "port": 3306
     }
   }
   ```

3. **IMPORTANT**: This file is already in `.gitignore` - it will NOT be committed to git.

### Option 2: Environment Variables (Alternative)

You can also set these as environment variables, but the config file method is easier.

## 🔒 Security Best Practices

1. ✅ **Never commit credentials to git** - `cpanel-config.json` is in `.gitignore`
2. ✅ **Use SFTP instead of FTP** when possible (more secure)
3. ✅ **Use strong passwords** for both FTP and database
4. ✅ **Limit database user permissions** - only grant necessary permissions
5. ✅ **Enable SSL/HTTPS** on your domain
6. ✅ **Keep credentials in a secure password manager**

## 🚀 After Providing Credentials

Once you've configured `cpanel-config.json`:

1. **Build the frontend:**
   ```powershell
   npm run build
   ```

2. **Deploy to cPanel:**
   ```powershell
   .\deploy_to_cpanel.ps1
   ```

3. **Configure production database:**
   - Copy `config/database.production.php.example` to `config/database.php`
   - Edit with your database credentials
   - Upload to cPanel (or edit directly on server)

4. **Test your deployment:**
   - Visit your domain
   - Test API endpoints
   - Check database connection

## 📞 Need Help?

- See `CPANEL_DEPLOYMENT_GUIDE.md` for detailed deployment instructions
- See `README_CPANEL.md` for quick reference
- Check cPanel documentation for your specific hosting provider

## ⚠️ Important Notes

- The deployment script will **NOT** ask you to enter credentials in the terminal
- All credentials are stored in `cpanel-config.json` (which is git-ignored)
- You can safely share your code repository - credentials won't be included
- If you need to change credentials, just edit `cpanel-config.json` and redeploy

