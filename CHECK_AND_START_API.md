# 🔍 Check API Status and Start If Needed

## What to check:

### 1. Did you see any output from `ps aux | grep 'python3 run_api_on_vast.py'`?
- **If YES** → API is running, go to step 2
- **If NO** → API is not running, start it first

### 2. What did `lsof -i :3001` show?
- **If it shows a process** → Port 3001 is in use (good!)
- **If it shows nothing** → Port 3001 is free (API might not be listening)

---

## Commands to Run:

### Step 1: Check API process
```bash
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
```

**If you see output like:**
```
root  12345  0.5  2.1  ... python3 run_api_on_vast.py
```
✅ API is running!

**If you see nothing:**
❌ API is not running → Start it (see below)

---

### Step 2: Check if port 3001 is listening
```bash
lsof -i :3001
```

**If you see output:**
```
python3  12345  root  3u  IPv4  ...  TCP *:3001 (LISTEN)
```
✅ Port 3001 is listening!

**If you see nothing:**
❌ Port 3001 is not listening → API might not have started properly

---

### Step 3: If API is NOT running, start it:
```bash
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
```

Wait 5 seconds, then check:
```bash
sleep 5
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep
tail -20 api.log
```

Look for: `"API available at: http://0.0.0.0:3001"`

---

### Step 4: Verify port 3001 is listening
```bash
lsof -i :3001
```

Should show the Python process listening on port 3001.

---

### Step 5: Test API directly
```bash
curl http://localhost:3001/health
```

Should return: `{"model":"Mistral-7B","status":"ok"}`

---

### Step 6: Once API is confirmed working on 3001, start port forward

**Option A: Try socat again (if API is running):**
```bash
nohup socat TCP-LISTEN:38660,fork,reuseaddr TCP:localhost:3001 > /dev/null 2>&1 &
sleep 2
ps aux | grep socat | grep -v grep
```

**Option B: Use Python forwarder (more reliable):**
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
    print(f"✅ Forwarding {source_port} -> {dest_host}:{dest_port}")
    
    while True:
        client, addr = server.accept()
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
        
        threading.Thread(target=forward_data, args=(client, dest), daemon=True).start()
        threading.Thread(target=forward_data, args=(dest, client), daemon=True).start()

if __name__ == '__main__':
    forward(38660, 'localhost', 3001)
EOF

chmod +x /workspace/port_forward.py
nohup python3 /workspace/port_forward.py > forward.log 2>&1 &
```

---

## Quick Status Check (All-in-One):

```bash
echo "=== API Process ==="
ps aux | grep 'python3 run_api_on_vast.py' | grep -v grep || echo "❌ Not running"

echo ""
echo "=== Port 3001 ==="
lsof -i :3001 || echo "❌ Not listening"

echo ""
echo "=== Port 38660 ==="
lsof -i :38660 || echo "✅ Free"

echo ""
echo "=== API Health ==="
curl -s http://localhost:3001/health || echo "❌ Not responding"
```

---

## What to Share:

Please run the "Quick Status Check" above and share the output. That will tell us:
1. Is API running?
2. Is port 3001 listening?
3. Is port 38660 free?
4. Is API responding?

Then we can fix the exact issue!

