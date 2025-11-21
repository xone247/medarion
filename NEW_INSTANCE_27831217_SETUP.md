# 🚀 Setup for New Instance 27831217

## Instance Details
- **Instance ID:** 27831217
- **Public IP:** 93.91.156.91
- **SSH Port:** 56000
- **Port Range:** -1--1 (likely means all ports open)

## Port Range -1--1 Meaning

This unusual port range might mean:
- ✅ **All ports are accessible** (no restrictions)
- ✅ **Direct port access** (no mapping needed)
- ✅ **Can use standard ports** (3001, 8080, etc.)

## Recommended Setup

### Option 1: Use Standard Port 3001 (Recommended)

Since all ports might be open, use a standard port:

```bash
# On new instance, set PORT = 3001
cd /workspace
sed -i 's/PORT = 38800/PORT = 3001/' run_api_on_vast.py

# Start API
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Test
curl http://localhost:3001/health
curl http://93.91.156.91:3001/health
```

### Option 2: Use Port 8080

```bash
# Set PORT = 8080
sed -i 's/PORT = 38800/PORT = 8080/' run_api_on_vast.py

# Start and test
nohup python3 run_api_on_vast.py > api.log 2>&1 &
curl http://93.91.156.91:8080/health
```

## Quick Setup Commands

### 1. Upload run_api_on_vast.py
```bash
# From your PC
scp -P 56000 run_api_on_vast.py root@93.91.156.91:/workspace/
```

### 2. SSH to instance
```bash
ssh -p 56000 root@93.91.156.91
```

### 3. Install dependencies
```bash
pip3 install --break-system-packages torch transformers flask flask-cors accelerate safetensors
```

### 4. Set port to 3001
```bash
cd /workspace
sed -i 's/PORT = 38800/PORT = 3001/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py
```

### 5. Start API
```bash
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

### 6. Test
```bash
sleep 5
curl http://localhost:3001/health
```

### 7. Test from your PC
```bash
curl http://93.91.156.91:3001/health
```

## Update cPanel Configuration

Once API is working on new instance:

```bash
# Update .env on cPanel
VAST_AI_URL=http://93.91.156.91:3001
VAST_API_KEY=47ccd6ed938face7dbb914a55eba4aa9c9ca3610d76861d04c029a055ccead3a
```

Or run:
```powershell
.\update_cpanel_direct_connection.ps1
```

(Update the script to use new IP and port first)

## Benefits of This Instance

- ✅ **All ports open** - use any port you want
- ✅ **No port mapping** - direct access
- ✅ **Standard ports work** - 3001, 8080, etc.
- ✅ **Simpler setup** - no port conflicts

## Testing Ports

If port range -1--1 means all ports are open, you can test:

```bash
# Test port 3001
curl http://93.91.156.91:3001/health

# Test port 8080
curl http://93.91.156.91:8080/health

# Test port 5000
curl http://93.91.156.91:5000/health
```

Use whichever works!

