# 🚀 Direct Vast.ai Connection Setup (No SSH Tunnel Needed)

## Overview
Instead of SSH tunnels, configure Vast.ai API to be directly accessible from cPanel.

## Step 1: Get Vast.ai Instance Public IP

From Vast.ai dashboard, get your instance's public IP address.
Example: `194.228.55.129`

## Step 2: Update Vast.ai API (Already Done)

The API is already configured to:
- Listen on `0.0.0.0:3001` (accessible from outside)
- Has API key authentication
- Supports IP whitelisting (optional)

## Step 3: Configure on Vast.ai Instance

Set environment variables (optional, for security):
```bash
export VAST_AI_API_KEY="your-secure-key-here"
export VAST_AI_ALLOWED_IPS="cpanel.ip.address,another.ip"
```

Or use default key: `medarion-secure-key-2025`

## Step 4: Update cPanel Node.js Configuration

In `/home/medasnnc/nodevenv/medarion/18/bin/.env`:

```env
AI_MODE=vast
VAST_AI_URL=http://194.228.55.129:3001
VAST_AI_API_KEY=medarion-secure-key-2025
```

Replace `194.228.55.129` with your actual Vast.ai IP.

## Step 5: Test Connection

On cPanel, test direct connection:
```bash
curl -H "X-API-Key: medarion-secure-key-2025" http://194.228.55.129:3001/health
```

## Step 6: Restart Node.js Service

```bash
systemctl restart medarion-api.service
```

## Security Notes

1. **API Key**: Change the default key in production
2. **IP Whitelisting**: Set `VAST_AI_ALLOWED_IPS` on Vast.ai to restrict access
3. **Firewall**: Ensure Vast.ai firewall allows port 3001
4. **HTTPS**: Consider using a reverse proxy with SSL for production

## Benefits

✅ No SSH tunnel needed
✅ Direct connection (faster)
✅ Works from anywhere
✅ Easier to maintain
✅ Better for production

## Troubleshooting

If connection fails:
1. Check Vast.ai firewall allows port 3001
2. Verify IP address is correct
3. Test with curl from cPanel
4. Check Vast.ai API logs
