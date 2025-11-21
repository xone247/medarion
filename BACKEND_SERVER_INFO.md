# Backend Server Information - Medarion Platform

## Server Location
- **Backend Directory**: `/home/medasnnc/api.medarion.africa`
- **Server File**: `/home/medasnnc/api.medarion.africa/server.js`
- **Routes Directory**: `/home/medasnnc/public_html/api/routes/`
- **Port**: 3001
- **Subdomain**: api.medarion.africa

## SSH Configuration
- **Host**: server1.medarion.africa
- **User**: root
- **Port**: 22
- **Key Path**: C:\Users\xone\.ssh\medarionput.ppk
- **Plink Path**: C:\Program Files\PuTTY\plink.exe

## Commands to Manage Backend Server with PM2

### PM2 Path
PM2 is installed at: `/opt/cpanel/ea-nodejs22/bin/pm2`

### Start Server with PM2
```bash
cd /home/medasnnc/api.medarion.africa
/opt/cpanel/ea-nodejs22/bin/pm2 start server.js --name medarion-backend --log server.log
```

### Stop Server
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 stop medarion-backend
```

### Restart Server
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend
```

### Check Server Status
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 list
/opt/cpanel/ea-nodejs22/bin/pm2 status
```

### View Server Logs
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend
```

### Save PM2 Configuration (to persist after reboot)
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 save
```

### Set PM2 to Auto-Start on System Reboot
```bash
/opt/cpanel/ea-nodejs22/bin/pm2 startup
```

### Verify Server is Running
```bash
curl http://localhost:3001/health
```

## PowerShell Command to Start Server
```powershell
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$sshHost = $config.ssh.host
$sshUser = $config.ssh.username
$sshPort = $config.ssh.port
$keyPath = "C:\Users\xone\.ssh\medarionput.ppk"

# Stop existing server
& $plinkPath -P $sshPort -i $keyPath -batch "${sshUser}@${sshHost}" "pkill -9 -f 'node.*server.js' || true" 2>&1

# Start server
& $plinkPath -P $sshPort -i $keyPath -batch "${sshUser}@${sshHost}" "cd /home/medasnnc/api.medarion.africa && nohup node server.js > server.log 2>&1 &" 2>&1

# Verify
Start-Sleep -Seconds 3
& $plinkPath -P $sshPort -i $keyPath -batch "${sshUser}@${sshHost}" "ps aux | grep '[n]ode.*server.js'" 2>&1
```

## Important Notes
- The server.js file is **directly in the subdomain folder** (`/home/medasnnc/api.medarion.africa/`)
- The routes folder is at `/home/medasnnc/public_html/api/routes/` (where admin.js was uploaded)
- Server runs on port 3001
- Log file: `/home/medasnnc/api.medarion.africa/server.log`
- If port 3001 is already in use, the server is already running

## Health Check
- Local: `http://localhost:3001/health`
- Public: `https://api.medarion.africa/health`

