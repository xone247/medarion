# 🗺️ Complete cPanel Setup Map - Application Infrastructure

## 📍 Directory Structure Map

### Main Application Directory
```
/home/medasnnc/nodevenv/medarion/18/bin/
├── server.js                    # Main Node.js server entry point
├── package.json                 # Node.js dependencies
├── .env                         # Environment variables (created during setup)
├── config/
│   └── database.js             # Database configuration
├── middleware/
│   └── auth.js                 # Authentication middleware
├── routes/
│   ├── admin.js               # Admin routes
│   ├── ai.js                   # AI routes
│   ├── ai-data-generation.js   # AI data generation routes
│   ├── ai-data-updates.js      # AI data update routes
│   ├── auth.js                 # Authentication routes
│   ├── blog.js                 # Blog routes
│   ├── clinical-trials.js      # Clinical trials routes
│   ├── companies.js            # Companies routes
│   ├── countries.js            # Countries routes
│   ├── db.js                   # Database routes
│   ├── deals.js                # Deals routes
│   ├── grants.js               # Grants routes
│   ├── investors.js            # Investors routes
│   └── notifications.js        # Notifications routes
└── services/
    └── vastAiService.js        # Vast.ai AI service
```

### AI Tunnel Service
```
/etc/systemd/system/
└── vast-ai-tunnel.service      # Systemd service for AI tunnel

/usr/local/bin/
└── vast-ai-tunnel.sh           # Tunnel startup script

/var/run/
└── vast-ai-tunnel.pid          # Tunnel process ID
```

### Node.js Application Service
- **Service**: `medarion-api.service` (systemd)
- **Location**: `/home/medasnnc/nodevenv/medarion/18/bin/`
- **Port**: `3001`
- **Status**: `systemctl status medarion-api.service`
- **Start**: `systemctl start medarion-api.service`
- **Stop**: `systemctl stop medarion-api.service`
- **Auto-start**: Enabled (starts on boot)

---

## 🔧 Services Running on cPanel

### 1. Node.js Backend Server
- **Service**: `medarion-api.service` (systemd)
- **Status**: `systemctl status medarion-api.service`
- **Port**: 3001
- **Health Check**: `curl http://localhost:3001/health`
- **Start**: `systemctl start medarion-api.service`
- **Stop**: `systemctl stop medarion-api.service`
- **Restart**: `systemctl restart medarion-api.service`
- **Logs**: `journalctl -u medarion-api.service -f`
- **Auto-start**: Enabled (starts on boot)

### 2. AI Tunnel (SSH Tunnel to Vast.ai)
- **Service**: `vast-ai-tunnel.service` (systemd)
- **Status**: `systemctl status vast-ai-tunnel.service`
- **Local Port**: 8081
- **Remote**: Vast.ai (194.228.55.129:38506 → localhost:3001)
- **Health Check**: `curl http://localhost:8081/health`
- **Start**: `systemctl start vast-ai-tunnel.service`
- **Stop**: `systemctl stop vast-ai-tunnel.service`
- **Auto-start**: Enabled (starts on boot)

### 3. MySQL Database
- **Host**: localhost
- **Port**: 3306
- **Database**: medasnnc_medarion
- **User**: medasnnc_medarion
- **Access**: Via cPanel → Databases → MySQL Databases

---

## 📋 Environment Variables (.env)

**Location**: `/home/medasnnc/nodevenv/medarion/18/bin/.env`

```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
VAST_AI_URL=http://localhost:8081
```

**Also set in**: cPanel Node.js Selector → Environment Variables

---

## 🚀 Setup Process (Complete)

### Phase 1: Fresh Start
```powershell
# Delete old setup
.\fresh_setup_cpanel.ps1
```

### Phase 2: Upload Files
```powershell
# Upload essential files (21 files)
.\upload_essential_files.ps1
```

### Phase 3: Install Dependencies
```bash
cd /home/medasnnc/nodevenv/medarion/18/bin
npm install --production
```

### Phase 4: Create .env File
```bash
cat > /home/medasnnc/nodevenv/medarion/18/bin/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medasnnc_medarion
DB_USER=medasnnc_medarion
DB_PASSWORD=Neorage94
CORS_ORIGIN=https://medarion.africa
JWT_SECRET=QfNm2gvGK4nrbdI0twBAUk6VTW75cMiS
VAST_AI_URL=http://localhost:8081
EOF
```

### Phase 5: Setup AI Tunnel
```bash
# Upload setup script
scp -P 22 setup_cpanel_ai_tunnel.sh root@server1.medarion.africa:/tmp/

# Run setup
ssh root@server1.medarion.africa
chmod +x /tmp/setup_cpanel_ai_tunnel.sh
/tmp/setup_cpanel_ai_tunnel.sh
```

### Phase 6: Setup Node.js Service via SSH
```bash
# Upload setup script
scp -P 22 setup_nodejs_service.sh root@server1.medarion.africa:/tmp/

# Run setup
ssh root@server1.medarion.africa
chmod +x /tmp/setup_nodejs_service.sh
/tmp/setup_nodejs_service.sh
```

This will:
- Install PM2 (process manager)
- Create systemd service
- Enable auto-start on boot
- Start the application

---

## ✅ Verification Checklist

### Backend Server
- [ ] Node.js service created: `systemctl status medarion-api.service`
- [ ] Service running: `systemctl is-active medarion-api.service`
- [ ] Health check works: `curl http://localhost:3001/health`
- [ ] Auto-start enabled: `systemctl is-enabled medarion-api.service`

### AI Tunnel
- [ ] Tunnel service created: `systemctl status vast-ai-tunnel.service`
- [ ] Tunnel running: `curl http://localhost:8081/health`
- [ ] Auto-start enabled: `systemctl is-enabled vast-ai-tunnel.service`

### Database
- [ ] Database exists: `mysql -u medasnnc_medarion -p`
- [ ] Connection test passes

### Files
- [ ] All 21 essential files uploaded
- [ ] Dependencies installed: `npm list --depth=0`
- [ ] .env file created

---

## 🔍 Quick Reference Commands

### Check Services
```bash
# Backend server status
systemctl status medarion-api.service
curl http://localhost:3001/health

# AI tunnel status
systemctl status vast-ai-tunnel.service
curl http://localhost:8081/health

# Check Node.js version
node --version
npm --version
```

### Restart Services
```bash
# Backend
systemctl restart medarion-api.service

# AI Tunnel
systemctl restart vast-ai-tunnel.service
```

### View Logs
```bash
# Backend logs
journalctl -u medarion-api.service -f
# Or PM2 logs
pm2 logs medarion-api

# AI tunnel logs
journalctl -u vast-ai-tunnel.service -f
```

---

## 📝 File Locations Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| **Backend Server** | `/home/medasnnc/nodevenv/medarion/18/bin/` | Node.js application files |
| **Environment Config** | `/home/medasnnc/nodevenv/medarion/18/bin/.env` | Environment variables |
| **AI Tunnel Script** | `/usr/local/bin/vast-ai-tunnel.sh` | Tunnel startup script |
| **AI Tunnel Service** | `/etc/systemd/system/vast-ai-tunnel.service` | Systemd service file |
| **Database Config** | `/home/medasnnc/nodevenv/medarion/18/bin/config/database.js` | DB connection config |
| **Node.js Service** | `/etc/systemd/system/medarion-api.service` | Systemd service file |
| **PM2 Config** | `/home/medasnnc/nodevenv/medarion/18/bin/ecosystem.config.js` | PM2 configuration |

---

## 🎯 Application Access Points

- **Frontend**: `https://medarion.africa`
- **Backend API**: `https://medarion.africa/medarion-api`
- **Health Check**: `https://medarion.africa/medarion-api/health`
- **AI Service**: `http://localhost:8081` (internal, via tunnel)

---

**This map provides a complete reference for your cPanel application infrastructure!** 🗺️

