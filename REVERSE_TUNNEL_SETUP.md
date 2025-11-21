# 🔄 Reverse SSH Tunnel Setup: Vast.ai → cPanel

## Problem
cPanel (Linux) cannot establish outbound SSH connection to Vast.ai (port 38506 times out).
This is likely due to firewall restrictions on the cPanel server.

## Solution: Reverse SSH Tunnel
Instead of cPanel connecting to Vast.ai, we'll have Vast.ai connect TO cPanel and forward the port.

## Setup Instructions

### Step 1: On Vast.ai Instance (via Jupyter Terminal)

Run this command to establish reverse tunnel:

```bash
ssh -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

**Or with SSH key:**
```bash
ssh -i ~/.ssh/cpanel_key -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

**Explanation:**
- `-R 8081:localhost:3001` = Forward Vast.ai's localhost:3001 to cPanel's localhost:8081
- `-N` = Don't execute remote command
- `-f` = Run in background

### Step 2: Make it Persistent on Vast.ai

Create a systemd service on Vast.ai to keep the tunnel alive:

```bash
cat > /etc/systemd/system/vast-to-cpanel-tunnel.service << 'EOF'
[Unit]
Description=Reverse SSH Tunnel from Vast.ai to cPanel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/ssh -R 8081:localhost:3001 -p 22 -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -N root@server1.medarion.africa
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vast-to-cpanel-tunnel.service
systemctl start vast-to-cpanel-tunnel.service
```

### Step 3: Verify on cPanel

Test the connection:
```bash
curl http://localhost:8081/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

### Step 4: Configure Node.js (Already Done)

Node.js is already configured to use `http://localhost:8081` via `VAST_AI_URL` in `.env`.

## Alternative: If Reverse Tunnel Also Fails

If Vast.ai also can't connect to cPanel, you may need to:

1. **Allow SSH from Vast.ai IP on cPanel firewall**
2. **Use a proxy/jump host**
3. **Configure Vast.ai API to be publicly accessible** (not recommended for security)

## Current Status

- ✅ Tunnel script created on cPanel
- ✅ Node.js configured with `VAST_AI_URL=http://localhost:8081`
- ⚠️ Waiting for reverse tunnel from Vast.ai side

