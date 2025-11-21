# 🌐 Vast.ai Tunnel Setup Guide

## Overview
Vast.ai's built-in tunnel feature can expose your API to the internet, bypassing firewall issues.

## Step 1: Create Tunnel in Vast.ai Dashboard

1. Go to your Vast.ai instance dashboard
2. Find **"Tunnels"** or **"Open New Ports"** section
3. Click **"Create New Tunnel"** or **"Manage Tunnels"**

### Tunnel Configuration:
- **Target URL**: `http://localhost:3001`
  - This is where your Flask API is running
  - The API is already running on port 3001

4. Click **"Create"** or **"Open Port"**

## Step 2: Get Tunnel URL

Vast.ai will generate a tunnel URL, for example:
- `https://xxxxx.vast.ai`
- `https://xxxxx.tunnels.vast.ai`
- Or similar format

**Copy this URL** - you'll need it for configuration.

## Step 3: Update cPanel Configuration

Once you have the tunnel URL, update the `.env` file on cPanel:

```env
AI_MODE=vast
VAST_AI_URL=https://your-tunnel-url.vast.ai
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

**Important**: 
- Use `https://` (Vast.ai tunnels are HTTPS)
- Remove the port number (tunnels handle that automatically)
- Use the full tunnel URL provided by Vast.ai

## Step 4: Restart Node.js Service

```bash
systemctl restart medarion-api.service
```

## Step 5: Test Connection

Test from cPanel:
```bash
curl -H "X-API-Key: 47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a" https://your-tunnel-url.vast.ai/health
```

Should return: `{"status":"ok","model":"Mistral-7B"}`

## Benefits of Using Vast.ai Tunnel

✅ **No Firewall Issues**: Tunnel handles all networking
✅ **HTTPS by Default**: Secure connection
✅ **Public URL**: Accessible from anywhere
✅ **Managed by Vast.ai**: Reliable and maintained
✅ **Easy Setup**: Just create tunnel and use the URL

## Troubleshooting

### Tunnel Not Working
- Verify target URL is `http://localhost:3001`
- Check that API is running on Vast.ai instance
- Ensure tunnel is "Active" in dashboard

### Connection Timeout
- Wait a few seconds after creating tunnel
- Verify tunnel status in dashboard
- Check API is still running: `ps aux | grep run_api_on_vast.py`

### API Key Issues
- Make sure you're sending `X-API-Key` header
- Verify `VAST_API_KEY` is set on Vast.ai instance
- Check API logs for authentication errors

## Alternative: If Tunnel Uses Different Port

Some Vast.ai tunnels might expose on a different port. If so:

```env
VAST_AI_URL=https://your-tunnel-url.vast.ai:PORT
```

Check the tunnel details in dashboard for the exact URL format.

