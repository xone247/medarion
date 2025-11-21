# Deployment Enhancements Added

## New Features Added

### 1. Database Backup (Step 1)
**Location:** `deploy_step1_cleanup.ps1`

- **What it does:**
  - Creates a backup of the database before dropping it
  - Backs up to `/tmp/` on server
  - Downloads backup to local `backups/` directory
  - Backup filename: `medarion_backup_YYYYMMDD_HHMMSS.sql`

- **Why it's important:**
  - Prevents data loss if something goes wrong
  - Allows rollback if needed
  - Creates a safety net before destructive operations

- **Backup location:**
  - Local: `backups/medarion_backup_*.sql`
  - Server: `/tmp/` (temporary, removed after download)

### 2. Apache Module Verification (Step 5)
**Location:** `deploy_step5_upload_htaccess.ps1`

- **What it checks:**
  - `mod_rewrite` (REQUIRED) - For URL routing
  - `mod_proxy` (REQUIRED) - For API proxying
  - `mod_proxy_http` (REQUIRED) - For HTTP proxying
  - `mod_headers` (optional) - For security headers
  - `mod_deflate` (optional) - For compression
  - `mod_expires` (optional) - For caching

- **What it does:**
  - Checks if each module is enabled
  - Warns if required modules are missing
  - Prompts to continue if required modules missing
  - Lists optional modules that are missing

- **Why it's important:**
  - Prevents deployment failures
  - Identifies configuration issues early
  - Guides user to fix issues before they cause problems

### 3. Port Verification (Step 7)
**Location:** `deploy_step7_deploy_server.ps1`

- **What it checks:**
  - Verifies port 3001 is available before starting application
  - Checks if port is already in use
  - Stops existing processes if port is in use
  - Verifies port is free before starting

- **What it does:**
  - Uses `netstat` or `ss` to check port status
  - Stops PM2 processes if port is in use
  - Kills any Node.js processes using the port
  - Waits and re-checks before starting

- **Why it's important:**
  - Prevents "port already in use" errors
  - Ensures clean application start
  - Handles leftover processes from previous deployments

### 4. Enhanced Verification (Step 8)
**Location:** `deploy_step8_verify.ps1`

- **New checks added:**
  - Port 3001 verification with process details
  - Apache module verification
  - Database backup verification

- **What it does:**
  - Checks if port is used by correct process
  - Verifies all required Apache modules
  - Lists available database backups
  - Provides detailed status for each check

## Updated Files

1. **`deploy_step1_cleanup.ps1`**
   - Added database backup before cleanup
   - Added download function
   - Creates backups directory

2. **`deploy_step5_upload_htaccess.ps1`**
   - Added Apache module verification
   - Checks required and optional modules
   - Provides warnings and guidance

3. **`deploy_step7_deploy_server.ps1`**
   - Added port availability check
   - Stops conflicting processes
   - Renumbered subsequent steps

4. **`deploy_step8_verify.ps1`**
   - Enhanced port check with process details
   - Added Apache module verification
   - Added database backup check

5. **`deploy_setup_folders.ps1`**
   - Added `backups/` directory creation

## Usage

### Database Backup
Backups are automatically created in Step 1 before cleanup. They are stored in:
```
backups/
└── medarion_backup_20250115_143022.sql
```

To restore a backup:
```bash
mysql -u username -p database_name < backups/medarion_backup_YYYYMMDD_HHMMSS.sql
```

### Apache Module Check
The check runs automatically in Step 5. If modules are missing:
1. Contact your hosting provider
2. Or enable via cPanel (if available)
3. Or use SSH to enable (if you have root access)

### Port Verification
Port check runs automatically in Step 7. If port is in use:
- Script automatically stops conflicting processes
- If that fails, you'll need to manually stop the process

## Benefits

1. **Safety:** Database backup prevents data loss
2. **Early Detection:** Apache module check finds issues before deployment
3. **Reliability:** Port check prevents startup failures
4. **Completeness:** Enhanced verification ensures everything works

## Manual Steps Still Required

1. **Enable Apache Modules** (if missing)
   - Contact hosting provider
   - Or enable via cPanel/WHM
   - Or use SSH with root access

2. **Restore Backup** (if needed)
   - Use the backup files in `backups/` directory
   - Import via phpMyAdmin or command line

3. **Fix Port Conflicts** (if automatic fix fails)
   - Manually stop processes using port 3001
   - Check with: `netstat -tuln | grep 3001`

