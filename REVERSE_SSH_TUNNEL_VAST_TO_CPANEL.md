# 🔄 Reverse SSH Tunnel: Vast.ai → cPanel

## Problem
- Vast.ai tunnel creation is failing
- Direct connection blocked by firewall
- Need reliable connection method

## Solution: Reverse SSH Tunnel

Instead of cPanel connecting to Vast.ai, we'll have Vast.ai connect TO cPanel and forward the port.

## Step 1: Setup SSH Access from Vast.ai to cPanel

### On Vast.ai Instance:

First, test if you can SSH to cPanel:
```bash
ssh -p 22 root@server1.medarion.africa
```

If it asks for password, you'll need to either:
- Use password authentication
- Or set up SSH key from Vast.ai to cPanel

## Step 2: Create Reverse Tunnel

### On Vast.ai Instance:

```bash
ssh -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

**Explanation:**
- `-R 8081:localhost:3001` = Forward Vast.ai's localhost:3001 to cPanel's localhost:8081
- `-N` = Don't execute remote command
- `-f` = Run in background

### With Password:
```bash
sshpass -p 'your-cpanel-password' ssh -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

### With SSH Key:
```bash
ssh -i /path/to/cpanel/key -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

## Step 3: Make It Persistent

### Option A: Systemd Service on Vast.ai

Create `/etc/systemd/system/vast-to-cpanel-tunnel.service`:

```ini
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
```

Then:
```bash
systemctl daemon-reload
systemctl enable vast-to-cpanel-tunnel.service
systemctl start vast-to-cpanel-tunnel.service
```

### Option B: Using autossh (More Reliable)

```bash
autossh -M 0 -R 8081:localhost:3001 -p 22 -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -N root@server1.medarion.africa
```

## Step 4: Update cPanel Configuration

On cPanel, update `/home/medasnnc/nodevenv/medarion/18/bin/.env`:

```env
AI_MODE=vast
VAST_AI_URL=http://localhost:8081
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

**Note**: Using `localhost:8081` because the reverse tunnel forwards to this port.

## Step 5: Restart Node.js Service

```bash
systemctl restart medarion-api.service
```

## Step 6: Test Connection

On cPanel:
```bash
curl -H "X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" http://localhost:8081/health
```

Should return: `{"status":"ok","model":"Mistral-7B"}`

## Troubleshooting

### Connection Refused
- Check if reverse tunnel is running: `ps aux | grep ssh`
- Verify SSH connection works: `ssh -p 22 root@server1.medarion.africa`
- Check cPanel firewall allows SSH connections

### Tunnel Dies
- Use `autossh` instead of `ssh` (auto-reconnects)
- Or use systemd service with `Restart=always`

### Authentication Issues
- Set up SSH key from Vast.ai to cPanel
- Or use `sshpass` for password authentication
- Ensure cPanel allows SSH from Vast.ai IP

## Benefits

✅ **No Firewall Issues**: Vast.ai initiates connection
✅ **Reliable**: SSH handles reconnection
✅ **Secure**: Encrypted connection
✅ **Persistent**: Can run as systemd service

## Quick Command Reference

**Start tunnel:**
```bash
ssh -R 8081:localhost:3001 -p 22 root@server1.medarion.africa -N -f
```

**Check if running:**
```bash
ps aux | grep "ssh.*8081"
```

**Stop tunnel:**
```bash
pkill -f "ssh.*8081.*cpanel"
```

