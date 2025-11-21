# Setting Up Vast.ai AI on cPanel

This guide will help you set up the Vast.ai AI API to work with your cPanel application.

## Prerequisites

1. ✅ Vast.ai instance running (IP: 93.91.156.91)
2. ✅ API working on Vast.ai instance
3. ✅ SSH access to cPanel
4. ✅ Vast.ai SSH key (`id_ed25519_vast`)

## Setup Steps

### Step 1: Deploy SSH Tunnel to cPanel

The SSH tunnel will create a persistent connection from cPanel to Vast.ai, allowing your application to access the AI API.

```powershell
# Run from your local PC
.\deploy_cpanel_tunnel.ps1
```

This will:
- Upload your Vast.ai SSH key to cPanel
- Create a systemd service for persistent tunnel
- Start the tunnel automatically
- Test the connection

### Step 2: Update cPanel Environment Variables

Update your `.env` file on cPanel with the AI configuration:

```powershell
# Run from your local PC
.\update_cpanel_env_vast.ps1
```

Or manually update `.env` on cPanel:
```bash
VAST_AI_URL=http://localhost:3001
VAST_AI_API_KEY=medarion-secure-key-2025
```

### Step 3: Restart Your Application

Restart your Node.js application on cPanel to load the new configuration:

```bash
# On cPanel
pm2 restart all
# or
systemctl restart your-app-service
```

### Step 4: Test the Connection

Test that your application can access the AI:

```bash
# On cPanel, test the tunnel
curl http://localhost:3001/health

# Should return: {"model":"Mistral-7B","status":"ok"}
```

## Service Management

The SSH tunnel runs as a systemd service. Manage it with:

```bash
# Check status
sudo systemctl status vast-ai-tunnel

# Start tunnel
sudo systemctl start vast-ai-tunnel

# Stop tunnel
sudo systemctl stop vast-ai-tunnel

# View logs
sudo journalctl -u vast-ai-tunnel -f

# Restart tunnel
sudo systemctl restart vast-ai-tunnel
```

## Troubleshooting

### Tunnel Not Working

1. **Check service status:**
   ```bash
   sudo systemctl status vast-ai-tunnel
   ```

2. **Check logs:**
   ```bash
   sudo journalctl -u vast-ai-tunnel -n 50
   ```

3. **Test SSH connection manually:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_vast -p 31216 -L 3001:localhost:3001 root@ssh1.vast.ai
   ```

4. **Verify Vast.ai instance is running:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_vast -p 31216 root@ssh1.vast.ai "curl http://localhost:3001/health"
   ```

### Application Can't Connect

1. **Verify .env file:**
   ```bash
   cat .env | grep VAST_AI
   ```

2. **Test local connection:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Check Node.js service logs:**
   ```bash
   pm2 logs
   # or
   journalctl -u your-app-service -f
   ```

### Port Already in Use

If port 3001 is already in use on cPanel:

1. **Find what's using it:**
   ```bash
   sudo lsof -i :3001
   # or
   sudo netstat -tlnp | grep 3001
   ```

2. **Change tunnel port in setup script:**
   Edit `setup_cpanel_vast_tunnel.sh` and change `LOCAL_PORT=3001` to another port (e.g., `3002`)

3. **Update .env accordingly:**
   ```bash
   VAST_AI_URL=http://localhost:3002
   ```

## Alternative: Direct Public Access (If Available)

If you fix public access in Vast.ai dashboard, you can use direct connection:

```bash
VAST_AI_URL=http://93.91.156.91:3001
VAST_AI_API_KEY=medarion-secure-key-2025
```

## Configuration Summary

| Setting | Value |
|---------|-------|
| Tunnel Service | `vast-ai-tunnel` |
| Local Port | `3001` |
| Remote Port | `3001` |
| Vast.ai Host | `ssh1.vast.ai:31216` |
| API URL | `http://localhost:3001` |
| API Key | `medarion-secure-key-2025` |

## Next Steps

1. ✅ Deploy tunnel: `.\deploy_cpanel_tunnel.ps1`
2. ✅ Update .env: `.\update_cpanel_env_vast.ps1`
3. ✅ Restart application
4. ✅ Test AI functionality in your application

Your AI should now be accessible from your cPanel application! 🎉

