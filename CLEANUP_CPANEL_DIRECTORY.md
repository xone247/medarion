# 🧹 Clean Up cPanel Directory - Start Fresh

## 📍 Target Directory on cPanel

**Full Path:** `/home/medasnnc/nodevenv/medarion/18/bin/`

This is where all the Node.js server files should be uploaded.

## 🗑️ Complete Cleanup Commands

### Option 1: SSH Cleanup (Recommended)

```bash
# SSH into your cPanel server
ssh root@server1.medarion.africa
# Password: RgIyt5SEkc4E]nmp

# Navigate to the directory
cd /home/medasnnc/nodevenv/medarion/18/bin

# Remove EVERYTHING in this directory
rm -rf *

# Or more specifically, remove all files and folders:
rm -rf config middleware routes services server.js package.json .env node_modules package-lock.json *.log

# Verify it's clean
ls -la
# Should show only: . and .. (empty directory)

# Recreate the directory structure (optional, will be created during upload)
mkdir -p config middleware routes services
```

### Option 2: cPanel File Manager

1. Log into cPanel: https://medarion.africa:2083
2. Go to: **Files → File Manager**
3. Navigate to: `/home/medasnnc/nodevenv/medarion/18/bin/`
4. Select **ALL** files and folders
5. Click **Delete**
6. Confirm deletion

### Option 3: PowerShell Script (Automated)

```powershell
# Run this from your local machine
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$sshHost = $config.ssh.host
$sshPort = $config.ssh.port
$sshUser = $config.ssh.username
$sshPassword = "RgIyt5SEkc4E]nmp"
$plinkPath = $config.ssh.plinkPath
$nodeAppPath = "/home/medasnnc/nodevenv/medarion/18/bin"

# Clean everything
$cleanCmd = "cd $nodeAppPath && rm -rf * .* 2>/dev/null; mkdir -p config middleware routes services; ls -la"
$result = echo $sshPassword | & $plinkPath -P $sshPort -pw $sshPassword "$sshUser@${sshHost}" $cleanCmd 2>&1
Write-Host $result
```

## ✅ Verification

After cleanup, the directory should be **completely empty** or only contain:
- Empty directories: `config/`, `middleware/`, `routes/`, `services/`

## 🚀 After Cleanup

Once the directory is clean, you can:

1. **Upload essential files** using:
   ```powershell
   .\upload_essential_files.ps1
   ```
   or
   ```powershell
   .\clean_and_upload.ps1
   ```

2. **Or upload manually** following `ESSENTIAL_FILES_LIST.md`

## 📋 Directory Structure After Clean Setup

```
/home/medasnnc/nodevenv/medarion/18/bin/
├── server.js                    (main entry point)
├── package.json                 (dependencies)
├── .env                         (created after upload)
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── admin.js
│   ├── ai.js
│   ├── ai-data-generation.js
│   ├── ai-data-updates.js
│   ├── auth.js
│   ├── blog.js
│   ├── clinical-trials.js
│   ├── companies.js
│   ├── countries.js
│   ├── db.js
│   ├── deals.js
│   ├── grants.js
│   ├── investors.js
│   └── notifications.js
└── services/
    └── vastAiService.js
```

---

**Ready to start fresh!** 🎯

