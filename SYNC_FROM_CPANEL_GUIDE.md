# Sync Files from cPanel to Local - Guide

This guide explains how to download files from your cPanel server and replace your local files while preserving your local development environment settings.

## 🎯 What This Does

1. **Downloads** all files from your cPanel server
2. **Replaces** your local files with the cPanel versions
3. **Preserves** your local configuration files:
   - `server/.env` (Node.js database and server settings)
   - `config/database.php` (PHP database settings)
   - `api/database.php` (API database connection)
   - `vite-plugin-api-proxy.ts` (Local development proxy settings)

## 📋 Prerequisites

### Option 1: WinSCP (Recommended - Easiest)
- Download and install [WinSCP](https://winscp.net/)
- Default installation path: `C:\Program Files (x86)\WinSCP\WinSCP.com`

### Option 2: PuTTY (SSH Method)
- Download and install [PuTTY](https://www.putty.org/)
- Default installation paths:
  - `C:\Program Files\PuTTY\plink.exe`
  - `C:\Program Files\PuTTY\pscp.exe`

### Option 3: Git (For Archive Extraction)
- If using SSH method, Git provides `tar.exe` for extraction
- Default path: `C:\Program Files\Git\usr\bin\tar.exe`

## 🚀 Usage

### Method 1: Using WinSCP (Recommended)

```powershell
.\sync_from_cpanel.ps1
```

This script will:
- Use WinSCP to download files via SFTP
- Automatically preserve your local config files
- Replace all other files with cPanel versions

### Method 2: Using SSH (Alternative)

```powershell
.\sync_from_cpanel_ssh.ps1
```

This script will:
- Use SSH to create a tar archive on the server
- Download the archive
- Extract it locally
- Preserve your local config files
- Replace all other files with cPanel versions

## ⚙️ Configuration

Make sure your `cpanel-config.json` file is configured:

```json
{
  "ftp": {
    "host": "ftp.medarion.africa",
    "username": "medarion@medarion.africa",
    "password": "your_password",
    "port": 21,
    "useSftp": false,
    "remotePath": "/public_html"
  },
  "ssh": {
    "host": "server1.medarion.africa",
    "username": "root",
    "port": 22,
    "useKey": true,
    "keyPath": "C:\\Users\\xone\\.ssh\\medarionput.ppk",
    "password": "your_password"
  }
}
```

## 📁 Files Preserved

The following files are **always preserved** (not replaced):

1. **`server/.env`** - Your local Node.js environment variables:
   - Database connection (localhost)
   - Server port (3001)
   - CORS origin (localhost:5173)
   - AI service URLs

2. **`config/database.php`** - Your local PHP database config:
   - Database host: localhost
   - Database name: medarion_platform
   - Database user: root
   - Database password: (empty for XAMPP)

3. **`api/database.php`** - API database connection settings

4. **`vite-plugin-api-proxy.ts`** - Vite proxy configuration for local development

## 🔄 Workflow

### Initial Sync (First Time)

1. **Backup your work** (if needed):
   ```powershell
   git add .
   git commit -m "Backup before cPanel sync"
   ```

2. **Run the sync script**:
   ```powershell
   .\sync_from_cpanel.ps1
   ```

3. **Verify your local config**:
   - Check `server/.env` still has localhost settings
   - Check `config/database.php` still has local database settings
   - Test your local environment:
     ```powershell
     npm start
     ```

### Regular Sync (After cPanel Updates)

Whenever you want to sync the latest cPanel files:

```powershell
.\sync_from_cpanel.ps1
```

Your local config files are automatically preserved, so you can continue working immediately.

## 🛠️ Troubleshooting

### "WinSCP not found"
- Install WinSCP from https://winscp.net/
- Or use the SSH method: `.\sync_from_cpanel_ssh.ps1`

### "PLINK/PSCP not found"
- Install PuTTY from https://www.putty.org/
- Make sure to install the full PuTTY suite (not just PuTTY)

### "Could not extract archive"
- Install Git (provides tar.exe): https://git-scm.com/
- Or install 7-Zip: https://www.7-zip.org/
- Or extract manually:
  1. Find the archive in the download directory
  2. Extract it using your preferred tool
  3. Copy files manually

### "SSH authentication failed"
- Check your SSH key path in `cpanel-config.json`
- Make sure Pageant is running with your key loaded (if using key auth)
- Or verify your SSH password is correct

### "Files not syncing correctly"
- Check the remote path in `cpanel-config.json`
- Verify FTP/SSH credentials are correct
- Check server permissions

## 📝 What Gets Synced

**Synced from cPanel:**
- ✅ All source code files (`src/`, `server/`, `api/`, etc.)
- ✅ Configuration files (except preserved ones)
- ✅ Public assets (`public/`)
- ✅ Build files (if any)
- ✅ Documentation files

**NOT Synced (Preserved Locally):**
- ❌ `server/.env` (local database/server config)
- ❌ `config/database.php` (local database config)
- ❌ `api/database.php` (local database connection)
- ❌ `vite-plugin-api-proxy.ts` (local dev proxy)
- ❌ `node_modules/` (local dependencies)
- ❌ `.git/` (version control)
- ❌ `medarion-dist/` (local build output)

## 🔐 Security Notes

- ⚠️ **Never commit** `cpanel-config.json` - it contains credentials
- ⚠️ **Never commit** `server/.env` - it may contain secrets
- ✅ These files are already in `.gitignore`

## 💡 Tips

1. **Always test locally** after syncing:
   ```powershell
   npm start
   ```

2. **Keep backups** - The script creates automatic backups, but you can also:
   ```powershell
   git add .
   git commit -m "Before cPanel sync"
   ```

3. **Use SSH method** if you have SSH access - it's more reliable than FTP

4. **Check logs** - If something goes wrong, check:
   - `winscp_download.log` (for WinSCP method)
   - PowerShell error output

## 🎯 Next Steps

After syncing:

1. **Install dependencies** (if needed):
   ```powershell
   npm run install:all
   ```

2. **Start your local environment**:
   ```powershell
   npm start
   ```

3. **Make your changes** locally

4. **Push back to cPanel** when ready:
   ```powershell
   .\deploy_to_cpanel.ps1
   ```

## 📞 Support

If you encounter issues:
1. Check the error messages in the console
2. Verify your `cpanel-config.json` settings
3. Ensure required tools (WinSCP/PuTTY) are installed
4. Check server connectivity and permissions

