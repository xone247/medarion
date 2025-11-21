# 🚀 Complete cPanel Setup: Backend Server + AI Tunnel

## ✅ Prerequisites

- cPanel access (root/WHM)
- SSH access to cPanel server
- Vast.ai instance running (IP: 194.228.55.129, Port: 38506)
- Node.js installed on cPanel (18.x or higher)

---

## 📋 Part 1: Backend Server Setup on cPanel

### Step 1: Upload Server Files

**Via SSH:**
```bash
# Connect to cPanel server
ssh -p 22 root@server1.medarion.africa

# Create Node.js app directory
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin
cd /home/medasnnc/nodevenv/medarion/18/bin

# Upload server files (from your local machine)
# Use SCP or FTP to upload:
# - server/ directory
# - package.json
# - .env (or create it)
```

**Via cPanel File Manager:**
1. Log into cPanel: `https://medarion.africa:2083`
2. Go to: **Files → File Manager**
3. Navigate to: `/home/medasnnc/nodevenv/medarion/18/bin/`
4. Upload all files from `server/` directory

### Step 2: Install Dependencies

**Via SSH:**
```bash
cd /home/medasnnc/nodevenv/medarion/18/bin
npm install
```

**Or via cPanel Terminal:**
1. cPanel → **Advanced → Terminal**
2. Run: `cd ~/nodevenv/medarion/18/bin && npm install`

### Step 3: Create .env File

Create `/home/medasnnc/nodevenv/medarion/18/bin/.env`:

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

### Step 4: Create Node.js Application in cPanel

1. Log into cPanel: `https://medarion.africa:2083`
2. Go to: **Software → Node.js Selector**
3. Click **"Create Application"**
4. Fill in:
   - **Node.js Version**: 18.x (or latest available)
   - **Application Mode**: Production
   - **Application Root**: `/home/medasnnc/nodevenv/medarion/18/bin`
   - **Application URL**: `/medarion-api`
   - **Application Startup File**: `server.js`
   - **Application Port**: `3001` (or let cPanel assign)
5. Click **"Create"**

### Step 5: Set Environment Variables

1. In Node.js Selector, click on your application
2. Go to **"Environment Variables"** section
3. Add all variables from `.env` file (see Step 3)
4. Click **"Save"**

### Step 6: Start Application

1. In Node.js Selector, click **"Start"** on your application
2. Check logs to ensure it started successfully
3. Test: `https://medarion.africa/medarion-api/health`

---

## 📋 Part 2: AI Tunnel Setup on cPanel

### Option A: SSH Tunnel (Recommended - Persistent)

**Create a systemd service for the tunnel:**

**Via SSH (as root):**
```bash
# Create tunnel script
cat > /usr/local/bin/vast-ai-tunnel.sh << 'EOF'
#!/bin/bash
# Vast.ai SSH Tunnel
# Connects localhost:8081 to Vast.ai API (port 3001)

SSH_KEY="/root/.ssh/vast_ai_key"
VAST_IP="194.228.55.129"
VAST_PORT="38506"
LOCAL_PORT="8081"
REMOTE_PORT="3001"

# Start tunnel in background
ssh -i "$SSH_KEY" \
    -p $VAST_PORT \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -N -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} \
    root@${VAST_IP} &

echo $! > /var/run/vast-ai-tunnel.pid
echo "✅ Vast.ai tunnel started (PID: $(cat /var/run/vast-ai-tunnel.pid))"
EOF

chmod +x /usr/local/bin/vast-ai-tunnel.sh

# Create systemd service
cat > /etc/systemd/system/vast-ai-tunnel.service << 'EOF'
[Unit]
Description=Vast.ai SSH Tunnel for AI API
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/vast-ai-tunnel.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
systemctl daemon-reload
systemctl enable vast-ai-tunnel.service
systemctl start vast-ai-tunnel.service

# Check status
systemctl status vast-ai-tunnel.service
```

**Setup SSH Key:**
```bash
# If you don't have the SSH key on the server, copy it:
# From your local machine:
scp -P 22 C:\Users\xone\.ssh\vast_ai_key root@server1.medarion.africa:/root/.ssh/
ssh -p 22 root@server1.medarion.africa "chmod 600 /root/.ssh/vast_ai_key"
```

**Verify Tunnel:**
```bash
# Check if tunnel is running
ps aux | grep "ssh.*vast"

# Test connection
curl http://localhost:8081/health

# Check logs
journalctl -u vast-ai-tunnel.service -f
```

### Option B: AutoSSH (More Reliable)

**Install autossh:**
```bash
# CentOS/RHEL
yum install -y autossh

# Ubuntu/Debian
apt-get install -y autossh
```

**Create autossh service:**
```bash
cat > /etc/systemd/system/vast-ai-tunnel.service << 'EOF'
[Unit]
Description=Vast.ai SSH Tunnel (AutoSSH)
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/autossh -M 0 -N -o "ServerAliveInterval 60" -o "ServerAliveCountMax 3" -o "StrictHostKeyChecking=no" -i /root/.ssh/vast_ai_key -p 38506 -L 8081:localhost:3001 root@194.228.55.129
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vast-ai-tunnel.service
systemctl start vast-ai-tunnel.service
```

---

## 📋 Part 3: Verify Everything Works

### Test Backend Server:
```bash
curl https://medarion.africa/medarion-api/health
```

### Test AI Tunnel:
```bash
# On cPanel server
curl http://localhost:8081/health
curl http://localhost:8081/ping
```

### Test AI from Backend:
```bash
# On cPanel server
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### Test from Application:
1. Open browser: `https://medarion.africa`
2. Try asking the AI a question
3. Check browser console for errors
4. Check Node.js logs in cPanel

---

## 🔧 Troubleshooting

### Backend Server Issues:

**Server won't start:**
```bash
# Check logs in cPanel Node.js Selector
# Or via SSH:
cd /home/medasnnc/nodevenv/medarion/18/bin
node server.js
```

**Database connection failed:**
- Verify database credentials in `.env`
- Test MySQL connection: `mysql -u medasnnc_medarion -p`

**Port already in use:**
- Change `PORT` in `.env` and restart app

### AI Tunnel Issues:

**Tunnel not connecting:**
```bash
# Check SSH key permissions
chmod 600 /root/.ssh/vast_ai_key

# Test SSH connection manually
ssh -i /root/.ssh/vast_ai_key -p 38506 root@194.228.55.129

# Check tunnel status
systemctl status vast-ai-tunnel.service
journalctl -u vast-ai-tunnel.service -n 50
```

**Tunnel keeps disconnecting:**
- Use AutoSSH (Option B) instead of basic SSH
- Increase `ServerAliveInterval` to 30

**Port 8081 already in use:**
```bash
# Find what's using port 8081
lsof -i :8081
# Kill it
kill -9 $(lsof -t -i:8081)
```

---

## ✅ Final Checklist

- [ ] Backend server files uploaded to cPanel
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] Node.js application created in cPanel
- [ ] Environment variables set in cPanel
- [ ] Backend server started and running
- [ ] Backend health check works: `https://medarion.africa/medarion-api/health`
- [ ] SSH key copied to cPanel server
- [ ] AI tunnel service created and enabled
- [ ] AI tunnel running: `systemctl status vast-ai-tunnel.service`
- [ ] AI tunnel test works: `curl http://localhost:8081/health`
- [ ] Application can access AI (test in browser)

---

## 🎯 Quick Commands Reference

```bash
# Backend Server
cd /home/medasnnc/nodevenv/medarion/18/bin
npm install
node server.js

# AI Tunnel
systemctl start vast-ai-tunnel.service
systemctl stop vast-ai-tunnel.service
systemctl status vast-ai-tunnel.service
journalctl -u vast-ai-tunnel.service -f

# Test Connections
curl http://localhost:8081/health
curl https://medarion.africa/medarion-api/health
```

---

**Ready?** Start with Part 1 (Backend Server Setup) and then proceed to Part 2 (AI Tunnel Setup)! 🚀

