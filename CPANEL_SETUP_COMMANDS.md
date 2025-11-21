# cPanel Environment Setup - Direct Commands

## SSH Connection
```bash
ssh root@server1.medarion.africa
# Password: RgIyt5SEkc4E]nmp
```

## Step 1: Check Node.js
```bash
node --version
npm --version
```

If not installed:
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

## Step 2: Create App Directory
```bash
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin
chown -R medasnnc:medasnnc /home/medasnnc/nodevenv/medarion/18/bin
cd /home/medasnnc/nodevenv/medarion/18/bin
```

## Step 3: Upload Server Files
From your local machine:
```powershell
# Upload server directory
scp -r server/* root@server1.medarion.africa:/home/medasnnc/nodevenv/medarion/18/bin/
scp package.json root@server1.medarion.africa:/home/medasnnc/nodevenv/medarion/18/bin/
```

## Step 4: Install Dependencies
```bash
cd /home/medasnnc/nodevenv/medarion/18/bin
npm install --production
```

## Step 5: Create .env File
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

## Step 6: Setup AI Tunnel
```bash
# Upload setup script
# From local: scp setup_cpanel_ai_tunnel.sh root@server1.medarion.africa:/tmp/

# Run setup
chmod +x /tmp/setup_cpanel_ai_tunnel.sh
/tmp/setup_cpanel_ai_tunnel.sh
```

## Step 7: Create Node.js App in cPanel
1. Log into cPanel: https://medarion.africa:2083
2. Go to: **Software → Node.js Selector**
3. Click **"Create Application"**
4. Settings:
   - **Root**: `/home/medasnnc/nodevenv/medarion/18/bin`
   - **URL**: `/medarion-api`
   - **File**: `server.js`
   - **Port**: `3001`
5. Add environment variables (from .env file)
6. Click **"Start"**

## Step 8: Verify
```bash
# Check tunnel
systemctl status vast-ai-tunnel.service

# Test tunnel
curl http://localhost:8081/health

# Test backend (after starting in cPanel)
curl https://medarion.africa/medarion-api/health
```


## SSH Connection
```bash
ssh root@server1.medarion.africa
# Password: RgIyt5SEkc4E]nmp
```

## Step 1: Check Node.js
```bash
node --version
npm --version
```

If not installed:
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

## Step 2: Create App Directory
```bash
mkdir -p /home/medasnnc/nodevenv/medarion/18/bin
chown -R medasnnc:medasnnc /home/medasnnc/nodevenv/medarion/18/bin
cd /home/medasnnc/nodevenv/medarion/18/bin
```

## Step 3: Upload Server Files
From your local machine:
```powershell
# Upload server directory
scp -r -P 22 server/* root@server1.medarion.africa:/home/medasnnc/nodevenv/medarion/18/bin/

# Upload package.json
scp -P 22 package.json root@server1.medarion.africa:/home/medasnnc/nodevenv/medarion/18/bin/
```

## Step 4: Install Dependencies
```bash
cd /home/medasnnc/nodevenv/medarion/18/bin
npm install --production
```

## Step 5: Create .env File
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

## Step 6: Setup AI Tunnel
```bash
# Upload setup script first (from local machine)
# scp -P 22 setup_cpanel_ai_tunnel.sh root@server1.medarion.africa:/tmp/

# Then run on server:
chmod +x /tmp/setup_cpanel_ai_tunnel.sh
/tmp/setup_cpanel_ai_tunnel.sh
```

## Step 7: Create Node.js App in cPanel
1. Log into cPanel: https://medarion.africa:2083
2. Go to: **Software → Node.js Selector**
3. Click **"Create Application"**
4. Settings:
   - **Root**: `/home/medasnnc/nodevenv/medarion/18/bin`
   - **URL**: `/medarion-api`
   - **File**: `server.js`
   - **Port**: `3001`
5. Add environment variables (from .env file)
6. Click **"Start"**

## Step 8: Verify
```bash
# Check backend
curl https://medarion.africa/medarion-api/health

# Check AI tunnel
curl http://localhost:8081/health
systemctl status vast-ai-tunnel.service
```

---

**All commands ready to run!** 🚀

