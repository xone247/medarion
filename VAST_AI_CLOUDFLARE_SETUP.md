# Vast.ai Public Access Setup

## Understanding Vast.ai Port Mapping

On Vast.ai:
- **Ports are locked** when you create the instance
- External ports are **mapped to internal ports** on the host machine
- Example: `93.91.156.86:44123 -> 8080/tcp` means:
  - External: `93.91.156.86:44123`
  - Internal: `localhost:8080`

## Option 1: Use Cloudflare Tunnel (Recommended - Easiest)

Cloudflare tunnel lets you expose any internal port publicly without port mapping.

### Setup in Jupyter Terminal:

```bash
# 1. Install cloudflared (if not installed)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# 2. Start Cloudflare tunnel (exposes internal port 8080)
cloudflared tunnel --url http://localhost:8080

# This will give you a public URL like:
# https://random-name.trycloudflare.com
```

### Or use the instance portal:
1. Go to your Vast.ai instance dashboard
2. Find "Tunnels" or "Cloudflare Tunnel" section
3. Enter: `localhost:8080`
4. Get your public URL

### Update API to use port 8080:
The script is already set to `PORT = 8080` (internal port)

## Option 2: Use Existing Port Mapping

If you want to use the existing mapping `44123 -> 8080/tcp`:

### Run API on internal port 8080:
```bash
# The script already uses PORT = 8080
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### Access via external port:
```
http://93.91.156.86:44123
```

## Option 3: Create New Instance with Correct Port

For future instances, when creating:
1. Expose port 8080 (or your desired port) in instance settings
2. Vast.ai will map it to an external port
3. Use that external port to access your API

## Current Setup

**Internal Port**: 8080 (what the API runs on)
**External Access Options**:
1. **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:8080` → Get public URL
2. **Port Mapping**: `http://93.91.156.86:44123` (if mapping works)

## Testing

### Test internal (on Vast.ai):
```bash
curl http://localhost:8080/health
```

### Test external (from your PC):
```bash
# Via Cloudflare tunnel URL
curl https://your-tunnel-url.trycloudflare.com/health

# OR via port mapping
curl http://93.91.156.86:44123/health
```

## Backend Configuration

Update `server/.env`:
```
# Option 1: Cloudflare tunnel URL
VAST_AI_URL=https://your-tunnel-url.trycloudflare.com

# Option 2: Port mapping
VAST_AI_URL=http://93.91.156.86:44123
```

