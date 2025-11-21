# Quick Start: Deploy to cPanel

This is a quick reference guide for deploying Medarion to cPanel.

## 🚀 Quick Deployment Steps

### 1. Get Your cPanel Credentials

You'll need:
- **FTP/SFTP credentials** (host, username, password)
- **Database credentials** (host, database name, username, password)
- **Domain information**

### 2. Configure Deployment

1. Copy the example config:
   ```powershell
   Copy-Item cpanel-config.json.example cpanel-config.json
   ```

2. Edit `cpanel-config.json` with your cPanel credentials:
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

### 3. Configure Production Database

1. Copy the production database template:
   ```powershell
   Copy-Item config/database.production.php.example config/database.php
   ```

2. Edit `config/database.php` with your cPanel database credentials.

### 4. Deploy

Run the deployment script:
```powershell
.\deploy_to_cpanel.ps1
```

This will:
- ✅ Build your frontend (`npm run build`)
- ✅ Upload all files to cPanel
- ✅ Verify the upload

### 5. Quick Sync (for small changes)

For quick updates after initial deployment:
```powershell
.\quick_sync_cpanel.ps1
```

## 📋 What Gets Deployed

- ✅ Built frontend (`medarion-dist/`)
- ✅ PHP API (`api/`)
- ✅ Configuration files (`config/`)
- ✅ Root PHP files
- ✅ `.htaccess` for routing

## 🔒 Security Notes

- ⚠️ **NEVER commit `cpanel-config.json`** - it contains your credentials
- ⚠️ **NEVER commit `config/database.php`** - it contains database passwords
- ✅ These files are already in `.gitignore`

## 🛠️ Troubleshooting

### "Configuration file not found"
- Copy `cpanel-config.json.example` to `cpanel-config.json`
- Edit it with your credentials

### "FTP connection failed"
- Verify FTP credentials in `cpanel-config.json`
- Check if FTP is enabled in cPanel
- Try using SFTP (set `useSftp: true` and install WinSCP)

### "Build failed"
- Run `npm install` first
- Check for TypeScript/compilation errors
- Ensure Node.js is installed

### Files uploaded but site not working
- Check `.htaccess` is uploaded correctly
- Verify file permissions (755 for directories, 644 for files)
- Check PHP error logs in cPanel
- Verify database connection

## 📞 Need Help?

See the full guide: `CPANEL_DEPLOYMENT_GUIDE.md`

