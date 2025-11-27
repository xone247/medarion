# Production Sync: Git to cPanel - Instructions

## 🚀 Quick Sync Command

Since the automated script has PowerShell parsing issues, here's the manual process:

### Step 1: Build Frontend
```powershell
npm run build
```

### Step 2: Sync Files via SSH

Use the existing deployment scripts or manually sync:

**Option A: Use existing sync script**
```powershell
.\deploy\sync-to-cpanel.ps1
```

**Option B: Manual SSH sync**
```powershell
# Load config
$config = Get-Content cpanel-config.json | ConvertFrom-Json
$plink = $config.ssh.plinkPath
$host = $config.ssh.host
$user = $config.ssh.username
$port = $config.ssh.port
$key = $config.ssh.keyPath
$pass = $config.ssh.password

# Frontend path
$frontendPath = "/home/medasnnc/public_html"
$backendPath = "/home/medasnnc/api.medarion.africa"
$pm2Path = "/opt/cpanel/ea-nodejs22/bin/pm2"

# Sync frontend (use pscp)
$pscp = $plink -replace "plink.exe", "pscp.exe"
echo $pass | & $pscp -P $port -pw $pass -i $key -r medarion-dist/* "${user}@${host}:${frontendPath}/"

# Sync backend
echo $pass | & $pscp -P $port -pw $pass -i $key -r server/* "${user}@${host}:${backendPath}/"

# Install dependencies
echo $pass | & $plink -P $port -pw $pass -i $key -batch "${user}@${host}" "cd $backendPath; npm install --production"

# Restart server
echo $pass | & $plink -P $port -pw $pass -i $key -batch "${user}@${host}" "cd $backendPath; $pm2Path restart medarion-backend || $pm2Path start server.js --name medarion-backend --log server.log"
```

### Step 3: Verify

```powershell
# Check server status
echo $pass | & $plink -P $port -pw $pass -i $key -batch "${user}@${host}" "$pm2Path list"

# Health check
echo $pass | & $plink -P $port -pw $pass -i $key -batch "${user}@${host}" "curl -s http://localhost:3001/health"
```

## 📝 Production Workflow

1. **Make changes locally**
2. **Commit to git**: `git add . && git commit -m "message" && git push`
3. **Build frontend**: `npm run build`
4. **Sync to cPanel**: Use the commands above or existing scripts
5. **Restart backend**: PM2 will handle it automatically

## ✅ Status

- ✅ Frontend: `/home/medasnnc/public_html`
- ✅ Backend: `/home/medasnnc/api.medarion.africa`
- ✅ PM2: `/opt/cpanel/ea-nodejs22/bin/pm2`
- ✅ Database: Already deployed (3,125 records)

