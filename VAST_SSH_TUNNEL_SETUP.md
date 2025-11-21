# 🔧 Vast.ai SSH Tunnel Setup Guide

## Understanding Your SSH Tunnel Command

### Your Command:
```bash
ssh -p 14075 root@ssh2.vast.ai -L 8080:localhost:8080
```

### Issues:
1. **Wrong Port**: Your API runs on port **3001**, not 8080
2. **Wrong Direction**: This should be run **FROM cPanel**, not **ON Vast.ai**

### Correct Command:
```bash
ssh -p 14075 root@ssh2.vast.ai -L 8081:localhost:3001 -N -f
```

This creates a tunnel that:
- **From cPanel**: `localhost:8081` 
- **To Vast.ai**: `localhost:3001` (where your API is running)

## Setup Options

### Option 1: Manual Setup (Quick Test)

**On cPanel (via SSH):**
```bash
# Start tunnel
ssh -p 14075 root@ssh2.vast.ai -L 8081:localhost:3001 -N -f

# Test connection
curl http://localhost:8081/health

# Check if running
ps aux | grep "ssh.*ssh2.vast.ai"
```

### Option 2: Automated Setup (Recommended)

**From your local machine:**
```powershell
# Deploy tunnel setup script
.\deploy_vast_tunnel_cpanel.ps1
```

This will:
1. Upload the setup script to cPanel
2. Run it to create the tunnel
3. Test the connection

### Option 3: Systemd Service (Persistent)

Create a systemd service that auto-starts the tunnel:

**On cPanel:**
```bash
# Create service file
sudo nano /etc/systemd/system/vast-ai-tunnel.service
```

**Service file content:**
```ini
[Unit]
Description=Vast.ai SSH Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/ssh -i /root/.ssh/vast_ai_key -p 14075 root@ssh2.vast.ai -L 8081:localhost:3001 -N -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable vast-ai-tunnel.service
sudo systemctl start vast-ai-tunnel.service
sudo systemctl status vast-ai-tunnel.service
```

## Configuration

### Update cPanel .env:
```env
VAST_AI_URL=http://localhost:8081
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

### Verify Connection:
```bash
# Test health endpoint
curl http://localhost:8081/health

# Test with API key
curl -H "X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" \
     http://localhost:8081/chat \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello"}'
```

## Troubleshooting

### Tunnel Not Connecting:
1. **Check SSH key**: Ensure `/root/.ssh/vast_ai_key` exists and has correct permissions (600)
2. **Check Vast.ai API**: Verify API is running on Vast.ai: `curl http://localhost:3001/health`
3. **Check firewall**: Ensure Vast.ai allows SSH connections on port 14075
4. **Check port**: Ensure port 8081 is not in use: `netstat -tuln | grep 8081`

### Tunnel Drops:
1. **Add keepalive**: Use `-o ServerAliveInterval=60` in SSH command
2. **Use systemd**: Systemd service will auto-restart the tunnel
3. **Check logs**: `journalctl -u vast-ai-tunnel.service -f`

### Connection Refused:
1. **Verify API port**: Check that Vast.ai API is on port 3001
2. **Test locally on Vast.ai**: `curl http://localhost:3001/health`
3. **Check tunnel**: `ps aux | grep ssh` to see if tunnel is running

## Quick Reference

### Start Tunnel:
```bash
ssh -p 14075 root@ssh2.vast.ai -L 8081:localhost:3001 -N -f
```

### Stop Tunnel:
```bash
pkill -f "ssh.*ssh2.vast.ai.*8081:localhost:3001"
```

### Check Status:
```bash
ps aux | grep "ssh.*ssh2.vast.ai"
```

### Test Connection:
```bash
curl http://localhost:8081/health
```

