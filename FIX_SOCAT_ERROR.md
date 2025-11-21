# 🔧 Fix Socat Port Forward Error

## Error: `Exit 1` from socat

This means socat failed to start. Let's diagnose and fix it.

---

## Step-by-Step Fix

### Step 1: Check if API is running on port 3001
```bash
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
```

If not running, start it:
```bash
cd /workspace && nohup python3 run_api_on_vast.py > api.log 2>&1 &
sleep 5
```

### Step 2: Verify port 3001 is listening
```bash
lsof -i :3001 || netstat -tuln | grep :3001 || ss -tuln | grep :3001
```

Should show the API listening on port 3001.

### Step 3: Check if port 38660 is free
```bash
lsof -i :38660 || netstat -tuln | grep :38660
```

If something is using it, kill it:
```bash
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null
```

### Step 4: Check socat error details
Run socat in foreground to see the error:
```bash
socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001
```

This will show the actual error message. Press Ctrl+C to stop.

### Step 5: Try alternative socat command
```bash
socat TCP-LISTEN:38660,reuseaddr,fork TCP4:127.0.0.1:3001
```

### Step 6: Check if socat is installed correctly
```bash
which socat
socat -V
```

If not found, reinstall:
```bash
apt-get update && apt-get install -y socat
```

---

## Alternative: Use Python Port Forwarder

If socat keeps failing, use a simple Python forwarder:

### Create forwarder script:
```bash
cat > /workspace/port_forward.py << 'EOF'
#!/usr/bin/env python3
import socket
import threading

def forward(source_port, dest_host, dest_port):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', source_port))
    server.listen(5)
    print(f"Forwarding {source_port} -> {dest_host}:{dest_port}")
    
    while True:
        client, addr = server.accept()
        print(f"Connection from {addr}")
        dest = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        dest.connect((dest_host, dest_port))
        
        def forward_data(src, dst):
            try:
                while True:
                    data = src.recv(4096)
                    if not data:
                        break
                    dst.send(data)
            except:
                pass
            finally:
                src.close()
                dst.close()
        
        threading.Thread(target=forward_data, args=(client, dest)).start()
        threading.Thread(target=forward_data, args=(dest, client)).start()

if __name__ == '__main__':
    forward(38660, 'localhost', 3001)
EOF

chmod +x /workspace/port_forward.py
```

### Run Python forwarder:
```bash
cd /workspace && nohup python3 port_forward.py > forward.log 2>&1 &
```

### Check if it's running:
```bash
ps aux | grep port_forward.py | grep -v grep
```

### Test:
```bash
curl http://localhost:38660/health
```

---

## Quick Diagnostic Commands

Run these to see what's wrong:

```bash
# Check API status
ps aux | grep run_api_on_vast.py | grep -v grep
lsof -i :3001

# Check port 38660
lsof -i :38660

# Check socat
which socat
socat -V

# Test API directly
curl http://localhost:3001/health

# Try socat manually (see error)
socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001
```

---

## Most Common Issues

1. **API not running on 3001** → Start API first
2. **Port 38660 in use** → Kill the process using it
3. **socat not installed** → `apt-get install -y socat`
4. **Permission denied** → Run as root (you should be root already)

---

## Recommended: Use Python Forwarder

The Python forwarder is more reliable. Use it if socat keeps failing.

