# 🔧 Fix "Address already in use" on Port 38660

## The Problem:
Port 38660 is already in use by another process.

## Solution: Find and Kill the Process

### Step 1: Find what's using port 38660
```bash
lsof -i :38660
```

OR if lsof doesn't work:
```bash
netstat -tuln | grep :38660
ss -tuln | grep :38660
fuser 38660/tcp
```

### Step 2: Kill the process
```bash
# Option 1: Using lsof
kill -9 $(lsof -ti :38660)

# Option 2: Using fuser
fuser -k 38660/tcp

# Option 3: Manual (if you see PID from step 1)
# kill -9 <PID>
```

### Step 3: Verify port is free
```bash
lsof -i :38660
```
Should return nothing.

### Step 4: Start the forwarder again
```bash
nohup python3 /workspace/port_forward.py > forward.log 2>&1 &
sleep 2
ps aux | grep port_forward.py | grep -v grep
```

### Step 5: Test
```bash
curl http://localhost:38660/health
```

---

## Quick All-in-One Fix:

```bash
# Kill anything on port 38660
fuser -k 38660/tcp 2>/dev/null || lsof -ti :38660 | xargs kill -9 2>/dev/null || pkill -f port_forward || true

# Wait a second
sleep 2

# Verify it's free
lsof -i :38660 || echo "✅ Port is free"

# Start forwarder
nohup python3 /workspace/port_forward.py > forward.log 2>&1 &

# Wait and check
sleep 2
ps aux | grep port_forward.py | grep -v grep

# Test
curl http://localhost:38660/health
```

