# 🔍 Find Free Public Port

## Port Range: 38506-38941

### Already Used Ports:
- 38506 → 22/tcp (SSH)
- 38570 → 6006/tcp
- 38660 → 38660/tcp (having issues)
- 38710 → 1111/tcp
- 38772 → 8384/tcp
- 38941 → 8080/tcp

### Available Ports to Try:
- 38507-38569 (between SSH and TensorBoard)
- 38571-38659 (between TensorBoard and our port)
- 38661-38709 (after our port, before 1111)
- 38711-38771 (between 1111 and 8384)
- 38773-38940 (between 8384 and 8080)

## Quick Test Commands

### Test if a port is free locally:
```bash
# Test port 38700 (example)
lsof -i :38700 || echo "Port 38700 is free"
netstat -tuln | grep :38700 || echo "Port 38700 is free"
```

### Scan for free ports:
```bash
# Check ports around 38660
for port in 38661 38662 38663 38700 38750 38800; do
  echo -n "Port $port: "
  lsof -i :$port > /dev/null 2>&1 && echo "IN USE" || echo "FREE"
done
```

## Recommended Ports to Try:

1. **38700** - Good middle ground, likely free
2. **38800** - Higher in range, less likely conflicts
3. **38661** - Right after 38660, should be free
4. **38750** - Middle of unused range

## Quick Setup for Port 38700:

```bash
# Kill everything
pkill -9 python3
sleep 2

# Update API to use port 38700
cd /workspace
sed -i 's/PORT = 38660/PORT = 38700/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py

# Start API
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Test
sleep 5
curl http://localhost:38700/health
```

## Or Use Port 38800 (Higher, Less Likely Conflicts):

```bash
# Kill everything
pkill -9 python3
sleep 2

# Update to 38800
cd /workspace
sed -i 's/PORT = [0-9]*/PORT = 38800/' run_api_on_vast.py
grep "PORT = " run_api_on_vast.py

# Start
nohup python3 run_api_on_vast.py > api.log 2>&1 &

# Test
sleep 5
curl http://localhost:38800/health
curl http://194.228.55.129:38800/health
```

